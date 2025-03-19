#!/bin/bash
set -e

echo "Generating Prisma client locally..."
npx prisma generate

echo "Building Docker images..."
docker-compose build

echo "Starting services..."
docker-compose up -d

echo "Running database migrations..."
./docker-migrate.sh

echo "Setup complete! Your app should be running at http://localhost:3000" 