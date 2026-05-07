#!/bin/bash
set -e

echo "=== LeadForge Deploy ==="

cd /opt/leadforge

echo "Pulling latest code..."
git pull origin master

echo "Building and starting services..."
docker compose -f docker/docker-compose.prod.yml up -d --build

echo "Waiting for postgres to be healthy..."
until docker exec leadforge-postgres pg_isready -U leadforge -d leadforge; do
  sleep 2
done

echo "Running Prisma migrations..."
docker exec leadforge-api sh -c "cd /app && npx prisma db push --schema=packages/database/prisma/schema.prisma --accept-data-loss"

echo "=== Deploy complete ==="
echo "App available at http://$(curl -s ifconfig.me)"
