export type NotificationType =
  | "EXPENSE_CREATED"
  | "EXPENSE_ANALYZED"
  | "EXPENSE_APPROVED"
  | "EXPENSE_REJECTED"
  | "RECEIPT_PROCESSED"
  | "TEAM_INVITATION"
  | "TEAM_MEMBER_ADDED"
  | "TEAM_MEMBER_REMOVED"
  | "POSTING_TEAM_UPDATED"
  | "GENERAL";

export type NotificationStatus = "UNREAD" | "READ";

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  EXPENSE_CREATED: "📄",
  EXPENSE_ANALYZED: "🤖",
  EXPENSE_APPROVED: "✅",
  EXPENSE_REJECTED: "❌",
  RECEIPT_PROCESSED: "🧾",
  TEAM_INVITATION: "👥",
  TEAM_MEMBER_ADDED: "👤",
  TEAM_MEMBER_REMOVED: "🚪",
  POSTING_TEAM_UPDATED: "🔄",
  GENERAL: "🔔",
} as const;

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  read_at?: string;
}

export interface NotificationMetadata {
  expense_id?: string;
  receipt_id?: string;
  account_id?: string;
  link?: string;
  [key: string]: unknown;
}
