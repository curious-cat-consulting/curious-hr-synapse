import { Clock } from "lucide-react";
import React from "react";

import { Badge } from "@components/ui/badge";
import { Card, CardContent } from "@components/ui/card";
import { createClient } from "@lib/supabase/server";

interface RecentActivityProps {
  title: string;
  accountId?: string;
}

const getStatusStyles = (status: string): string => {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-600";
    case "REJECTED":
      return "bg-red-100 text-red-600";
    case "PENDING":
      return "bg-yellow-100 text-yellow-700";
    case "ANALYZED":
      return "bg-blue-100 text-blue-700";
    default:
      return "text-gray-600";
  }
};

export async function RecentActivity({ title, accountId }: RecentActivityProps) {
  // Fetch recent activity using the new RPC
  const supabase = createClient();
  const { data: expenses, error } = await supabase.rpc("get_recent_activity", {
    account_id: accountId ?? null,
  });

  let content: React.ReactNode;
  if (error != null || !Array.isArray(expenses) || expenses.length === 0) {
    content = (
      <div className="py-8 text-center">
        <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">
          Recent activity will appear here as you start submitting expenses
        </p>
      </div>
    );
  } else {
    content = (
      <ul className="divide-y">
        {expenses.map(
          (expense: {
            id: string;
            account_expense_id: number;
            title: string;
            amount: number;
            status: string;
            created_at: string;
            user_name: string;
          }) => (
            <li key={expense.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-4">
                <span className="min-w-[60px] font-mono text-sm text-muted-foreground">
                  #{expense.account_expense_id}
                </span>
                <div>
                  <div className="font-medium">{expense.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(expense.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {accountId != null && <Badge variant="secondary">{expense.user_name}</Badge>}
                <span className="font-semibold">${expense.amount.toFixed(2)}</span>
                <span
                  className={`rounded-full bg-gray-100 px-2 py-1 text-xs ${getStatusStyles(expense.status)}`}
                >
                  {expense.status}
                </span>
              </div>
            </li>
          )
        )}
      </ul>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="mb-6 text-2xl font-semibold">{title}</h2>
      <Card>
        <CardContent className="pt-6">{content}</CardContent>
      </Card>
    </div>
  );
}
