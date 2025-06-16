import type { User } from "@supabase/supabase-js";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useToast } from "@components/ui/use-toast";
import { createClient } from "@lib/supabase/client";
import type { ExpenseDetails } from "@type/expense";

// Enhanced ReceiptLineItem interface to include missing fields
interface ReceiptLineItemComplete {
  id: string;
  expense_id: string;
  receipt_name: string;
  description: string;
  quantity?: number;
  unit_price?: number;
  total_amount: number;
  category?: string;
  is_ai_generated: boolean;
  is_deleted?: boolean;
  created_at: string;
  line_item_date: string;
}

// Define types for line items with display type
interface ReceiptLineItemWithType extends ReceiptLineItemComplete {
  _type: "regular";
}

interface MileageLineItemWithType {
  id: string;
  expense_id: string;
  from_address: string;
  to_address: string;
  category: string;
  miles_driven: number;
  calculated_miles: number;
  custom_miles?: number;
  total_amount: number;
  line_item_date: string;
  created_at: string;
  _type: "miles";
}

type LineItemWithType = ReceiptLineItemWithType | MileageLineItemWithType;

interface UseExpenseDetailsReturn {
  expense: ExpenseDetails | null;
  allLineItems: LineItemWithType[];
  isAnalyzing: boolean;
  isRequestingApproval: boolean;
  isManager: boolean;
  hasReceipts: boolean;
  fetchExpenseDetails: () => Promise<void>;
  handleAnalyze: () => Promise<void>;
  handleRequestApproval: () => Promise<void>;
  handleApprove: () => Promise<void>;
  handleReject: () => Promise<void>;
  handleExport: () => Promise<void>;
}

export function useExpenseDetails(user: User | null): UseExpenseDetailsReturn {
  const params = useParams();
  const { toast } = useToast();
  const [expense, setExpense] = useState<ExpenseDetails | null>(null);
  const [allLineItems, setAllLineItems] = useState<LineItemWithType[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRequestingApproval, setIsRequestingApproval] = useState(false);
  const [isManager, setIsManager] = useState(false);

  const hasReceipts = (expense?.receipt_metadata.length ?? 0) > 0;

  useEffect(() => {
    const checkManagerRole = async () => {
      const supabase = createClient();
      if (user !== null) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("roles")
          .eq("id", user.id)
          .single();
        setIsManager(profile?.roles?.includes("MANAGER") ?? false);
      }
    };
    checkManagerRole();
  }, [user]);

  const fetchExpenseDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/expenses/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch expense details");
      const data = await response.json();
      setExpense(data);

      // Add type property for display
      const receiptWithType: ReceiptLineItemWithType[] = Array.isArray(data.receipt_line_items)
        ? data.receipt_line_items.map((item: ReceiptLineItemComplete) => ({
            ...item,
            _type: "regular" as const,
          }))
        : [];

      const mileageWithType: MileageLineItemWithType[] = Array.isArray(data.mileage_line_items)
        ? data.mileage_line_items.map((item: Omit<MileageLineItemWithType, "_type">) => ({
            ...item,
            _type: "miles" as const,
          }))
        : [];

      // Merge and sort by date desc
      const merged: LineItemWithType[] = [...receiptWithType, ...mileageWithType].sort(
        (a, b) => new Date(b.line_item_date).getTime() - new Date(a.line_item_date).getTime()
      );
      setAllLineItems(merged);
    } catch (error) {
      console.error("Error fetching expense details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch expense details",
        variant: "destructive",
      });
    }
  }, [params.id, toast]);

  useEffect(() => {
    fetchExpenseDetails();
  }, [fetchExpenseDetails]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/receipts/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expenseId: params.id }),
      });

      if (!response.ok) throw new Error("Failed to analyze receipts");

      toast({
        title: "Success",
        description: "Receipts analyzed successfully",
        variant: "success",
      });

      await fetchExpenseDetails();
    } catch (error) {
      console.error("Error analyzing receipts:", error);
      toast({
        title: "Error",
        description: "Failed to analyze receipts",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRequestApproval = async () => {
    setIsRequestingApproval(true);
    try {
      const response = await fetch(`/api/expenses/${params.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "PENDING" }),
      });

      if (!response.ok) throw new Error("Failed to request approval");

      toast({
        title: "Success",
        description: "Approval requested successfully",
        variant: "success",
      });

      await fetchExpenseDetails();
    } catch (error) {
      console.error("Error requesting approval:", error);
      toast({
        title: "Error",
        description: "Failed to request approval",
        variant: "destructive",
      });
    } finally {
      setIsRequestingApproval(false);
    }
  };

  const handleApprove = async () => {
    try {
      const response = await fetch(`/api/expenses/${params.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "APPROVED" }),
      });

      if (!response.ok) throw new Error("Failed to approve expense");

      toast({
        title: "Success",
        description: "Expense approved successfully",
        variant: "success",
      });

      await fetchExpenseDetails();
    } catch (error) {
      console.error("Error approving expense:", error);
      toast({
        title: "Error",
        description: "Failed to approve expense",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    try {
      const response = await fetch(`/api/expenses/${params.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "REJECTED" }),
      });

      if (!response.ok) throw new Error("Failed to reject expense");

      toast({
        title: "Success",
        description: "Expense rejected successfully",
        variant: "success",
      });

      await fetchExpenseDetails();
    } catch (error) {
      console.error("Error rejecting expense:", error);
      toast({
        title: "Error",
        description: "Failed to reject expense",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    if (expense === null) return;

    try {
      const response = await fetch(`/api/expenses/${params.id}/export`, {
        method: "GET",
      });

      if (!response.ok) throw new Error("Failed to export expense");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expense-${expense.title}-${new Date().toISOString()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting expense:", error);
      toast({
        title: "Error",
        description: "Failed to export expense",
        variant: "destructive",
      });
    }
  };

  return {
    expense,
    allLineItems,
    isAnalyzing,
    isRequestingApproval,
    isManager,
    hasReceipts,
    fetchExpenseDetails,
    handleAnalyze,
    handleRequestApproval,
    handleApprove,
    handleReject,
    handleExport,
  };
}
