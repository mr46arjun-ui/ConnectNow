import { useAuth } from "@/_core/hooks/useAuth";
import RandomChatExperience from "@/components/RandomChatExperience";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function RandomChat() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [loading, navigate, user]);

  if (loading || !user) return null;

  return (
    <RandomChatExperience
      mode="authenticated"
      backPath="/dashboard"
      backLabel="Dashboard"
    />
  );
}
