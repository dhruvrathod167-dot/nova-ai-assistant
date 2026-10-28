#!/bin/bash

# Wait for database to be ready if using PostgreSQL
if [[ "$DATABASE_URL" == *"postgresql"* ]]; then
    echo "Waiting for PostgreSQL database to be ready..."
    until python -c "import psycopg2; psycopg2.connect('$DATABASE_URL')" 2>/dev/null; do
        echo "Database is unavailable - sleeping"
        sleep 2
    done
    echo "Database is ready!"
fi

# Generate Prisma client if needed
if [ ! -d "node_modules/@prisma/client" ]; then
    echo "Generating Prisma client..."
    npx prisma generate
fi

# Push database schema if needed (for development)
if [ "$NODE_ENV" = "development" ]; then
    echo "Pushing database schema..."
    npx prisma db push --accept-data-loss
fi

# Start the application
echo "Starting MAISON E-Commerce application..."
exec node .next/standalone/server.js