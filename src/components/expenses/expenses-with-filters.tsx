"use client";

import type { Expense } from "@type/expense";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ExpenseCard } from "@components/expenses/expense-card";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Label } from "@components/ui/label";

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

  const toggleStatusFilter = (status: string) => {
    setStatusFilters((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const filteredExpenses = expenses.filter((expense) => statusFilters[expense.status]);

  return (
    <>
      <div className="mb-6">
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

      {filteredExpenses.length === 0 ? (
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
          {filteredExpenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} />
          ))}
        </div>
      )}
    </>
  );
}
