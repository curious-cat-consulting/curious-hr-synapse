import { Trash2, Pencil } from "lucide-react";
import { useState } from "react";

import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@components/ui/tooltip";
import { useToast } from "@components/ui/use-toast";
import type { ReceiptLineItem } from "@type/expense";

const EXPENSE_CATEGORIES = [
  "Travel",
  "Meals",
  "Office Supplies",
  "Software",
  "Hardware",
  "Marketing",
  "Training",
  "Professional Services",
  "Other",
];

export interface LineItem {
  id: string;
  description: string;
  total_amount: number;
  category?: string;
  is_ai_generated?: boolean;
  is_deleted?: boolean;
  quantity?: number;
  unit_price?: number;
  from_address?: string;
  to_address?: string;
  miles_driven?: number;
  line_item_date?: string;
  _type?: "regular" | "miles";
}

interface LineItemsListProps {
  lineItems: LineItem[];
  onLineItemDeleted?: () => void;
  expenseStatus: string;
}

export function LineItemsList({
  lineItems,
  onLineItemDeleted,
  expenseStatus,
}: Readonly<LineItemsListProps>) {
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<ReceiptLineItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const canEdit = !["APPROVED", "REJECTED"].includes(expenseStatus);

  const handleDelete = async (itemId: string) => {
    try {
      const response = await fetch(`/api/expenses/line-items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete line item");

      toast({
        title: "Success",
        description: "Line item deleted successfully",
      });

      onLineItemDeleted?.();
    } catch (error) {
      console.error("Error deleting line item:", error);
      toast({
        title: "Error",
        description: "Failed to delete line item",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;

    const formData = new FormData(e.currentTarget);
    const updatedItem = {
      description: formData.get("description"),
      quantity: Number(formData.get("quantity")),
      unit_price: Number(formData.get("unit_price")),
      total_amount: Number(formData.get("total_amount")),
      category: formData.get("category"),
    };

    try {
      const response = await fetch(`/api/expenses/line-items/${editingItem.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedItem),
      });

      if (!response.ok) throw new Error("Failed to update line item");

      toast({
        title: "Success",
        description: "Line item updated successfully",
      });

      onLineItemDeleted?.();
      setIsDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Error updating line item:", error);
      toast({
        title: "Error",
        description: "Failed to update line item",
        variant: "destructive",
      });
    }
  };

  if (!lineItems || lineItems.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {lineItems.map((item) => (
            <div
              key={item.id}
              className={`space-y-2 rounded-lg border p-4 ${item.is_deleted ? "opacity-50" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex min-w-0 items-center gap-2">
                    <h3 className="truncate font-medium">{item.description}</h3>
                    <span className="flex-shrink-0 rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
                      {item.is_ai_generated ? "AI" : item._type === "miles" ? "Miles" : "MN"}
                    </span>
                  </div>
                  {item.category && (
                    <p className="text-sm text-gray-500">Category: {item.category}</p>
                  )}
                  {item._type === "miles" && (
                    <>
                      <p className="text-sm text-gray-500">From: {item.from_address}</p>
                      <p className="text-sm text-gray-500">To: {item.to_address}</p>
                      <p className="text-sm text-gray-500">Miles: {item.miles_driven}</p>
                    </>
                  )}
                  {item.line_item_date && (
                    <p className="mt-1 text-xs text-gray-400">Date: {item.line_item_date}</p>
                  )}
                </div>
                <div className="flex min-w-0 items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">${item.total_amount.toFixed(2)}</p>
                    {item._type !== "miles" && item.quantity && item.unit_price && (
                      <p className="text-sm text-gray-500">
                        {item.quantity} × ${item.unit_price.toFixed(2)}
                      </p>
                    )}
                  </div>
                  {canEdit && !item.is_deleted && item._type !== "miles" && (
                    <div className="flex gap-2">
                      {!item.is_ai_generated && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-500 hover:bg-blue-50 hover:text-blue-700"
                                onClick={() => {
                                  setEditingItem(item as any);
                                  setIsDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit line item</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {item.is_ai_generated
                              ? "Soft delete AI-generated item"
                              : "Delete line item"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Line Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    defaultValue={editingItem.description}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue={editingItem.category || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    defaultValue={editingItem.quantity || 1}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit_price">Unit Price</Label>
                  <Input
                    id="unit_price"
                    name="unit_price"
                    type="number"
                    step="0.01"
                    defaultValue={editingItem.unit_price || 0}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="total_amount">Total Amount</Label>
                  <Input
                    id="total_amount"
                    name="total_amount"
                    type="number"
                    step="0.01"
                    defaultValue={editingItem.total_amount}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Update Line Item
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
