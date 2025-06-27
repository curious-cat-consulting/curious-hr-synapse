"use client";

import { NewExpenseDrawer } from "@components/expenses/new-expense-drawer";

interface ExpensesPageHeaderProps {
  fraudFilter?: string;
  accountId?: string;
  accountName?: string;
}

export function ExpensesPageHeader({
  fraudFilter,
  accountId,
  accountName,
}: ExpensesPageHeaderProps) {
  const handleExpenseCreated = (_expenseId: string) => {
    // Refresh the page to show the new expense
    window.location.reload();
  };

  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold">
        {fraudFilter === "high" ? "Fraud Flagged Expenses" : "Team Expenses"}
      </h1>
      <NewExpenseDrawer
        onExpenseCreated={handleExpenseCreated}
        accountId={accountId}
        accountName={accountName}
      />
    </div>
  );
}
