"use client";

import { Users } from "lucide-react";
import { useMemo, useEffect, useState } from "react";

import { useExpenseFilters } from "@/src/lib/hooks/use-expense-filters";
import { TeamExpenseCard } from "@components/expenses/team-expense-card";
import { Badge } from "@components/ui/badge";
import { Card, CardContent } from "@components/ui/card";
import { Tabs, TabsContent } from "@components/ui/tabs";
import { createClient } from "@lib/supabase/client";
import type { TeamExpense } from "@type/expense";

import { ExpenseFilters } from "./expense-filters";
import { NewExpenseDrawer } from "./new-expense-drawer";

interface TeamExpensesWithFiltersProps {
  expenses: TeamExpense[];
  accountSlug?: string;
  exportFilename?: string;
  fraudFilter?: string | null;
  accountId?: string;
  initialFraudData?: FraudData[] | null;
}

interface FraudData {
  expense_id: string;
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
}

export function TeamExpensesWithFilters({
  expenses,
  accountSlug,
  exportFilename,
  fraudFilter,
  accountId,
  initialFraudData,
}: Readonly<TeamExpensesWithFiltersProps>) {
  const [fraudData, setFraudData] = useState<FraudData[]>([]);
  const [isLoadingFraud, setIsLoadingFraud] = useState(false);

  const { filters, actions, filterExpenses, getUniqueUsers } = useExpenseFilters({
    includeTeamFeatures: true,
  });

  const users = useMemo(() => getUniqueUsers(expenses), [expenses, getUniqueUsers]);

  // Use initial fraud data if provided, otherwise fetch client-side
  useEffect(() => {
    if (initialFraudData != null) {
      setFraudData(initialFraudData);
    } else if (fraudFilter === "high" && accountId != null) {
      setIsLoadingFraud(true);
      const fetchFraudData = async () => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase.rpc("detect_fraud_patterns", {
            account_id: accountId,
          });

          if (error != null) {
            console.error("Error fetching fraud data:", error);
            return;
          }

          setFraudData(data ?? []);
        } catch (error) {
          console.error("Error fetching fraud data:", error);
        } finally {
          setIsLoadingFraud(false);
        }
      };

      fetchFraudData();
    } else {
      setFraudData([]);
    }
  }, [fraudFilter, accountId, initialFraudData]);

  // Create a map of fraud data by expense ID for quick lookup
  const fraudDataMap = useMemo(() => {
    const map = new Map<string, FraudData>();
    fraudData.forEach((item) => {
      map.set(item.expense_id, item);
    });
    return map;
  }, [fraudData]);

  // Apply fraud filtering if fraudFilter is active
  const fraudFilteredExpenses = useMemo(() => {
    if (fraudFilter !== "high" || accountId == null) {
      return expenses;
    }

    // Filter to only show expenses that have fraud data
    return expenses.filter((expense) => fraudDataMap.has(expense.id));
  }, [expenses, fraudFilter, accountId, fraudDataMap]);

  const filteredAndSortedExpenses = useMemo(() => {
    return filterExpenses(fraudFilteredExpenses);
  }, [fraudFilteredExpenses, filterExpenses]);

  // Group expenses by user for the "byUser" view
  const expensesByUser = useMemo(() => {
    const grouped = new Map<string, TeamExpense[]>();
    filteredAndSortedExpenses.forEach((expense) => {
      if (!grouped.has(expense.user_id)) {
        grouped.set(expense.user_id, []);
      }
      grouped.get(expense.user_id)!.push(expense);
    });
    return grouped;
  }, [filteredAndSortedExpenses]);

  // Wrapper function to handle type conversion for onValueChange
  const handleViewModeChange = (value: string) => {
    if (value === "chronological" || value === "byUser") {
      actions.setViewMode(value);
    }
  };

  const EmptyState = () => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted p-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {fraudFilter === "high"
                ? "No fraud flagged expenses found"
                : "No team expenses found"}
            </h3>
            <p className="text-muted-foreground">
              {fraudFilter === "high"
                ? "No expenses match the current fraud detection criteria, or fraud detection has not flagged any expenses yet."
                : "No expenses match your current filters, or your team hasn't created any expenses yet."}
            </p>
          </div>
          {fraudFilter !== "high" && (
            <NewExpenseDrawer
              accountId={accountId}
              accountName={accountSlug}
              onExpenseCreated={() => {
                // Refresh the page to show the new expense
                window.location.reload();
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Show loading state while fetching fraud data
  if (fraudFilter === "high" && isLoadingFraud) {
    return (
      <div className="space-y-6">
        <ExpenseFilters
          statusFilters={filters.statusFilters}
          onStatusFiltersChange={actions.setStatusFilters}
          selectedUser={filters.selectedUser}
          onSelectedUserChange={actions.setSelectedUser}
          viewMode={filters.viewMode}
          onViewModeChange={actions.setViewMode}
          sortBy={filters.sortBy}
          onSortByChange={actions.setSortBy}
          users={users}
          includeTeamFeatures={true}
          includeUserSort={true}
          onResetFilters={actions.resetFilters}
          expenses={[]}
          exportFilename={exportFilename}
          fraudFilter={fraudFilter}
        />
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
              <p className="text-gray-600">Loading fraud detection data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ExpenseFilters
        statusFilters={filters.statusFilters}
        onStatusFiltersChange={actions.setStatusFilters}
        selectedUser={filters.selectedUser}
        onSelectedUserChange={actions.setSelectedUser}
        viewMode={filters.viewMode}
        onViewModeChange={actions.setViewMode}
        sortBy={filters.sortBy}
        onSortByChange={actions.setSortBy}
        users={users}
        includeTeamFeatures={true}
        includeUserSort={true}
        onResetFilters={actions.resetFilters}
        expenses={filteredAndSortedExpenses}
        exportFilename={exportFilename}
        fraudFilter={fraudFilter}
      />

      {filteredAndSortedExpenses.length === 0 ? (
        <EmptyState />
      ) : (
        <Tabs value={filters.viewMode} onValueChange={handleViewModeChange} className="w-full">
          <TabsContent value="chronological" className="mt-0">
            <div className="grid gap-4">
              {filteredAndSortedExpenses.map((expense) => (
                <TeamExpenseCard
                  key={expense.id}
                  expense={expense}
                  showUserName
                  accountSlug={accountSlug}
                  fraudData={fraudDataMap.get(expense.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="byUser" className="mt-0">
            <div className="space-y-8">
              {Array.from(expensesByUser.entries()).map(([userId, userExpenses]) => {
                const user = users.find((u) => u.id === userId);
                return (
                  <Card key={userId} className="overflow-hidden">
                    <div className="border-b bg-muted/50 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-primary/10 p-2">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{user?.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {userExpenses.length} expense{userExpenses.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-background">
                          {userExpenses.length}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {userExpenses.map((expense) => (
                          <div key={expense.id} className="p-4">
                            <TeamExpenseCard
                              expense={expense}
                              accountSlug={accountSlug}
                              fraudData={fraudDataMap.get(expense.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
