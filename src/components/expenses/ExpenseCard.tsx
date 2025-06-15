import { useState } from "react";
import { Card, CardContent } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { useToast } from "@components/ui/use-toast";
import { Expense } from "@type/expense";
import { Loader2 } from "lucide-react";

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
          <div>
            <h3 className="font-semibold text-lg">{expense.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
            <div className="mt-2 text-sm">
              <p>Submitted by: {expense.submitted_by.name}</p>
              <p>
                Amount: {expense.amount} {expense.currency}
              </p>
              <p>Date: {new Date(expense.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {expense.status === "PENDING" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze"
                )}
              </Button>
            )}
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
  );
}
