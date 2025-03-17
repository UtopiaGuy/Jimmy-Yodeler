#!/bin/bash

# Jimmy Yodeler - Scenario SQL Generator Script
# This script installs dependencies and runs the scenario SQL generator

# Change to the script directory
cd "$(dirname "$0")"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js to use this script."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm to use this script."
    exit 1
fi

# Install dependencies if they don't exist
if [ ! -d "../../node_modules/csv-parse" ] || [ ! -d "../../node_modules/csv-stringify" ]; then
    echo "Installing required dependencies..."
    cd ../..
    npm install csv-parse csv-stringify
    cd - > /dev/null
fi

# Make the script executable
chmod +x generate_scenario_sql.js

# Run the script
echo "Running scenario SQL generator..."
node generate_scenario_sql.js

# Check if the SQL file was generated
if [ -f "scenario_insert.sql" ]; then
    echo "SQL file generated successfully: scenario_insert.sql"
    echo ""
    echo "To execute the SQL file against your database, you can use:"
    echo "mysql -u <username> -p <database_name> < scenario_insert.sql"
    echo ""
    echo "Or you can copy and paste the contents into your database management tool."
else
    echo "Error: Failed to generate SQL file."
    exit 1
fi
