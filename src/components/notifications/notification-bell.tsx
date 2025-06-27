"use client";

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

// Global channel tracking to prevent duplicate subscriptions
const activeChannels = new Set<string>();

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedNotifications, setHasLoadedNotifications] = useState(false);

  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const channelIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchUnreadCount = async () => {
    try {
      const { data: unreadCountData } = await supabase.rpc("get_unread_notification_count");
      setUnreadCount(Number(unreadCountData ?? 0));
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
    }
  };

  const fetchNotifications = async () => {
    if (hasLoadedNotifications) return; // Don't refetch if already loaded

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

  const cleanupChannel = () => {
    if (channelRef.current != null && channelIdRef.current != null) {
      try {
        supabase.removeChannel(channelRef.current);
        activeChannels.delete(channelIdRef.current);
      } catch (error) {
        console.error("Error removing channel:", error);
      }
      channelRef.current = null;
      channelIdRef.current = null;
    }
  };

  const setupChannel = (userId: string) => {
    // Clean up any existing channel first
    cleanupChannel();

    // Create a unique channel ID for this user and tab
    const channelId = `notifications-${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Check if this channel is already active globally
    if (activeChannels.has(channelId)) {
      console.warn("Channel already active, skipping subscription");
      return;
    }

    try {
      const channel = supabase
        .channel(channelId)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "synapse",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            // Only refresh unread count when notifications change
            fetchUnreadCount();
            // If notifications are currently loaded, refresh them too
            if (hasLoadedNotifications) {
              refreshNotifications();
            }
          }
        )
        .subscribe((status) => {
          if (status === "CLOSED" && isMountedRef.current) {
            // Remove from active channels when closed
            activeChannels.delete(channelId);
            channelRef.current = null;
            channelIdRef.current = null;

            // Only retry if component is still mounted
            setTimeout(() => {
              if (isMountedRef.current) {
                setupChannel(userId);
              }
            }, 2000);
          }
        });

      // Store references and mark as active
      channelRef.current = channel;
      channelIdRef.current = channelId;
      activeChannels.add(channelId);
    } catch (error) {
      console.error("Error setting up notification channel:", error);
      activeChannels.delete(channelId);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Set up auth state listener to handle subscription properly
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (
        (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
        session?.user != null &&
        isMountedRef.current
      ) {
        // Wait a bit for the session to be fully established
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setupChannel(session.user.id);
      }
    });

    return () => {
      isMountedRef.current = false;
      authSubscription.unsubscribe();
      cleanupChannel();
    };
  }, [hasLoadedNotifications]);

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
