FROM node:18-alpine

# Install wget, ffmpeg, mysql-client and other required dependencies for audio processing
RUN apk add --no-cache wget ffmpeg mysql-client

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy initialization scripts
COPY init-db.sh /app/init-db.sh
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/init-db.sh /app/docker-entrypoint.sh

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Set entrypoint
ENTRYPOINT ["/app/docker-entrypoint.sh"]
