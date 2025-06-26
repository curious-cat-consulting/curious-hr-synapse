/*
===============================================================================
                              NOTIFICATIONS SCHEMA
===============================================================================
*/

-- Create notification types enum
CREATE TYPE synapse.notification_type AS ENUM (
  'EXPENSE_CREATED',
  'EXPENSE_ANALYZED',
  'EXPENSE_APPROVED',
  'EXPENSE_REJECTED',
  'RECEIPT_PROCESSED',
  'TEAM_INVITATION',
  'GENERAL'
);

-- Create notification status enum
CREATE TYPE synapse.notification_status AS ENUM (
  'UNREAD',
  'READ'
);

-- Create notifications table
CREATE TABLE synapse.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  account_id uuid REFERENCES basejump.accounts(id) NOT NULL,
  type synapse.notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  status synapse.notification_status NOT NULL DEFAULT 'UNREAD',
  metadata jsonb DEFAULT '{}'::jsonb, -- Store additional data like expense_id, links, etc.
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  read_at timestamp with time zone NULL
);

-- Add indexes for better query performance
CREATE INDEX idx_notifications_user_id ON synapse.notifications(user_id);
CREATE INDEX idx_notifications_account_id ON synapse.notifications(account_id);
CREATE INDEX idx_notifications_status ON synapse.notifications(status);
CREATE INDEX idx_notifications_created_at ON synapse.notifications(created_at DESC);
CREATE INDEX idx_notifications_user_status ON synapse.notifications(user_id, status);

-- Enable Row Level Security
ALTER TABLE synapse.notifications ENABLE ROW LEVEL SECURITY;

-- Enable real-time replication for notifications table
-- This is required for Supabase real-time subscriptions to work properly
ALTER TABLE synapse.notifications REPLICA IDENTITY FULL;

-- Add the table to the real-time publication
-- This ensures real-time events are broadcast for INSERT, UPDATE, DELETE
ALTER PUBLICATION supabase_realtime ADD TABLE synapse.notifications;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON synapse.notifications FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() AND 
  account_id IN (SELECT basejump.get_accounts_with_role())
);

-- Policy: Users can insert notifications for themselves
CREATE POLICY "Users can insert their own notifications"
ON synapse.notifications FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND 
  account_id IN (SELECT basejump.get_accounts_with_role())
);

-- Policy: Users can update their own notifications
CREATE POLICY "Users can update their own notifications"
ON synapse.notifications FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() AND 
  account_id IN (SELECT basejump.get_accounts_with_role())
)
WITH CHECK (
  user_id = auth.uid() AND 
  account_id IN (SELECT basejump.get_accounts_with_role())
);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON synapse.notifications FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() AND 
  account_id IN (SELECT basejump.get_accounts_with_role())
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE synapse.notifications TO authenticated;

/*
===============================================================================
                              NOTIFICATION FUNCTIONS
===============================================================================
*/

/**
  Creates a new notification for the current user
 */
CREATE OR REPLACE FUNCTION synapse.create_notification(
  notification_type synapse.notification_type,
  notification_title text,
  notification_message text,
  notification_account_id uuid,
  notification_metadata jsonb DEFAULT '{}'::jsonb
)
  RETURNS json
  LANGUAGE plpgsql
AS
$$
DECLARE
  new_notification synapse.notifications;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate input
  IF notification_title IS NULL OR trim(notification_title) = '' THEN
    RAISE EXCEPTION 'Title is required';
  END IF;
  IF notification_message IS NULL OR trim(notification_message) = '' THEN
    RAISE EXCEPTION 'Message is required';
  END IF;
  IF notification_account_id IS NULL THEN
    RAISE EXCEPTION 'Account ID is required';
  END IF;
  IF NOT basejump.has_role_on_account(notification_account_id) THEN
    RAISE EXCEPTION 'Access denied: you do not have access to this account';
  END IF;

  -- Create the notification
  INSERT INTO synapse.notifications (
    user_id,
    account_id,
    type,
    title,
    message,
    metadata
  ) VALUES (
    auth.uid(),
    notification_account_id,
    notification_type,
    notification_title,
    notification_message,
    notification_metadata
  )
  RETURNING * INTO new_notification;

  -- Return the created notification
  RETURN json_build_object(
    'id', new_notification.id,
    'type', new_notification.type,
    'title', new_notification.title,
    'message', new_notification.message,
    'status', new_notification.status,
    'metadata', new_notification.metadata,
    'created_at', new_notification.created_at
  );
