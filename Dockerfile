# Multi-stage build for NestJS backend

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Install ts-node for seed script
RUN npm install ts-node typescript @types/node --save-dev

# Generate Prisma Client
RUN npx prisma generate

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy seed script
COPY seed-categories.js ./seed-categories.js

# Expose port
EXPOSE 3000

# Run database migrations, seed categories, and start application
CMD ["sh", "-c", "npx prisma migrate deploy && node seed-categories.js || true && npm run start:prod"]
