#!/bin/bash

# Jimmy Yodeler - Execute Scenario SQL Script
# This script executes the generated SQL file against the database

# Change to the script directory
cd "$(dirname "$0")"

# Check if the SQL file exists
if [ ! -f "scenario_insert.sql" ]; then
    echo "Error: scenario_insert.sql not found. Please run generate_sql.sh first."
    exit 1
fi

# Prompt for database credentials
read -p "Enter MySQL username: " DB_USER
read -s -p "Enter MySQL password: " DB_PASS
echo ""
read -p "Enter database name: " DB_NAME

# Execute the SQL file
echo "Executing SQL file against database $DB_NAME..."
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < scenario_insert.sql

# Check if the command was successful
if [ $? -eq 0 ]; then
    echo "SQL executed successfully!"
    echo "The scenarios have been added to the database."
else
    echo "Error: Failed to execute SQL."
    echo "Please check your database credentials and try again."
    exit 1
fi
