import { NextResponse } from "next/server";

import { createClient } from "@lib/supabase/server";

const ALLOWED_STATUSES = ["ANALYZED", "NEW", "PENDING"] as const;
const MANAGER_STATUSES = ["APPROVED", "REJECTED"] as const;

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

    const { status } = await request.json();

    // Check if the status is valid
    if (![...ALLOWED_STATUSES, ...MANAGER_STATUSES].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // If trying to approve/reject, check if user is a manager
    if (MANAGER_STATUSES.includes(status)) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("roles")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
      }

      if (!profile.roles.includes("MANAGER")) {
        return NextResponse.json(
          { error: "Only managers can approve or reject expenses" },
          { status: 403 }
        );
      }
    }

    // Update the expense status
    const { data: expense, error: updateError } = await supabase
      .from("expenses")
      .update({ status })
      .eq("id", params.id)
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
