"use client";

import { Bell, Check, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { Separator } from "@components/ui/separator";
import { createClient } from "@lib/supabase/client";

import { NOTIFICATION_ICONS } from "../../types/notification";
import type { Notification } from "../../types/notification";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  const fetchUnreadCount = async () => {
    try {
      const { data: unreadCountData } = await supabase.rpc("get_unread_notification_count");
      setUnreadCount(Number(unreadCountData ?? 0));
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
    }
  };

  const fetchNotifications = async () => {
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

  const refreshNotifications = async () => {
    await Promise.all([fetchUnreadCount(), fetchNotifications()]);
  };

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase.rpc("mark_notification_read", { notification_id: notificationId });
      await refreshNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase.rpc("delete_notification", { notification_id: notificationId });
      await refreshNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setIsLoading(true);
      await supabase.rpc("mark_all_notifications_read");
      await refreshNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      setIsLoading(true);
      await supabase.rpc("delete_all_notifications");
      await refreshNotifications();
    } catch (error) {
      console.error("Error deleting all notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDropdownOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      fetchNotifications();
    }
  };

  const getNotificationIcon = (type: string) => {
    return (
      NOTIFICATION_ICONS[type as keyof typeof NOTIFICATION_ICONS] ?? NOTIFICATION_ICONS.GENERAL
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleDropdownOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Notifications</p>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="max-h-96 w-80 overflow-y-auto">
        <div className="flex items-center justify-between p-2">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={isLoading || unreadCount === 0}
              className="h-6 px-2 text-xs"
            >
              Mark all read
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={deleteAllNotifications}
              disabled={isLoading || notifications.length === 0}
              className="h-6 px-2 text-xs text-destructive hover:text-destructive"
            >
              Clear all
            </Button>
          </div>
        </div>

        <Separator />

        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((notification) => {
              const icon = getNotificationIcon(notification.type);

              return (
                <div key={notification.id} className="rounded-md p-2 hover:bg-muted">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-lg">{icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{notification.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {notification.status === "UNREAD" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
