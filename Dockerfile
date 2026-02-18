# VT Eating - Production Dockerfile
# Suitable for AWS ECS/EC2 or Raspberry Pi

FROM node:20-alpine

WORKDIR /app

# Reduce memory usage for Raspberry Pi (npm can OOM on 2–4GB RAM)
ENV NODE_OPTIONS="--max-old-space-size=512"

COPY package.json package-lock.json* ./
# Lightweight flags to reduce memory during install on Pi
RUN npm install --no-audit --no-fund

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

COPY scripts/docker-entrypoint.sh /app/scripts/
RUN chmod +x /app/scripts/docker-entrypoint.sh

CMD ["/app/scripts/docker-entrypoint.sh"]
