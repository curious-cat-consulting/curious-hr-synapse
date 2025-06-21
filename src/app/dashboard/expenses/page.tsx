"use client";

import { useEffect, useState } from "react";

import { ExpensesWithFilters } from "@components/expenses/expenses-with-filters";
import { NewExpenseDialog } from "@components/expenses/new-expense-dialog";
import { createClient } from "@lib/supabase/client";
import type { Expense } from "@type/expense";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingExpenseId, setProcessingExpenseId] = useState<string | null>(null);

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

  // Poll for expense status updates
  const pollExpenseStatus = async (expenseId: string) => {
    const supabase = createClient();

    try {
      const { data, error } = await supabase.rpc("get_expense_details", {
        expense_id: expenseId,
      });

      if (error !== null) {
        console.error("Error polling expense status:", error);
        return false;
      }

      // Check if processing is complete
      const expense = data as Expense;
      const isComplete = expense.status === "ANALYZED" || expense.status === "PENDING";

      if (isComplete) {
        console.log(`Expense ${expenseId} processing complete, status: ${expense.status}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error polling expense status:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Poll for expense status when processing
  useEffect(() => {
    if (!isProcessing || processingExpenseId === null) return;

    const pollInterval = setInterval(async () => {
      const isComplete = await pollExpenseStatus(processingExpenseId);

      if (isComplete) {
        setIsProcessing(false);
        setProcessingExpenseId(null);
        fetchExpenses(); // Refresh the list
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [isProcessing, processingExpenseId]);

  const handleExpenseCreated = (expenseId: string) => {
    // Close dialog immediately and show loading indicator
    setIsProcessing(true);
    setProcessingExpenseId(expenseId);
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
        <NewExpenseDialog onExpenseCreated={handleExpenseCreated} />
      </div>

      <ExpensesWithFilters expenses={expenses} />
    </div>
  );
}
