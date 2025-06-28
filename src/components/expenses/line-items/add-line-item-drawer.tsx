"use client";

import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

import { Button } from "@components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@components/ui/drawer";
import { createClient } from "@lib/supabase/client";
import type { ReceiptMetadata } from "@type/expense";

import { LineItemTypeSelector } from "./line-item-type-selector";
import { MileageLineItemForm } from "./mileage-line-item-form";
import { RegularLineItemForm } from "./regular-line-item-form";

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

interface AddLineItemDrawerProps {
  expenseId: string;
  onLineItemAdded?: () => void;
  receipts?: ReceiptMetadata[];
  selectedReceiptId?: string;
  account?: {
    metadata?: {
      mileage_rate?: number;
    };
  } | null;
  trigger?: React.ReactNode;
}

export function AddLineItemDrawer({
  expenseId,
  onLineItemAdded,
  receipts = [],
  selectedReceiptId,
  account,
  trigger,
}: Readonly<AddLineItemDrawerProps>) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"regular" | "miles">("regular");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regularTotal, setRegularTotal] = useState(0);
  const [milesTotal, setMilesTotal] = useState(0);

  // Set default date to today
  const [lineItemDate, setLineItemDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // Calculate current total based on type
  const currentTotal = type === "regular" ? regularTotal : milesTotal;
  const totalColor =
    currentTotal > 0 ? "text-green-600" : currentTotal < 0 ? "text-red-600" : "text-gray-600";

  // Auto-select the most recent receipt when drawer opens or receipts change
  useEffect(() => {
    if (receipts.length > 0 && type === "regular" && open) {
      if (
        selectedReceiptId !== undefined &&
        selectedReceiptId !== "" &&
        receipts.some((r) => r.receipt_id === selectedReceiptId)
      ) {
        // Receipt is already selected
      } else {
        // Auto-select the most recent receipt - this will be handled by the RegularLineItemForm component
      }
    }
  }, [receipts, selectedReceiptId, type, open]);

  const handleSubmit = async (formData: {
    receiptId?: string;
    description?: string;
    quantity?: string;
    unitPrice?: string;
    totalAmount?: string;
    category?: string;
    fromAddress?: string;
    toAddress?: string;
    milesDriven?: string;
    milesTotalAmount?: string;
    mileageRate?: number;
    milesCategory?: string;
  }) => {
    setIsSubmitting(true);
    setOpen(false);

    try {
      const supabase = createClient();

      if (type === "regular") {
        const { error } = await supabase.rpc("add_receipt_line_item", {
          expense_id: expenseId,
          receipt_id: formData.receiptId,
          description: formData.description,
          quantity: Number(formData.quantity),
          unit_price: Number(formData.unitPrice),
          total_amount: Number(formData.totalAmount),
          category: formData.category !== "" ? formData.category : null,
          line_item_date: lineItemDate !== "" ? lineItemDate : null,
        });

        if (error !== null) throw error;
        toast.success("Line item added successfully");
      } else {
        const { error } = await supabase.rpc("add_mileage_line_item", {
          expense_id: expenseId,
          from_address: formData.fromAddress,
          to_address: formData.toAddress,
          miles_driven: Number(formData.milesDriven),
          total_amount: Number(formData.milesTotalAmount),
          mileage_rate: formData.mileageRate,
          category: formData.milesCategory !== "" ? formData.milesCategory : null,
          line_item_date: lineItemDate !== "" ? lineItemDate : null,
        });

        if (error !== null) throw error;
        toast.success("Mileage line item added successfully");
      }

      onLineItemAdded?.();
    } catch (error: unknown) {
      console.error("Error adding line item:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add line item";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      // Reset form when closing (but not when submitting)
      setType("regular");
      setRegularTotal(0);
      setMilesTotal(0);
      const today = new Date();
      setLineItemDate(today.toISOString().split("T")[0]);
    }
    setOpen(newOpen);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh] overflow-y-auto">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle>Add Line Item</DrawerTitle>
              <DrawerDescription>
                Add a new line item to your expense. Choose between regular receipt items or mileage
                entries.
              </DrawerDescription>
            </div>
            {currentTotal > 0 && (
              <p className={`text-xl font-bold ${totalColor}`}>${currentTotal.toFixed(2)}</p>
            )}
          </div>
        </DrawerHeader>

        <div className="space-y-6 px-4">
          <LineItemTypeSelector
            type={type}
            onTypeChange={setType}
            lineItemDate={lineItemDate}
            onLineItemDateChange={setLineItemDate}
          />

          {type === "regular" && (
            <RegularLineItemForm
              receipts={receipts}
              selectedReceiptId={selectedReceiptId}
              categories={EXPENSE_CATEGORIES}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onTotalChange={setRegularTotal}
              expenseId={expenseId}
              onReceiptUploaded={onLineItemAdded}
            />
          )}

          {type === "miles" && (
            <MileageLineItemForm
              categories={MILES_CATEGORIES}
              mileageRate={account?.metadata?.mileage_rate ?? 0.65}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onTotalChange={setMilesTotal}
            />
          )}
        </div>

        <DrawerFooter>
          <div className="flex w-full gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              form={type === "regular" ? "regular-line-item-form" : "mileage-line-item-form"}
              className="flex-1"
            >
              {isSubmitting ? "Adding..." : "Add Line Item"}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
