BEGIN;

-- Plan: 6 tests (3 direct FK to basejump.accounts + 3 FK to synapse.expenses)
SELECT plan(6);

-- Test 1: account_expense_counters.account_id should have ON DELETE CASCADE
SELECT is(
  (SELECT confdeltype = 'c'
   FROM pg_catalog.pg_constraint c
   JOIN pg_catalog.pg_class t ON c.conrelid = t.oid
   WHERE t.relname = 'account_expense_counters'
     AND c.confrelid = 'basejump.accounts'::regclass
     AND c.conkey[1] = (
       SELECT attnum FROM pg_catalog.pg_attribute
       WHERE attrelid = t.oid AND attname = 'account_id'
     )
  ),
  true,
  'account_expense_counters.account_id has ON DELETE CASCADE to basejump.accounts'
);

-- Test 2: expenses.account_id should NOT have ON DELETE CASCADE
SELECT is(
  (SELECT confdeltype = 'c'
   FROM pg_catalog.pg_constraint c
   JOIN pg_catalog.pg_class t ON c.conrelid = t.oid
   WHERE t.relname = 'expenses'
     AND c.confrelid = 'basejump.accounts'::regclass
     AND c.conkey[1] = (
       SELECT attnum FROM pg_catalog.pg_attribute
       WHERE attrelid = t.oid AND attname = 'account_id'
     )
  ),
  false,
  'expenses.account_id does NOT have ON DELETE CASCADE to basejump.accounts'
);

-- Test 3: notifications.account_id should have ON DELETE CASCADE
SELECT is(
  (SELECT confdeltype = 'c'
   FROM pg_catalog.pg_constraint c
   JOIN pg_catalog.pg_class t ON c.conrelid = t.oid
   WHERE t.relname = 'notifications'
     AND c.confrelid = 'basejump.accounts'::regclass
     AND c.conkey[1] = (
       SELECT attnum FROM pg_catalog.pg_attribute
       WHERE attrelid = t.oid AND attname = 'account_id'
     )
  ),
  true,
  'notifications.account_id has ON DELETE CASCADE to basejump.accounts'
);

-- Test 4: receipt_metadata.expense_id should have ON DELETE CASCADE
SELECT is(
  (SELECT confdeltype = 'c'
   FROM pg_catalog.pg_constraint c
   JOIN pg_catalog.pg_class t ON c.conrelid = t.oid
   WHERE t.relname = 'receipt_metadata'
     AND c.confrelid = 'synapse.expenses'::regclass
     AND c.conkey[1] = (
       SELECT attnum FROM pg_catalog.pg_attribute
       WHERE attrelid = t.oid AND attname = 'expense_id'
     )
  ),
  true,
  'receipt_metadata.expense_id has ON DELETE CASCADE to synapse.expenses'
);

-- Test 5: receipt_line_items.expense_id should have ON DELETE CASCADE
SELECT is(
  (SELECT confdeltype = 'c'
   FROM pg_catalog.pg_constraint c
   JOIN pg_catalog.pg_class t ON c.conrelid = t.oid
   WHERE t.relname = 'receipt_line_items'
     AND c.confrelid = 'synapse.expenses'::regclass
     AND c.conkey[1] = (
       SELECT attnum FROM pg_catalog.pg_attribute
       WHERE attrelid = t.oid AND attname = 'expense_id'
     )
  ),
  true,
  'receipt_line_items.expense_id has ON DELETE CASCADE to synapse.expenses'
);

-- Test 6: mileage_line_items.expense_id should have ON DELETE CASCADE
SELECT is(
  (SELECT confdeltype = 'c'
   FROM pg_catalog.pg_constraint c
   JOIN pg_catalog.pg_class t ON c.conrelid = t.oid
   WHERE t.relname = 'mileage_line_items'
     AND c.confrelid = 'synapse.expenses'::regclass
     AND c.conkey[1] = (
       SELECT attnum FROM pg_catalog.pg_attribute
       WHERE attrelid = t.oid AND attname = 'expense_id'
     )
  ),
  true,
  'mileage_line_items.expense_id has ON DELETE CASCADE to synapse.expenses'
);

SELECT * FROM finish();
ROLLBACK; 