import { NextResponse } from "next/server";

import { createClient } from "@lib/supabase/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
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

    // Verify the expense exists and belongs to the user
    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .select("id, user_id")
      .eq("id", params.id)
      .single();

    if (expenseError || !expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    if (expense.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lineItem = await request.json();

    // Insert the line item
    const { data, error } = await supabase
      .from("receipt_line_items")
      .insert({
        ...lineItem,
        receipt_name: "manual-entry",
        expense_id: params.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error adding line item:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to add line item" },
      { status: 500 }
    );
  }
}
