"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { useToast } from "@components/ui/use-toast";
import { ReceiptUploader } from "@components/expenses/ReceiptUploader";

interface ReceiptMetadata {
  id: string;
  receipt_name: string;
  vendor_name: string;
  receipt_date: string;
  receipt_total: number;
  tax_amount: number;
  confidence_score: number;
}

interface ReceiptLineItem {
  id: string;
  receipt_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  category: string;
}

interface ExpenseDetails {
  id: string;
  user_id: string;
  title: string;
  description: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  receipt_metadata: ReceiptMetadata[];
  receipt_line_items: ReceiptLineItem[];
  receipts: string[];
}

export default function ExpenseDetailsPage() {
  const params = useParams();
  const { toast } = useToast();
  const [expense, setExpense] = useState<ExpenseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchExpenseDetails();
  }, [params.id]);

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
    } finally {
      setIsLoading(false);
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
          expenseId: params.id,
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

      // Refresh expense details
      await fetchExpenseDetails();
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

  const handleReceiptUpload = async (
    files: { file: File; preview: string; id: string }[]
  ) => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("receipts", file.file);
      });

      const response = await fetch(`/api/expenses/${params.id}/receipts`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error ?? "Failed to upload receipts");
      }

      toast({
        title: "Success",
        description: "Receipts uploaded successfully",
      });

      // Refresh expense details
      await fetchExpenseDetails();
    } catch (error) {
      console.error("Error uploading receipts:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to upload receipts",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!expense) {
    return <div>Expense not found</div>;
  }

  // Create a map of analyzed receipt names
  const analyzedReceipts = new Set(
    expense.receipt_metadata?.map((meta) => meta.receipt_name) || []
  );

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
              <dd className="mt-1">${expense.amount.toFixed(2)}</dd>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expense.receipts.map((receipt) => (
                <div
                  key={receipt}
                  className="flex items-center justify-between p-2 rounded-lg border"
                >
                  <span className="text-sm truncate">{receipt}</span>
                  {analyzedReceipts.has(receipt) ? (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      Analyzed
                    </span>
                  ) : (
                    <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                      Pending
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <ReceiptUploader
              onUpload={handleReceiptUpload}
              existingReceipts={expense.receipts}
            />
          </CardContent>
        </Card>
      </div>

      {expense.receipt_metadata && expense.receipt_metadata.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Receipt Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expense.receipt_metadata.map((receipt) => (
                <div
                  key={receipt.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{receipt.vendor_name}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(receipt.receipt_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${receipt.receipt_total.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Confidence:{" "}
                        {(receipt.confidence_score * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {expense.receipt_line_items && expense.receipt_line_items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expense.receipt_line_items.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{item.description}</h3>
                      {item.category && (
                        <p className="text-sm text-gray-500">
                          Category: {item.category}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${item.total_amount.toFixed(2)}
                      </p>
                      {item.quantity && item.unit_price && (
                        <p className="text-sm text-gray-500">
                          {item.quantity} × ${item.unit_price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
