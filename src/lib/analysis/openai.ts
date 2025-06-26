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
    dt?: string; // date
  }[];
  s: number; // confidence_score
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

  try {
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

    return analysis;
  } catch (error) {
    console.error("Failed to parse OpenAI response", error);
    console.error("OpenAI response:", content);
    throw new Error("Failed to parse OpenAI response");
  }
}
