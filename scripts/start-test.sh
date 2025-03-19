#!/bin/bash
# Jimmy Yodeler - Test Server Startup Script

# Print colored messages
print_message() {
  echo -e "\e[1;34m>> $1\e[0m"
}

print_success() {
  echo -e "\e[1;32m>> $1\e[0m"
}

print_error() {
  echo -e "\e[1;31m>> $1\e[0m"
}

# Load environment
source .env

# Start the test server
print_message "Starting Jimmy Yodeler TEST server..."
print_message "NOTE: This server uses mock data and does not connect to the database"
node backend/server-test.js
