import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, AtSign, MessageSquare, Shield } from "lucide-react";
import { useLocation } from "wouter";

type ActiveUsersDesktopPanelProps = {
  onTagUser?: (username: string) => void;
  className?: string;
};

const avatarColors = [
  "from-emerald-500 to-cyan-500",
  "from-purple-600 to-pink-500",
  "from-blue-500 to-indigo-600",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-600",
];

export function ActiveUsersDesktopPanel({ onTagUser, className = "" }: ActiveUsersDesktopPanelProps) {
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { data: onlineUsers, isLoading } = trpc.admin.getOnlineUsers.useQuery(undefined, {
    refetchInterval: 10000,
    enabled: Boolean(currentUser),
  });

  return (
    <div className={`hidden lg:flex flex-col w-80 shrink-0 border-l border-slate-800 bg-slate-900/90 backdrop-blur-md p-4 space-y-4 h-full rounded-2xl ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Users className="w-5 h-5 text-emerald-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <h3 className="font-bold text-white text-base">Active Users</h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          {onlineUsers?.length || 0} Online
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-2 rounded-lg bg-slate-950">
                <div className="w-9 h-9 rounded-full bg-slate-800" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-slate-800 rounded w-24" />
                  <div className="h-2 bg-slate-800/60 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : onlineUsers && onlineUsers.length > 0 ? (
          onlineUsers.map((user, idx) => {
            const handle = user.username || `user${user.id}`;
            const isMe = currentUser?.id === user.id;
            const gradient = avatarColors[idx % avatarColors.length];

            return (
              <Card
                key={user.id}
                className="bg-slate-950 border-slate-800 hover:border-emerald-500/40 transition-all p-2.5 flex items-center justify-between group hover:bg-slate-850 rounded-xl"
              >
                <div
                  className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                  onClick={() => onTagUser?.(handle)}
                  title={`Click to tag @${handle} in chat`}
                >
                  <div className="relative shrink-0">
                    <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white font-black text-sm shadow`}>
                      {(user.name || handle).charAt(0).toUpperCase()}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-white text-sm font-bold truncate group-hover:text-emerald-400 transition-colors">
                        {user.name || handle}
                      </p>
                      {user.role === "admin" && (
                        <span title="Admin"><Shield className="w-3.5 h-3.5 text-rose-400 shrink-0" /></span>
                      )}
                      {user.role === "moderator" && (
                        <span title="Staff"><Shield className="w-3.5 h-3.5 text-purple-400 shrink-0" /></span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs truncate">@{handle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  {onTagUser && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-lg"
                      onClick={() => onTagUser(handle)}
                      title={`Tag @${handle}`}
                    >
                      <AtSign className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {!isMe && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 rounded-lg"
                      onClick={() => setLocation("/messages")}
                      title={`Direct chat with @${handle}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        ) : (
          <p className="text-xs text-slate-500 text-center py-6">No online users right now</p>
        )}
      </div>
    </div>
  );
}
