import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create a new organization
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: "My Organization",
      })
      .select()
      .single();

    if (orgError) {
      console.error("Error creating organization:", orgError);
      return NextResponse.json(
        { error: "Failed to create organization" },
        { status: 500 }
      );
    }

    // Create an initial expense to establish the relationship
    const { error: expenseError } = await supabase.from("expenses").insert({
      title: "Initial Setup",
      description: "Organization setup",
      receipt_urls: [],
      submitted_by_id: user.id,
      organization_id: organization.id,
      status: "APPROVED",
    });

    if (expenseError) {
      console.error("Error creating initial expense:", expenseError);
      return NextResponse.json(
        { error: "Failed to set up organization" },
        { status: 500 }
      );
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Error in organization setup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
