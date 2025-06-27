"use client";

import { Plus } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import { useExpenseFilters } from "@/src/lib/hooks/use-expense-filters";
import { ExpenseCard } from "@components/expenses/expense-card";
import { Card, CardContent } from "@components/ui/card";
import { createClient } from "@lib/supabase/client";
import type { Expense } from "@type/expense";

import { ExpenseFilters } from "./expense-filters";
import { NewExpenseDrawer } from "./new-expense-drawer";

interface ExpensesWithFiltersProps {
  expenses: Expense[];
  exportFilename?: string;
}

export function ExpensesWithFilters({
  expenses: initialExpenses,
  exportFilename,
}: Readonly<ExpensesWithFiltersProps>) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  // Update expenses when initialExpenses changes (e.g., from server props)
  useEffect(() => {
    setExpenses(initialExpenses);
  }, [initialExpenses]);

  const { filters, actions, filterExpenses } = useExpenseFilters({
    includeTeamFeatures: false,
  });

  const filteredAndSortedExpenses = useMemo(() => {
    return filterExpenses(expenses);
  }, [expenses, filterExpenses]);

  // Handle new expense creation
  const handleExpenseCreated = async (expenseId: string) => {
    try {
      // Fetch the newly created expense to add to the list
      const supabase = createClient();
      const { data: newExpense, error } = await supabase.rpc("get_expenses");

      if (error != null) {
        console.error("Error fetching new expense:", error);
        return;
      }

      // Find the newly created expense in the fetched data
      const createdExpense = newExpense?.find((expense: Expense) => expense.id === expenseId);

      if (createdExpense != null) {
        // Add the new expense to the beginning of the list
        setExpenses((prevExpenses) => [createdExpense, ...prevExpenses]);
      }
    } catch (error) {
      console.error("Error handling new expense:", error);
    }
  };

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
              <NewExpenseDrawer onExpenseCreated={handleExpenseCreated} />
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
