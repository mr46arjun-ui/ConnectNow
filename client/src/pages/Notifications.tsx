import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, Check, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Notifications() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: notifications, isLoading } =
    trpc.notifications.getNotifications.useQuery({
      limit: 100,
    });

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation();
  const utils = trpc.useUtils();

  if (!user) {
    setLocation("/");
    return null;
  }

  const handleMarkAsRead = async (notificationId: number) => {
    await markAsReadMutation.mutateAsync({ notificationId });
    await Promise.all([
      utils.notifications.getNotifications.invalidate(),
      utils.notifications.getUnreadCount.invalidate(),
    ]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "friend_request":
        return "👥";
      case "message":
        return "💬";
      case "system":
        return "⚙️";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "friend_request":
        return "border-blue-500/20 bg-blue-500/5";
      case "message":
        return "border-purple-500/20 bg-purple-500/5";
      case "system":
        return "border-gray-500/20 bg-gray-500/5";
      default:
        return "border-purple-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-purple-400" />
            <span className="text-xl font-bold text-white">Notifications</span>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/dashboard")}
            className="text-gray-300 border-gray-500/50 hover:bg-gray-500/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">
            Loading notifications...
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification: any) => (
              <Card
                key={notification.id}
                className={`border backdrop-blur p-4 transition-all hover:shadow-lg ${getNotificationColor(
                  notification.type
                )}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-grow">
                    <span className="text-2xl mt-1">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-grow">
                      <p className="text-white font-semibold">
                        {notification.title}
                      </p>
                      {notification.content && (
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                          {notification.content}
                        </p>
                      )}
                      <p className="text-gray-500 text-xs mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {!notification.isRead && (
                      <Button
                        onClick={() => handleMarkAsRead(notification.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    {notification.relatedItemId &&
                    (notification.title.startsWith("You were mentioned in") ||
                      notification.title.startsWith("Invitation to") ||
                      notification.title.startsWith("Group ")) ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          setLocation(
                            notification.title.startsWith(
                              "You were mentioned in"
                            ) || notification.title.startsWith("Group ")
                              ? `/groups/${notification.relatedItemId}`
                              : "/groups"
                          )
                        }
                        className="bg-purple-600 text-white hover:bg-purple-500"
                      >
                        Open
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-800/50 backdrop-blur border border-purple-500/20 p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No notifications</p>
            <p className="text-gray-500 text-sm">
              You're all caught up! New notifications will appear here.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
