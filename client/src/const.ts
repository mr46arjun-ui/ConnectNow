export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthEnabled = import.meta.env.VITE_ENABLE_OAUTH === "true";
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL?.trim();
  const appId = import.meta.env.VITE_APP_ID?.trim();

  if (
    !oauthEnabled ||
    !oauthPortalUrl ||
    !appId ||
    typeof window === "undefined"
  ) {
    return "/login";
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const url = new URL("/app-auth", oauthPortalUrl);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch {
    console.warn("[OAuth] Invalid VITE_OAUTH_PORTAL_URL; using local login");
    return "/login";
  }
};
