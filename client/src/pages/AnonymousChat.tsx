import RandomChatExperience from "@/components/RandomChatExperience";
import { getAnonymousSession } from "@/lib/anonymous-session";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function AnonymousChat() {
  const [, navigate] = useLocation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!getAnonymousSession()) {
      navigate("/guest-login", { replace: true });
      return;
    }
    setIsReady(true);
  }, [navigate]);

  if (!isReady) return null;

  return (
    <RandomChatExperience
      mode="anonymous"
      backPath="/guest"
      backLabel="Guest home"
    />
  );
}
