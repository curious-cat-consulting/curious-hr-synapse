"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";

import {
  ExpenseSortControl,
  sortExpenses,
  type ExpenseSortOption,
} from "@components/expenses/expense-sort-control";
import { TeamExpenseCard } from "@components/expenses/team-expense-card";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import type { TeamExpense } from "@type/expense";

import { Checkbox } from "../ui";

interface TeamExpensesWithFiltersProps {
  expenses: TeamExpense[];
  accountSlug?: string;
}

export function TeamExpensesWithFilters({
  expenses,
  accountSlug,
}: Readonly<TeamExpensesWithFiltersProps>) {
  const [statusFilters, setStatusFilters] = useState<Record<string, boolean>>({
    NEW: true,
    PENDING: true,
    ANALYZED: true,
    APPROVED: false,
    REJECTED: false,
  });
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"chronological" | "byUser">("chronological");
  const [sortBy, setSortBy] = useState<ExpenseSortOption>("created_date");

  const toggleStatusFilter = (status: string) => {
    setStatusFilters((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  // Get unique users for filtering
  const users = useMemo(() => {
    const userMap = new Map<string, { name: string }>();
    expenses.forEach((expense) => {
      if (!userMap.has(expense.user_id)) {
        userMap.set(expense.user_id, {
          name: expense.user_name,
        });
      }
    });
    return Array.from(userMap.entries()).map(([id, user]) => ({
      id,
      name: user.name,
    }));
  }, [expenses]);

  // Filter and sort expenses
  const filteredAndSortedExpenses = useMemo(() => {
    const filtered = expenses.filter((expense) => {
      const statusMatch = statusFilters[expense.status];
      const userMatch = selectedUser === "all" || expense.user_id === selectedUser;
      return statusMatch && userMatch;
    });

    return sortExpenses(filtered, sortBy);
  }, [expenses, statusFilters, selectedUser, sortBy]);

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

  return (
    <>
      <div className="mb-6 space-y-4">
        {/* Status Filters and Sort Control */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="mb-2 text-sm font-medium">Filter by Status</h2>
            <div className="flex flex-wrap gap-4">
              {Object.entries(statusFilters).map(([status, checked]) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={status}
                    checked={checked}
                    onCheckedChange={() => toggleStatusFilter(status)}
                  />
                  <Label htmlFor={status} className="text-sm">
                    <Badge>{status}</Badge>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <ExpenseSortControl sortBy={sortBy} onSortChange={setSortBy} includeUserSort={true} />
        </div>

        {/* User Filter */}
        <div>
          <h2 className="mb-2 text-sm font-medium">Filter by User</h2>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* View Mode Toggle */}
        <div>
          <h2 className="mb-2 text-sm font-medium">View Mode</h2>
          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as "chronological" | "byUser")}
          >
            <TabsList>
              <TabsTrigger value="chronological">Chronological</TabsTrigger>
              <TabsTrigger value="byUser">By User</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {filteredAndSortedExpenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="mb-4 text-muted-foreground">No expenses found</p>
            <Button asChild>
              <Link href="/expenses/new">
                <Plus className="mr-2 h-4 w-4" />
                Create your first expense
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as "chronological" | "byUser")}
          className="w-full"
        >
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
            <div className="space-y-6">
              {Array.from(expensesByUser.entries()).map(([userId, userExpenses]) => {
                const user = users.find((u) => u.id === userId);
                return (
                  <div key={userId} className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="text-lg font-semibold">{user?.name}</h3>
                      <Badge variant="outline">{userExpenses.length} expenses</Badge>
                    </div>
                    <div className="grid gap-4">
                      {userExpenses.map((expense) => (
                        <TeamExpenseCard
                          key={expense.id}
                          expense={expense}
                          accountSlug={accountSlug}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}
