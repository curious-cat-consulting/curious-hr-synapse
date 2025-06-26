"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { useExpenseFilters } from "@/src/lib/hooks/use-expense-filters";
import { ExpenseCard } from "@components/expenses/expense-card";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import type { Expense } from "@type/expense";

import { ExpenseFilters } from "./expense-filters";

interface ExpensesWithFiltersProps {
  expenses: Expense[];
  exportFilename?: string;
}

export function ExpensesWithFilters({
  expenses,
  exportFilename,
}: Readonly<ExpensesWithFiltersProps>) {
  const { filters, actions, filterExpenses } = useExpenseFilters({
    includeTeamFeatures: false,
  });

  const filteredAndSortedExpenses = useMemo(() => {
    return filterExpenses(expenses);
  }, [expenses, filterExpenses]);

  return (
    <div className="space-y-6">
      <ExpenseFilters
        statusFilters={filters.statusFilters}
        onStatusFiltersChange={actions.setStatusFilters}
        sortBy={filters.sortBy}
        onSortByChange={actions.setSortBy}
        includeTeamFeatures={false}
        includeUserSort={false}
        onResetFilters={actions.resetFilters}
        expenses={filteredAndSortedExpenses}
        exportFilename={exportFilename}
      />

      {filteredAndSortedExpenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted p-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No expenses found</h3>
                <p className="text-muted-foreground">Get started by creating your first expense.</p>
              </div>
              <Button asChild>
                <Link href="/expenses/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Expense
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedExpenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} />
          ))}
        </div>
      )}
    </div>
  );
}
