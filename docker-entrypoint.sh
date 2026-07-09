#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy 2>/dev/null || echo "Migration skipped (no pending migrations or DB not ready)"

echo "Starting AEON Document Log..."
exec node server.js
