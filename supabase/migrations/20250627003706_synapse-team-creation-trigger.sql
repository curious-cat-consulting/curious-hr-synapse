/*
===============================================================================
                              TEAM CREATION TRIGGERS
===============================================================================
*/

/**
  * Trigger function to handle account_user insertions
  * This function:
  * 1. Sets the new team as the user's posting team if they don't have one
  * 2. Creates a notification that they were successfully added to the team
  * This handles both owners and members joining teams
  */
CREATE OR REPLACE FUNCTION synapse.handle_account_user_insertion()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS
$$
DECLARE
  personal_account_id uuid;
  current_posting_team_id uuid;
  team_name text;
  team_slug text;
  user_id uuid;
  is_owner boolean;
BEGIN
  -- Only process team accounts (not personal accounts)
  SELECT personal_account INTO is_owner
  FROM basejump.accounts
  WHERE id = NEW.account_id;
  
  IF is_owner THEN
    RETURN NEW;
  END IF;

  -- Get the team details
  SELECT name, slug INTO team_name, team_slug
  FROM basejump.accounts
  WHERE id = NEW.account_id;

  user_id := NEW.user_id;

  -- Get the user's personal account ID
  SELECT id INTO personal_account_id
  FROM basejump.accounts
  WHERE primary_owner_user_id = user_id AND personal_account;

  -- Check if user already has a posting team set
  SELECT (public_metadata->>'posting_team_id')::uuid INTO current_posting_team_id
  FROM basejump.accounts
  WHERE id = personal_account_id;

  -- If no posting team is set, set this new team as the posting team
  IF current_posting_team_id IS NULL THEN
    UPDATE basejump.accounts
    SET public_metadata = COALESCE(public_metadata, '{}'::jsonb) || 
                         jsonb_build_object('posting_team_id', NEW.account_id)
    WHERE id = personal_account_id;
  END IF;

  -- Create notification that user was successfully added to the team
  INSERT INTO synapse.notifications (
    user_id,
    account_id,
    type,
    title,
    message,
    metadata
  ) VALUES (
    user_id,
    NEW.account_id,
    'TEAM_MEMBER_ADDED'::synapse.notification_type,
    'Successfully Added to Team',
    format('You have been successfully added to the team "%s"', team_name),
    jsonb_build_object(
      'team_id', NEW.account_id,
      'team_name', team_name,
      'team_slug', team_slug,
      'user_role', NEW.account_role
    )
  );

  RETURN NEW;
END;
$$;

/**
  * Trigger function to handle posting team changes
  * This function:
  * 1. Detects when posting_team_id changes in personal account metadata
  * 2. Creates a notification about the posting team update
  */
CREATE OR REPLACE FUNCTION synapse.handle_posting_team_change()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS
$$
DECLARE
  old_posting_team_id uuid;
  new_posting_team_id uuid;
  team_name text;
  team_slug text;
  user_id uuid;
BEGIN
  -- Only process personal accounts
  IF NEW.personal_account = false THEN
    RETURN NEW;
  END IF;

  user_id := NEW.primary_owner_user_id;

  -- Only process if this is the current user's personal account
  IF NEW.primary_owner_user_id != user_id THEN
    RETURN NEW;
  END IF;

  -- Get old and new posting team IDs
  old_posting_team_id := (OLD.public_metadata->>'posting_team_id')::uuid;
  new_posting_team_id := (NEW.public_metadata->>'posting_team_id')::uuid;

  -- Only proceed if posting team actually changed
  IF old_posting_team_id IS NOT DISTINCT FROM new_posting_team_id THEN
    RETURN NEW;
  END IF;

  -- Get team details for the new posting team
  SELECT name, slug INTO team_name, team_slug
  FROM basejump.accounts
  WHERE id = new_posting_team_id;

  -- Create notification about posting team update
  INSERT INTO synapse.notifications (
    user_id,
    account_id,
    type,
    title,
    message,
    metadata
  ) VALUES (
    user_id,
    NEW.id,
    'POSTING_TEAM_UPDATED'::synapse.notification_type,
    'Posting Team Updated',
    format('Your posting team has been set to "%s"', team_name),
    jsonb_build_object(
      'team_id', new_posting_team_id,
      'team_name', team_name,
      'team_slug', team_slug,
      'previous_posting_team_id', old_posting_team_id
    )
  );

  RETURN NEW;
