FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy shared packages
COPY packages/ ./packages/

# Copy API Gateway service
COPY services/api-gateway/ ./services/api-gateway/

# Install dependencies
RUN npm install

# Build shared packages
RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=packages/shared-utils

# Build API Gateway
RUN npm run build --workspace=services/api-gateway

WORKDIR /app/services/api-gateway

EXPOSE 3000

CMD ["node", "dist/index.js"]
