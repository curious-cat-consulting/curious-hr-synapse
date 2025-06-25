export type NotificationType =
  | "EXPENSE_CREATED"
  | "EXPENSE_ANALYZED"
  | "EXPENSE_APPROVED"
  | "EXPENSE_REJECTED"
  | "RECEIPT_PROCESSED"
  | "TEAM_INVITATION"
  | "GENERAL";

export type NotificationStatus = "UNREAD" | "READ";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  metadata: Record<string, any>;
  created_at: string;
  read_at?: string;
}

export interface NotificationMetadata {
  expense_id?: string;
  receipt_id?: string;
  account_id?: string;
  link?: string;
  [key: string]: any;
}
