import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { startAnonymousSession } from "@/lib/anonymous-session";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  EyeOff,
  LogIn,
  MessageCircle,
  UserRound,
  UserCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useLocation } from "wouter";

export default function GuestLogin() {
  const [, navigate] = useLocation();
  const [guestUsername, setGuestUsername] = useState("");
  const utils = trpc.useUtils();
  const startGuest = trpc.auth.startGuest.useMutation();

  const trimmedUsername = guestUsername.trim();
  const { data: availability, isFetching } = trpc.auth.checkUsernameAvailability.useQuery(
    { username: trimmedUsername },
    { enabled: Boolean(trimmedUsername.length >= 2) }
  );

  const isUnavailable = trimmedUsername.length >= 2 && availability && !availability.available;

  const continueAnonymously = async () => {
    if (isUnavailable) return;
    try {
      await startGuest.mutateAsync({ username: trimmedUsername || undefined });
      startAnonymousSession(trimmedUsername || undefined);
      await utils.auth.me.invalidate();
      navigate("/dashboard");
    } catch {
      // The mutation error is rendered below.
    }
  };

  return (
    <main className="min-h-[100dvh] bg-slate-950 text-slate-100 px-4 py-6 sm:flex sm:items-center sm:py-10">
      {/* Top glow accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[400px] bg-[radial-gradient(circle_at_top,_rgba(178,34,34,0.22),_transparent_70%)]" />

      <div className="mx-auto w-full max-w-md relative z-10">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-slate-300 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </button>

        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-600 shadow-lg shadow-emerald-950/50 text-white font-black">
            <UserRound className="h-7 w-7 fill-current" />
          </div>
          <h1 className="text-3xl font-black text-white">Continue as Guest</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Choose a pseudonymous guest identity that stays available across browser sessions.
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/90 p-5 shadow-2xl backdrop-blur sm:p-7 space-y-4 rounded-2xl">
          <div>
            <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1.5 block">
              Choose your Unique Guest Username
            </label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              <Input
                value={guestUsername}
                onChange={e => setGuestUsername(e.target.value)}
                placeholder="e.g. Monika, Alex, CyberGuest"
                className={`pl-10 bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500 rounded-xl ${
                  isUnavailable ? "border-rose-500/80 text-rose-200" : ""
                }`}
              />
            </div>

            {/* Validation Feedback Badge */}
            {trimmedUsername.length >= 2 && (
              <div className="mt-2 text-xs">
                {isFetching ? (
                  <span className="text-emerald-400 animate-pulse">Checking username uniqueness...</span>
                ) : availability?.available ? (
                  <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Username "@{trimmedUsername}" is unique & available!
                  </span>
                ) : isUnavailable ? (
                  <span className="text-rose-400 flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {availability?.reason || "This username is already taken to protect identity."}
                  </span>
                ) : null}
              </div>
            )}

            {!trimmedUsername && (
              <p className="text-xs text-slate-400 mt-1">
                If left blank, a guaranteed unique handle (e.g. Guest_8291) will be assigned.
              </p>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <EyeOff className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <h2 className="font-bold text-white text-sm">Unique Identity Safeguard</h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Usernames must be unique across all visitors to prevent impersonation.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
              <div>
                <h2 className="font-bold text-white text-sm">
                  Persistent Guest Access
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Create groups, save messages and connections, and use eligible live calls without registering.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="button"
            disabled={Boolean(isUnavailable) || startGuest.isPending}
            onClick={continueAnonymously}
            className="mt-6 min-h-12 w-full bg-emerald-500 hover:bg-emerald-400 text-white text-base font-black rounded-xl shadow-lg shadow-emerald-950/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="mr-2 h-5 w-5" />
            {startGuest.isPending
              ? "Creating persistent guest session…"
              : `Enter as ${trimmedUsername || "Guest"}`}
          </Button>

          {startGuest.error ? (
            <p className="mt-3 text-center text-xs font-semibold text-rose-300">
              {startGuest.error.message}
            </p>
          ) : null}

          <p className="mt-4 text-center text-xs leading-5 text-slate-500">
            Your guest identity, groups, messages, friends, and eligible calls
            are saved on this browser for one year.
          </p>
        </Card>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-5 min-h-11 w-full text-center text-sm font-bold text-emerald-400 hover:text-emerald-300"
        >
          Sign in or create an account instead
        </button>
      </div>
    </main>
  );
}
