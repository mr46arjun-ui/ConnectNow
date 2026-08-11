import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  clearAnonymousSession,
  getAnonymousSession,
} from "@/lib/anonymous-session";
import {
  ArrowRight,
  LogOut,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AnonymousDashboard() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      navigate("/dashboard", { replace: true });
      return;
    }
    if (!getAnonymousSession()) {
      navigate("/guest-login", { replace: true });
      return;
    }
    setIsReady(true);
  }, [loading, navigate, user]);

  if (!isReady) return null;

  const leave = () => {
    clearAnonymousSession();
    navigate("/");
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">ConnectNow</p>
              <p className="truncate text-xs text-purple-200">Anonymous mode</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={leave}
            className="min-h-11 border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Leave
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
            <ShieldCheck className="h-4 w-4" />
            No registered account required
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">
            Start a private or group conversation.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            Join 1-on-1 random chats or participate in public group chat rooms directly as a guest!
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Card className="group border-purple-400/20 bg-gradient-to-br from-purple-600/80 to-fuchsia-700/70 p-6 shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-white">
              1-on-1 Random Chat
            </h2>
            <p className="mt-2 leading-6 text-purple-100">
              Match with another online visitor for temporary 1-on-1 text conversation.
            </p>
            <Button
              type="button"
              onClick={() => navigate("/guest/chat")}
              className="mt-7 min-h-12 w-full bg-red-800 font-semibold text-purple-700 hover:bg-purple-50"
            >
              Find 1-on-1 Match
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Card>

          <Card className="group border-indigo-400/20 bg-gradient-to-br from-indigo-600/80 to-purple-800/70 p-6 shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-white">
              Group Chat Rooms
            </h2>
            <p className="mt-2 leading-6 text-indigo-100">
              Join public group chat rooms, chat in real-time, and participate in group calls.
            </p>
            <Button
              type="button"
              onClick={() => navigate("/groups")}
              className="mt-7 min-h-12 w-full bg-red-800 font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Browse Group Rooms
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Card>

          <Card className="border-white/10 bg-slate-900/60 p-6 md:col-span-2 lg:col-span-1">
            <h2 className="text-lg font-semibold text-white">
              Want saved history?
            </h2>
            <p className="mt-2 leading-6 text-slate-400">
              Create an account later when you want verified identity and account recovery. Guest-created groups and conversations already persist in this browser.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 md:grid-cols-1">
              <Button
                type="button"
                onClick={() => navigate("/signup")}
                className="min-h-11 bg-purple-600 text-white hover:bg-purple-500"
              >
                Create account
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/login")}
                className="min-h-11 border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                Sign in
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
