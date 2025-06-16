"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { useToast } from "@components/ui/use-toast";
import { LineItemsList } from "@components/expenses/LineItemsList";
import { ReceiptsSection } from "@components/expenses/ReceiptsSection";
import { AddLineItemButton } from "@components/expenses/AddLineItemButton";
import { ExpenseDetails } from "@type/expense";

export default function ExpenseDetailsPage() {
  const params = useParams();
  const { toast } = useToast();
  const [expense, setExpense] = useState<ExpenseDetails | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchExpenseDetails = async () => {
    try {
      const response = await fetch(`/api/expenses/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch expense details");
      const data = await response.json();
      setExpense(data);
    } catch (error) {
      console.error("Error fetching expense details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch expense details",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchExpenseDetails();
  }, [params.id]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/receipts/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expenseId: params.id }),
      });

      if (!response.ok) throw new Error("Failed to analyze receipts");

      toast({
        title: "Success",
        description: "Receipts analyzed successfully",
      });

      await fetchExpenseDetails();
    } catch (error) {
      console.error("Error analyzing receipts:", error);
      toast({
        title: "Error",
        description: "Failed to analyze receipts",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!expense) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{expense.title}</h1>
        {expense.status === "pending" && (
          <Button onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? "Analyzing..." : "Analyze Receipts"}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1">{expense.description}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Amount</dt>
              <dd className="mt-1">
                {expense.currency_code} {expense.amount.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">{expense.status.toUpperCase()}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1">
                {new Date(expense.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <ReceiptsSection
        expenseId={expense.id}
        receiptMetadata={expense.receipt_metadata}
        lineItems={expense.receipt_line_items}
        onReceiptsUploaded={fetchExpenseDetails}
      />

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Line Items</h2>
        <AddLineItemButton
          expenseId={expense.id}
          onLineItemAdded={fetchExpenseDetails}
        />
      </div>

      <LineItemsList lineItems={expense.receipt_line_items} />
    </div>
  );
}
