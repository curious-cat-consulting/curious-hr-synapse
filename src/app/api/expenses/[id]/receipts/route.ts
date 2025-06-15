import { NextResponse } from "next/server";
import { createClient } from "@lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify the expense exists and belongs to the user
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .select('id, user_id')
      .eq('id', params.id)
      .single();

    if (expenseError || !expense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      );
    }

    if (expense.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const receipts = formData.getAll("receipts") as File[];

    if (!receipts || receipts.length === 0) {
      return NextResponse.json(
        { error: "No receipts provided" },
        { status: 400 }
      );
    }

    // Upload receipts to Supabase Storage
    const uploadedReceipts = await Promise.all(
      receipts.map(async (receipt) => {
        const bytes = await receipt.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Create a unique filename
        const filename = `${Date.now()}-${receipt.name}`;
        const filepath = `${user.id}/${params.id}/${filename}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('receipts')
          .upload(filepath, buffer, {
            contentType: receipt.type,
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        return filename;
      })
    );

    return NextResponse.json({
      success: true,
      receipts: uploadedReceipts
    });
  } catch (error: any) {
    console.error("Error uploading receipts:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to upload receipts" },
      { status: 500 }
    );
  }
} 