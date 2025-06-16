import { NextResponse } from "next/server";
import { createClient } from "@lib/supabase/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch expense details
    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .select(
        `
        *,
        receipt_metadata (*),
        receipt_line_items (*),
        mileage_line_items (*)
      `
      )
      .eq("id", params.id)
      .single();

    if (expenseError || !expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    if (expense.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // List all receipts in the expense's directory
    const { data: receipts, error: listError } = await supabase.storage
      .from("receipts")
      .list(`${user.id}/${params.id}`);

    if (listError) {
      throw new Error("Failed to list receipts");
    }

    // Add receipt names to the response
    const expenseWithReceipts = {
      ...expense,
      receipts: receipts?.map((receipt) => receipt.name) || [],
    };

    return NextResponse.json(expenseWithReceipts);
  } catch (error: any) {
    console.error("Error fetching expense details:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch expense details" },
      { status: 500 }
    );
  }
}
