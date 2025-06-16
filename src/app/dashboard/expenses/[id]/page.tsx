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
import { createClient } from "@lib/supabase/client";
import { Download } from "lucide-react";
import { AuthGuard } from "@/src/components/auth/AuthGuard";
import { useAuthGuard } from "@/src/hooks/useAuthGuard";

export default function ExpenseDetailsPage() {
  const { user } = useAuthGuard();
  const params = useParams();
  const { toast } = useToast();
  const [expense, setExpense] = useState<ExpenseDetails | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRequestingApproval, setIsRequestingApproval] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const hasReceipts = (expense?.receipt_metadata?.length ?? 0) > 0;

  useEffect(() => {
    const checkManagerRole = async () => {
      const supabase = createClient();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("roles")
          .eq("id", user.id)
          .single();
        setIsManager(profile?.roles?.includes("MANAGER") ?? false);
      }
    };
    checkManagerRole();
  }, []);

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
        variant: "success",
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

  const handleRequestApproval = async () => {
    setIsRequestingApproval(true);
    try {
      const response = await fetch(`/api/expenses/${params.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "PENDING" }),
      });

      if (!response.ok) throw new Error("Failed to request approval");

      toast({
        title: "Success",
        description: "Approval requested successfully",
        variant: "success",
      });

      await fetchExpenseDetails();
    } catch (error) {
      console.error("Error requesting approval:", error);
      toast({
        title: "Error",
        description: "Failed to request approval",
        variant: "destructive",
      });
    } finally {
      setIsRequestingApproval(false);
    }
  };

  const handleApprove = async () => {
    try {
      const response = await fetch(`/api/expenses/${params.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "APPROVED" }),
      });

      if (!response.ok) throw new Error("Failed to approve expense");

      toast({
        title: "Success",
        description: "Expense approved successfully",
        variant: "success",
      });

      await fetchExpenseDetails();
    } catch (error) {
      console.error("Error approving expense:", error);
      toast({
        title: "Error",
        description: "Failed to approve expense",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    try {
      const response = await fetch(`/api/expenses/${params.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "REJECTED" }),
      });

      if (!response.ok) throw new Error("Failed to reject expense");

      toast({
        title: "Success",
        description: "Expense rejected successfully",
        variant: "success",
      });

      await fetchExpenseDetails();
    } catch (error) {
      console.error("Error rejecting expense:", error);
      toast({
        title: "Error",
        description: "Failed to reject expense",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    if (!expense) return;

    try {
      const response = await fetch(`/api/expenses/${params.id}/export`, {
        method: "GET",
      });

      if (!response.ok) throw new Error("Failed to export expense");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expense-${expense.title}-${new Date().toISOString()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting expense:", error);
      toast({
        title: "Error",
        description: "Failed to export expense",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "ANALYZED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "NEW":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
    }
  };

  if (!expense) {
    return <div>Loading...</div>;
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{expense.title}</h1>
          <div className="flex gap-2">
            {expense.status === "NEW" && (
              <Button
                onClick={handleAnalyze}
                disabled={!hasReceipts || isAnalyzing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isAnalyzing ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Analyzing...
                  </div>
                ) : (
                  "Analyze Receipts"
                )}
              </Button>
            )}
            {expense.status === "ANALYZED" && (
              <Button
                onClick={handleRequestApproval}
                disabled={isRequestingApproval}
                className="bg-green-600 hover:bg-green-700"
              >
                {isRequestingApproval ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Requesting...
                  </div>
                ) : (
                  "Request Approval"
                )}
              </Button>
            )}
            {isManager && expense.status === "PENDING" && (
              <>
                <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                  Approve
                </Button>
                <Button onClick={handleReject} className="bg-red-600 hover:bg-red-700">
                  Reject
                </Button>
              </>
            )}
            {isManager && expense.status === "APPROVED" && (
              <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Expense Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                <dd className="mt-1">{expense.description}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Amount</dt>
                <dd className="mt-1">
                  {expense.currency_code} {expense.amount.toFixed(2)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                      expense.status
                    )}`}
                  >
                    {expense.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                <dd className="mt-1">{new Date(expense.created_at).toLocaleDateString()}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <ReceiptsSection
          expenseId={expense.id}
          receiptMetadata={expense.receipt_metadata}
          lineItems={expense.receipt_line_items}
          onReceiptsUploaded={fetchExpenseDetails}
          expenseStatus={expense.status}
        />

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Line Items</h2>
          <AddLineItemButton
            expenseId={expense.id}
            onLineItemAdded={fetchExpenseDetails}
            expenseStatus={expense.status}
          />
        </div>

        <LineItemsList
          lineItems={expense.receipt_line_items}
          onLineItemDeleted={fetchExpenseDetails}
          expenseStatus={expense.status}
        />
      </div>
    </AuthGuard>
  );
}
