"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@components/ui/button";
import { createClient } from "@lib/supabase/client";
import type { Expense } from "@type/expense";

interface ExpenseApprovalButtonsProps {
  expense: Expense;
  onStatusUpdated: () => void;
  isOwner: boolean;
}

export function ExpenseApprovalButtons({
  expense,
  onStatusUpdated,
  isOwner,
}: Readonly<ExpenseApprovalButtonsProps>) {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = async (newStatus: "APPROVED" | "REJECTED") => {
    if (!isOwner) return;

    setIsUpdating(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("update_expense_status", {
        expense_id: expense.id,
        new_status: newStatus,
      });

      if (error !== null) {
        console.error("Error updating expense status:", error);
        return;
      }

      onStatusUpdated();
    } catch (error) {
      console.error("Error updating expense status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Only show buttons for team owners and if the expense is in a state that can be approved/rejected
  if (!isOwner || !["NEW", "PENDING", "ANALYZED"].includes(expense.status)) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => updateStatus("APPROVED")}
        disabled={isUpdating}
        className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
      >
        <Check className="mr-2 h-4 w-4" />
        Approve
      </Button>
      <Button onClick={() => updateStatus("REJECTED")} disabled={isUpdating} variant="destructive">
        <X className="mr-2 h-4 w-4" />
        Reject
      </Button>
    </div>
  );
}
