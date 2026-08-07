import "dotenv/config";
import express from "express";
import { createServer } from "http";
import helmet from "helmet";
import cron from "node-cron";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "./appRouter";
import { createContext } from "./context";
import { serveStatic } from "./static";
import { initializeSocket } from "../socket";
import { cleanupRateLimitBuckets } from "../security";
import { cleanupStaleGroupCalls } from "../groups";
import { rateLimitMiddleware } from "../security";
import { validateEnvironment } from "./env";
import {
  checkDatabaseReadiness,
  ensureDatabaseReady,
} from "../database-readiness";
import { registerGroupMediaRoutes } from "../group-media-upload";

async function startServer() {
  validateEnvironment();
  await ensureDatabaseReady();

  const app = express();
  const server = createServer(app);

  app.disable("x-powered-by");

  // Trust the configured number of proxy hops so req.ip / X-Forwarded-For are
  // populated correctly. Override with TRUST_PROXY=integer|true|false.
  app.set("trust proxy", process.env.TRUST_PROXY ?? 1);

  app.use(
    helmet({
      // The generated Vite document currently contains inline bootstrap data.
      // Other security headers remain enabled while CSP is configured later.
      contentSecurityPolicy: false,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));

  // Render and Docker use this endpoint for liveness checks.
  app.get("/health", (_req, res) => {
    res
      .status(200)
      .json({ ok: true, uptimeSeconds: Math.floor(process.uptime()) });
  });

  // Readiness includes a live database/schema check. Configure Render to use
  // this endpoint when database health should gate traffic.
  app.get("/ready", async (_req, res) => {
    try {
      await checkDatabaseReadiness();
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error("[Readiness] Database check failed", error);
      res.status(503).json({ ok: false, error: "Service not ready" });
    }
  });

  // Rate-limit public, auth-related paths before they reach tRPC. Finer-grained
  // limits live in handlers (per-user buckets).
  app.use("/api/oauth", rateLimitMiddleware("oauth", 20, 60_000));
  app.use("/api/auth", rateLimitMiddleware("auth", 30, 60_000));
  app.use(
    "/api/trpc/auth.login",
    rateLimitMiddleware("auth.login", 10, 60_000)
  );
  app.use(
    "/api/trpc/auth.signup",
    rateLimitMiddleware("auth.signup", 5, 60_000)
  );
  app.use(
    "/api/trpc/auth.requestPasswordReset",
    rateLimitMiddleware("auth.reset", 5, 60_000)
  );

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerGroupMediaRoutes(app);

  // Initialize Socket.IO for real-time features
  initializeSocket(server);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path }) {
        if (error.code === "INTERNAL_SERVER_ERROR") {
          console.error(`[tRPC] Internal error in ${path ?? "unknown"}`, {
            cause: error.cause ?? error,
          });
        }
      },
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number.parseInt(process.env.PORT || "3000", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(
      `PORT must be an integer between 1 and 65535; received "${process.env.PORT}"`
    );
  }

  // ========================================================================
  // BACKGROUND JOBS
  // ========================================================================
  // Hourly: reset expired in-memory rate-limit buckets.
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_CRON === "true"
  ) {
    cron.schedule("15 * * * *", async () => {
      try {
        await Promise.all([
          cleanupRateLimitBuckets(),
          cleanupStaleGroupCalls(),
        ]);
      } catch (err) {
        console.error("[Cron] Background cleanup failed:", err);
      }
    });
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
    console.log(`[Socket.IO] Real-time engine initialized`);
  });
}

startServer().catch(error => {
  console.error("[Startup] Server failed to start:", error);
  process.exitCode = 1;
});
