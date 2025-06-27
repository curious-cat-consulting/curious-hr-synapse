"use client";

import type { Expense } from "@type/expense";

import { ReceiptsAndLineItems } from "./receipts-and-line-items";

interface ReceiptsAndLineItemsWrapperProps {
  expense: Expense;
  isExpenseOwner: boolean;
}

export function ReceiptsAndLineItemsWrapper({
  expense,
  isExpenseOwner,
}: Readonly<ReceiptsAndLineItemsWrapperProps>) {
  const handleReceiptsUploaded = () => {
    // Refresh the page to get updated data
    window.location.reload();
  };

  const handleLineItemAdded = () => {
    // Refresh the page to get updated data
    window.location.reload();
  };

  const handleLineItemDeleted = () => {
    // Refresh the page to get updated data
    window.location.reload();
  };

  return (
    <ReceiptsAndLineItems
      expense={expense}
      onReceiptsUploaded={handleReceiptsUploaded}
      onLineItemAdded={handleLineItemAdded}
      onLineItemDeleted={handleLineItemDeleted}
      isExpenseOwner={isExpenseOwner}
    />
  );
}
