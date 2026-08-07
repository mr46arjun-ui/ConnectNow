# ConnectNow - Production Dockerfile
# Multi-stage build for optimized production image

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g pnpm@11.17.0 && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Vite variables are intentionally public browser configuration. Render passes
# service variables to Docker builds as build arguments, so declare the values
# needed by the client bundle.
ARG VITE_ENABLE_OAUTH=false
ARG VITE_OAUTH_PORTAL_URL
ARG VITE_APP_ID
ARG VITE_TURN_URL
ARG VITE_TURN_USERNAME
ARG VITE_TURN_CREDENTIAL
ARG VITE_ANALYTICS_ENDPOINT
ARG VITE_ANALYTICS_WEBSITE_ID
ENV VITE_ENABLE_OAUTH=$VITE_ENABLE_OAUTH \
    VITE_OAUTH_PORTAL_URL=$VITE_OAUTH_PORTAL_URL \
    VITE_APP_ID=$VITE_APP_ID \
    VITE_TURN_URL=$VITE_TURN_URL \
    VITE_TURN_USERNAME=$VITE_TURN_USERNAME \
    VITE_TURN_CREDENTIAL=$VITE_TURN_CREDENTIAL \
    VITE_ANALYTICS_ENDPOINT=$VITE_ANALYTICS_ENDPOINT \
    VITE_ANALYTICS_WEBSITE_ID=$VITE_ANALYTICS_WEBSITE_ID

# Build frontend and backend (Removed the || true bypass so errors are caught properly)
RUN pnpm build

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Install runtime dependencies only
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g pnpm@11.17.0 && pnpm install --prod --frozen-lockfile

# Copy built artifacts from builder (Fixed client/dist to point to the correct dist/public folder)
COPY --from=builder /app/dist ./dist
# Runtime migrations are applied before the server opens its port.
COPY --from=builder /app/drizzle ./drizzle

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http');const port=process.env.PORT||3000;const req=http.get({hostname:'127.0.0.1',port,path:'/ready',timeout:2000},r=>process.exit(r.statusCode===200?0:1));req.on('error',()=>process.exit(1));req.on('timeout',()=>{req.destroy();process.exit(1)})"

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
