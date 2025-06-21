import { NextResponse } from "next/server";

import { processReceiptsForExpense } from "@lib/analysis/receipt-processing";
import { createClient } from "@lib/supabase/server";

export async function POST(request: Request) {
  try {
    console.log("Creating new expense");

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError !== null || user === null) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const receipts = formData.getAll("receipts") as File[];

    console.log(`Expense title: "${title}", receipts: ${receipts.length}`);

    // Create expense using RPC function
    const { data: expense, error: rpcError } = await supabase.rpc("create_expense", {
      expense_title: title,
      expense_description: description,
    });

    if (rpcError !== null) {
      console.error("Error creating expense:", rpcError);
      throw rpcError;
    }

    console.log(`Expense created with ID: ${expense.id}`);

    // If there are receipts, upload them directly
    if (receipts.length > 0) {
      console.log(`Processing ${receipts.length} receipts`);

      // Process receipts with AI analysis (including upload)
      console.log("Starting receipt analysis...");
      await processReceiptsForExpense(supabase, expense.id, user.id, receipts);
    }

    console.log(`Expense creation complete: ${expense.id}`);

    return NextResponse.json({
      success: true,
      data: expense,
    });
  } catch (error: unknown) {
    console.error("Error creating expense:", error);

    return NextResponse.json({ error: "Error creating expense" }, { status: 500 });
  }
}
