import OpenAI from "openai";

import { logAIUsageWithTiming, createAIOperation } from "../utils/ai-usage-logger";

if (process.env.OPENAI_API_KEY == null || process.env.OPENAI_API_KEY === "") {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ReceiptAnalysis {
  vendor_name: string;
  vendor_address?: string;
  receipt_date?: string;
  receipt_total: number;
  tax_amount?: number;
  currency: string;
  line_items: {
    description: string;
    quantity?: number;
    unit_price?: number;
    total_amount: number;
    category?: string;
    date?: string;
  }[];
  confidence_score: number;
}

// Compact JSON interface for AI responses
interface CompactReceiptAnalysis {
  v: string; // vendor_name
  a?: string; // vendor_address
  d?: string; // receipt_date
  t: number; // receipt_total
  x?: number; // tax_amount
  c: string; // currency
  l: {
    d: string; // description
    q?: number; // quantity
    u?: number; // unit_price
    t: number; // total_amount
    g?: string; // category
    dt?: string; // date if different from receipt date (optional, YYYY-MM-DD or empty string)
  }[];
  s: number; // confidence_score
}

export async function analyzeReceipt(
  imageBase64: string,
  expenseId: string
): Promise<ReceiptAnalysis> {
  return logAIUsageWithTiming(
    async () => {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `
Please analyze this receipt and extract the following information in compact JSON format:

{
  "v": string, // vendor_name
  "a": string, // vendor_address (optional)
  "d": string, // receipt_date (YYYY-MM-DD or empty string)
  "t": number, // receipt_total (number, no currency symbol)
  "x": number, // tax_amount (optional, number, no currency symbol)
  "c": string, // currency code (e.g., USD, EUR, AED)
  "l": [
    {
      "d": string, // description
      "q": number, // quantity (optional)
      "u": number, // unit_price (optional)
      "t": number, // total_amount
      "g": string, // category (optional)
      "dt": string // date if different from receipt date (optional, YYYY-MM-DD or empty string)
    }
  ],
  "s": number // confidence_score (0-1)
}

- All monetary values should be numbers without currency symbols
- Use empty string ("") for missing dates
- If multiple items have exactly the same description and unit price, combine them into a single line item and sum the quantities
- Format as valid JSON wrapped in \`\`\`json ... \`\`\`
`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content;
      if (content == null || content === "") {
        throw new Error("No response from OpenAI");
      }

      // Strip markdown formatting if present
      const jsonContent = content.replace(/```json\n?|\n?```/g, "").trim();
      console.log("Raw AI response:", jsonContent);

      // Parse the compact JSON format
      const compactAnalysis = JSON.parse(jsonContent) as CompactReceiptAnalysis;

      // Convert to the full interface format
      const analysis: ReceiptAnalysis = {
        vendor_name: compactAnalysis.v,
        vendor_address: compactAnalysis.a,
        receipt_date: compactAnalysis.d,
        receipt_total: compactAnalysis.t,
        tax_amount: compactAnalysis.x,
        currency: compactAnalysis.c,
        line_items: compactAnalysis.l.map((item) => ({
          description: item.d,
          quantity: item.q,
          unit_price: item.u,
          total_amount: item.t,
          category: item.g,
          date: item.dt,
        })),
        confidence_score: compactAnalysis.s,
      };

      return { analysis, response };
    },
    {
      expense_id: expenseId,
      model: "gpt-4o",
      operation_type: "receipt_analysis",
      prompt_tokens: undefined, // Will be extracted from response
      completion_tokens: undefined, // Will be extracted from response
      total_tokens: undefined, // Will be extracted from response
      request_data: {
        image_size: Math.round((imageBase64.length * 3) / 4), // Approximate base64 size
        max_tokens: 4000,
      },
      response_data: {}, // Will be populated with analysis metadata
    },
    (result) => {
      const { analysis, response } = result;

      return {
        // Extract token counts from OpenAI response
        prompt_tokens: response.usage?.prompt_tokens,
        completion_tokens: response.usage?.completion_tokens,
        total_tokens: response.usage?.total_tokens,

        // Provide useful response data for analytics
        response_data: {
          line_items_count: analysis.line_items.length,
          confidence_score: analysis.confidence_score,
          has_vendor_address: analysis.vendor_address != null && analysis.vendor_address !== "",
          has_tax_amount: analysis.tax_amount != null,
          has_receipt_date: analysis.receipt_date != null && analysis.receipt_date !== "",
          currency: analysis.currency,
          receipt_total: analysis.receipt_total,
          categories_found: analysis.line_items.filter((item) => item.category != null).length,
          items_with_quantities: analysis.line_items.filter((item) => item.quantity != null).length,
          items_with_unit_prices: analysis.line_items.filter((item) => item.unit_price != null)
            .length,
        },
      };
    }
  ).then((result) => result.analysis);
}

/**
 * Example of how to use the createAIOperation helper for future AI operations.
 * This demonstrates expense categorization using AI.
 */
export async function categorizeExpense(
  expenseData: {
    title: string;
    description?: string;
    amount: number;
    vendor_name?: string;
  },
  expenseId: string
): Promise<{ category: string; confidence: number; reasoning: string }> {
  const categorizeOperation = createAIOperation(
    async (data: typeof expenseData) => {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: `Please categorize this expense and provide reasoning:

Title: ${data.title}
Description: ${data.description ?? "N/A"}
Amount: $${data.amount}
Vendor: ${data.vendor_name ?? "N/A"}

Respond with JSON in this format:
{
  "category": "string (e.g., Office Supplies, Travel, Meals, etc.)",
  "confidence": number (0-1),
  "reasoning": "string (brief explanation)"
}`,
          },
        ],
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (content == null || content === "") {
        throw new Error("No response from OpenAI");
      }

      return JSON.parse(content) as { category: string; confidence: number; reasoning: string };
    },
    {
      model: "gpt-4o",
      operation_type: "expense_categorization",
      extractTokens: (_result) => {
        // This would be extracted from the OpenAI response
        // For now, returning undefined as this is just an example
        return {};
      },
      extractResponseData: (result) => ({
        category: result.category,
        confidence_score: result.confidence,
        has_reasoning: result.reasoning.length > 0,
      }),
      extractRequestData: (input) => ({
        expense_title: input.title,
        expense_amount: input.amount,
        has_description: input.description != null,
        has_vendor: input.vendor_name != null,
      }),
    }
  );

  return categorizeOperation(expenseData, expenseId);
}
