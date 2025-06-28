/*
===============================================================================
                              EXPENSE STATUS NOTIFICATION TRIGGER
===============================================================================
*/

-- Create a function that will be called by the trigger
CREATE OR REPLACE FUNCTION synapse.handle_expense_status_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS
$$
DECLARE
  notification_type synapse.notification_type;
  notification_title text;
  notification_message text;
  expense_owner_id uuid;
  expense_account_id uuid;
  expense_title text;
  expense_amount decimal(10,2);
BEGIN
  -- Only proceed if status has changed to APPROVED or REJECTED
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('APPROVED', 'REJECTED') THEN
    RETURN NEW;
  END IF;

  -- Get expense details
  expense_owner_id := NEW.user_id;
  expense_account_id := NEW.account_id;
  expense_title := NEW.title;
  expense_amount := NEW.amount;

  -- Determine notification type and content
  IF NEW.status = 'APPROVED' THEN
    notification_type := 'EXPENSE_APPROVED'::synapse.notification_type;
    notification_title := 'Expense Approved';
    notification_message := format('Your expense "%s" for $%s has been approved.', expense_title, expense_amount);
  ELSIF NEW.status = 'REJECTED' THEN
    notification_type := 'EXPENSE_REJECTED'::synapse.notification_type;
    notification_title := 'Expense Rejected';
    notification_message := format('Your expense "%s" for $%s has been rejected.', expense_title, expense_amount);
  END IF;

  -- Create notification for the expense owner
  INSERT INTO synapse.notifications (
    user_id,
    account_id,
    type,
    title,
    message,
    metadata
  ) VALUES (
    expense_owner_id,
    expense_account_id,
    notification_type,
    notification_title,
    notification_message,
    jsonb_build_object(
      'expense_id', NEW.id,
      'expense_title', expense_title,
      'expense_amount', expense_amount,
      'link', format('/dashboard/expenses/%s', NEW.id)
    )
  );

  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER expense_status_notification_trigger
  AFTER UPDATE ON synapse.expenses
  FOR EACH ROW
  EXECUTE FUNCTION synapse.handle_expense_status_change();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION synapse.handle_expense_status_change() TO authenticated;
