-- This function returns expenses for all members of a team account
CREATE OR REPLACE FUNCTION public.get_team_expenses(team_account_slug text)
  RETURNS json
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, basejump
AS
$$
DECLARE
  team_account_id uuid;
BEGIN
  -- Get the account ID from the slug using Basejump's API
  team_account_id := public.get_account_id(team_account_slug);

  -- Check if account exists
  IF team_account_id IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  -- Use Basejump's built-in permission check
  IF NOT basejump.has_role_on_account(team_account_id, 'owner') THEN
    RAISE EXCEPTION 'Only account owners can access this function';
  END IF;

  -- Get all expenses from team members (following Basejump's pattern from get_account_members)
  RETURN (
    SELECT COALESCE(json_agg(
      json_build_object(
        'id', e.id,
        'title', e.title,
        'description', e.description,
        'amount', e.amount,
        'status', e.status,
        'created_at', e.created_at,
        'user_id', e.user_id,
        'user_name', e.name
      ) ORDER BY e.created_at DESC
    ), '[]'::json)
    FROM (
      SELECT DISTINCT ON (e.id) e.*, p.name
      FROM synapse.expenses e
      INNER JOIN basejump.account_user au ON au.user_id = e.user_id AND au.account_id = team_account_id
      INNER JOIN basejump.accounts p ON p.primary_owner_user_id = e.user_id AND p.personal_account = true
      ORDER BY e.id, p.name
    ) e
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_team_expenses(text) TO authenticated;