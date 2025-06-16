import { NextResponse } from "next/server";
import { createClient } from "@lib/supabase/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log(`Uploading receipts for expense: ${params.id}`);

    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`Receipt upload requested by user: ${user.id}`);

    // Verify the expense exists and belongs to the user
    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .select("id, user_id")
      .eq("id", params.id)
      .single();

    if (expenseError || !expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    if (expense.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const receipts = formData.getAll("receipts") as File[];

    console.log(`Processing ${receipts.length} receipt files`);

    if (!receipts || receipts.length === 0) {
      return NextResponse.json({ error: "No receipts provided" }, { status: 400 });
    }

    // Upload receipts to Supabase Storage
    const uploadedReceipts = await Promise.all(
      receipts.map(async (receipt) => {
        console.log(`Uploading receipt: ${receipt.name} (${receipt.size} bytes)`);

        const bytes = await receipt.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create a unique filename
        const filename = `${Date.now()}-${receipt.name}`;
        const filepath = `${user.id}/${params.id}/${filename}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(filepath, buffer, {
            contentType: receipt.type,
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        console.log(`Receipt uploaded successfully: ${filename}`);
        return filename;
      })
    );

    console.log(`All ${uploadedReceipts.length} receipts uploaded successfully`);

    // Trigger receipt analysis for the new receipts
    try {
      console.log("Triggering receipt analysis");

      // Get the session token for internal API call
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/receipts/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ expenseId: params.id }),
      });

      if (!response.ok) {
        console.error("Failed to trigger receipt analysis");
      } else {
        console.log("Receipt analysis triggered successfully");
      }
    } catch (error) {
      console.error("Error triggering receipt analysis:", error);
    }

    console.log(`Receipt upload process complete for expense: ${params.id}`);

    return NextResponse.json({
      success: true,
      receipts: uploadedReceipts,
    });
  } catch (error: any) {
    console.error("Error uploading receipts:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to upload receipts" },
      { status: 500 }
    );
  }
}
