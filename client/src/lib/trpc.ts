import { createTRPCReact, httpBatchLink, loggerLink } from "@trpc/react-query";
import { QueryClient } from "@tanstack/react-query";
import type { AppRouter } from "../../../server/_core/appRouter";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

/**
 * Default tRPC client. Wires the HTTP batch link to the same-origin `/api/trpc`
 * endpoint and uses `superjson` for Date/Map/Set serialization. The logger
 * link is enabled only in development.
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      loggerLink({
        enabled: (op) =>
          process.env.NODE_ENV === "development" ||
          (op.direction === "down" && op.result instanceof Error),
      }),
      httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include",
          });
        },
      }),
    ],
  });
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
    },
  });
}
