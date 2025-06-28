import { NextResponse } from "next/server";

import { createClient } from "@lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; receiptId: string }> }
) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError !== null || user === null) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: expenseId, receiptId } = await params;

    // Get receipt download information using the comprehensive RPC function
    const { data: downloadInfo, error: downloadInfoError } = await supabase.rpc(
      "get_receipt_download_info",
      {
        expense_id: expenseId,
        receipt_id: receiptId,
      }
    );

    if (downloadInfoError !== null || downloadInfo === null) {
      console.error("Error getting download info:", downloadInfoError);
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    console.log(`Downloading file: ${downloadInfo.storage_name}`);

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("receipts")
      .download(downloadInfo.storage_name);

    if (downloadError !== null) {
      console.error("Download error:", downloadError);
      return NextResponse.json({ error: "Failed to download receipt" }, { status: 500 });
    }

    // Return the file as a response
    return new NextResponse(fileData, {
      headers: {
        "Content-Type": downloadInfo.mime_type,
        "Content-Disposition": `attachment; filename="${downloadInfo.file_name}"`,
      },
    });
  } catch (error: unknown) {
    console.error("Error downloading receipt:", error);
    return NextResponse.json({ error: "Error downloading receipt" }, { status: 500 });
  }
}
