import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const login = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Welcome back");
      navigate("/dashboard");
    },
    onError: error => {
      toast.error(error.message || "Unable to sign in");
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      toast.error("Enter your email and password");
      return;
    }

    try {
      await login.mutateAsync({ email: normalizedEmail, password });
    } catch {
      // The mutation callback presents the safe server message.
    }
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 px-4 py-5 sm:flex sm:items-center sm:py-10">
      <div className="mx-auto w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </button>

        <Card className="border-white/10 bg-slate-900/70 shadow-2xl backdrop-blur">
          <div className="p-5 sm:p-8">
            <h1 className="text-center text-3xl font-bold text-white">
              Welcome back
            </h1>
            <p className="mt-2 text-center text-sm leading-6 text-slate-400">
              Sign in to your ConnectNow account.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Email
                </span>
                <span className="relative block">
                  <Mail className="pointer-events-none absolute left-3.5 top-3.5 z-10 h-5 w-5 text-purple-300" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    disabled={login.isPending}
                    autoComplete="email"
                    className="min-h-12 border-white/10 bg-slate-800/80 pl-11 text-white placeholder:text-slate-500"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Password
                </span>
                <span className="relative block">
                  <Lock className="pointer-events-none absolute left-3.5 top-3.5 z-10 h-5 w-5 text-purple-300" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    placeholder="Your password"
                    disabled={login.isPending}
                    autoComplete="current-password"
                    maxLength={128}
                    className="min-h-12 border-white/10 bg-slate-800/80 pl-11 pr-12 text-white placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(value => !value)}
                    disabled={login.isPending}
                    className="absolute right-1 top-0 flex h-12 w-11 items-center justify-center text-slate-400 hover:text-white"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </span>
              </label>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate("/password-reset")}
                  className="min-h-11 text-sm text-purple-300 hover:text-purple-200"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={login.isPending}
                className="min-h-12 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-base font-semibold text-white hover:from-purple-500 hover:to-pink-500"
              >
                {login.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="mt-6 grid gap-3 text-center text-sm">
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="min-h-11 text-slate-400 hover:text-white"
              >
                New to ConnectNow?{" "}
                <span className="font-medium text-purple-300">
                  Create account
                </span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/guest-login")}
                className="min-h-11 text-purple-300 hover:text-purple-200"
              >
                Continue anonymously instead
              </button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
