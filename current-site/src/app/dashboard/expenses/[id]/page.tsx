"use client";

import { AuthGuard } from "@/src/components/auth/AuthGuard";
import { useAuthGuard } from "@/src/hooks/useAuthGuard";
import { AddLineItemButton } from "@components/expenses/AddLineItemButton";
import type { LineItem } from "@components/expenses/LineItemsList";
import { LineItemsList } from "@components/expenses/LineItemsList";

import { ExpenseDetailsHeader, ExpenseDetailsCard } from "./components";
import { ReceiptsSection } from "./components/ReceiptsSection";
import { useExpenseDetails } from "./hooks";

export default function ExpenseDetailsPage() {
  const { user } = useAuthGuard();
  const {
    expense,
    allLineItems,
    isAnalyzing,
    isRequestingApproval,
    isManager,
    hasReceipts,
    fetchExpenseDetails,
    handleAnalyze,
    handleRequestApproval,
    handleApprove,
    handleReject,
    handleExport,
  } = useExpenseDetails(user);

  if (expense === null) {
    return <div>Loading...</div>;
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        <ExpenseDetailsHeader
          title={expense.title}
          status={expense.status}
          hasReceipts={hasReceipts}
          isAnalyzing={isAnalyzing}
          isRequestingApproval={isRequestingApproval}
          isManager={isManager}
          onAnalyze={handleAnalyze}
          onRequestApproval={handleRequestApproval}
          onApprove={handleApprove}
          onReject={handleReject}
          onExport={handleExport}
        />

        <ExpenseDetailsCard expense={expense} />

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
          lineItems={allLineItems as LineItem[]}
          onLineItemDeleted={fetchExpenseDetails}
          expenseStatus={expense.status}
        />
      </div>
    </AuthGuard>
  );
}
