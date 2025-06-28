"use client";

import { useEffect, useState } from "react";

import { ReceiptUploader } from "@components/shared/receipt-uploader";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import type { ReceiptMetadata } from "@type/expense";

interface RegularLineItemFormProps {
  receipts: ReceiptMetadata[];
  selectedReceiptId?: string;
  categories: string[];
  onSubmit: (formData: {
    receiptId: string;
    description: string;
    category: string;
    quantity: string;
    unitPrice: string;
    totalAmount: string;
  }) => void;
  isSubmitting: boolean;
  onTotalChange?: (total: number) => void;
  expenseId?: string;
  onReceiptUploaded?: () => void;
}

export function RegularLineItemForm({
  receipts,
  selectedReceiptId,
  categories,
  onSubmit,
  onTotalChange,
  expenseId,
  onReceiptUploaded,
}: Readonly<RegularLineItemFormProps>) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [receiptId, setReceiptId] = useState("");
  const [showReceiptUploader, setShowReceiptUploader] = useState(false);

  // Auto-select the most recent receipt when component mounts or receipts change
  useEffect(() => {
    if (receipts.length > 0) {
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
  }, [receipts, selectedReceiptId]);

  // Update total for regular using useEffect for better reactivity
  useEffect(() => {
    if (quantity !== "" && unitPrice !== "") {
      const total = Number(quantity) * Number(unitPrice);
      setTotalAmount(total.toFixed(2));
      onTotalChange?.(total);
    } else {
      setTotalAmount("");
      onTotalChange?.(0);
    }
  }, [quantity, unitPrice, onTotalChange]);

  const handleReceiptChange = (value: string) => {
    if (value === "add-new") {
      setShowReceiptUploader(true);
      setReceiptId("");
    } else {
      setShowReceiptUploader(false);
      setReceiptId(value);
    }
  };

  const handleReceiptUploadSuccess = () => {
    setShowReceiptUploader(false);
    onReceiptUploaded?.();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (receiptId === "") {
      return;
    }

    onSubmit({
      receiptId,
      description,
      category,
      quantity,
      unitPrice,
      totalAmount,
    });
  };

  return (
    <form id="regular-line-item-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="col-span-2">
        <Label htmlFor="receipt">Receipt</Label>
        <Select value={receiptId} onValueChange={handleReceiptChange} required>
          <SelectTrigger id="receipt" name="receipt">
            <SelectValue placeholder="Select a receipt" />
          </SelectTrigger>
          <SelectContent>
            {receipts.map((receipt) => (
              <SelectItem key={receipt.receipt_id} value={receipt.receipt_id}>
                {receipt.vendor_name} - {new Date(receipt.receipt_date).toLocaleDateString()}
              </SelectItem>
            ))}
            <SelectItem value="add-new" className="font-medium text-blue-600">
              + Add a new receipt
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showReceiptUploader && expenseId !== undefined && expenseId !== "" && (
        <div className="relative rounded-lg border p-4">
          <ReceiptUploader
            expenseId={expenseId}
            onUploadSuccess={handleReceiptUploadSuccess}
            title="Upload New Receipt"
            description="Upload a new receipt to add to this expense"
            showUploadButton={true}
            inDrawer={true}
          />
        </div>
      )}

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
          <SelectTrigger id="category" name="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {category === "" && (
          <Input
            id="category_input"
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
    </form>
  );
}
