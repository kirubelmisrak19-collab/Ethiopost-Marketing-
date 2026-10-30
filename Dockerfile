# Ethiopost Marketing Command Center
# Production Dockerfile - Pure Zero-Dependency Architecture
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3050

# Copy application files
COPY package.json ./
COPY server.js db.js seed.js test.js ./
COPY public/ ./public/

# Create persistent data directory for SQLite database
RUN mkdir -p /app/data

# Expose port
EXPOSE 3050

# Define volume for database persistence
VOLUME ["/app/data"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3050/api/overview || exit 1

# Start server
CMD ["node", "server.js"]
