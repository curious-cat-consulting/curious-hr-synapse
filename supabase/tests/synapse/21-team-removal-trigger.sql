/*
===============================================================================
                              TEAM REMOVAL TRIGGER TESTS
===============================================================================
*/

BEGIN;

-- Test setup
SELECT plan(2);

-- Test 1: Verify the trigger function exists
SELECT has_function('synapse', 'handle_account_user_removal', 'Trigger function should exist');

-- Test 2: Verify the trigger exists
SELECT trigger_is('basejump', 'account_user', 'synapse_account_user_removal_trigger', 'synapse', 'handle_account_user_removal');

SELECT * FROM finish();

ROLLBACK; 