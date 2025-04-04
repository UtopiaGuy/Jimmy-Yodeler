#!/bin/bash

# Initialize database script for Jimmy Yodeler
# This script will be run when the container starts to ensure the database is properly set up

echo "=== Initializing Jimmy Yodeler Database ==="

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
MAX_TRIES=30
TRIES=0

while ! mysqladmin ping -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" --silent; do
    TRIES=$((TRIES+1))
    if [ $TRIES -ge $MAX_TRIES ]; then
        echo "Error: MySQL did not become ready in time"
        exit 1
    fi
    echo "MySQL not ready yet, waiting 2 seconds..."
    sleep 2
done

echo "MySQL is ready!"

# Check if database exists
echo "Checking if database exists..."
if mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME" 2>/dev/null; then
    echo "Database $DB_NAME already exists"
else
    echo "Creating database $DB_NAME..."
    mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE $DB_NAME"
    
    # Import schema if it exists
    if [ -f "/app/database/schema.sql" ]; then
        echo "Importing schema..."
        mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < /app/database/schema.sql
    else
        echo "Warning: schema.sql not found"
    fi
    
    # Import seed data if it exists
    if [ -f "/app/database/seed.sql" ]; then
        echo "Importing seed data..."
        mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < /app/database/seed.sql
    else
        echo "Warning: seed.sql not found"
    fi
    
    # Import dump file if it exists
    if [ -f "/app/jimmy_yodeler_dump.sql" ]; then
        echo "Importing database dump..."
        mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < /app/jimmy_yodeler_dump.sql
    else
        echo "Warning: jimmy_yodeler_dump.sql not found"
    fi
fi

echo "Database initialization complete!"