END;
$$;

/**
  Gets notifications for the current user
 */
CREATE OR REPLACE FUNCTION public.get_notifications(
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
  RETURNS json
  LANGUAGE sql
AS
$$
SELECT COALESCE(json_agg(
  json_build_object(
    'id', n.id,
    'type', n.type,
    'title', n.title,
    'message', n.message,
    'status', n.status,
    'metadata', n.metadata,
    'created_at', n.created_at,
    'read_at', n.read_at
  ) ORDER BY n.created_at DESC
), '[]'::json)
FROM synapse.notifications n
WHERE n.user_id = auth.uid()
  AND n.account_id IN (SELECT basejump.get_accounts_with_role())
LIMIT limit_count
OFFSET offset_count;
$$;

/**
  Gets unread notification count for the current user
 */
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
  RETURNS integer
  LANGUAGE sql
AS
$$
SELECT COALESCE(count(*), 0)::integer
FROM synapse.notifications n
WHERE n.user_id = auth.uid()
  AND n.account_id IN (SELECT basejump.get_accounts_with_role())
  AND n.status = 'UNREAD';
$$;

/**
  Marks a notification as read
 */
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id uuid)
  RETURNS json
  LANGUAGE plpgsql
AS
$$
DECLARE
  updated_notification synapse.notifications;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Update the notification
  UPDATE synapse.notifications
  SET status = 'READ'::synapse.notification_status,
      read_at = now()
  WHERE id = notification_id
    AND user_id = auth.uid()
    AND account_id IN (SELECT basejump.get_accounts_with_role())
  RETURNING * INTO updated_notification;

  IF updated_notification IS NULL THEN
    RAISE EXCEPTION 'Notification not found or access denied';
  END IF;

  -- Return the updated notification
  RETURN json_build_object(
    'id', updated_notification.id,
    'type', updated_notification.type,
    'title', updated_notification.title,
    'message', updated_notification.message,
    'status', updated_notification.status,
    'metadata', updated_notification.metadata,
    'created_at', updated_notification.created_at,
    'read_at', updated_notification.read_at
  );
END;
$$;

/**
  Marks all notifications as read for the current user
 */
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
  RETURNS integer
  LANGUAGE plpgsql
AS
$$
DECLARE
  updated_count integer;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Update all unread notifications
  UPDATE synapse.notifications
  SET status = 'READ'::synapse.notification_status,
      read_at = now()
  WHERE user_id = auth.uid()
    AND account_id IN (SELECT basejump.get_accounts_with_role())
    AND status = 'UNREAD';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

/**
  Deletes a notification for the current user
 */
CREATE OR REPLACE FUNCTION public.delete_notification(notification_id uuid)
  RETURNS boolean
  LANGUAGE plpgsql
AS
$$
DECLARE
  deleted_count integer;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Delete the notification
  DELETE FROM synapse.notifications
  WHERE id = notification_id
    AND user_id = auth.uid()
    AND account_id IN (SELECT basejump.get_accounts_with_role());

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$;

/**
  Deletes all notifications for the current user
 */
CREATE OR REPLACE FUNCTION public.delete_all_notifications()
  RETURNS integer
  LANGUAGE plpgsql
AS
$$
DECLARE
  deleted_count integer;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Delete all notifications for the current user
  DELETE FROM synapse.notifications
  WHERE user_id = auth.uid()
    AND account_id IN (SELECT basejump.get_accounts_with_role());

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION synapse.create_notification(synapse.notification_type, text, text, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_notifications(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_notification(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_all_notifications() TO authenticated; 