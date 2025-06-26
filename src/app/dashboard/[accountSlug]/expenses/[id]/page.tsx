import { format } from "date-fns";

import { DuplicateDetectionCard } from "@/src/components/expenses/duplicate-detection-card";
import { ExpenseApprovalButtons } from "@/src/components/expenses/expense-approval-buttons";
import { ReceiptsAndLineItemsWrapper } from "@/src/components/expenses/receipts-and-line-items-wrapper";
import { ExportExpenseDetailsButton } from "@components/expenses/export-expense-details-button";
import { Badge } from "@components/ui/badge";
import { Card, CardContent } from "@components/ui/card";
import { createClient } from "@lib/supabase/server";
import { getStatusColor } from "@lib/utils";
import type { Expense } from "@type/expense";

interface TeamExpenseDetailsPageProps {
  params: Promise<{
    accountSlug: string;
    id: string;
  }>;
}

export default async function TeamExpenseDetailsPage({
  params,
}: Readonly<TeamExpenseDetailsPageProps>) {
  const { accountSlug, id } = await params;

  const supabase = createClient();
  const { data: expense, error } = await supabase.rpc("get_expense_details", {
    expense_id: id,
  });

  if (error !== null) {
    console.error("Error fetching expense:", error);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Error loading expense</div>
      </div>
    );
  }

  if (expense === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Expense not found</div>
      </div>
    );
  }

  const expenseData = expense as Expense;

  // Get current user to check if they're the expense owner
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isExpenseOwner = user?.id === expenseData.user_id;

  return (
    <div className="space-y-8">
      {/* Main Content */}
      <div className="space-y-6">
        {/* Header Card with Dates */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-6 flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-gray-100 px-3 py-1 font-mono text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {expenseData.account_expense_id}
                  </span>
                  <h1 className="text-3xl font-bold">{expenseData.title}</h1>
                  <Badge
                    variant={expenseData.account_personal ? "secondary" : "default"}
                    className="text-xs"
                  >
                    {expenseData.account_name}
                  </Badge>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {expenseData.description}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {expenseData.currency_code} {expenseData.amount.toFixed(2)}
                </p>
                <Badge className={`mt-3 px-3 py-1 text-sm ${getStatusColor(expenseData.status)}`}>
                  {expenseData.status}
                </Badge>
              </div>
            </div>

            {/* Approval Buttons for Team Owners */}
            {!isExpenseOwner && (
              <div className="mb-6">
                <ExpenseApprovalButtons
                  expense={expenseData}
                  onStatusUpdated={() => {
                    // This will need to be handled differently in server component
                    // For now, we'll rely on page refresh
                  }}
                  isOwner={true}
                />
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-1 gap-6 border-t pt-6 md:grid-cols-2">
              <div>
                <p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Created Date
                </p>
                <p className="text-sm font-semibold">
                  {format(new Date(expenseData.created_at), "PPP")}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Last Updated
                  </p>
                  <p className="text-sm font-semibold">
                    {format(new Date(expenseData.updated_at), "PPP")}
                  </p>
                </div>
                <ExportExpenseDetailsButton
                  expense={expenseData}
                  filename={`team-expense-${expenseData.account_expense_id}`}
                  variant="ghost"
                  size="sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Duplicate Detection Card */}
        <DuplicateDetectionCard expenseId={id} accountSlug={accountSlug} />

        {/* Receipts & Line Items with Tabs */}
        <ReceiptsAndLineItemsWrapper expense={expenseData} isExpenseOwner={isExpenseOwner} />
      </div>
    </div>
  );
}
