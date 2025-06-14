import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    console.log("Starting POST request to /api/expenses");

    // Create a new cookie store for this request
    const cookieStore = cookies();
    console.log("Cookie store:", cookieStore.getAll());

    // Create the Supabase client with the cookie store
    const supabase = createRouteHandlerClient(
      {
        cookies: () => cookieStore,
      },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    );

    console.log("Created Supabase client");

    // Get the session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("Session data:", session);
    console.log("Session error:", sessionError);

    if (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 }
      );
    }

    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User authenticated:", session.user.id);

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
        const filePath = `${session.user.id}/${fileName}`;

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
        submitted_by_id: session.user.id,
        organization_id: session.user.user_metadata.organization_id,
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
    const supabase = createRouteHandlerClient({ cookies });

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Get expenses for the authenticated user
    const { data: expenses, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", session.user.id)
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
