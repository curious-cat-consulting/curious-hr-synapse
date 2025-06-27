import Link from "next/link";

import { AccountBadge } from "@components/ui/account-badge";
import { Card, CardContent } from "@components/ui/card";
import { getStatusColor } from "@lib/utils";
import type { Expense } from "@type/expense";

interface ExpenseCardProps {
  expense: Expense;
}

export function ExpenseCard({ expense }: Readonly<ExpenseCardProps>) {
  return (
    <Link href={`/dashboard/expenses/${expense.id}`}>
      <Card className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {expense.account_expense_id}
                </span>
                <h3 className="font-semibold">{expense.title}</h3>
                {!expense.account_personal && (
                  <AccountBadge
                    accountName={expense.account_name}
                    isPersonal={false}
                    variant="outline"
                    className="text-xs"
                  />
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{expense.description}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                {expense.currency_code} {expense.amount.toFixed(2)}
              </p>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                  expense.status
                )}`}
              >
                {expense.status}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
