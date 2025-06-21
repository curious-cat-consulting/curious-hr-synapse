import OpenAI from "openai";

if (process.env.OPENAI_API_KEY == null || process.env.OPENAI_API_KEY === "") {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ReceiptAnalysis {
  vendor_name: string;
  vendor_address?: string;
  receipt_date: string;
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

export async function analyzeReceipt(imageBase64: string): Promise<ReceiptAnalysis> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `
Please analyze this receipt and extract the following information in JSON format:

{
  "vendor_name": string, // The name of the vendor
  "vendor_address": string, // The address of the vendor (if available)
  "receipt_date": string, // The date of the receipt (YYYY-MM-DD)
  "receipt_total": number, // The total amount (number, no currency symbol)
  "tax_amount": number, // The tax amount (number, no currency symbol, if available)
  "currency": string, // The currency code (e.g., USD, EUR, AED)
  "line_items": [
    {
      "description": string, // Description of the item
      "quantity": number, // Quantity (if available)
      "unit_price": number, // Unit price (if available)
      "total_amount": number, // Total amount for this item
      "category": string, // Category (if possible)
      "date": string // The date for this line item or receipt (YYYY-MM-DD, if available)
    },
    ...
  ],
  "confidence_score": number // Confidence score between 0 and 1
}

- All monetary values should be numbers without currency symbols.
- If a line item has a specific date (e.g., for travel or mileage), include it in the "date" field for that item.
- Format the response as a valid JSON object, and wrap it in triple backticks with the json language tag (\`\`\`json ... \`\`\`).
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
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content;
  if (content == null || content === "") {
    throw new Error("No response from OpenAI");
  }

  try {
    // Strip markdown formatting if present
    const jsonContent = content.replace(/```json\n?|\n?```/g, "").trim();
    console.log(jsonContent);
    return JSON.parse(jsonContent) as ReceiptAnalysis;
  } catch (error) {
    console.error("Failed to parse OpenAI response", error);
    console.error("OpenAI response:", content);
    throw new Error("Failed to parse OpenAI response");
  }
}
