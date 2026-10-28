#!/bin/bash

# Wait for database to be ready (if using PostgreSQL)
if [ "$DATABASE_URL" != "${DATABASE_URL#postgresql}" ]; then
    echo "Waiting for database to be ready..."
    until python -c "import asyncio; import asyncpg; asyncio.run(asyncpg.connect('$DATABASE_URL'))" 2>/dev/null; do
        echo "Database is unavailable - sleeping"
        sleep 2
    done
    echo "Database is ready!"
fi

# Run database migrations if needed
echo "Running database migrations..."
python -c "from app.db.session import engine; from app.models.models import Base; import asyncio; asyncio.run(engine.run_sync(Base.metadata.create_all))"

# Start the application
echo "Starting NOVA AI backend..."
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT --reload