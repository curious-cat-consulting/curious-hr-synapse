import { NextResponse } from 'next/server';
import { analyzeReceipt } from '@lib/openai';
import { createClient } from '@lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { expenseId } = await request.json();

    console.log(`Starting receipt processing for expense: ${expenseId}`);

    if (!expenseId) {
      return NextResponse.json(
        { error: 'Missing expense ID' },
        { status: 400 }
      );
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log(`Processing for user: ${user.id}`);

    // Fetch expense details to verify it exists and belongs to the user
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .select('id, user_id')
      .eq('id', expenseId)
      .single();

    if (expenseError || !expense) {
      console.error('Failed to fetch expense details', expenseError);
      throw new Error('Failed to fetch expense details');
    }

    if (expense.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // List all receipts in the expense's directory
    const { data: receipts, error: listError } = await supabase
      .storage
      .from('receipts')
      .list(`${user.id}/${expenseId}`);

    if (listError) {
      console.error('Failed to list receipts', listError);
      throw new Error('Failed to list receipts');
    }

    if (!receipts || receipts.length === 0) {
      console.log('No receipts found in storage');
      return NextResponse.json(
        { error: 'No receipts found for this expense' },
        { status: 404 }
      );
    }

    console.log(`Found ${receipts.length} receipts in storage`);

    // Get existing receipt metadata to check which receipts have been analyzed
    const { data: existingMetadata, error: metadataError } = await supabase
      .from('receipt_metadata')
      .select('id, receipt_name')
      .eq('expense_id', expenseId);

    if (metadataError) {
      console.error('Failed to fetch existing receipt metadata', metadataError);
      throw new Error('Failed to fetch existing receipt metadata');
    }

    // Create a set of already analyzed receipt names
    const analyzedReceipts = new Set(
      existingMetadata?.map(meta => meta.receipt_name) || []
    );

    // Filter out receipts that have already been analyzed
    const receiptsToProcess = receipts.filter(
      receipt => !analyzedReceipts.has(receipt.name)
    );

    console.log(`${receiptsToProcess.length} receipts need processing (${analyzedReceipts.size} already analyzed)`);

    if (receiptsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All receipts have already been analyzed',
        data: []
      });
    }

    // Process each receipt that hasn't been analyzed yet
    const receiptPromises = receiptsToProcess.map(async (receipt) => {
      console.log(`Processing receipt: ${receipt.name}`);
      
      // Get the receipt file from storage
      const { data: receiptData, error: receiptError } = await supabase
        .storage
        .from('receipts')
        .download(`${user.id}/${expenseId}/${receipt.name}`);

      if (receiptError || !receiptData) {
        throw new Error(`Failed to fetch receipt ${receipt.name}`);
      }

      // Convert the receipt to base64
      const buffer = await receiptData.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      console.log(`Analyzing receipt ${receipt.name} with OpenAI`);
      
      // Analyze receipt using OpenAI
      const analysis = await analyzeReceipt(base64);

      console.log(`Analysis complete for ${receipt.name} - vendor: ${analysis.vendor_name}, total: $${analysis.receipt_total}`);

      // Store receipt metadata
      const { data: metadataData, error: metadataError } = await supabase
        .from('receipt_metadata')
        .insert({
          expense_id: expenseId,
          receipt_name: receipt.name,
          vendor_name: analysis.vendor_name,
          receipt_date: analysis.receipt_date,
          receipt_total: analysis.receipt_total,
          tax_amount: analysis.tax_amount,
          confidence_score: analysis.confidence_score,
          currency: analysis.currency,
        })
        .select()
        .single();

      if (metadataError) {
        throw metadataError;
      }

      // Store line items
      const lineItems = analysis.line_items.map((item) => ({
        expense_id: expenseId,
        receipt_name: receipt.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: item.total_amount,
        category: item.category,
        is_ai_generated: true
      }));

      const { error: lineItemsError } = await supabase
        .from('receipt_line_items')
        .insert(lineItems);

      if (lineItemsError) {
        throw lineItemsError;
      }

      console.log(`Stored ${lineItems.length} line items for ${receipt.name}`);

      return {
        metadata: metadataData,
        lineItems
      };
    });

    const results = await Promise.all(receiptPromises);
    
    const { error: updateError } = await supabase
      .from('expenses')
      .update({ 
        status: 'analyzed'
      })
      .eq('id', expenseId);

    if (updateError) {
      throw updateError;
    }

    console.log(`Receipt processing complete for expense ${expenseId}`);

    return NextResponse.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error processing receipt:', error);
    return NextResponse.json(
      { error: 'Failed to process receipt' },
      { status: 500 }
    );
  }
}