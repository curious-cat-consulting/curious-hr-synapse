"use client";

import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { useExpenseFilters } from "@/src/lib/hooks/use-expense-filters";
import { TeamExpenseCard } from "@components/expenses/team-expense-card";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Tabs, TabsContent } from "@components/ui/tabs";
import type { TeamExpense } from "@type/expense";

import { ExpenseFilters } from "./expense-filters";

interface TeamExpensesWithFiltersProps {
  expenses: TeamExpense[];
  accountSlug?: string;
  compact?: boolean;
}

export function TeamExpensesWithFilters({
  expenses,
  accountSlug,
  compact = false,
}: Readonly<TeamExpensesWithFiltersProps>) {
  const { filters, actions, filterExpenses, getUniqueUsers } = useExpenseFilters({
    includeTeamFeatures: true,
  });

  const users = useMemo(() => getUniqueUsers(expenses), [expenses, getUniqueUsers]);

  const filteredAndSortedExpenses = useMemo(() => {
    return filterExpenses(expenses);
  }, [expenses, filterExpenses]);

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
            <h3 className="text-lg font-semibold">No team expenses found</h3>
            <p className="text-muted-foreground">
              No expenses match your current filters, or your team hasn&apos;t created any expenses
              yet.
            </p>
          </div>
          <Button asChild>
            <Link href="/expenses/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Team Expense
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

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
        compact={compact}
        onResetFilters={actions.resetFilters}
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
                            <TeamExpenseCard expense={expense} accountSlug={accountSlug} />
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
