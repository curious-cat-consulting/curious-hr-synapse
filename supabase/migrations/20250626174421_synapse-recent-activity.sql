-- Migration: create get_recent_activity RPC (with explicit table aliases)
create or replace function get_recent_activity(account_id uuid default null)
returns table (
  id uuid,
  account_expense_id integer,
  title text,
  amount numeric,
  status text,
  created_at timestamptz,
  user_name text
) as $$
begin
  if account_id is not null then
    return query
      select 
        expenses.id, 
        expenses.account_expense_id,
        expenses.title, 
        expenses.amount, 
        expenses.status::text, 
        expenses.created_at,
        p.name as user_name
      from synapse.expenses as expenses
      inner join basejump.account_user au on au.user_id = expenses.user_id and au.account_id = get_recent_activity.account_id
      inner join basejump.accounts p on p.primary_owner_user_id = expenses.user_id and p.personal_account = true
      where expenses.account_id = get_recent_activity.account_id
      order by expenses.created_at desc
      limit 5;
  else
    return query
      select 
        expenses.id, 
        expenses.account_expense_id,
        expenses.title, 
        expenses.amount, 
        expenses.status::text, 
        expenses.created_at,
        null as user_name
      from synapse.expenses as expenses
      where expenses.user_id = auth.uid()
      order by expenses.created_at desc
      limit 5;
  end if;
end;
$$ language plpgsql
SET search_path = '';

-- Grant execute permissions
grant execute on function get_recent_activity(uuid) to authenticated;
