import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const files = formData.getAll("receipts") as File[];

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
        organization_id: session.user.organizationId,
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

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build query
    let query = supabase
      .from("expenses")
      .select(
        `
        *,
        submitted_by:users!submitted_by_id(id, name, email),
        approved_by:users!approved_by_id(id, name, email),
        category:expense_categories(id, name)
      `
      )
      .eq("organization_id", session.user.organizationId);

    // Add filters based on user role
    if (session.user.role === "EMPLOYEE") {
      query = query.eq("submitted_by_id", session.user.id);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (startDate) {
      query = query.gte("date", startDate);
    }

    if (endDate) {
      query = query.lte("date", endDate);
    }

    const { data: expenses, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Error fetching expenses" },
      { status: 500 }
    );
  }
}
