import { Suspense } from "react";

import { TeamExpensesWithFilters } from "@/src/components/expenses/team-expenses-with-filters";
import { getAccountBySlug } from "@lib/actions/accounts";
import { getFraudDetectionData } from "@lib/actions/fraud-detection";
import { createClient } from "@lib/supabase/server";
import { OwnerOnlyPage } from "@lib/utils/owner-only";

interface TeamExpensesPageProps {
  params: Promise<{
    accountSlug: string;
  }>;
  searchParams: Promise<{
    fraud?: string;
  }>;
}

// Server component for data fetching
async function TeamExpensesContent({
  accountSlug,
  fraudFilter,
}: {
  accountSlug: string;
  fraudFilter?: string;
}) {
  // Fetch account data using server-side action
  let accountData;
  let accountError;
  try {
    accountData = await getAccountBySlug(accountSlug);
  } catch (error) {
    accountError = error as Error;
  }

  const accountId = accountData?.account_id;
  const accountName = accountData?.name;

  // Fetch team expenses
  const supabase = createClient();
  const { data: expensesData, error: expensesError } = await supabase.rpc("get_team_expenses", {
    team_account_slug: accountSlug,
  });

  const expenses = expensesData ?? [];

  // Fetch fraud data server-side if fraud filter is active
  let fraudData = null;
  if (fraudFilter === "high" && accountId != null) {
    try {
      const { fraudIndicators } = await getFraudDetectionData(accountId);
      fraudData = fraudIndicators;
    } catch (error) {
      console.error("Error fetching fraud data:", error);
    }
  }

  // Handle account error
  if (accountError != null) {
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

  // Handle expenses error
  if (expensesError != null) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Team Expenses</h1>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-red-600">Error loading expenses: {expensesError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <TeamExpensesWithFilters
        expenses={expenses}
        accountSlug={accountSlug}
        exportFilename={`team-expenses-${accountSlug}`}
        fraudFilter={fraudFilter}
        accountId={accountId}
        initialFraudData={fraudData}
        accountName={accountName}
      />
    </div>
  );
}

export default async function TeamExpensesPage({
  params,
  searchParams,
}: Readonly<TeamExpensesPageProps>) {
  const { accountSlug } = await params;
  const { fraud } = await searchParams;

  return (
    <OwnerOnlyPage accountSlug={accountSlug}>
      <Suspense
        fallback={
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
        }
      >
        <TeamExpensesContent accountSlug={accountSlug} fraudFilter={fraud} />
      </Suspense>
    </OwnerOnlyPage>
  );
}
