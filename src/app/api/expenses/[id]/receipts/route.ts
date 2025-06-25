import { NextResponse } from "next/server";

import { processReceiptsForExpense } from "@lib/analysis/receipt-processing";
import { createClient } from "@lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("Processing receipts for expense");

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError !== null || user === null) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const formData = await request.formData();
    const receipts = formData.getAll("receipts") as File[];

    console.log(`Processing ${receipts.length} receipts for expense: ${id}`);

    // Process receipts using the enhanced logic (including upload)
    await processReceiptsForExpense(supabase, id, user.id, receipts);

    console.log(`Receipt processing complete for expense: ${id}`);

    return NextResponse.json({
      success: true,
      message: "Receipts processed successfully",
    });
  } catch (error: unknown) {
    console.error("Error processing receipts:", error);

    return NextResponse.json({ error: "Error processing receipts" }, { status: 500 });
  }
}
