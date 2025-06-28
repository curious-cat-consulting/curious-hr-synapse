import * as XLSX from "xlsx";

import type { Expense, TeamExpense } from "@type/expense";

export interface ExportOptions {
  format: "xlsx" | "csv";
  filename?: string;
  includeLineItems?: boolean;
}

export interface ExpenseExportData {
  id: string;
  accountExpenseId: number;
  title: string;
  description: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  userId: string;
  userName?: string;
  accountName: string;
  currencyCode: string;
}

export interface LineItemExportData {
  expenseId: string;
  expenseTitle: string;
  lineItemId: string;
  type: "receipt" | "mileage";
  description: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount: number;
  category?: string;
  date: string;
  // Mileage specific fields
  fromAddress?: string;
  toAddress?: string;
  milesDriven?: number;
  mileageRate?: number;
  // Receipt specific fields
  receiptId?: string;
  vendorName?: string;
  receiptDate?: string;
  receiptTotal?: number;
  taxAmount?: number;
}

/**
 * Converts expense data to a format suitable for export
 */
export function prepareExpenseDataForExport(
  expenses: (Expense | TeamExpense)[],
  includeLineItems = false
): {
  expenses: ExpenseExportData[];
  lineItems: LineItemExportData[];
} {
  const exportExpenses: ExpenseExportData[] = [];
  const exportLineItems: LineItemExportData[] = [];

  expenses.forEach((expense) => {
    // Prepare expense data
    const exportExpense: ExpenseExportData = {
      id: expense.id,
      accountExpenseId: expense.account_expense_id,
      title: expense.title,
      description: expense.description,
      amount: expense.amount,
      status: expense.status,
      createdAt: new Date(expense.created_at).toLocaleDateString(),
      updatedAt:
        "updated_at" in expense ? new Date(expense.updated_at).toLocaleDateString() : undefined,
      userId: expense.user_id,
      userName: "user_name" in expense ? expense.user_name : undefined,
      accountName: expense.account_name,
      currencyCode: "currency_code" in expense ? expense.currency_code : "USD",
    };

    exportExpenses.push(exportExpense);

    // Include line items if requested and available
    if (includeLineItems && "receipt_line_items" in expense) {
      const fullExpense = expense as Expense;

      // Add receipt line items
      fullExpense.receipt_line_items.forEach((item) => {
        const receiptMetadata = fullExpense.receipt_metadata.find(
          (rm) => rm.receipt_id === item.receipt_id
        );
        exportLineItems.push({
          expenseId: expense.id,
          expenseTitle: expense.title,
          lineItemId: item.id,
          type: "receipt",
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalAmount: item.total_amount,
          category: item.category ?? "",
          date:
            item.line_item_date != null
              ? new Date(item.line_item_date).toLocaleDateString()
              : new Date(item.created_at).toLocaleDateString(),
          receiptId: item.receipt_id,
          vendorName: receiptMetadata?.vendor_name,
          receiptDate: receiptMetadata?.receipt_date,
          receiptTotal: receiptMetadata?.receipt_total,
          taxAmount: receiptMetadata?.tax_amount,
        });
      });

      // Add mileage line items
      fullExpense.mileage_line_items.forEach((item) => {
        exportLineItems.push({
          expenseId: expense.id,
          expenseTitle: expense.title,
          lineItemId: item.id,
          type: "mileage",
          description: `Mileage: ${item.from_address} to ${item.to_address}`,
          totalAmount: item.total_amount,
          category: item.category ?? "",
          date:
            item.line_item_date != null
              ? new Date(item.line_item_date).toLocaleDateString()
              : new Date(item.created_at).toLocaleDateString(),
          fromAddress: item.from_address,
          toAddress: item.to_address,
          milesDriven: item.miles_driven,
          mileageRate: item.mileage_rate,
        });
      });
    }
  });

  return { expenses: exportExpenses, lineItems: exportLineItems };
}

/**
 * Exports data to Excel/CSV file
 */
export function exportToFile(data: unknown[], options: ExportOptions): void {
  if (data.length === 0) {
    throw new Error("No data to export");
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

  const filename = options.filename ?? `export-${new Date().toISOString().split("T")[0]}`;

  if (options.format === "csv") {
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  } else {
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }
}

/**
 * Exports expense list with optional line items
 */
export function exportExpenses(expenses: (Expense | TeamExpense)[], options: ExportOptions): void {
  const { expenses: exportExpenses, lineItems } = prepareExpenseDataForExport(
    expenses,
    options.includeLineItems
  );

  if ((options.includeLineItems ?? false) && lineItems.length > 0) {
    // Create a workbook with multiple sheets
    const workbook = XLSX.utils.book_new();

    // Expenses sheet
    const expensesWorksheet = XLSX.utils.json_to_sheet(exportExpenses);
    XLSX.utils.book_append_sheet(workbook, expensesWorksheet, "Expenses");

    // Line items sheet
    const lineItemsWorksheet = XLSX.utils.json_to_sheet(lineItems);
    XLSX.utils.book_append_sheet(workbook, lineItemsWorksheet, "Line Items");

    const filename = options.filename ?? `expenses-${new Date().toISOString().split("T")[0]}`;

    if (options.format === "csv") {
      // For CSV, we'll export expenses only (CSV doesn't support multiple sheets)
      const csvContent = XLSX.utils.sheet_to_csv(expensesWorksheet);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.csv`;
      link.click();
    } else {
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    }
  } else {
    // Single sheet export
    exportToFile(exportExpenses, options);
  }
}

/**
 * Exports a single expense with all its details
 */
export function exportExpenseDetails(expense: Expense, options: ExportOptions): void {
  const { expenses, lineItems } = prepareExpenseDataForExport([expense], true);

  // Create a workbook with multiple sheets
  const workbook = XLSX.utils.book_new();

  // Expense details sheet
  const expenseWorksheet = XLSX.utils.json_to_sheet(expenses);
  XLSX.utils.book_append_sheet(workbook, expenseWorksheet, "Expense Details");

  // Line items sheet
  if (lineItems.length > 0) {
    const lineItemsWorksheet = XLSX.utils.json_to_sheet(lineItems);
    XLSX.utils.book_append_sheet(workbook, lineItemsWorksheet, "Line Items");
  }

  // Receipt metadata sheet
  if (expense.receipt_metadata.length > 0) {
    const receiptData = expense.receipt_metadata.map((rm) => ({
      receiptId: rm.receipt_id,
      vendorName: rm.vendor_name,
      receiptDate: new Date(rm.receipt_date).toLocaleDateString(),
      receiptTotal: rm.receipt_total,
      taxAmount: rm.tax_amount,
      currencyCode: rm.currency_code,
      confidenceScore: rm.confidence_score,
      createdAt: new Date(rm.created_at).toLocaleDateString(),
    }));
    const receiptWorksheet = XLSX.utils.json_to_sheet(receiptData);
    XLSX.utils.book_append_sheet(workbook, receiptWorksheet, "Receipts");
  }

  const filename =
    options.filename ??
    `expense-${expense.account_expense_id}-${new Date().toISOString().split("T")[0]}`;

  if (options.format === "csv") {
    // For CSV, export expense details only
    const csvContent = XLSX.utils.sheet_to_csv(expenseWorksheet);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  } else {
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }
}
