#!/bin/bash
# Jimmy Yodeler - Startup Script

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

# Check if MySQL is running
print_message "Checking MySQL connection..."
if ! mysql -u root -p"$DB_PASSWORD" -e "SELECT 1" &>/dev/null; then
  print_error "Cannot connect to MySQL. Please make sure MySQL is running."
  print_message "If MySQL is not running, start it with: brew services start mysql"
  exit 1
fi

# Check if database exists
print_message "Checking if database exists..."
if ! mysql -u root -p"$DB_PASSWORD" -e "USE jimmy_yodeler" &>/dev/null; then
  print_error "Database 'jimmy_yodeler' does not exist."
  print_message "Would you like to set up the database now? (y/n)"
  read -r setup_db
  
  if [[ $setup_db =~ ^[Yy]$ ]]; then
    print_message "Setting up database..."
    npm run setup-db-full
    
    if [ $? -ne 0 ]; then
      print_error "Failed to set up database. Please run the installation script first."
      print_message "Run: ./scripts/install.sh"
      exit 1
    fi
  else
    print_error "Cannot start server without database. Please run the installation script first."
    print_message "Run: ./scripts/install.sh"
    exit 1
  fi
fi

print_success "Database connection verified"

# Start the backend server
print_message "Starting Jimmy Yodeler server..."
node backend/server.js
