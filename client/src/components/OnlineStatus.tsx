import { Badge } from "@/components/ui/badge";

type StatusType = "online" | "away" | "offline" | "do-not-disturb";

interface OnlineStatusProps {
  status: StatusType;
  lastSeen?: Date;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function OnlineStatus({
  status,
  lastSeen,
  showLabel = true,
  size = "md",
}: OnlineStatusProps) {
  const getStatusColor = () => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "do-not-disturb":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "online":
        return "Online";
      case "away":
        return "Away";
      case "do-not-disturb":
        return "Do Not Disturb";
      default:
        return "Offline";
    }
  };

  const getLastSeenText = () => {
    if (!lastSeen) return "";
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return lastSeen.toLocaleDateString();
  };

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} ${getStatusColor()} rounded-full`} />
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-300">
            {getStatusLabel()}
          </span>
          {status === "offline" && lastSeen && (
            <span className="text-xs text-gray-500">
              Last seen {getLastSeenText()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Badge variant for online status
export function OnlineStatusBadge({
  status,
  className,
}: {
  status: StatusType;
  className?: string;
}) {
  const getVariant = () => {
    switch (status) {
      case "online":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "away":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "do-not-disturb":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getLabel = () => {
    switch (status) {
      case "online":
        return "🟢 Online";
      case "away":
        return "🟡 Away";
      case "do-not-disturb":
        return "🔴 DND";
      default:
        return "⚫ Offline";
    }
  };

  return (
    <Badge className={`${getVariant()} border ${className}`}>
      {getLabel()}
    </Badge>
  );
}

// Animated online indicator
export function AnimatedOnlineIndicator() {
  return (
    <div className="relative w-3 h-3">
      <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse" />
      <div className="absolute inset-1 bg-green-400 rounded-full" />
    </div>
  );
}
