/*
===============================================================================
                              TEAM CREATION TRIGGERS
===============================================================================
*/

-- Add new notification types for team-related notifications
ALTER TYPE synapse.notification_type ADD VALUE IF NOT EXISTS 'TEAM_CREATED';
ALTER TYPE synapse.notification_type ADD VALUE IF NOT EXISTS 'POSTING_ACCOUNT_UPDATED';

/**
  * Trigger function to handle team creation events
  * This function:
  * 1. Sets the new team as the user's posting team if they don't have one
  * 2. Creates a notification that they were set as owner on the new team
  */
CREATE OR REPLACE FUNCTION synapse.handle_team_creation()
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
BEGIN
  -- Only process team accounts (not personal accounts)
  IF NEW.personal_account = true THEN
    RETURN NEW;
  END IF;

  -- Get the team name
  team_name := NEW.name;

  -- Get the user's personal account ID
  SELECT id INTO personal_account_id
  FROM basejump.accounts
  WHERE primary_owner_user_id = auth.uid() AND personal_account = true;

  -- If no personal account found, something is wrong
  IF personal_account_id IS NULL THEN
    RAISE EXCEPTION 'Personal account not found for user %', auth.uid();
  END IF;

  -- Check if user already has a posting team set
  SELECT (public_metadata->>'posting_team_id')::uuid INTO current_posting_team_id
  FROM basejump.accounts
  WHERE id = personal_account_id;

  -- If no posting team is set, set this new team as the posting team
  IF current_posting_team_id IS NULL THEN
    UPDATE basejump.accounts
    SET public_metadata = COALESCE(public_metadata, '{}'::jsonb) || 
                         jsonb_build_object('posting_team_id', NEW.id)
    WHERE id = personal_account_id;
  END IF;

  -- Create notification that user was set as owner on the new team
  INSERT INTO synapse.notifications (
    user_id,
    account_id,
    type,
    title,
    message,
    metadata
  ) VALUES (
    auth.uid(),
    NEW.id,
    'TEAM_CREATED'::synapse.notification_type,
    'New Team Created',
    format('You have been set as the owner of the new team "%s"', team_name),
    jsonb_build_object(
      'team_id', NEW.id,
      'team_name', team_name,
      'team_slug', NEW.slug
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
CREATE OR REPLACE FUNCTION synapse.handle_posting_account_change()
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
BEGIN
  -- Only process personal accounts
  IF NEW.personal_account = false THEN
    RETURN NEW;
  END IF;

  -- Only process if this is the current user's personal account
  IF NEW.primary_owner_user_id != auth.uid() THEN
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
    auth.uid(),
    NEW.id,
    'POSTING_ACCOUNT_UPDATED'::synapse.notification_type,
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

-- Create the trigger that fires after a team account is created
CREATE TRIGGER synapse_team_creation_trigger
  AFTER INSERT
  ON basejump.accounts
  FOR EACH ROW
  WHEN (NEW.personal_account = false)
EXECUTE FUNCTION synapse.handle_team_creation();

-- Create the trigger that fires when posting team metadata changes
CREATE TRIGGER synapse_posting_account_change_trigger
  AFTER UPDATE
  ON basejump.accounts
  FOR EACH ROW
  WHEN (NEW.personal_account = true AND OLD.public_metadata IS DISTINCT FROM NEW.public_metadata)
EXECUTE FUNCTION synapse.handle_posting_account_change();

-- Grant execute permissions on the trigger functions
GRANT EXECUTE ON FUNCTION synapse.handle_team_creation() TO authenticated;
GRANT EXECUTE ON FUNCTION synapse.handle_posting_account_change() TO authenticated; 