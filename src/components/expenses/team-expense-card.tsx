import Link from "next/link";

import { Card, CardContent } from "@components/ui/card";
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "ANALYZED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "NEW":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
    }
  };

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
              <h3 className="font-semibold">{expense.title}</h3>
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
