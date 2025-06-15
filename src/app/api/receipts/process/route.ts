import { NextResponse } from 'next/server';
import { analyzeReceipt } from '@lib/openai';
import { createClient } from '@lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { expenseId } = await request.json();

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

    // Fetch expense details to verify it exists and belongs to the user
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .select('id, user_id')
      .eq('id', expenseId)
      .single();

    if (expenseError || !expense) {
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
      throw new Error('Failed to list receipts');
    }

    if (!receipts || receipts.length === 0) {
      return NextResponse.json(
        { error: 'No receipts found for this expense' },
        { status: 404 }
      );
    }

    // Process each receipt
    const receiptPromises = receipts.map(async (receipt) => {
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

      // Analyze receipt using OpenAI
      const analysis = await analyzeReceipt(base64);

      console.warn('analysis', analysis);

      // Store receipt metadata
      const { data: metadataData, error: metadataError } = await supabase
        .from('receipt_metadata')
        .insert({
          expense_id: expenseId,
          vendor_name: analysis.vendor_name,
          vendor_address: analysis.vendor_address,
          receipt_date: analysis.receipt_date,
          receipt_total: analysis.total_amount,
          tax_amount: analysis.tax_amount,
          confidence_score: analysis.confidence_score,
          raw_ai_response: analysis
        })
        .select()
        .single();

      if (metadataError) {
        throw metadataError;
      }

      // Store line items
      const lineItems = analysis.line_items.map((item) => ({
        expense_id: expenseId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: item.total_amount,
        category: item.category
      }));

      const { error: lineItemsError } = await supabase
        .from('receipt_line_items')
        .insert(lineItems);

      if (lineItemsError) {
        throw lineItemsError;
      }

      return {
        metadata: metadataData,
        lineItems
      };
    });

    const results = await Promise.all(receiptPromises);

    // Update expense amount based on receipt totals
    const totalAmount = results.reduce((sum, result) => 
      sum + (result.metadata.receipt_total ?? 0), 0);

    const { error: updateError } = await supabase
      .from('expenses')
      .update({ amount: totalAmount })
      .eq('id', expenseId);

    if (updateError) {
      throw updateError;
    }

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