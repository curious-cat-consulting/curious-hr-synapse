import { NextResponse } from "next/server";

import { createClient } from "@lib/supabase/server";

import { ReceiptAnalysisService, ReceiptStorageService, ExpenseUpdateService } from "./services";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { expenseId } = await request.json();

    console.log(`Starting receipt processing for expense: ${expenseId}`);

    if (expenseId === null) {
      return NextResponse.json({ error: "Missing expense ID" }, { status: 400 });
    }

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError === null || user === null) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`Processing for user: ${user.id}`);

    // Initialize services
    const analysisService = new ReceiptAnalysisService(supabase);
    const storageService = new ReceiptStorageService(supabase);
    const expenseService = new ExpenseUpdateService(supabase);

    // Validate expense ownership
    await expenseService.validateExpenseOwnership(expenseId, user.id);

    // Get receipts that need processing
    const receiptsToProcess = await analysisService.getReceiptsToProcess(user.id, expenseId);

    if (receiptsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All receipts have already been analyzed",
        data: [],
      });
    }

    // Process receipts with AI analysis
    const processedReceipts = await analysisService.processMultipleReceipts(
      user.id,
      expenseId,
      receiptsToProcess
    );

    // Store processed receipts in database
    const storedResults = await storageService.storeMultipleProcessedReceipts(
      expenseId,
      processedReceipts
    );

    // Update expense status to analyzed
    await expenseService.markExpenseAsAnalyzed(expenseId);

    console.log(`Receipt processing complete for expense ${expenseId}`);

    return NextResponse.json({
      success: true,
      data: storedResults,
    });
  } catch (error) {
    console.error("Error processing receipt:", error);
    return NextResponse.json({ error: "Failed to process receipt" }, { status: 500 });
  }
}
