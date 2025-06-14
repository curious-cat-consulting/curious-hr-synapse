import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface SupabaseUser {
  id: string;
  full_name: string;
  email: string;
}

interface SupabaseExpense {
  id: string;
  user_id: string;
  title: string;
  description: string;
  amount: number;
  status: string;
  receipt_url: string;
  created_at: string;
  updated_at: string;
}

export async function POST(request: Request) {
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

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const receipts = formData.getAll("receipts") as File[];

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
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
        const filepath = `${user.id}/${filename}`;
        
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

        // Get the public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from('receipts')
          .getPublicUrl(filepath);

        return {
          filename,
          originalName: receipt.name,
          size: receipt.size,
          type: receipt.type,
          url: publicUrl
        };
      })
    );

    // Create expense record in the database
    const { data: expense, error: dbError } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        description: description || title,
        receipt_url: uploadedReceipts[0]?.url, // Store the first receipt URL
        amount: 0,
      })
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json({
      id: expense.id,
      title,
      description,
      receipts: uploadedReceipts,
      createdAt: expense.created_at,
    });
  } catch (error: any) {
    console.error("Error processing expense:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to process expense" },
      { status: 500 }
    );
  }
}

export async function GET() {
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

    // Fetch expenses with user details
    const { data: expenses, error: fetchError } = await supabase
      .from('expenses')
      .select(`
        id,
        user_id,
        description,
        amount,
        status,
        receipt_url,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false }) as { data: SupabaseExpense[] | null, error: any };

    if (fetchError || !expenses) {
      throw fetchError || new Error('No expenses found');
    }

    // Transform the data to match the frontend interface
    const transformedExpenses = expenses.map(expense => ({
      id: expense.id,
      title: expense.title,
      description: expense.description,
      amount: expense.amount || 0,
      currency: 'USD', // Default currency
      status: expense.status || 'PENDING',
      receipt_urls: expense.receipt_url ? [expense.receipt_url] : [],
      submitted_by: {
        id: expense.user_id,
        name: 'User', // We'll need to fetch user details separately if needed
        email: ''
      },
      created_at: expense.created_at,
      updated_at: expense.updated_at
    }));

    return NextResponse.json(transformedExpenses);
  } catch (error: any) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch expenses" },
      { status: 500 }
    );
  }
} 