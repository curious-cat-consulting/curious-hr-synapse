"use client";

import { useEffect, useState } from "react";

import { ExpensesWithFilters } from "@/src/components/expenses/expenses-with-filters";
import { NewExpenseDrawer } from "@components/expenses/new-expense-drawer";
import { createClient } from "@lib/supabase/client";
import type { Expense } from "@type/expense";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExpenses = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_expenses");

      if (error !== null) {
        console.error("Error fetching expenses:", error);
        return;
      }

      setExpenses(data ?? []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleExpenseCreated = (_expenseId: string) => {
    // Refresh the expense list after creating a new expense
    fetchExpenses();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Expenses</h1>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
            <p className="text-gray-600">Loading expenses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <NewExpenseDrawer onExpenseCreated={handleExpenseCreated} />
      </div>

      <ExpensesWithFilters expenses={expenses} />
    </div>
  );
}
