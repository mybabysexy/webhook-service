#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "Running prisma migrate deploy..."
npx prisma@6.3.0 migrate deploy

echo "Starting application..."
node server.js
