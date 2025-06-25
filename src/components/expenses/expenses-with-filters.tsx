"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";

import { ExpenseCard } from "@components/expenses/expense-card";
import {
  ExpenseSortControl,
  sortExpenses,
  type ExpenseSortOption,
} from "@components/expenses/expense-sort-control";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Label } from "@components/ui/label";
import type { Expense } from "@type/expense";

import { Checkbox } from "../ui";

interface ExpensesWithFiltersProps {
  expenses: Expense[];
}

export function ExpensesWithFilters({ expenses }: Readonly<ExpensesWithFiltersProps>) {
  const [statusFilters, setStatusFilters] = useState<Record<string, boolean>>({
    NEW: true,
    PENDING: true,
    ANALYZED: true,
    APPROVED: false,
    REJECTED: false,
  });
  const [sortBy, setSortBy] = useState<ExpenseSortOption>("created_date");

  const toggleStatusFilter = (status: string) => {
    setStatusFilters((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const filteredAndSortedExpenses = useMemo(() => {
    const filtered = expenses.filter((expense) => statusFilters[expense.status]);
    return sortExpenses(filtered, sortBy);
  }, [expenses, statusFilters, sortBy]);

  return (
    <>
      <div className="mb-6 space-y-4">
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

          <ExpenseSortControl sortBy={sortBy} onSortChange={setSortBy} includeUserSort={false} />
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
        <div className="grid gap-4">
          {filteredAndSortedExpenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} />
          ))}
        </div>
      )}
    </>
  );
}
