"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";

import { DuplicateDetectionCard } from "@/src/components/expenses/duplicate-detection-card";
import { ExpenseApprovalButtons } from "@/src/components/expenses/expense-approval-buttons";
import { ReceiptsAndLineItems } from "@/src/components/expenses/receipts-and-line-items";
import { ExportExpenseDetailsButton } from "@components/expenses/export-expense-details-button";
import { AccountBadge } from "@components/ui/account-badge";
import { Badge } from "@components/ui/badge";
import { Card, CardContent } from "@components/ui/card";
import { LoadingSpinner } from "@components/ui/loading-spinner";
import { useCurrentUser } from "@lib/hooks/use-accounts";
import { createClient } from "@lib/supabase/client";
import { getStatusColor } from "@lib/utils";
import type { Expense } from "@type/expense";

interface TeamExpenseDetailsPageProps {
  params: Promise<{
    accountSlug: string;
    id: string;
  }>;
}

interface AccountData {
  account_id: string;
  name: string;
  metadata?: {
    self_approvals_enabled?: boolean;
  };
}

export default function TeamExpenseDetailsPage({ params }: Readonly<TeamExpenseDetailsPageProps>) {
  const [expense, setExpense] = useState<Expense | null>(null);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: currentUser } = useCurrentUser();

  const fetchExpenseDetails = async () => {
    try {
      const { id, accountSlug } = await params;
      const supabase = createClient();

      // Fetch expense details
      const { data: expenseData, error: expenseError } = await supabase.rpc("get_expense_details", {
        expense_id: id,
      });

      if (expenseError !== null) {
        console.error("Error fetching expense:", expenseError);
        return;
      }

      // Fetch account data to check self approvals setting
      const { data: accountData, error: accountError } = await supabase.rpc("get_account_by_slug", {
        slug: accountSlug,
      });

      if (accountError !== null) {
        console.error("Error fetching account:", accountError);
        return;
      }

      setExpense(expenseData as Expense);
      setAccountData(accountData as AccountData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenseDetails();
  }, [fetchExpenseDetails]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Loading expense details..." />
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
  const isExpenseOwner = currentUser?.id === expenseData.user_id;

  // Check if self approvals are enabled for this account
  const selfApprovalsEnabled = accountData?.metadata?.self_approvals_enabled ?? false;

  // Show approval buttons if:
  // 1. User is not the expense owner (existing logic), OR
  // 2. User is the expense owner AND self approvals are enabled
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const shouldShowApprovalButtons = !isExpenseOwner || (isExpenseOwner && selfApprovalsEnabled);

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
                  <AccountBadge
                    accountName={expenseData.user_name}
                    isPersonal={true}
                    className="text-xs"
                  />
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
            {shouldShowApprovalButtons && (
              <div className="mb-6">
                <ExpenseApprovalButtons
                  expense={expenseData}
                  onStatusUpdated={fetchExpenseDetails}
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
        <DuplicateDetectionCard expenseId={expenseData.id} accountSlug={expenseData.account_name} />

        {/* Receipts & Line Items with Tabs */}
        <ReceiptsAndLineItems
          expense={expenseData}
          onReceiptsUploaded={fetchExpenseDetails}
          onLineItemAdded={fetchExpenseDetails}
          onLineItemDeleted={fetchExpenseDetails}
          isExpenseOwner={isExpenseOwner}
        />
      </div>
    </div>
  );
}
