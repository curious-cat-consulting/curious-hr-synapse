import { Plus, Trash2, Car, Receipt } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
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
import { createClient } from "@lib/supabase/client";
import type { LineItem } from "@type/expense";

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

const MILES_CATEGORIES = ["Client Meeting", "Airport", "Delivery", "Commute", "Other"];

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
  const [type, setType] = useState<"regular" | "miles">("regular");

  // Regular fields
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [totalAmount, setTotalAmount] = useState("");

  // Miles fields
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [milesCategory, setMilesCategory] = useState("");
  const [milesDriven, setMilesDriven] = useState("");
  const [milesTotalAmount, setMilesTotalAmount] = useState("");

  const [lineItemDate, setLineItemDate] = useState("");

  const canEdit = !["APPROVED", "REJECTED"].includes(expenseStatus);

  // Update total for regular
  const updateRegularTotal = () => {
    if (quantity !== "" && unitPrice !== "") {
      const total = Number(quantity) * Number(unitPrice);
      setTotalAmount(total.toFixed(2));
    }
  };

  // Update total for miles
  const updateMilesTotal = () => {
    if (milesDriven !== "") {
      const total = Number(milesDriven) * 0.655; // IRS 2023 rate
      setMilesTotalAmount(total.toFixed(2));
    }
  };

  const handleAddLineItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const supabase = createClient();

    if (type === "regular") {
      try {
        const { error } = await supabase.rpc("add_receipt_line_item", {
          expense_id: expenseId,
          description,
          quantity: Number(quantity),
          unit_price: Number(unitPrice),
          total_amount: Number(totalAmount),
          category: category !== "" ? category : null,
          line_item_date: lineItemDate !== "" ? lineItemDate : null,
        });

        if (error !== null) throw error;

        toast.success("Line item added successfully");
        onLineItemAdded?.();
        setIsAddDialogOpen(false);
        resetForm();
      } catch (error: any) {
        console.error("Error adding line item:", error);
        toast.error(error.message ?? "Failed to add line item");
      }
    } else {
      try {
        const { error } = await supabase.rpc("add_mileage_line_item", {
          expense_id: expenseId,
          from_address: fromAddress,
          to_address: toAddress,
          category: milesCategory !== "" ? milesCategory : null,
          miles_driven: Number(milesDriven),
          total_amount: Number(milesTotalAmount),
          line_item_date: lineItemDate !== "" ? lineItemDate : null,
        });

        if (error !== null) throw error;

        toast.success("Mileage line item added successfully");
        onLineItemAdded?.();
        setIsAddDialogOpen(false);
        resetForm();
      } catch (error: any) {
        console.error("Error adding mileage line item:", error);
        toast.error(error.message ?? "Failed to add mileage line item");
      }
    }
  };

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

  const resetForm = () => {
    setDescription("");
    setCategory("");
    setQuantity("1");
    setUnitPrice("");
    setTotalAmount("");
    setFromAddress("");
    setToAddress("");
    setMilesCategory("");
    setMilesDriven("");
    setMilesTotalAmount("");
    setLineItemDate("");
    setType("regular");
  };

  const openAddDialog = () => {
    resetForm();
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

        {/* Add Line Item Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Line Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddLineItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={type}
                    onValueChange={(value: "regular" | "miles") => setType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="miles">Miles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="line_item_date">Date</Label>
                  <Input
                    id="line_item_date"
                    name="line_item_date"
                    type="date"
                    value={lineItemDate}
                    onChange={(e) => setLineItemDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {type === "regular" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      name="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
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
                    {category === "" && (
                      <Input
                        name="category"
                        className="mt-2"
                        placeholder="Or type your own category"
                      />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      step="0.01"
                      value={quantity}
                      onChange={(e) => {
                        setQuantity(e.target.value);
                        updateRegularTotal();
                      }}
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
                      value={unitPrice}
                      onChange={(e) => {
                        setUnitPrice(e.target.value);
                        updateRegularTotal();
                      }}
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
                      value={totalAmount}
                      readOnly
                      required
                    />
                  </div>
                </div>
              )}

              {type === "miles" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="from_address">From Address</Label>
                    <Input
                      id="from_address"
                      name="from_address"
                      value={fromAddress}
                      onChange={(e) => setFromAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="to_address">To Address</Label>
                    <Input
                      id="to_address"
                      name="to_address"
                      value={toAddress}
                      onChange={(e) => setToAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="miles_category">Category</Label>
                    <Select value={milesCategory} onValueChange={setMilesCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {MILES_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="miles_driven">Miles Driven</Label>
                    <Input
                      id="miles_driven"
                      name="miles_driven"
                      type="number"
                      step="0.1"
                      value={milesDriven}
                      onChange={(e) => {
                        setMilesDriven(e.target.value);
                        updateMilesTotal();
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="miles_total_amount">Total Amount</Label>
                    <Input
                      id="miles_total_amount"
                      name="miles_total_amount"
                      type="number"
                      step="0.01"
                      value={milesTotalAmount}
                      readOnly
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Line Item</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
          {lineItems.map((item) => {
            const isDeleted = item.is_deleted ?? false;
            return (
              <div
                key={item.id}
                className={`space-y-2 rounded-lg border p-4 transition-colors hover:bg-gray-50 ${
                  isDeleted ? "bg-gray-100 opacity-50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      {item._type === "miles" ? (
                        <Car className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Receipt className="h-4 w-4 text-green-500" />
                      )}
                      <h3
                        className={`truncate font-medium ${
                          isDeleted ? "text-gray-500 line-through" : ""
                        }`}
                      >
                        {item._type === "miles"
                          ? `${item.from_address} → ${item.to_address}`
                          : item.description}
                      </h3>
                      <span className="flex-shrink-0 rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
                        {item._type === "miles" ? "Miles" : item.is_ai_generated ? "AI" : "Manual"}
                      </span>
                      {isDeleted && (
                        <span className="flex-shrink-0 rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                          Deleted
                        </span>
                      )}
                    </div>

                    {(item.category ?? "") !== "" && (
                      <p className={`text-sm ${isDeleted ? "text-gray-400" : "text-gray-500"}`}>
                        Category: {item.category}
                      </p>
                    )}

                    {item._type === "miles" && (
                      <p className={`text-sm ${isDeleted ? "text-gray-400" : "text-gray-500"}`}>
                        Miles: {item.miles_driven} • Rate: $0.655/mile
                      </p>
                    )}

                    {item._type === "regular" &&
                      (item.quantity ?? 0) > 0 &&
                      (item.unit_price ?? 0) > 0 && (
                        <p className={`text-sm ${isDeleted ? "text-gray-400" : "text-gray-500"}`}>
                          {item.quantity} × ${item.unit_price?.toFixed(2)}
                        </p>
                      )}

                    {(item.line_item_date ?? "") !== "" && (
                      <p className="mt-1 text-xs text-gray-400">
                        Date: {new Date(item.line_item_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex min-w-0 items-center gap-4">
                    <div className="text-right">
                      <p className={`font-medium ${isDeleted ? "text-gray-500" : ""}`}>
                        ${item.total_amount.toFixed(2)}
                      </p>
                    </div>

                    {canEdit && !isDeleted && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDelete(item.id, item._type)}
                          title="Delete line item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Add Line Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Line Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddLineItem} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={(value: "regular" | "miles") => setType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="miles">Miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="line_item_date">Date</Label>
                <Input
                  id="line_item_date"
                  name="line_item_date"
                  type="date"
                  value={lineItemDate}
                  onChange={(e) => setLineItemDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {type === "regular" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
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
                  {category === "" && (
                    <Input
                      name="category"
                      className="mt-2"
                      placeholder="Or type your own category"
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value);
                      updateRegularTotal();
                    }}
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
                    value={unitPrice}
                    onChange={(e) => {
                      setUnitPrice(e.target.value);
                      updateRegularTotal();
                    }}
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
                    value={totalAmount}
                    readOnly
                    required
                  />
                </div>
              </div>
            )}

            {type === "miles" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="from_address">From Address</Label>
                  <Input
                    id="from_address"
                    name="from_address"
                    value={fromAddress}
                    onChange={(e) => setFromAddress(e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="to_address">To Address</Label>
                  <Input
                    id="to_address"
                    name="to_address"
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="miles_category">Category</Label>
                  <Select value={milesCategory} onValueChange={setMilesCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {MILES_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="miles_driven">Miles Driven</Label>
                  <Input
                    id="miles_driven"
                    name="miles_driven"
                    type="number"
                    step="0.1"
                    value={milesDriven}
                    onChange={(e) => {
                      setMilesDriven(e.target.value);
                      updateMilesTotal();
                    }}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="miles_total_amount">Total Amount</Label>
                  <Input
                    id="miles_total_amount"
                    name="miles_total_amount"
                    type="number"
                    step="0.01"
                    value={milesTotalAmount}
                    readOnly
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Line Item</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
