"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@lib/supabase/server";

import type { NotificationType, NotificationMetadata } from "../../types/notification";

export async function createNotification(
  type: NotificationType,
  title: string,
  message: string,
  accountId: string,
  metadata?: NotificationMetadata
) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("create_notification", {
    notification_type: type,
    notification_title: title,
    notification_message: message,
    notification_account_id: accountId,
    notification_metadata: metadata ?? {},
  });

  if (error !== null) {
    console.error("Error creating notification:", error);
    throw new Error("Failed to create notification");
  }

  // Revalidate the dashboard to show new notifications
  revalidatePath("/dashboard");

  return data;
}

export async function getNotifications(limit = 50, offset = 0) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_notifications", {
    limit_count: limit,
    offset_count: offset,
  });

  if (error !== null) {
    console.error("Error fetching notifications:", error);
    throw new Error("Failed to fetch notifications");
  }

  return data;
}

export async function getUnreadNotificationCount() {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_unread_notification_count");

  if (error !== null) {
    console.error("Error fetching unread notification count:", error);
    throw new Error("Failed to fetch unread notification count");
  }

  return data;
}

export async function markNotificationRead(notificationId: string) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("mark_notification_read", {
    notification_id: notificationId,
  });

  if (error !== null) {
    console.error("Error marking notification as read:", error);
    throw new Error("Failed to mark notification as read");
  }

  // Revalidate the dashboard to update notification count
  revalidatePath("/dashboard");

  return data;
}

export async function markAllNotificationsRead() {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("mark_all_notifications_read");

  if (error !== null) {
    console.error("Error marking all notifications as read:", error);
    throw new Error("Failed to mark all notifications as read");
  }

  // Revalidate the dashboard to update notification count
  revalidatePath("/dashboard");

  return data;
}

export async function deleteNotification(notificationId: string) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("delete_notification", {
    notification_id: notificationId,
  });

  if (error !== null) {
    console.error("Error deleting notification:", error);
    throw new Error("Failed to delete notification");
  }

  // Revalidate the dashboard to update notification count
  revalidatePath("/dashboard");

  return data;
}
