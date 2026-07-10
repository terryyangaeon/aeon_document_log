#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy || echo "Migration failed — check DATABASE_URL and database connectivity"

echo "Starting AEON Document Log..."
exec node server.js
