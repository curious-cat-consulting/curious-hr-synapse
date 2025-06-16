"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@components/ui/card";
import { useToast } from "@components/ui/use-toast";
import { Expense } from "@type/expense";
import { ExpenseCard } from "@components/expenses/ExpenseCard";
import { Badge } from "@components/ui/badge";
import { Checkbox } from "@components/ui/checkbox";
import { Label } from "@components/ui/label";

export default function ReviewPage() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilters, setStatusFilters] = useState<Record<string, boolean>>({
    NEW: false,
    PENDING: true,
    ANALYZED: false,
    APPROVED: false,
    REJECTED: false,
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch("/api/expenses");
      if (!response.ok) {
        throw new Error("Failed to fetch expenses");
      }
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch expenses",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilters((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const filteredExpenses = expenses.filter(
    (expense) => statusFilters[expense.status]
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Expense Review</h1>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-medium mb-2">Filter by Status</h2>
        <div className="flex flex-wrap gap-4">
          {Object.entries(statusFilters).map(([status, isChecked]) => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${status}`}
                checked={isChecked}
                onCheckedChange={() => toggleStatusFilter(status)}
              />
              <Label htmlFor={`status-${status}`}>
                <Badge variant="outline" className="capitalize">
                  {status.toLowerCase()}
                </Badge>
              </Label>
            </div>
          ))}
        </div>
      </div>

      <ExpensesList expenses={filteredExpenses} isLoading={isLoading} />
    </div>
  );
}

function ExpensesList({
  expenses,
  isLoading,
}: Readonly<{
  expenses: Expense[];
  isLoading: boolean;
}>) {
  if (isLoading) return <div>Loading...</div>;
  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">No expenses found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {expenses.map((expense) => (
        <ExpenseCard key={expense.id} expense={expense} />
      ))}
    </div>
  );
}
