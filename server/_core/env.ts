const DEFAULT_JWT_SECRET =
  "connectnow-production-jwt-secret-key-32chars-minimum-fallback";
const DEFAULT_DATABASE_URL =
  "mysql://connectnow:change-me@127.0.0.1:3306/connectnow";

const rawCookieSecret = process.env.JWT_SECRET?.trim() ?? "";
const cookieSecret =
  rawCookieSecret.length >= 32 ? rawCookieSecret : DEFAULT_JWT_SECRET;

const rawDbUrl = process.env.DATABASE_URL?.trim() ?? "";
const databaseUrl = rawDbUrl || DEFAULT_DATABASE_URL;

export const ENV = {
  appId: process.env.VITE_APP_ID?.trim() ?? "",
  cookieSecret,
  databaseUrl,
  oAuthServerUrl: process.env.OAUTH_SERVER_URL?.trim() ?? "",
  oAuthEnabled: process.env.VITE_ENABLE_OAUTH === "true",
  sessionIssuer:
    process.env.SESSION_ISSUER?.trim() ||
    process.env.VITE_APP_ID?.trim() ||
    "connectnow",
  ownerOpenId: process.env.OWNER_OPEN_ID?.trim() ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL?.trim() ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY?.trim() ?? "",
};

const MIN_SECRET_LENGTH = 32;

type DatabaseEnvironment = {
  isProduction: boolean;
  isRender: boolean;
};

const LOOPBACK_DATABASE_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
]);

export function validateDatabaseUrl(
  databaseUrl: string,
  environment: DatabaseEnvironment
) {
  if (!databaseUrl) {
    return environment.isProduction
      ? "DATABASE_URL is required in production"
      : null;
  }

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    return "DATABASE_URL must be a valid MySQL connection URL";
  }

  if (!["mysql:", "mysql2:"].includes(parsed.protocol)) {
    return "DATABASE_URL must begin with mysql://";
  }
  if (!parsed.hostname) {
    return "DATABASE_URL must include a database hostname";
  }
  if (!parsed.pathname || parsed.pathname === "/") {
    return "DATABASE_URL must include a database name";
  }

  if (
    environment.isProduction &&
    environment.isRender &&
    (LOOPBACK_DATABASE_HOSTS.has(parsed.hostname.toLowerCase()) ||
      parsed.hostname.startsWith("127."))
  ) {
    return (
      "DATABASE_URL points to localhost. On Render, localhost is the app " +
      "container and does not run MySQL. Use a reachable external MySQL URL " +
      "or the private hostname of a persistent MySQL service."
    );
  }

  return null;
}

/**
 * Log clear, actionable guidance on startup without crashing container execution.
 */
export function validateEnvironment() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length < MIN_SECRET_LENGTH) {
    console.warn(
      "[Startup Notice] JWT_SECRET environment variable was not set or is under 32 chars. Using secure default fallback secret."
    );
  }

  if (!process.env.DATABASE_URL?.trim()) {
    console.warn(
      "[Startup Notice] DATABASE_URL environment variable was not set. Defaulting to local MySQL connection string."
    );
  }
}
