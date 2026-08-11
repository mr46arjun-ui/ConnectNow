import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function EmailVerification() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    // Get email from URL params or localStorage
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      toast.error("Please enter the verification code");
      return;
    }
    setLoading(true);
    try {
      // TODO: Call API to verify email
      toast.success("Email verified successfully!");
      setVerified(true);
      setTimeout(() => setLocation("/dashboard"), 2000);
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      // TODO: Call API to resend verification code
      toast.success("Verification code sent to your email");
      setResendCountdown(60);
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900/50 border-purple-500/20">
        <div className="p-8">
          {!verified ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <Mail className="w-12 h-12 text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Verify Email</h1>
                <p className="text-gray-400">
                  We've sent a verification code to {email || "your email"}
                </p>
              </div>

              {/* Verification Form */}
              <form onSubmit={handleVerify} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.slice(0, 6))}
                    maxLength={6}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-white placeholder:text-gray-500 text-center text-2xl tracking-widest focus:outline-none focus:border-purple-500/60"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter the 6-digit code from your email
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 rounded-lg transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Email"
                  )}
                </Button>
              </form>

              {/* Resend Code */}
              <div className="text-center mt-6">
                <p className="text-gray-400 text-sm mb-3">Didn't receive the code?</p>
                <Button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCountdown > 0 || loading}
                  className="text-purple-400 hover:text-purple-300 font-semibold text-sm bg-transparent hover:bg-transparent"
                >
                  {resendCountdown > 0
                    ? `Resend in ${resendCountdown}s`
                    : "Resend Code"}
                </Button>
              </div>

              {/* Help Text */}
              <div className="mt-8 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-300">
                      Check your spam folder if you don't see the email
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center space-y-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
                  <p className="text-gray-400">
                    Your email has been verified successfully. Redirecting to dashboard...
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
