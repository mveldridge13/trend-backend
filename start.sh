#!/bin/sh
set -e

# Try to mark the failed migration as rolled back
npx prisma migrate resolve --rolled-back "20251027204249_add_rollover_transaction_type" || true

# Run migrations (this will now apply the fixed idempotent migration)
npx prisma migrate deploy

# Seed categories
node seed-categories.js || true

# Start the application
npm run start:prod
