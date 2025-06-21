import { NextResponse } from "next/server";

import { processReceiptsForExpense } from "@lib/analysis/receipt-processing";
import { createClient } from "@lib/supabase/server";

export async function POST(request: Request, {}: { params: { id: string } }) {
  try {
    console.log("Processing receipts for expense");

    const supabase = await createClient();

    const body = await request.json();
    const { expenseId } = body;

    // Process receipts using the existing logic
    await processReceiptsForExpense(supabase, expenseId);

    console.log(`Receipt processing complete for expense: ${expenseId}`);

    return NextResponse.json({
      success: true,
      message: "Receipts processed successfully",
    });
  } catch (error: unknown) {
    console.error("Error processing receipts:", error);

    return NextResponse.json({ error: "Error processing receipts" }, { status: 500 });
  }
}
