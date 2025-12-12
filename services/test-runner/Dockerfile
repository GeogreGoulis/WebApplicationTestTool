# Build stage
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy shared packages
COPY packages ./packages

# Copy service files
COPY services/test-runner ./services/test-runner

# Copy examples directory for test execution
COPY examples ./examples

# Install dependencies
RUN npm install

# Build shared packages
RUN npm run build --workspace=@watt/shared-types
RUN npm run build --workspace=@watt/shared-utils
RUN npm run build --workspace=@watt/test-data-loader
RUN npm run build --workspace=@watt/cucumber-helpers

# Build test-runner service
RUN npm run build --workspace=@watt/test-runner

# Production stage
FROM mcr.microsoft.com/playwright:v1.57.0-jammy

# Install Node.js
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/test-runner/dist ./services/test-runner/dist
COPY --from=builder /app/services/test-runner/package.json ./services/test-runner/
COPY --from=builder /app/examples ./examples

# Create artifacts directory
RUN mkdir -p /app/test-artifacts

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3200
ENV EXAMPLES_PATH=/app/examples

# Expose port
EXPOSE 3200

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3200/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run the service
CMD ["node", "services/test-runner/dist/index.js"]
