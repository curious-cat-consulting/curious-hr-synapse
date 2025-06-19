import { format } from "date-fns";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReceiptUploader } from "@/src/components/shared/receipt-uploader";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { createClient } from "@lib/supabase/server";
import type { Expense } from "@type/expense";

interface ExpenseDetailsPageProps {
  params: {
    id: string;
  };
}

async function getExpenseDetails(id: string): Promise<Expense | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_expense_details", { expense_id: id }).single();

  if (error !== null || data === null || data === undefined) {
    return null;
  }

  return data as Expense;
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

export default async function ExpenseDetailsPage({ params }: Readonly<ExpenseDetailsPageProps>) {
  const expense = await getExpenseDetails(params.id);

  if (expense === null) {
    notFound();
  }

  const canUploadReceipts = expense.status === "NEW" || expense.status === "ANALYZED";

  return (
    <div className="space-y-8">
      {/* Back Button and Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/expenses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Expenses
            </Button>
          </Link>
        </div>
      </div>

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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Line Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="py-12 text-center text-gray-500">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <p className="mb-2 text-lg font-medium">No line items yet</p>
              <p className="text-sm">Click &quot;Add Line Item&quot; to get started</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
