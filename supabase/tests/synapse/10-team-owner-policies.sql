BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select plan(3);

-- Test that team owner policies exist
select policies_are('synapse', 'receipt_metadata', 
    ARRAY['Users can view their own receipt metadata', 'Users can insert their own receipt metadata', 'Team owners can view member receipt metadata'],
    'Receipt metadata should have the correct RLS policies including team owner policy');

select policies_are('synapse', 'receipt_line_items', 
    ARRAY['Users can view their own receipt line items', 'Users can insert their own receipt line items', 'Users can update their own receipt line items', 'Users can delete their own non-AI line items', 'Team owners can view member receipt line items'],
    'Receipt line items should have the correct RLS policies including team owner policy');

select policies_are('synapse', 'mileage_line_items', 
    ARRAY['Users can view their own mileage line items', 'Users can insert their own mileage line items', 'Users can update their own mileage line items', 'Users can delete their own mileage line items', 'Team owners can view member mileage line items'],
    'Mileage line items should have the correct RLS policies including team owner policy');

SELECT *
FROM finish();

ROLLBACK; 