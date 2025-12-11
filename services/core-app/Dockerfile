FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy shared packages
COPY packages/ ./packages/

# Copy Core App service
COPY services/core-app/ ./services/core-app/

# Install dependencies
RUN npm install

# Build shared packages
RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=packages/shared-utils

# Build Core App
RUN npm run build --workspace=services/core-app

WORKDIR /app/services/core-app

EXPOSE 3100

CMD ["node", "dist/index.js"]
