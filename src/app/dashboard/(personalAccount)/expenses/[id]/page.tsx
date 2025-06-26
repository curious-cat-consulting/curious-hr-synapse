"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";

import { ReceiptsAndLineItems } from "@/src/components/expenses/receipts-and-line-items";
import { ExpenseApprovalButtons } from "@components/expenses/expense-approval-buttons";
import { ExportExpenseDetailsButton } from "@components/expenses/export-expense-details-button";
import { Badge } from "@components/ui/badge";
import { Card, CardContent } from "@components/ui/card";
import { useCurrentUser } from "@lib/hooks/use-accounts";
import { createClient } from "@lib/supabase/client";
import { getStatusColor } from "@lib/utils";
import type { Expense } from "@type/expense";

interface ExpenseDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function ExpenseDetailsPage({ params }: Readonly<ExpenseDetailsPageProps>) {
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: currentUser } = useCurrentUser();

  const fetchExpenseDetails = async () => {
    try {
      const { id } = await params;
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_expense_details", {
        expense_id: id,
      });

      if (error !== null) {
        console.error("Error fetching expense:", error);
        return;
      }

      setExpense(data as Expense);
    } catch (error) {
      console.error("Error fetching expense:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenseDetails();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
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

  // Check if current user is the expense owner
  const isExpenseOwner = currentUser?.id === expense.user_id;

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
                    {expense.account_expense_id}
                  </span>
                  <h1 className="text-3xl font-bold">{expense.title}</h1>
                  <Badge
                    variant={expense.account_personal ? "secondary" : "default"}
                    className="text-xs"
                  >
                    {expense.account_name}
                  </Badge>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400">{expense.description}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {expense.currency_code} {expense.amount.toFixed(2)}
                </p>
                <Badge className={`mt-3 px-3 py-1 text-sm ${getStatusColor(expense.status)}`}>
                  {expense.status}
                </Badge>
              </div>
            </div>

            {/* Approval Buttons for Team Owners */}
            {!isExpenseOwner && (
              <div className="mb-6">
                <ExpenseApprovalButtons
                  expense={expense}
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
                  {format(new Date(expense.created_at), "PPP")}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Last Updated
                  </p>
                  <p className="text-sm font-semibold">
                    {format(new Date(expense.updated_at), "PPP")}
                  </p>
                </div>
                <ExportExpenseDetailsButton
                  expense={expense}
                  filename={`expense-${expense.account_expense_id}`}
                  variant="ghost"
                  size="sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receipts & Line Items with Tabs */}
        <ReceiptsAndLineItems
          expense={expense}
          onReceiptsUploaded={fetchExpenseDetails}
          onLineItemAdded={fetchExpenseDetails}
          onLineItemDeleted={fetchExpenseDetails}
          isExpenseOwner={isExpenseOwner}
        />
      </div>
    </div>
  );
}
