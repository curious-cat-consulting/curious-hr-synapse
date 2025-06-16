import { NextResponse } from "next/server";
import { createClient } from "@lib/supabase/server";
import ExcelJS from "exceljs";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's role
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles")
      .eq("id", user.id)
      .single();

    if (!profile?.roles?.includes("MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get expense details
    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .select(`
        *,
        receipt_line_items (*)
      `)
      .eq("id", params.id)
      .single();

    if (expenseError || !expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Expense Details");

    // Add expense details
    worksheet.addRow(["Expense Details"]);
    worksheet.addRow(["Title", expense.title]);
    worksheet.addRow(["Description", expense.description]);
    worksheet.addRow(["Amount", expense.amount]);
    worksheet.addRow(["Status", expense.status]);
    worksheet.addRow(["Created At", new Date(expense.created_at).toLocaleString()]);
    worksheet.addRow([]);

    // Add line items
    worksheet.addRow(["Line Items"]);
    worksheet.addRow(["Description", "Category", "Quantity", "Unit Price", "Total Amount", "AI Generated"]);
    
    expense.receipt_line_items.forEach((item: any) => {
      worksheet.addRow([
        item.description,
        item.category || "",
        item.quantity || "",
        item.unit_price || "",
        item.total_amount,
        item.is_ai_generated ? "Yes" : "No"
      ]);
    });

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();

    // Return the Excel file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="expense-${expense.title}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting expense:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to export expense" },
      { status: 500 }
    );
  }
} 