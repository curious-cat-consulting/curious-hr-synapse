"use client";

import { useEffect, useState } from "react";

import { NewExpenseDrawer } from "@components/expenses/new-expense-drawer";
import { TeamExpensesWithFilters } from "@components/expenses/team-expenses-with-filters";
import { createClient } from "@lib/supabase/client";
import type { TeamExpense } from "@type/expense";

interface TeamExpensesPageProps {
  params: Promise<{
    accountSlug: string;
  }>;
}

export default function TeamExpensesPage({ params }: Readonly<TeamExpensesPageProps>) {
  const [expenses, setExpenses] = useState<TeamExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingExpenseId, setProcessingExpenseId] = useState<string | null>(null);
  const [accountSlug, setAccountSlug] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);

  const fetchAccountDetails = async (slug: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_account_by_slug", {
        slug: slug,
      });

      if (error !== null) {
        console.error("Error fetching account details:", error);
        return;
      }

      setAccountId(data.account_id);
      setAccountName(data.name);
    } catch (error) {
      console.error("Error fetching account details:", error);
    }
  };

  const fetchTeamExpenses = async (slug: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_team_expenses", {
        team_account_slug: slug,
      });

      if (error !== null) {
        console.error("Error fetching team expenses:", error);
        return;
      }

      setExpenses(data ?? []);
    } catch (error) {
      console.error("Error fetching team expenses:", error);
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
      const expense = data as any;
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
    const loadParams = async () => {
      const { accountSlug: slug } = await params;
      setAccountSlug(slug);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (accountSlug !== null) {
      fetchAccountDetails(accountSlug);
      fetchTeamExpenses(accountSlug);
    }
  }, [accountSlug]);

  // Poll for expense status when processing
  useEffect(() => {
    if (!isProcessing || processingExpenseId === null) return;

    const pollInterval = setInterval(async () => {
      const isComplete = await pollExpenseStatus(processingExpenseId);

      if (isComplete) {
        setIsProcessing(false);
        setProcessingExpenseId(null);
        if (accountSlug !== null) {
          fetchTeamExpenses(accountSlug); // Refresh the list
        }
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [isProcessing, processingExpenseId, accountSlug]);

  const handleExpenseCreated = (expenseId: string) => {
    // Close dialog immediately and show loading indicator
    setIsProcessing(true);
    setProcessingExpenseId(expenseId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Team Expenses</h1>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
            <p className="text-gray-600">Loading team expenses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Team Expenses</h1>
        <NewExpenseDrawer
          onExpenseCreated={handleExpenseCreated}
          accountId={accountId ?? undefined}
          accountName={accountName ?? undefined}
        />
      </div>

      <TeamExpensesWithFilters expenses={expenses} accountSlug={accountSlug ?? undefined} />
    </div>
  );
}
