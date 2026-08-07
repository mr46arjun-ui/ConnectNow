import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import NavigationLayout from "@/components/NavigationLayout";
import { Card } from "@/components/ui/card";
import {
  Video,
  Mic,
  MessageCircle,
  Users,
  MessagesSquare,
  Bell,
  User,
  Shield,
  Search,
  Sparkles,
  LayoutGrid as Grid,
  Circle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: unreadCount } = trpc.notifications.getUnreadCount.useQuery(
    undefined,
    { enabled: Boolean(user) }
  );
  const isAdmin = user?.role === "admin" || user?.role === "moderator";

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login", { replace: true });
    }
  }, [loading, setLocation, user]);

  if (loading || !user) return null;

  const menuItems = [
    {
      icon: MessageCircle,
      label: "Direct Messages & Friends",
      description: "Chat with your contacts, voice notes, & instant tagging",
      path: "/messages",
      badge: "Direct Chat",
      color: "bg-slate-900 hover:bg-slate-850 border-emerald-500/30",
      accent: "bg-emerald-500 text-white",
      accentText: "text-emerald-400",
    },
    {
      icon: MessagesSquare,
      label: "Group Communities",
      description: "Join public rooms or create your own managed group",
      path: "/rooms",
      badge: "Group Rooms",
      color: "bg-slate-900 hover:bg-slate-850 border-cyan-500/30",
      accent: "bg-cyan-500 text-white",
      accentText: "text-cyan-400",
    },
    {
      icon: Grid,
      label: "Mini Apps & Games",
      description: "Draw together, watch YouTube, paste bin, & games",
      path: "/apps",
      badge: "Mini Apps",
      color: "bg-slate-900 hover:bg-slate-850 border-purple-500/30",
      accent: "bg-purple-600 text-white",
      accentText: "text-purple-400",
    },
    {
      icon: Video,
      label: "Random Video Match",
      description: "Live 1-on-1 WebRTC video conversations",
      path: "/video-chat",
      badge: "WebRTC Video",
      color: "bg-slate-900 hover:bg-slate-850 border-blue-500/30",
      accent: "bg-blue-600 text-white",
      accentText: "text-blue-400",
    },
    {
      icon: Mic,
      label: "Random Voice Match",
      description: "Live audio calls with active members",
      path: "/voice-chat",
      badge: "Voice Call",
      color: "bg-slate-900 hover:bg-slate-850 border-amber-500/30",
      accent: "bg-amber-500 text-white",
      accentText: "text-amber-400",
    },
    {
      icon: Users,
      label: "Friends List",
      description: "Add friends, accept requests, & check status",
      path: "/friends",
      badge: "Contacts",
      color: "bg-slate-900 hover:bg-slate-850 border-emerald-500/30",
      accent: "bg-emerald-500 text-white",
      accentText: "text-emerald-400",
    },
    {
      icon: Bell,
      label: "Notifications",
      description: `${unreadCount || 0} unread alerts and group invites`,
      path: "/notifications",
      badge: unreadCount ? `${unreadCount} New` : "Alerts",
      color: "bg-slate-900 hover:bg-slate-850 border-rose-500/30",
      accent: "bg-rose-500 text-white",
      accentText: "text-rose-400",
    },
    {
      icon: User,
      label: "My Profile",
      description: "Update avatar, bio, and account settings",
      path: "/profile",
      badge: "Account",
      color: "bg-slate-900 hover:bg-slate-850 border-slate-700",
      accent: "bg-slate-700 text-white",
      accentText: "text-slate-300",
    },
    ...(isAdmin
      ? [
          {
            icon: Shield,
            label: "Admin & Staff Control",
            description: "Group management, staff roles, & moderation",
            path: "/admin-dashboard",
            badge: "Staff Panel",
            color: "bg-slate-900 hover:bg-slate-850 border-rose-500/40",
            accent: "bg-rose-600 text-white",
            accentText: "text-rose-400",
          },
        ]
      : []),
  ];

  const filteredItems = menuItems.filter(
    item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <NavigationLayout activeTab="rooms">
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Banner Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950/70 border border-emerald-500/40 p-6 sm:p-8 shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold">
              <Sparkles className="w-3.5 h-3.5" />
              Live Social Platform
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {user.isGuest ? "Welcome, guest" : "Welcome back"},{" "}
              {user.name || user.username}! 👋
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {user.isGuest
                ? "Your persistent guest identity can create groups, save conversations, connect with people, and use live audio/video features."
                : "Connect instantly with friends, join public community rooms, launch WebRTC video & voice calls, or play Mini Apps!"}
            </p>
          </div>

          {/* Search bar inside dashboard */}
          <div className="relative mt-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search features, group rooms, contacts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Feature Navigation Cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Circle className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />
              Quick Launch Hub
            </h2>
            <span className="text-xs text-slate-500">{filteredItems.length} features available</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredItems.map(item => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`${item.color} border p-5 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/40 group relative flex flex-col justify-between`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-11 h-11 rounded-xl ${item.accent} flex items-center justify-center font-black shadow-md`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 ${item.accentText}`}>
                        {item.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
                        {item.label}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className={`mt-6 flex items-center justify-between text-xs font-bold ${item.accentText} group-hover:underline`}>
                    <span>Open Now</span>
                    <span>→</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </NavigationLayout>
  );
}
