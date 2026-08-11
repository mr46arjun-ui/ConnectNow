import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Home as HomeIcon,
  MessageSquare,
  Users,
  LayoutGrid as Grid,
  Shield,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavigationLayoutProps {
  children: ReactNode;
  activeTab?: "rooms" | "messages" | "people" | "apps" | "admin";
}

export default function NavigationLayout({ children, activeTab = "rooms" }: NavigationLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { data: unreadCount } = trpc.notifications.getUnreadCount.useQuery(
    undefined,
    { enabled: Boolean(user) }
  );

  const isAdmin = user?.role === "admin" || user?.role === "moderator";

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const navItems = [
    {
      id: "rooms",
      label: "ROOMS",
      icon: HomeIcon,
      path: "/rooms",
    },
    {
      id: "messages",
      label: "MESSAGES",
      icon: MessageSquare,
      path: "/messages",
      badge: unreadCount ? String(unreadCount) : undefined,
    },
    {
      id: "people",
      label: "PEOPLE",
      icon: Users,
      path: "/friends",
    },
    {
      id: "apps",
      label: "APPS",
      icon: Grid,
      path: "/apps",
    },
    ...(isAdmin
      ? [
          {
            id: "admin",
            label: "ADMIN",
            icon: Shield,
            path: "/admin-dashboard",
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 sm:pb-0">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => setLocation("/rooms")}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <MessageSquare className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <span className="text-lg font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                ConnectNow
                <span className="text-[10px] lowercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-semibold border border-emerald-500/30">
                  v2.0
                </span>
              </span>
            </div>
          </div>

          {/* Desktop Top Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || location.startsWith(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => setLocation(item.path)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black text-xs tracking-wider transition-all relative ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-500 to-cyan-400 text-white shadow-md shadow-emerald-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div
                  onClick={() => setLocation("/profile")}
                  className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 cursor-pointer hover:border-emerald-500/50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-white font-black flex items-center justify-center text-xs">
                    {(user.name || user.username || "U")[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-xs font-bold text-slate-200 max-w-[100px] truncate">
                    {user.name || user.username}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs h-8 px-2.5"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setLocation("/login")}
                  className="text-slate-300 hover:text-white text-xs font-bold"
                >
                  Sign in
                </Button>
                <Button
                  size="sm"
                  onClick={() => setLocation("/signup")}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs px-4 rounded-xl shadow-md shadow-emerald-950/50"
                >
                  Sign up
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">{children}</div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-t border-slate-800 px-2 py-2 flex items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || location.startsWith(item.path);
          return (
            <button
              key={item.id}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all relative ${
                isActive ? "text-emerald-400 font-black" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-extrabold px-1 rounded-full min-w-[14px] text-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-wider uppercase font-bold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
