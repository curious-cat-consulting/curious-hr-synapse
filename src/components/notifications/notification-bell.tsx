"use client";

import { Bell, Check, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { Separator } from "@components/ui/separator";
import { createClient } from "@lib/supabase/client";

import type { Notification } from "../../types/notification";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  const fetchNotifications = async () => {
    try {
      const { data: notificationsData } = await supabase.rpc("get_notifications", {
        limit_count: 10,
        offset_count: 0,
      });

      const { data: unreadCountData } = await supabase.rpc("get_unread_notification_count");

      setNotifications(notificationsData ?? []);
      setUnreadCount(Number(unreadCountData ?? 0));
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase.rpc("mark_notification_read", { notification_id: notificationId });
      await fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase.rpc("delete_notification", { notification_id: notificationId });
      await fetchNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      await supabase.rpc("mark_all_notifications_read");
      await fetchNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAllNotifications = async () => {
    setIsLoading(true);
    try {
      await supabase.rpc("delete_all_notifications");
      await fetchNotifications();
    } catch (error) {
      console.error("Error deleting all notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    // Set up auth state listener to handle subscription properly
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (
        (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
        session?.user != null &&
        isMounted
      ) {
        // Clean up existing channel
        if (channel != null) {
          supabase.removeChannel(channel);
          channel = null;
        }

        // Wait a bit for the session to be fully established
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!isMounted) return;

        // Create new subscription with retry logic
        const setupChannel = () => {
          channel = supabase
            .channel(`notifications-${session.user.id}-${Date.now()}`) // Unique channel name
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "synapse",
                table: "notifications",
                filter: `user_id=eq.${session.user.id}`,
              },
              () => {
                // Refetch notifications when any change occurs
                fetchNotifications();
              }
            )
            .subscribe((status) => {
              if (status === "CLOSED") {
                setTimeout(() => {
                  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                  if (isMounted && session.user !== null) {
                    setupChannel();
                  }
                }, 2000);
              }
            });
        };

        setupChannel();
      }
    });

    return () => {
      isMounted = false;
      authSubscription.unsubscribe();
      if (channel !== null) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "EXPENSE_CREATED":
        return "📄";
      case "EXPENSE_ANALYZED":
        return "🤖";
      case "EXPENSE_APPROVED":
        return "✅";
      case "EXPENSE_REJECTED":
        return "❌";
      case "RECEIPT_PROCESSED":
        return "🧾";
      case "TEAM_INVITATION":
        return "👥";
      default:
        return "🔔";
    }
  };

  const getNotificationLink = (notification: Notification) => {
    const metadata = notification.metadata as Record<string, unknown>;
    const expenseId = metadata.expense_id;
    const link = metadata.link;

    if (typeof expenseId === "string" && expenseId.length > 0) {
      return `/dashboard/expenses/${expenseId}`;
    }
    if (typeof link === "string" && link.length > 0) {
      return link;
    }
    return null;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  const safeUnreadCount =
    typeof unreadCount === "number" && Number.isFinite(unreadCount) ? unreadCount : 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {Math.max(0, safeUnreadCount) > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {Math.max(0, safeUnreadCount) > 99 ? "99+" : Math.max(0, safeUnreadCount)}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {notifications.length > 0 && (
            <div className="flex gap-1">
              {Math.max(0, safeUnreadCount) > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={isLoading}
                  className="h-auto p-1 text-xs"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={deleteAllNotifications}
                disabled={isLoading}
                className="h-auto p-1 text-xs text-destructive hover:text-destructive"
              >
                Delete all
              </Button>
            </div>
          )}
        </div>
        <Separator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {notifications.map((notification) => {
                const link = getNotificationLink(notification);
                const NotificationContent = (
                  <div className="flex items-start gap-3 p-2">
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight">{notification.title}</p>
                      <p className="mt-1 text-xs leading-tight text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {notification.status === "UNREAD" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );

                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`cursor-pointer ${
                      notification.status === "UNREAD" ? "bg-muted/50" : ""
                    }`}
                    onClick={() => {
                      if (notification.status === "UNREAD") {
                        markAsRead(notification.id);
                      }
                      if (typeof link === "string" && link.length > 0) {
                        window.location.href = link;
                      }
                      setIsOpen(false);
                    }}
                  >
                    {typeof link === "string" && link.length > 0 ? (
                      <div className="w-full">{NotificationContent}</div>
                    ) : (
                      NotificationContent
                    )}
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
