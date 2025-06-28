import Link from "next/link";

import { AccountBadge } from "@components/ui/account-badge";
import { Card, CardContent } from "@components/ui/card";
import { getStatusColor } from "@lib/utils";
import type { TeamExpense } from "@type/expense";

import { Badge } from "../ui/badge";

interface TeamExpenseCardProps {
  expense: TeamExpense;
  showUserName?: boolean;
  accountSlug?: string;
  fraudData?: {
    fraud_risk_score: number;
    risk_level: "HIGH" | "MEDIUM" | "LOW";
    indicators: {
      amount_anomaly?: string;
      submission_pattern?: string;
      timing_anomaly?: string;
      vendor_anomaly?: string;
      amount_pattern?: string;
      receipt_quality?: string;
    };
  };
}

export function TeamExpenseCard({
  expense,
  showUserName,
  accountSlug,
  fraudData,
}: Readonly<TeamExpenseCardProps>) {
  // Use team-specific route if accountSlug is provided, otherwise fall back to personal route
  const expenseDetailUrl =
    (accountSlug ?? "") !== ""
      ? `/dashboard/${accountSlug}/expenses/${expense.id}`
      : `/dashboard/expenses/${expense.id}`;

  const getRiskColor = (riskLevel: "HIGH" | "MEDIUM" | "LOW") => {
    const colors = {
      HIGH: "bg-red-100 border-red-300 text-red-800 dark:bg-red-950/30 dark:border-red-700 dark:text-red-200",
      MEDIUM:
        "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-200",
      LOW: "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-950/30 dark:border-blue-700 dark:text-blue-200",
    };
    return colors[riskLevel];
  };

  return (
    <Link href={expenseDetailUrl}>
      <Card
        className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
          fraudData != null ? getRiskColor(fraudData.risk_level) : ""
        }`}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {expense.account_expense_id}
                </span>
                <h3 className="font-semibold">{expense.title}</h3>
                {fraudData != null && (
                  <Badge variant="default" className="text-xs">
                    {fraudData.risk_level} RISK
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{expense.description}</p>
              {fraudData != null && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium">Risk Score: {fraudData.fraud_risk_score}</span>
                  </div>
                  {Object.entries(fraudData.indicators).map(
                    ([key, value]) =>
                      value !== "" && (
                        <div key={key} className="text-xs text-gray-600 dark:text-gray-400">
                          • {key.replace(/_/g, " ").toLowerCase()}: {value}
                        </div>
                      )
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <p className="font-semibold">${expense.amount.toFixed(2)}</p>
              <div className="flex items-center gap-2">
                {showUserName === true && (
                  <AccountBadge
                    accountName={expense.user_name}
                    isPersonal={true}
                    className="text-xs"
                  />
                )}
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
