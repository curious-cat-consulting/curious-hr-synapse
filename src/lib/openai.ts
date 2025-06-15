import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ReceiptAnalysis {
  vendor_name: string;
  vendor_address?: string;
  receipt_date: string;
  total_amount: number;
  tax_amount?: number;
  line_items: {
    description: string;
    quantity?: number;
    unit_price?: number;
    total_amount: number;
    category?: string;
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
            text: "Analyze this receipt and extract the following information in JSON format: vendor name, vendor address (if available), receipt date, total amount, tax amount (if available), and line items (including description, quantity, unit price, total amount, and category if possible). Also provide a confidence score between 0 and 1 for the overall analysis. Format the response as a valid JSON object."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
              detail: "high"
            }
          }
        ]
      }
    ],
    max_tokens: 1000
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  try {
    // Strip markdown formatting if present
    const jsonContent = content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonContent) as ReceiptAnalysis;
  } catch (error) {
    console.error('Failed to parse OpenAI response', error);
    throw new Error('Failed to parse OpenAI response');
  }
} 