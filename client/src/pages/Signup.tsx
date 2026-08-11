import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Signup() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const signup = trpc.auth.signup.useMutation({
    onSuccess: () => {
      toast.success("Your account is ready");
      navigate("/dashboard");
    },
    onError: error => {
      toast.error(error.message || "Unable to create your account");
    },
  });

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    if (
      !normalizedEmail ||
      !normalizedUsername ||
      !password ||
      !confirmPassword
    ) {
      toast.error("Please complete every field");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("The passwords do not match");
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      toast.error("Use at least one letter and one number");
      return;
    }

    try {
      await signup.mutateAsync({
        email: normalizedEmail,
        password,
        username: normalizedUsername,
        name: normalizedUsername,
      });
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
              Create your account
            </h1>
            <p className="mt-2 text-center text-sm leading-6 text-slate-400">
              One account for chats, group rooms, friends, voice, and video.
            </p>

            <form onSubmit={handleSignup} className="mt-7 space-y-4">
              <AuthField
                label="Username"
                icon={User}
                input={
                  <Input
                    type="text"
                    required
                    value={username}
                    onChange={event => setUsername(event.target.value)}
                    placeholder="Choose a username"
                    disabled={signup.isPending}
                    autoComplete="username"
                    minLength={3}
                    maxLength={32}
                    pattern="[a-zA-Z0-9_-]+"
                    className="min-h-12 border-white/10 bg-slate-800/80 pl-11 text-white placeholder:text-slate-500"
                  />
                }
              />

              <AuthField
                label="Email"
                icon={Mail}
                input={
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    disabled={signup.isPending}
                    autoComplete="email"
                    className="min-h-12 border-white/10 bg-slate-800/80 pl-11 text-white placeholder:text-slate-500"
                  />
                }
              />

              <PasswordField
                label="Password"
                value={password}
                onChange={setPassword}
                visible={showPassword}
                onToggle={() => setShowPassword(value => !value)}
                disabled={signup.isPending}
                autoComplete="new-password"
              />

              <PasswordField
                label="Confirm password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword(value => !value)}
                disabled={signup.isPending}
                autoComplete="new-password"
              />

              <p className="text-xs leading-5 text-slate-500">
                Use 8–128 characters with at least one letter and one number.
              </p>

              <Button
                type="submit"
                disabled={signup.isPending}
                className="min-h-12 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-base font-semibold text-white hover:from-purple-500 hover:to-pink-500"
              >
                {signup.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

            <div className="mt-6 grid gap-3 text-center text-sm">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="min-h-11 text-slate-400 hover:text-white"
              >
                Already registered?{" "}
                <span className="font-medium text-purple-300">Sign in</span>
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

function AuthField({
  label,
  icon: Icon,
  input,
}: {
  label: string;
  icon: typeof User;
  input: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">
        {label}
      </span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-3.5 top-3.5 z-10 h-5 w-5 text-purple-300" />
        {input}
      </span>
    </label>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
  disabled,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  disabled: boolean;
  autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">
        {label}
      </span>
      <span className="relative block">
        <Lock className="pointer-events-none absolute left-3.5 top-3.5 z-10 h-5 w-5 text-purple-300" />
        <Input
          type={visible ? "text" : "password"}
          required
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder="Enter your password"
          disabled={disabled}
          autoComplete={autoComplete}
          minLength={8}
          maxLength={128}
          className="min-h-12 border-white/10 bg-slate-800/80 pl-11 pr-12 text-white placeholder:text-slate-500"
        />
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="absolute right-1 top-0 flex h-12 w-11 items-center justify-center text-slate-400 hover:text-white"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </span>
    </label>
  );
}
