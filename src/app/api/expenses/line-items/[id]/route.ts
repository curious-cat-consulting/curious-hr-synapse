import { NextResponse } from "next/server";
import { createClient } from "@lib/supabase/server";

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

    // Delete the line item
    const { error: deleteError } = await supabase
      .from("receipt_line_items")
      .delete()
      .eq("id", params.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting line item:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to delete line item" },
      { status: 500 }
    );
  }
}
