import { NextResponse } from "next/server";
import { createClient } from "@lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { status } = await request.json();

    // Update the expense status
    const { data: expense, error: updateError } = await supabase
      .from('expenses')
      .update({ status })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(expense);
  } catch (error: any) {
    console.error("Error updating expense status:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to update expense status" },
      { status: 500 }
    );
  }
} 