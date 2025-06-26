"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";

import { Button } from "@components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { exportExpenses } from "@lib/utils/export-utils";
import type { Expense, TeamExpense } from "@type/expense";

interface ExportExpenseButtonProps {
  expenses: (Expense | TeamExpense)[];
  filename?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function ExportExpenseButton({
  expenses,
  filename,
  variant = "outline",
  size = "default",
  className,
}: Readonly<ExportExpenseButtonProps>) {
  const handleExport = (format: "xlsx" | "csv") => {
    try {
      exportExpenses(expenses, {
        format,
        filename,
        includeLineItems: false, // Always false since we don't have full expense data in lists
      });
    } catch (error) {
      console.error("Export failed:", error);
      // You could add a toast notification here
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Download className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleExport("xlsx")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileText className="mr-2 h-4 w-4" />
          Export as CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
