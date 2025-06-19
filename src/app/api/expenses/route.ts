import { NextResponse } from "next/server";

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

      // Upload each receipt to Supabase Storage
      const uploadPromises = receipts.map(async (receipt) => {
        const fileName = `${Date.now()}-${receipt.name}`;
        const filePath = `${user.id}/${expense.id}/${fileName}`;

        // Upload file to storage
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(filePath, receipt);

        if (uploadError !== null) {
          console.error("Error uploading receipt:", uploadError);
          throw uploadError;
        }
      });

      await Promise.all(uploadPromises);
      console.log(`Successfully uploaded ${receipts.length} receipts`);
    }

    console.log(`Expense creation complete: ${expense.id}`);

    return NextResponse.json({
      success: true,
      data: expense,
    });
  } catch (error: unknown) {
    console.error("Error creating expense:", error);

    const message = error instanceof Error ? error.message : "Failed to create expense";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
