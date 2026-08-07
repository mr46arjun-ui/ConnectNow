import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bell, X, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: "friend-request" | "message" | "system" | "call";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationCenterProps {
  notifications?: Notification[];
  unreadCount?: number;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAction?: (id: string) => void;
}

export default function NotificationCenter({
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onDelete,
  onAction,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "friend-request":
        return "👥";
      case "message":
        return "💬";
      case "call":
        return "📞";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "friend-request":
        return "border-blue-500/30 bg-blue-500/10";
      case "message":
        return "border-purple-500/30 bg-purple-500/10";
      case "call":
        return "border-green-500/30 bg-green-500/10";
      default:
        return "border-gray-500/30 bg-gray-500/10";
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="relative h-10 w-10 hover:bg-slate-800"
        onClick={() => setOpen(true)}
      >
        <Bell className="w-5 h-5 text-gray-400" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-600 text-white text-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:w-96 bg-slate-900 border-purple-500/20">
          <SheetHeader>
            <SheetTitle className="text-white flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge className="bg-purple-600 text-white">{unreadCount}</Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-3 mt-6 max-h-[calc(100vh-120px)] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${getNotificationColor(
                    notification.type
                  )} ${!notification.read ? "bg-opacity-20" : "bg-opacity-10"}`}
                  onClick={() => {
                    if (!notification.read) {
                      onMarkAsRead?.(notification.id);
                    }
                  }}
                >
                  <div className="flex gap-3">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-white text-sm">
                          {notification.title}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(notification.id);
                          }}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">{notification.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.timestamp)}
                        </span>
                        {notification.actionLabel && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAction?.(notification.id);
                            }}
                          >
                            {notification.actionLabel}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
