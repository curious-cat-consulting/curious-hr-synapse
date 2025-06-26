"use client";

import { Receipt, FileText, Plus, AlertCircle } from "lucide-react";
import { useState } from "react";

import { LineItemsList } from "@/src/components/expenses/line-items/line-items-list";
import { ReceiptUploader } from "@/src/components/shared/receipt-uploader";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import type { Expense, LineItem } from "@type/expense";

import { AddLineItemDrawer } from "./line-items/add-line-item-drawer";

interface ReceiptsAndLineItemsProps {
  expense: Expense;
  onReceiptsUploaded: () => void;
  onLineItemAdded: () => void;
  onLineItemDeleted: () => void;
  isExpenseOwner: boolean;
}

export function ReceiptsAndLineItems({
  expense,
  onReceiptsUploaded,
  onLineItemAdded,
  onLineItemDeleted,
  isExpenseOwner,
}: Readonly<ReceiptsAndLineItemsProps>) {
  const [activeTab, setActiveTab] = useState("receipts");
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | undefined>();
  const canUploadReceipts = ["ANALYZED", "NEW", "PENDING"].includes(expense.status);
  const canEdit = !["APPROVED", "REJECTED"].includes(expense.status);

  // Combine all line items for the line items tab
  const allLineItems: LineItem[] = [...expense.receipt_line_items, ...expense.mileage_line_items];

  // Calculate total receipts (processed + unprocessed)
  const totalReceipts = expense.receipt_metadata.length + expense.unprocessed_receipts.length;

  const openAddDrawer = (receiptId?: string) => {
    setSelectedReceiptId(receiptId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipts & Line Items</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="receipts" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Receipts ({totalReceipts})
            </TabsTrigger>
            <TabsTrigger value="line-items" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Line Items ({allLineItems.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="receipts" className="space-y-6">
            {canUploadReceipts && isExpenseOwner && (
              <ReceiptUploader
                expenseId={expense.id}
                onUploadSuccess={() => {
                  onReceiptsUploaded();
                }}
              />
            )}

            {/* Show unprocessed receipts first */}
            {expense.unprocessed_receipts.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Unprocessed Receipts
                </h3>
                {expense.unprocessed_receipts.map((receipt) => {
                  const fileName = receipt.name.split("/").pop();
                  return (
                    <div
                      key={receipt.id}
                      className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <div>
                            <h3 className="font-medium">{fileName}</h3>
                            <p className="text-sm text-gray-500">
                              Uploaded {new Date(receipt.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="flex-shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                        >
                          Pending Analysis
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        This receipt was uploaded but hasn&apos;t been analyzed yet. It will be
                        processed automatically.
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Show processed receipts */}
            {expense.receipt_metadata.length > 0 ? (
              <div className="space-y-4">
                {expense.unprocessed_receipts.length > 0 && (
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Processed Receipts
                  </h3>
                )}
                {expense.receipt_metadata.map((receipt) => (
                  <div key={receipt.id} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{receipt.vendor_name}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(receipt.receipt_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-medium">
                            {receipt.currency_code} {receipt.receipt_total?.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Confidence: {(receipt.confidence_score * 100).toFixed(1)}%
                          </p>
                        </div>
                        {canEdit && isExpenseOwner && (
                          <AddLineItemDrawer
                            expenseId={expense.id}
                            onLineItemAdded={onLineItemAdded}
                            receipts={expense.receipt_metadata}
                            selectedReceiptId={receipt.receipt_id}
                            trigger={
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openAddDrawer(receipt.receipt_id)}
                                className="ml-2"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            }
                          />
                        )}
                      </div>
                    </div>

                    {/* Show line items for this receipt */}
                    {expense.receipt_line_items
                      .filter((item) => item.receipt_id === receipt.receipt_id)
                      .map((item) => {
                        const isDeleted = item.is_deleted ?? false;
                        return (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between rounded-md p-3 ${
                              isDeleted
                                ? "bg-gray-50/50 opacity-60 dark:bg-gray-800/30"
                                : "bg-gray-50 dark:bg-gray-800"
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className={`truncate text-sm ${
                                  isDeleted ? "text-gray-400 line-through dark:text-gray-500" : ""
                                }`}
                              >
                                {item.description}
                              </span>
                              <span
                                className={`flex-shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${
                                  isDeleted
                                    ? "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                    : "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-100"
                                }`}
                              >
                                {item.is_ai_generated ? "AI" : "Manual"}
                              </span>
                              {isDeleted && (
                                <span className="flex-shrink-0 rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-500 dark:bg-red-900/20 dark:text-red-400">
                                  Deleted
                                </span>
                              )}
                            </div>
                            <span
                              className={`ml-2 flex-shrink-0 text-sm font-medium ${
                                isDeleted ? "text-gray-400 dark:text-gray-500" : ""
                              }`}
                            >
                              {receipt.currency_code} {item.total_amount.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            ) : expense.unprocessed_receipts.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Receipt className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="mb-2 text-lg font-medium">No receipts yet</p>
                <p className="text-sm">
                  {canUploadReceipts && isExpenseOwner
                    ? "Upload receipts to get started with expense tracking"
                    : "Receipts will appear here once uploaded"}
                </p>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="line-items" className="space-y-4">
            <LineItemsList
              lineItems={allLineItems}
              expenseStatus={expense.status}
              expenseId={expense.id}
              onLineItemAdded={onLineItemAdded}
              onLineItemDeleted={onLineItemDeleted}
              receipts={expense.receipt_metadata}
              selectedReceiptId={selectedReceiptId}
              isExpenseOwner={isExpenseOwner}
            />
          </TabsContent>
        </Tabs>

        <AddLineItemDrawer
          expenseId={expense.id}
          onLineItemAdded={onLineItemAdded}
          receipts={expense.receipt_metadata}
          selectedReceiptId={selectedReceiptId}
        />
      </CardContent>
    </Card>
  );
}
