import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Mail, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Two-step password reset:
 * 1. Enter email -> requestPasswordReset mutation logs/returns the token in dev.
 * 2. Paste the token + new password -> resetPassword mutation completes.
 *
 * In production, email delivery handles step 1 -> step 2 transition.
 */
export default function PasswordReset() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const requestMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setStep("reset");
    },
    onError: (err) => toast.error(err.message || "Failed to request reset"),
  });

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Password updated");
      setLocation("/login");
    },
    onError: (err) => toast.error(err.message || "Failed to reset password"),
  });

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email is required");
      return;
    }
    setLoading(true);
    try {
      await requestMutation.mutateAsync({ email });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPassword || !confirm) {
      toast.error("All fields are required");
      return;
    }
    if (newPassword !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await resetMutation.mutateAsync({ token, newPassword });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900/50 border-purple-500/20">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-white mb-2 text-center">
            Reset your password
          </h1>
          <p className="text-gray-400 text-center mb-8 text-sm">
            {step === "request"
              ? "We'll send a reset link to your email"
              : "Paste the token from the email and choose a new password"}
          </p>

          {step === "request" ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
                  <Input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-purple-500/30 text-white placeholder:text-gray-500"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reset token
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Paste the token from the email"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="bg-slate-800/50 border-purple-500/30 text-white placeholder:text-gray-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
                  <Input
                    type="password"
                    required
                    placeholder="8+ chars, letters and digits"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-purple-500/30 text-white placeholder:text-gray-500"
                    disabled={loading}
                    autoComplete="new-password"
                    minLength={8}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm password
                </label>
                <Input
                  type="password"
                  required
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="bg-slate-800/50 border-purple-500/30 text-white placeholder:text-gray-500"
                  disabled={loading}
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Update password"
                )}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-400">
            Remembered it?{" "}
            <button
              type="button"
              onClick={() => setLocation("/login")}
              className="text-purple-400 hover:text-purple-300 underline"
            >
              Back to sign in
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
