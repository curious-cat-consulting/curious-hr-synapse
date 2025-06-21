import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { createClient } from "@lib/supabase/client";
import type { LineItem } from "@type/expense";

import { AddLineItemDialog } from "./add-line-item-dialog";
import { LineItemCard } from "./line-item-card";

interface LineItemsListProps {
  lineItems: LineItem[];
  onLineItemAdded?: () => void;
  onLineItemDeleted?: () => void;
  expenseStatus: string;
  expenseId: string;
}

export function LineItemsList({
  lineItems,
  onLineItemAdded,
  onLineItemDeleted,
  expenseStatus,
  expenseId,
}: Readonly<LineItemsListProps>) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const canEdit = !["APPROVED", "REJECTED"].includes(expenseStatus);

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
    } catch (error: any) {
      console.error("Error deleting line item:", error);
      toast.error(error.message ?? "Failed to delete line item");
    }
  };

  const openAddDialog = () => {
    setIsAddDialogOpen(true);
  };

  if (lineItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-gray-500">
            <button
              onClick={openAddDialog}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
            >
              <Plus className="h-8 w-8 text-gray-400" />
            </button>
            <p className="mb-2 text-lg font-medium">No line items yet</p>
            <p className="text-sm">Click the + icon to add your first line item</p>
          </div>
        </CardContent>

        <AddLineItemDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          expenseId={expenseId}
          onLineItemAdded={onLineItemAdded}
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          {canEdit && (
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Line Item
            </Button>
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

      <AddLineItemDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        expenseId={expenseId}
        onLineItemAdded={onLineItemAdded}
      />
    </Card>
  );
}
