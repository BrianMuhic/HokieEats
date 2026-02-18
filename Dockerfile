# VT Eating - Production Dockerfile
# Suitable for AWS ECS/EC2 or Raspberry Pi

# Debian (glibc) - Prisma engines work reliably on ARM64; Alpine/musl causes "Error load" on Pi
FROM node:20-slim

WORKDIR /app

# 512MB was too low and caused npm OOM (exit 146). With 8GB RAM + swap, 2GB is safe.
ENV NODE_OPTIONS="--max-old-space-size=2048"

COPY package.json package-lock.json* ./
# Increase timeout for slow/unstable Pi network; retries help with flaky connections
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm install --no-audit --no-fund

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

COPY scripts/docker-entrypoint.sh /app/scripts/
RUN chmod +x /app/scripts/docker-entrypoint.sh

CMD ["/app/scripts/docker-entrypoint.sh"]
