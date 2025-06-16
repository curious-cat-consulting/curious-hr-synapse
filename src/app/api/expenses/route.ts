import { NextResponse } from "next/server";
import { createClient } from "@lib/supabase/server";

export async function POST(request: Request) {
  try {
    console.log("Creating new expense");

    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`Creating expense for user: ${user.id}`);

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const receipts = formData.getAll("receipts") as File[];

    console.log(`Expense title: "${title}", receipts: ${receipts.length}`);

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Create expense record in the database first
    const { data: expense, error: dbError } = await supabase
      .from("expenses")
      .insert({
        user_id: user.id,
        profile_id: user.id,
        title: title,
        description: description ?? title,
        amount: 0,
        status: "NEW",
      })
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    console.log(`Expense created with ID: ${expense.id}`);

    // If there are receipts, upload them using the receipts endpoint
    if (receipts.length > 0) {
      console.log(`Uploading ${receipts.length} receipts`);

      const receiptsFormData = new FormData();
      receipts.forEach((receipt) => {
        receiptsFormData.append("receipts", receipt);
      });

      // Get the session token for internal API call
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/expenses/${expense.id}/receipts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: receiptsFormData,
        }
      );

      if (!response.ok) {
        console.error("Failed to upload receipts", response);
        return NextResponse.json({ error: "Failed to upload receipts" }, { status: 500 });
      } else {
        console.log("Receipts uploaded successfully");
      }
    }

    console.log(`Expense creation complete: ${expense.id}`);

    return NextResponse.json({
      success: true,
      data: expense,
    });
  } catch (error: any) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to create expense" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log("Fetching expenses list");

    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`Fetching expenses for user: ${user.id}`);

    // Fetch expenses with user details
    const { data: expenses, error: fetchError } = (await supabase
      .from("expenses")
      .select(
        `
        *,
        profiles (
          email,
          full_name,
          avatar_url
        )
      `
      )
      .order("created_at", { ascending: false })) as { data: any[] | null; error: any };

    if (fetchError || !expenses) {
      throw fetchError ?? new Error("No expenses found");
    }

    console.log(`Found ${expenses.length} expenses`);

    // Transform the data to match the frontend interface
    const transformedExpenses = expenses.map((expense) => ({
      id: expense.id,
      title: expense.title,
      description: expense.description,
      amount: expense.amount ?? 0,
      currency_code: "USD", // Default currency
      status: expense.status,
      submitted_by: {
        id: expense.profiles.id,
        name: expense.profiles.full_name ?? "User",
        email: expense.profiles.email,
        avatar_url: expense.profiles.avatar_url,
      },
      created_at: expense.created_at,
      updated_at: expense.updated_at,
    }));

    console.log("Expenses fetch complete");

    return NextResponse.json(transformedExpenses);
  } catch (error: any) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}
