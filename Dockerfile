FROM node:20-alpine

# Install tini for proper signal handling (SIGTERM → graceful shutdown)
RUN apk add --no-cache tini

WORKDIR /app

# Create non-root user and prep directories in one layer
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && mkdir -p /tmp/uploads \
    && chown -R appuser:appgroup /app /tmp/uploads

# Copy package files and install production deps
COPY --chown=appuser:appgroup package*.json ./
USER appuser
RUN npm ci --omit=dev

# Copy source
COPY --chown=appuser:appgroup . .

EXPOSE 3225

# Container-level health check (Dokploy will also do Traefik-level checks)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3225/api/health || exit 1

# tini as PID 1 so SIGTERM reaches Node (graceful shutdown)
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "index.js"]