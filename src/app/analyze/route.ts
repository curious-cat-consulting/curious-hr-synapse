import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabase";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { files, userId } = await req.json();

    const analyzedExpenses = await Promise.all(
      files.map(async (file: any) => {
        // Analyze the receipt using OpenAI Vision
        const response = await openai.chat.completions.create({
          model: "gpt-4-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this receipt and extract the following information in JSON format: amount, date, merchant name, category (choose from: Travel, Meals, Office Supplies, Software, Hardware, Other), and any notable items. Also provide a confidence score (0-100) for the category prediction.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: file.receiptUrl,
                  },
                },
              ],
            },
          ],
          max_tokens: 500,
        });

        const analysis = JSON.parse(
          response.choices[0].message.content || "{}"
        );

        // Create expense record in database
        const expense = await prisma.expense.create({
          data: {
            amount: analysis.amount,
            description: `${analysis.merchant_name} - ${
              analysis.notable_items || ""
            }`,
            date: new Date(analysis.date),
            receiptUrl: file.receiptUrl,
            submittedById: userId,
            aiCategory: analysis.category,
            aiConfidence: analysis.confidence,
            aiNotes: JSON.stringify(analysis),
          },
        });

        return {
          id: expense.id,
          amount: expense.amount,
          category: expense.aiCategory,
          confidence: expense.aiConfidence,
          notes: expense.aiNotes,
        };
      })
    );

    return NextResponse.json(analyzedExpenses);
  } catch (error) {
    console.error("Error analyzing receipts:", error);
    return NextResponse.json(
      { error: "Failed to analyze receipts" },
      { status: 500 }
    );
  }
}
