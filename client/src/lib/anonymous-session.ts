const ANONYMOUS_SESSION_KEY = "connectnow-anonymous-mode";

type AnonymousSession = {
  startedAt: number;
  username?: string;
};

export function startAnonymousSession(customUsername?: string) {
  const cleanName = customUsername?.trim();
  const username = cleanName || `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
  const session: AnonymousSession = { startedAt: Date.now(), username };
  localStorage.setItem(ANONYMOUS_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getAnonymousSession(): AnonymousSession | null {
  if (typeof window === "undefined") return null;

  try {
    const value = localStorage.getItem(ANONYMOUS_SESSION_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<AnonymousSession>;
    return typeof parsed.startedAt === "number"
      ? { startedAt: parsed.startedAt, username: parsed.username }
      : null;
  } catch {
    return null;
  }
}

export function clearAnonymousSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ANONYMOUS_SESSION_KEY);
  }
}
