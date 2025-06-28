import { Plus } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { createClient } from "@lib/supabase/client";
import type { LineItem, ReceiptMetadata } from "@type/expense";

import { AddLineItemDrawer } from "./add-line-item-drawer";
import { LineItemCard } from "./line-item-card";

interface LineItemsListProps {
  lineItems: LineItem[];
  onLineItemAdded?: () => void;
  onLineItemDeleted?: () => void;
  expenseStatus: string;
  expenseId: string;
  receipts?: ReceiptMetadata[];
  selectedReceiptId?: string;
  isExpenseOwner: boolean;
}

export function LineItemsList({
  lineItems,
  onLineItemAdded,
  onLineItemDeleted,
  expenseStatus,
  expenseId,
  receipts = [],
  selectedReceiptId,
  isExpenseOwner,
}: Readonly<LineItemsListProps>) {
  const canEdit = !["APPROVED", "REJECTED"].includes(expenseStatus) && isExpenseOwner;

  const handleDelete = async (itemId: string, itemType: "regular" | "miles") => {
    const supabase = createClient();

    try {
      const { error } = await supabase.rpc(
        itemType === "regular" ? "delete_receipt_line_item" : "delete_mileage_line_item",
        { line_item_id: itemId }
      );

      if (error !== null) throw error;

      toast.success("Line item deleted successfully");
      onLineItemDeleted?.();
    } catch (error: unknown) {
      console.error("Error deleting line item:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete line item";
      toast.error(errorMessage);
    }
  };

  if (lineItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-gray-500">
            <AddLineItemDrawer
              expenseId={expenseId}
              onLineItemAdded={onLineItemAdded}
              receipts={receipts}
              selectedReceiptId={selectedReceiptId}
              trigger={
                <button className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200">
                  <Plus className="h-8 w-8 text-gray-400" />
                </button>
              }
            />
            <p className="mb-2 text-lg font-medium">No line items yet</p>
            <p className="text-sm">Click the + icon to add your first line item</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          {canEdit && (
            <AddLineItemDrawer
              expenseId={expenseId}
              onLineItemAdded={onLineItemAdded}
              receipts={receipts}
              selectedReceiptId={selectedReceiptId}
              trigger={
                <Button size="sm" data-testid="add-line-item-button">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Line Item
                </Button>
              }
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lineItems.map((item) => (
            <LineItemCard key={item.id} item={item} canEdit={canEdit} onDelete={handleDelete} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
