import { NextResponse } from "next/server";

import { createClient } from "@lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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

    // Get the line item
    const { data: lineItem, error: lineItemError } = await supabase
      .from("receipt_line_items")
      .select("*, expenses!inner(*)")
      .eq("id", params.id)
      .single();

    if (lineItemError || !lineItem) {
      return NextResponse.json({ error: "Line item not found" }, { status: 404 });
    }

    // Check if the expense belongs to the user
    if (lineItem.expenses.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the expense is in a state that allows editing
    if (["APPROVED", "REJECTED"].includes(lineItem.expenses.status)) {
      return NextResponse.json({ error: "Cannot edit line items in this state" }, { status: 400 });
    }

    const updates = await request.json();

    // Update the line item
    const { data, error } = await supabase
      .from("receipt_line_items")
      .update(updates)
      .eq("id", params.id)
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
    console.error("Error updating line item:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to update line item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    // Get the line item
    const { data: lineItem, error: lineItemError } = await supabase
      .from("receipt_line_items")
      .select("*, expenses!inner(*)")
      .eq("id", params.id)
      .single();

    if (lineItemError || !lineItem) {
      return NextResponse.json({ error: "Line item not found" }, { status: 404 });
    }

    // Check if the expense belongs to the user
    if (lineItem.expenses.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the expense is in a state that allows deletion
    if (["APPROVED", "REJECTED"].includes(lineItem.expenses.status)) {
      return NextResponse.json(
        { error: "Cannot delete line items in this state" },
        { status: 400 }
      );
    }

    if (lineItem.is_ai_generated) {
      // Soft delete for AI-generated items
      const { error } = await supabase
        .from("receipt_line_items")
        .update({ is_deleted: true })
        .eq("id", params.id);

      if (error) throw error;
    } else {
      // Hard delete for manual items
      const { error } = await supabase.from("receipt_line_items").delete().eq("id", params.id);

      if (error) throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("Error deleting line item:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to delete line item" },
      { status: 500 }
    );
  }
}
