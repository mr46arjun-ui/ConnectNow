import type { CookieOptions, Request } from "express";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME } from "@shared/const";

/**
 * Determine whether the request is HTTPS. We allow direct HTTPS or a single
 * trusted proxy hop that explicitly forwards `X-Forwarded-Proto: https`. For
 * multi-hop deployments, set `TRUST_PROXY_HOPS` to the number of hops.
 */
export function isSecureRequest(req: Request): boolean {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  // If we're behind N trusted proxies, take the *first* hop's value (closest
  // to the client) and only trust it if it is HTTPS. Otherwise refuse.
  const hops = Number(process.env.TRUST_PROXY_HOPS ?? 1);
  const relevant = protoList.slice(0, hops).map(p => p.trim().toLowerCase());
  return relevant.length > 0 && relevant.every(p => p === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isSecureRequest(req);

  return {
    httpOnly: true,
    path: "/",
    // OAuth callbacks use a top-level GET, so Lax supports that flow while
    // retaining CSRF protection for state-changing cross-site requests.
    sameSite: "lax",
    secure,
  };
}

/**
 * Parse the session cookie out of a cookie header (string or undefined).
 * Used by Socket.IO middleware which doesn't get an Express Request by default.
 */
export function parseSessionCookie(
  cookieHeader: string | undefined
): string | undefined {
  if (!cookieHeader) return undefined;
  const parsed = parseCookieHeader(cookieHeader);
  return parsed[COOKIE_NAME];
}
