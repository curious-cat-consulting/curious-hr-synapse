import type { SupabaseClient } from "@supabase/supabase-js";

export type ExpenseStatus = "NEW" | "ANALYZED" | "PENDING" | "APPROVED" | "REJECTED";

export class ExpenseUpdateService {
  constructor(private readonly supabase: SupabaseClient) {}

  async validateExpenseOwnership(expenseId: string, userId: string) {
    console.log(`Validating expense ownership for user: ${userId}`);

    const { data: expense, error: expenseError } = await this.supabase
      .from("expenses")
      .select("id, user_id")
      .eq("id", expenseId)
      .single();

    if (expenseError !== null) {
      console.error("Failed to fetch expense details", expenseError);
      throw new Error("Failed to fetch expense details");
    }

    if (expense.user_id !== userId) {
      throw new Error("Unauthorized access to expense");
    }

    return expense;
  }

  async updateExpenseStatus(expenseId: string, status: ExpenseStatus) {
    console.log(`Updating expense ${expenseId} status to: ${status}`);

    const { error: updateError } = await this.supabase
      .from("expenses")
      .update({
        status: status.toLowerCase(),
      })
      .eq("id", expenseId);

    if (updateError !== null) {
      console.error("Failed to update expense status", updateError);
      throw updateError;
    }

    console.log(`Successfully updated expense ${expenseId} status to ${status}`);
  }

  async markExpenseAsAnalyzed(expenseId: string) {
    await this.updateExpenseStatus(expenseId, "ANALYZED");
  }

  async getExpenseDetails(expenseId: string) {
    const { data: expense, error } = await this.supabase
      .from("expenses")
      .select("*")
      .eq("id", expenseId)
      .single();

    if (error !== null) {
      console.error("Failed to fetch expense details", error);
      throw new Error("Failed to fetch expense details");
    }

    return expense;
  }
}