END;
$$;

/**
  * Trigger function to handle account_user deletions (team member removal)
  * This function:
  * 1. Removes the user from their posting team if they were removed from that team
  * 2. Creates a notification that they were removed from the team
  * This handles both owners and members being removed from teams
  */
CREATE OR REPLACE FUNCTION synapse.handle_account_user_removal()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS
$$
DECLARE
  personal_account_id uuid;
  current_posting_team_id uuid;
  team_name text;
  team_slug text;
  removed_user_id uuid;
  is_owner boolean;
BEGIN
  -- Only process team accounts (not personal accounts)
  SELECT personal_account INTO is_owner
  FROM basejump.accounts
  WHERE id = OLD.account_id;
  
  IF is_owner THEN
    RETURN OLD;
  END IF;

  -- Get the team details
  SELECT name, slug INTO team_name, team_slug
  FROM basejump.accounts
  WHERE id = OLD.account_id;

  removed_user_id := OLD.user_id;

  -- Get the user's personal account ID
  SELECT id INTO personal_account_id
  FROM basejump.accounts
  WHERE primary_owner_user_id = removed_user_id AND personal_account;

  -- Check if the removed team was their posting team
  SELECT (public_metadata->>'posting_team_id')::uuid INTO current_posting_team_id
  FROM basejump.accounts
  WHERE id = personal_account_id;

  -- If the removed team was their posting team, clear the posting team
  IF current_posting_team_id = OLD.account_id THEN
    UPDATE basejump.accounts
    SET public_metadata = public_metadata - 'posting_team_id'
    WHERE id = personal_account_id;
  END IF;

  -- Clear notification for the user and the team
  DELETE FROM synapse.notifications n
  WHERE n.user_id = removed_user_id
  AND n.account_id = OLD.account_id;

  -- Create notification that user was removed from the team
  INSERT INTO synapse.notifications (
    user_id,
    account_id,
    type,
    title,
    message,
    metadata
  ) VALUES (
    removed_user_id,
    removed_user_id, -- not account_id since they'll be removed from the account
    'TEAM_MEMBER_REMOVED'::synapse.notification_type,
    'Removed from Team',
    format('You have been removed from the team "%s"', team_name),
    jsonb_build_object(
      'team_id', OLD.account_id,
      'team_name', team_name,
      'team_slug', team_slug,
      'user_role', OLD.account_role,
      'was_posting_team', current_posting_team_id = OLD.account_id
    )
  );

  RETURN OLD;
END;
$$;

-- Create the trigger that fires after a user is added to a team account
CREATE TRIGGER synapse_account_user_insertion_trigger
  AFTER INSERT
  ON basejump.account_user
  FOR EACH ROW
EXECUTE FUNCTION synapse.handle_account_user_insertion();

-- Create the trigger that fires after a user is removed from a team account
CREATE TRIGGER synapse_account_user_removal_trigger
  AFTER DELETE
  ON basejump.account_user
  FOR EACH ROW
EXECUTE FUNCTION synapse.handle_account_user_removal();

-- Create the trigger that fires when posting team metadata changes
CREATE TRIGGER synapse_posting_team_change_trigger
  AFTER UPDATE
  ON basejump.accounts
  FOR EACH ROW
  WHEN (NEW.personal_account = true AND OLD.public_metadata IS DISTINCT FROM NEW.public_metadata)
EXECUTE FUNCTION synapse.handle_posting_team_change();

-- Grant execute permissions on the trigger functions
GRANT EXECUTE ON FUNCTION synapse.handle_account_user_insertion() TO authenticated;
GRANT EXECUTE ON FUNCTION synapse.handle_posting_team_change() TO authenticated;
GRANT EXECUTE ON FUNCTION synapse.handle_account_user_removal() TO authenticated; 