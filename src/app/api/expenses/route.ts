import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    console.log("Starting POST request to /api/expenses");

    const supabase = await createClient();
    console.log("Created Supabase client");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("User data:", user);
    console.log("User error:", userError);

    if (userError) {
      console.error("User error:", userError);
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 }
      );
    }

    if (!user) {
      console.log("No user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User authenticated:", user.id);

    // Check if user has an organization
    const { data: existingExpense } = await supabase
      .from("expenses")
      .select("organization_id")
      .eq("submitted_by_id", user.id)
      .limit(1)
      .single();

    let organizationId = existingExpense?.organization_id;

    // If no organization exists, create one
    if (!organizationId) {
      const response = await fetch(
        `${req.headers.get("origin")}/api/organizations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create organization");
      }

      const organization = await response.json();
      organizationId = organization.id;
    }

    console.warn("starting expenses");

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const files = formData.getAll("receipts") as File[];

    console.warn("submitting expenses");

    if (!title || files.length === 0) {
      return NextResponse.json(
        { error: "Title and at least one receipt are required" },
        { status: 400 }
      );
    }

    // Upload receipts to Supabase Storage
    const receiptUrls = await Promise.all(
      files.map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { data, error } = await supabase.storage
          .from("receipts")
          .upload(filePath, file);

        if (error) throw error;
        return data.path;
      })
    );

    // Create expense record
    const { data: expense, error } = await supabase
      .from("expenses")
      .insert({
        title,
        description,
        receipt_urls: receiptUrls,
        submitted_by_id: user.id,
        organization_id: organizationId,
        status: "PENDING",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Error creating expense" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Get expenses for the authenticated user
    const { data: expenses, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("submitted_by_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
