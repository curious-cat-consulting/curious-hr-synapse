"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Plus } from "lucide-react";
import { useToast } from "@components/ui/use-toast";
import { Expense } from "@type/expense";
import { ExpenseCard } from "@components/expenses/ExpenseCard";

export default function ExpensesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      });
      // Clean up the URL
      router.replace("/dashboard/expenses");
    }
  }, [router, toast]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Button onClick={() => router.push("/dashboard/expenses/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Expense
        </Button>
      </div>

      <ExpensesList expenses={expenses} isLoading={isLoading} />
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
