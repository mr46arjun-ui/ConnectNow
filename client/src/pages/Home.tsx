import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  EyeOff,
  MessageCircle,
  Sparkles,
  UserRoundPlus,
  MessagesSquare,
  LayoutGrid as Grid,
} from "lucide-react";
import { useLocation } from "wouter";

const features = [
  {
    icon: MessageCircle,
    title: "Direct Messaging & Chat",
    description:
      "Direct messaging, voice notes, live status, and instant name-based tagging.",
    color: "text-emerald-400",
  },
  {
    icon: MessagesSquare,
    title: "User-Managed Group Rooms",
    description:
      "Create public or password-protected group communities with creator-only administration.",
    color: "text-cyan-400",
  },
  {
    icon: Grid,
    title: "Mini-Apps & Games Hub",
    description:
      "Draw together live, watch YouTube, paste code snippets, or play Mini Games.",
    color: "text-purple-400",
  },
  {
    icon: EyeOff,
    title: "Custom Unique Usernames",
    description:
      "Browse anonymously with your own unique custom guest username with zero sign-up.",
    color: "text-amber-400",
  },
];

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-slate-950 text-slate-100 flex flex-col">
      {/* Glow background accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(circle_at_top,_rgba(178,34,34,0.25),_transparent_62%)]" />

      <header className="relative border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
        <nav className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex min-h-11 items-center gap-3"
            aria-label="ConnectNow home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-600 text-white shadow-lg shadow-emerald-950/50">
              <MessageCircle className="h-6 w-6 fill-current" />
            </span>
            <span className="text-xl font-black tracking-wider text-white uppercase">
              ConnectNow
            </span>
          </button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/login")}
              className="min-h-11 text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-bold"
            >
              Sign in
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/signup")}
              className="hidden min-h-11 bg-emerald-500 text-white font-black hover:bg-emerald-400 sm:inline-flex text-xs px-5 shadow-md shadow-emerald-950/50"
            >
              Create account
            </Button>
          </div>
        </nav>
      </header>

      <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] flex-1">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1 text-xs font-extrabold text-emerald-400">
            <Sparkles className="h-4 w-4" />
            Vibrant Live Chat & Mini-Apps Platform
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl text-white leading-tight">
            Connect instantly with live messaging, WebRTC video, and Mini-Apps.
          </h1>
          <p className="mt-5 max-w-2xl text-base sm:text-lg leading-8 text-slate-300">
            Create a full account to save friends & managed group rooms, or join
            instantly as a guest with your custom username.
          </p>

          <div className="mt-8 grid gap-3 sm:flex">
            <Button
              type="button"
              onClick={() => navigate("/signup")}
              className="min-h-12 bg-emerald-500 px-6 text-base font-black text-white hover:bg-emerald-400 shadow-lg shadow-emerald-950/50"
            >
              <UserRoundPlus className="mr-2 h-5 w-5" />
              Create free account
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/guest-login")}
              className="min-h-12 border-slate-800 bg-slate-900 px-6 text-base text-slate-200 hover:bg-slate-800 font-bold"
            >
              Join with Guest Username
              <ArrowRight className="ml-2 h-4 w-4 text-emerald-400" />
            </Button>
          </div>
        </div>

        <Card className="relative border-slate-800 bg-slate-900 p-5 shadow-2xl backdrop-blur sm:p-7 space-y-4 rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <p className="font-bold text-white text-base">
                How would you like to enter?
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Choose an option below to start chatting immediately.
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <MessageCircle className="h-5 w-5 text-emerald-400" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="flex min-h-20 w-full items-center gap-4 rounded-2xl border border-emerald-500/30 bg-slate-950 p-4 text-left transition hover:border-emerald-500 hover:bg-slate-850"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white font-black">
              <UserRoundPlus className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-bold text-white">
                Full Member Account
              </span>
              <span className="mt-0.5 block text-xs text-slate-400">
                Friends list, direct chat, user-managed group admin rights,
                voice notes, & WebRTC calls.
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/guest-login")}
            className="flex min-h-20 w-full items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-left transition hover:border-slate-700 hover:bg-slate-850"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-200">
              <EyeOff className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-bold text-white">
                Guest Mode with Unique Username
              </span>
              <span className="mt-0.5 block text-xs text-slate-400">
                Type your own unique nickname & enter live anonymous chat with
                zero sign-up.
              </span>
            </span>
          </button>
        </Card>
      </section>

      <section className="relative border-y border-slate-800 bg-slate-900/60">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 md:py-16">
          {features.map(feature => (
            <Card
              key={feature.title}
              className="border-slate-800 bg-slate-900 p-5 rounded-2xl space-y-2"
            >
              <feature.icon className={`h-6 w-6 ${feature.color}`} />
              <h2 className="text-base font-bold text-white">
                {feature.title}
              </h2>
              <p className="text-xs leading-6 text-slate-400">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="relative mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© 2026 ConnectNow • Live Social Messaging & Mini-Apps Platform</p>
        <p>End-to-End Secure Relay & Real-time WebRTC</p>
      </footer>
    </main>
  );
}
