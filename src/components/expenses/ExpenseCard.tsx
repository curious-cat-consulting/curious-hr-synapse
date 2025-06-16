import { useState } from "react";
import { Card, CardContent } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { useToast } from "@components/ui/use-toast";
import { Expense } from "@type/expense";
import { Eye } from "lucide-react";
import Link from "next/link";

interface ExpenseCardProps {
  expense: Expense;
}

export function ExpenseCard({ expense }: Readonly<ExpenseCardProps>) {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "ANALYZED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/receipts/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expenseId: expense.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error ?? "Failed to analyze expense");
      }

      toast({
        title: "Success",
        description: "Receipts analyzed successfully",
        variant: "success",
      });
    } catch (error) {
      console.error("Error analyzing expense:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to analyze receipts",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold">{expense.title}</h3>
              <Link href={`/dashboard/expenses/${expense.id}`}>
                <Eye className="h-4 w-4 text-gray-500 hover:text-gray-700" />
              </Link>
            </div>
            <p className="text-sm text-gray-500">{expense.description}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">
              {expense.currency_code} {expense.amount.toFixed(2)}
            </p>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                expense.status
              )}`}
            >
              {expense.status}
            </span>
          </div>
        </div>
        {expense.status === "PENDING" && (
          <div className="mt-4">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Receipts"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
