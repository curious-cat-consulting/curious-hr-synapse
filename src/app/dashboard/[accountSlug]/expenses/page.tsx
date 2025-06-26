"use client";

import { useEffect, useState } from "react";

import { TeamExpensesWithFilters } from "@/src/components/expenses/team-expenses-with-filters";
import { NewExpenseDrawer } from "@components/expenses/new-expense-drawer";
import { useAccountBySlug } from "@lib/hooks/use-accounts";
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
  const [accountSlug, setAccountSlug] = useState<string | null>(null);

  // Use the cached hook instead of manual fetching
  const { data: accountData, error: accountError } = useAccountBySlug(accountSlug);
  const accountId = accountData?.account_id ?? null;
  const accountName = accountData?.name ?? null;

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

      setExpenses(data !== null ? data : []);
    } catch (error) {
      console.error("Error fetching team expenses:", error);
    } finally {
      setIsLoading(false);
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
      fetchTeamExpenses(accountSlug);
    }
  }, [accountSlug]);

  const handleExpenseCreated = (_expenseId: string) => {
    // Refresh the expense list after creating a new expense
    if (accountSlug !== null) {
      fetchTeamExpenses(accountSlug);
    }
  };

  // Handle account error
  if (accountError) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Team Expenses</h1>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-red-600">Error loading account: {accountError.message}</p>
          </div>
        </div>
      </div>
    );
  }

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
