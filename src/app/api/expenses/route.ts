import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Use regular client for auth verification
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("User error:", userError);
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User authenticated:", user.id);

    // Create service client for database operations (bypasses RLS)
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

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

    // Upload receipts to Supabase Storage (use regular client for storage)
    const receiptUrls = await Promise.all(
      files.map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { data, error } = await supabase.storage
          .from("receipts")
          .upload(filePath, file);

        if (error) {
          console.error("Storage upload error:", error);
          throw error;
        }
        return data.path;
      })
    );

    console.warn("receiptUrls", receiptUrls);

    // Create expense record using service client (bypasses RLS)
    console.log("Attempting to create expense with data:", {
      title,
      description,
      receipt_urls: receiptUrls,
      submitted_by_id: user.id,
      status: "PENDING",
    });

    const { data: expense, error } = await serviceSupabase
      .from("expenses")
      .insert({
        title,
        description,
        submitted_by_id: user.id,
      })
      .select()
      .single();

    console.warn("expense result:", expense, error);
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
    // Use regular client for auth verification
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

    // Use service client for database query (bypasses RLS)
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get expenses for the authenticated user
    const { data: expenses, error } = await serviceSupabase
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
