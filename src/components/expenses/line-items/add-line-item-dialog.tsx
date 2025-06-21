import { useState, useEffect } from "react";
import { toast } from "react-toastify";

import { Button } from "@components/ui/button";
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
import type { ReceiptMetadata } from "@type/expense";

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

interface AddLineItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  expenseId: string;
  onLineItemAdded?: () => void;
  receipts?: ReceiptMetadata[];
  selectedReceiptId?: string;
}

export function AddLineItemDialog({
  isOpen,
  onOpenChange,
  expenseId,
  onLineItemAdded,
  receipts = [],
  selectedReceiptId,
}: Readonly<AddLineItemDialogProps>) {
  const [type, setType] = useState<"regular" | "miles">("regular");

  // Regular fields
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [receiptId, setReceiptId] = useState("");

  // Miles fields
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [milesCategory, setMilesCategory] = useState("");
  const [milesDriven, setMilesDriven] = useState("");
  const [milesTotalAmount, setMilesTotalAmount] = useState("");

  // Set default date to today
  const [lineItemDate, setLineItemDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // Update total for regular using useEffect for better reactivity
  useEffect(() => {
    if (quantity !== "" && unitPrice !== "") {
      const total = Number(quantity) * Number(unitPrice);
      setTotalAmount(total.toFixed(2));
    } else {
      setTotalAmount("");
    }
  }, [quantity, unitPrice]);

  // Update total for miles using useEffect for better reactivity
  useEffect(() => {
    if (milesDriven !== "") {
      const total = Number(milesDriven) * 0.655; // IRS 2023 rate
      setMilesTotalAmount(total.toFixed(2));
    } else {
      setMilesTotalAmount("");
    }
  }, [milesDriven]);

  // Auto-select the most recent receipt when dialog opens or receipts change
  useEffect(() => {
    if (receipts.length > 0 && type === "regular") {
      if (
        selectedReceiptId !== undefined &&
        selectedReceiptId !== "" &&
        receipts.some((r) => r.receipt_id === selectedReceiptId)
      ) {
        setReceiptId(selectedReceiptId);
      } else {
        // Auto-select the most recent receipt
        const mostRecent = receipts.reduce((latest, current) =>
          new Date(current.created_at) > new Date(latest.created_at) ? current : latest
        );
        setReceiptId(mostRecent.receipt_id);
      }
    }
  }, [receipts, selectedReceiptId, type]);

  // Get the current total for display in title
  const getCurrentTotal = () => {
    if (type === "regular" && totalAmount !== "") {
      return Number(totalAmount);
    }
    if (type === "miles" && milesTotalAmount !== "") {
      return Number(milesTotalAmount);
    }
    return 0;
  };

  const currentTotal = getCurrentTotal();
  const totalColor =
    currentTotal > 0 ? "text-green-600" : currentTotal < 0 ? "text-red-600" : "text-gray-600";

  const handleAddLineItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const supabase = createClient();

    if (type === "regular") {
      if (receiptId === "") {
        toast.error("Please select a receipt");
        return;
      }

      try {
        const { error } = await supabase.rpc("add_receipt_line_item", {
          expense_id: expenseId,
          receipt_id: receiptId,
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
        onOpenChange(false);
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
        onOpenChange(false);
        resetForm();
      } catch (error: any) {
        console.error("Error adding mileage line item:", error);
        toast.error(error.message ?? "Failed to add mileage line item");
      }
    }
  };

  const resetForm = () => {
    setDescription("");
    setCategory("");
    setQuantity("1");
    setUnitPrice("");
    setTotalAmount("");
    setReceiptId("");
    setFromAddress("");
    setToAddress("");
    setMilesCategory("");
    setMilesDriven("");
    setMilesTotalAmount("");
    // Reset date to today instead of empty
    const today = new Date();
    setLineItemDate(today.toISOString().split("T")[0]);
    setType("regular");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span>Add Line Item</span>
            {currentTotal !== 0 && (
              <span className={`font-mono text-lg ${totalColor}`}>${currentTotal.toFixed(2)}</span>
            )}
          </DialogTitle>
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
              <div className="col-span-2">
                <Label htmlFor="receipt">Receipt</Label>
                <Select value={receiptId} onValueChange={setReceiptId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a receipt" />
                  </SelectTrigger>
                  <SelectContent>
                    {receipts.map((receipt) => (
                      <SelectItem key={receipt.receipt_id} value={receipt.receipt_id}>
                        {receipt.vendor_name} -{" "}
                        {new Date(receipt.receipt_date).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                  <Input name="category" className="mt-2" placeholder="Or type your own category" />
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
                  onChange={(e) => setQuantity(e.target.value)}
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
                  onChange={(e) => setUnitPrice(e.target.value)}
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
                  onChange={(e) => setMilesDriven(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Line Item</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
