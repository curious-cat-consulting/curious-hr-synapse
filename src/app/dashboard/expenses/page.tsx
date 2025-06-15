"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  receipt_urls: string[];
  submitted_by: {
    id: string;
    name: string;
    email: string;
  };
  approved_by?: {
    id: string;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

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
  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

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
        <Card key={expense.id}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{expense.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {expense.description}
                </p>
                <div className="mt-2 text-sm">
                  <p>Submitted by: {expense.submitted_by.name}</p>
                  <p>
                    Amount: {expense.amount} {expense.currency}
                  </p>
                  <p>
                    Date: {new Date(expense.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    expense.status
                  )}`}
                >
                  {expense.status}
                </span>
                {expense.approved_by && (
                  <span className="text-sm text-gray-500">
                    Approved by: {expense.approved_by.name}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
