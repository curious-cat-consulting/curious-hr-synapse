"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";

import { LineItemsList } from "@/src/components/expenses/line-items-list";
import { ReceiptUploader } from "@/src/components/shared/receipt-uploader";
import { Badge } from "@components/ui/badge";
import { Card, CardContent } from "@components/ui/card";
import { createClient } from "@lib/supabase/client";
import type { Expense } from "@type/expense";

interface ExpenseDetailsPageProps {
  params: {
    id: string;
  };
}

function getStatusColor(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    case "ANALYZED":
      return "bg-blue-100 text-blue-800";
    case "NEW":
      return "bg-gray-100 text-gray-800";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function ExpenseDetailsPage({ params }: Readonly<ExpenseDetailsPageProps>) {
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchExpenseDetails = async () => {
    try {
      const { id } = await params;
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_expense_details", {
        expense_id: id,
      });

      if (error !== null) {
        console.error("Error fetching expense:", error);
        return;
      }

      setExpense(data as Expense);
    } catch (error) {
      console.error("Error fetching expense:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenseDetails();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (expense === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Expense not found</div>
      </div>
    );
  }

  const canUploadReceipts = expense.status === "NEW" || expense.status === "ANALYZED";

  // Combine all line items
  const allLineItems = [...expense.receipt_line_items, ...expense.mileage_line_items];

  return (
    <div className="space-y-8">
      {/* Main Content */}
      <div className="space-y-6">
        {/* Header Card with Dates */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-6 flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">{expense.title}</h1>
                <p className="text-lg text-gray-600">{expense.description}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">
                  {expense.currency_code} {expense.amount.toFixed(2)}
                </p>
                <Badge className={`mt-3 px-3 py-1 text-sm ${getStatusColor(expense.status)}`}>
                  {expense.status}
                </Badge>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 gap-6 border-t pt-6 md:grid-cols-2">
              <div>
                <p className="mb-1 text-sm font-medium text-gray-500">Created Date</p>
                <p className="text-sm font-semibold">
                  {format(new Date(expense.created_at), "PPP")}
                </p>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-gray-500">Last Updated</p>
                <p className="text-sm font-semibold">
                  {format(new Date(expense.updated_at), "PPP")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Upload Section - Only show when needed */}
        {canUploadReceipts && (
          <ReceiptUploader
            expenseId={expense.id}
            title="Upload Receipts"
            description="Upload receipt images or PDFs to process this expense"
          />
        )}

        {/* Line Items Section */}
        <LineItemsList
          lineItems={allLineItems}
          expenseStatus={expense.status}
          expenseId={expense.id}
          onLineItemAdded={fetchExpenseDetails}
          onLineItemDeleted={fetchExpenseDetails}
        />
      </div>
    </div>
  );
}
