import { NextResponse } from "next/server";

import { createNotification } from "@lib/actions/notifications";
import { createClient } from "@lib/supabase/server";

export async function POST() {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError !== null || user === null) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's personal account
    const { data: personalAccount, error: accountError } =
      await supabase.rpc("get_personal_account");

    if (accountError !== null || personalAccount === null) {
      return NextResponse.json({ error: "Failed to get account" }, { status: 500 });
    }

    // Create a test notification
    const notification = await createNotification(
      "EXPENSE_ANALYZED",
      "Test AI Analysis Complete",
      "This is a test notification for AI analysis completion. Your expense has been processed successfully!",
      personalAccount.account_id,
      {
        expense_id: "test-expense-123",
        account_name: personalAccount.name,
        receipts_processed: 2,
      }
    );

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error: unknown) {
    console.error("Error creating test notification:", error);

    return NextResponse.json({ error: "Error creating test notification" }, { status: 500 });
  }
}
