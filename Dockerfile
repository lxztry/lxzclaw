# LxzClaw Docker Image
FROM node:22-alpine

# Install dependencies
RUN apk add --no-cache \
    dumb-init \
    tini \
    ca-certificates \
    tzdata

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source (for skills and web assets)
COPY dist/ ./dist/
COPY src/web/ ./src/web/

# Create non-root user
RUN addgroup -g 1001 -S lxzclaw && \
    adduser -S lxzclaw -u 1001 -G lxzclaw

# Create data directories
RUN mkdir -p /app/data /app/.lxzclaw && \
    chown -R lxzclaw:lxzclaw /app

USER lxzclaw

# Expose gateway port
EXPOSE 18789

# Environment variables
ENV NODE_ENV=production
ENV LXZ_GATEWAY_PORT=18789
ENV LXZ_HOME=/app/.lxzclaw

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:18789/health || exit 1

# Default command
ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/index.js", "gateway"]
