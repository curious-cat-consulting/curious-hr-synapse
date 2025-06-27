"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { Bell, Check, Trash2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";

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

import { NOTIFICATION_ICONS } from "../../types/notification";
import type { Notification } from "../../types/notification";

// Global subscription management per user across all tabs
const globalSubscriptions = new Map<
  string,
  {
    channel: RealtimeChannel | null;
    refCount: number;
    subscribers: Set<() => void>; // Functions to call when notifications change
  }
>();

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedNotifications, setHasLoadedNotifications] = useState(false);

  const supabase = createClient();
  const userIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const updateCallbackRef = useRef<(() => void) | null>(null);

  const fetchUnreadCount = async () => {
    try {
      const { data: unreadCountData } = await supabase.rpc("get_unread_notification_count");
      setUnreadCount(Number(unreadCountData ?? 0));
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
    }
  };

  const fetchNotifications = async () => {
    if (hasLoadedNotifications) return;

    try {
      const { data: notificationsData } = await supabase.rpc("get_notifications", {
        limit_count: 10,
        offset_count: 0,
      });

      setNotifications(notificationsData ?? []);
      setHasLoadedNotifications(true);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const refreshNotifications = async () => {
    try {
      const { data: notificationsData } = await supabase.rpc("get_notifications", {
        limit_count: 10,
        offset_count: 0,
      });

      setNotifications(notificationsData ?? []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Create a callback that this component instance will use
  const createUpdateCallback = () => {
    return () => {
      if (isMountedRef.current) {
        fetchUnreadCount();
        if (hasLoadedNotifications) {
          refreshNotifications();
        }
      }
    };
  };

  const setupOrJoinSubscription = (userId: string) => {
    userIdRef.current = userId;
    const channelName = `notifications-${userId}`;

    // Create the update callback for this component instance
    updateCallbackRef.current = createUpdateCallback();

    let subscription = globalSubscriptions.get(channelName);

    if (subscription != null) {
      // Join existing subscription
      subscription.refCount++;
      subscription.subscribers.add(updateCallbackRef.current);

      return;
    }

    try {
      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "synapse",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (_) => {
            // Notify all subscribers (all component instances for this user)
            const sub = globalSubscriptions.get(channelName);
            if (sub != null) {
              sub.subscribers.forEach((callback) => {
                try {
                  callback();
                } catch (error) {
                  console.error("Error in notification callback:", error);
                }
              });
            }
          }
        )
        .subscribe((_) => {});

      // Store the new subscription
      globalSubscriptions.set(channelName, {
        channel,
        refCount: 1,
        subscribers: new Set([updateCallbackRef.current]),
      });
    } catch (error) {
      console.error("Error setting up notification channel:", error);
    }
  };

  const leaveSubscription = async () => {
    if (userIdRef.current == null || updateCallbackRef.current == null) return;

    const channelName = `notifications-${userIdRef.current}`;
    const subscription = globalSubscriptions.get(channelName);

    if (subscription != null) {
      // Remove this component's callback
      subscription.subscribers.delete(updateCallbackRef.current);
      subscription.refCount--;

      // If no more subscribers, clean up the channel
      if (subscription.refCount <= 0 || subscription.subscribers.size === 0) {
        try {
          if (subscription.channel != null) {
            await supabase.removeChannel(subscription.channel);
          }
        } catch (error) {
          console.error("Error removing channel:", error);
        }
        globalSubscriptions.delete(channelName);
      }
    }

    userIdRef.current = null;
    updateCallbackRef.current = null;
  };

  useEffect(() => {
    fetchUnreadCount();

    // Set up auth state listener
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (
        (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
        session?.user != null &&
        isMountedRef.current
      ) {
        // Small delay to ensure session is fully established
        await new Promise((resolve) => setTimeout(resolve, 500));
        setupOrJoinSubscription(session.user.id);
      } else if (event === "SIGNED_OUT") {
        // Clean up subscription when user signs out
        await leaveSubscription();
      }
    });

    return () => {
      isMountedRef.current = false;
      authSubscription.unsubscribe();
      leaveSubscription();
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase.rpc("mark_notification_read", { notification_id: notificationId });
      await Promise.all([fetchUnreadCount(), refreshNotifications()]);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase.rpc("delete_notification", { notification_id: notificationId });
      await Promise.all([fetchUnreadCount(), refreshNotifications()]);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      await supabase.rpc("mark_all_notifications_read");
      await Promise.all([fetchUnreadCount(), refreshNotifications()]);
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
      await Promise.all([fetchUnreadCount(), refreshNotifications()]);
    } catch (error) {
      console.error("Error deleting all notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDropdownOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !hasLoadedNotifications) {
      fetchNotifications();
    }
  };

  const getNotificationIcon = (type: string) => {
    return type in NOTIFICATION_ICONS
      ? NOTIFICATION_ICONS[type as keyof typeof NOTIFICATION_ICONS]
      : "🔔";
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
    <DropdownMenu open={isOpen} onOpenChange={handleDropdownOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {safeUnreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {safeUnreadCount > 99 ? "99+" : safeUnreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-4">
          <h4 className="font-semibold">Notifications</h4>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={isLoading || safeUnreadCount === 0}
                className="text-xs"
              >
                <Check className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={deleteAllNotifications}
                disabled={isLoading}
                className="text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Clear all
              </Button>
            </div>
          )}
        </div>
        <Separator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => {
              const link = getNotificationLink(notification);
              const icon = getNotificationIcon(notification.type);
              const isUnread = notification.status === "UNREAD";

              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex cursor-pointer flex-col items-start gap-2 p-4 ${
                    isUnread ? "bg-muted/50" : ""
                  }`}
                  onClick={() => {
                    if (link != null) {
                      window.location.href = link;
                    }
                    if (isUnread) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex w-full items-start justify-between">
                    <div className="flex flex-1 items-start gap-3">
                      <span className="text-lg">{icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{notification.title}</p>
                          {isUnread && (
                            <div className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
