#!/bin/sh

# Docker entrypoint script for Jimmy Yodeler
# This script runs the database initialization script and then starts the application

echo "=== Starting Jimmy Yodeler ==="

# Run database initialization script
echo "Initializing database..."
/app/init-db.sh

# Start the application
echo "Starting application..."
exec npm start
