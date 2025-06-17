"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthGuard } from "@components/auth/AuthGuard";
import { ExpenseCard } from "@components/expenses/ExpenseCard";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Checkbox } from "@components/ui/checkbox";
import { Label } from "@components/ui/label";
import { useToast } from "@components/ui/use-toast";
import type { Expense } from "@type/expense";

export default function ExpensesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilters, setStatusFilters] = useState<Record<string, boolean>>({
    NEW: true,
    PENDING: true,
    ANALYZED: true,
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

  // Show success message if redirected from new expense submission
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("success") === "true") {
      toast({
        title: "Success",
        description: "Expense report submitted successfully",
        variant: "success",
      });
      // Clean up the URL
      router.replace("/dashboard/expenses");
    }
  }, [router, toast]);

  const toggleStatusFilter = (status: string) => {
    setStatusFilters((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const filteredExpenses = expenses.filter((expense) => statusFilters[expense.status]);

  return (
    <AuthGuard>
      <div className="container mx-auto py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Expenses</h1>
          <Button onClick={() => router.push("/dashboard/expenses/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Expense
          </Button>
        </div>

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
                  <Badge variant={checked ? "default" : "outline"}>{status}</Badge>
                </Label>
              </div>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="mb-4 text-muted-foreground">No expenses found</p>
              <Button onClick={() => router.push("/dashboard/expenses/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first expense
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
      </div>
    </AuthGuard>
  );
}
