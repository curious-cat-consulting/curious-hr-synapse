import Link from "next/link";

import { Card, CardContent } from "@components/ui/card";
import { getStatusColor } from "@lib/utils";
import type { TeamExpense } from "@type/expense";

import { Badge } from "../ui/badge";

interface TeamExpenseCardProps {
  expense: TeamExpense;
  showUserName?: boolean;
  accountSlug?: string;
}

export function TeamExpenseCard({
  expense,
  showUserName,
  accountSlug,
}: Readonly<TeamExpenseCardProps>) {
  // Use team-specific route if accountSlug is provided, otherwise fall back to personal route
  const expenseDetailUrl =
    (accountSlug ?? "") !== ""
      ? `/dashboard/${accountSlug}/expenses/${expense.id}`
      : `/dashboard/expenses/${expense.id}`;

  return (
    <Link href={expenseDetailUrl}>
      <Card className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {expense.account_expense_id}
                </span>
                <h3 className="font-semibold">{expense.title}</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{expense.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <p className="font-semibold">${expense.amount.toFixed(2)}</p>
              <div className="flex items-center gap-2">
                {showUserName === true && <Badge variant="secondary">{expense.user_name}</Badge>}
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                    expense.status
                  )}`}
                >
                  {expense.status}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
