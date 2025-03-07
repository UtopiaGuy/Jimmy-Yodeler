#!/bin/bash
# Jimmy Yodeler - Military Voice Procedure Trainer
# Installation Script

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

# Check if running with sudo
if [ "$EUID" -eq 0 ]; then
  print_error "Please do not run this script with sudo or as root"
  exit 1
fi

# Welcome message
print_message "Welcome to Jimmy Yodeler Installation"
print_message "This script will set up all dependencies for the application"
echo ""

# Check for Node.js
print_message "Checking for Node.js..."
if ! command -v node &> /dev/null; then
  print_error "Node.js is not installed"
  print_message "Please install Node.js v18 or higher from https://nodejs.org/"
  exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d '.' -f 1)
if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
  print_error "Node.js version $NODE_VERSION is not supported"
  print_message "Please upgrade to Node.js v18 or higher"
  exit 1
fi

print_success "Node.js v$NODE_VERSION detected"

# Check for npm
print_message "Checking for npm..."
if ! command -v npm &> /dev/null; then
  print_error "npm is not installed"
  print_message "Please install npm (usually comes with Node.js)"
  exit 1
fi

print_success "npm detected"

# Check for MySQL
print_message "Checking for MySQL..."
if ! command -v mysql &> /dev/null; then
  print_error "MySQL is not installed"
  print_message "Please install MySQL from https://dev.mysql.com/downloads/"
  print_message "Alternatively, you can use a MySQL Docker container"
  exit 1
fi

print_success "MySQL detected"

# Install dependencies
print_message "Installing Node.js dependencies..."
npm install

if [ $? -ne 0 ]; then
  print_error "Failed to install dependencies"
  exit 1
fi

print_success "Dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  print_message "Creating .env file..."
  cp .env.example .env
  
  if [ $? -ne 0 ]; then
    print_error "Failed to create .env file"
    print_message "Please create a .env file manually based on .env.example"
  else
    print_success ".env file created"
    print_message "Please update the .env file with your configuration"
  fi
else
  print_message ".env file already exists"
fi

# Setup database
print_message "Would you like to set up the database now? (y/n)"
read -r setup_db

if [[ $setup_db =~ ^[Yy]$ ]]; then
  print_message "Setting up database..."
  print_message "You will be prompted for your MySQL root password"
  
  # Run database setup script
  npm run setup-db
  
  if [ $? -ne 0 ]; then
    print_error "Failed to set up database"
    print_message "You can set up the database manually by running:"
    print_message "mysql -u root -p < database/schema.sql"
    print_message "mysql -u root -p < database/seed.sql"
  else
    print_success "Database set up successfully"
  fi
else
  print_message "Skipping database setup"
  print_message "You can set up the database later by running: npm run setup-db"
fi

# Final instructions
echo ""
print_success "Installation completed!"
print_message "To start the application, run: ./scripts/start.sh"
print_message "For development mode with auto-reload, run: npm run dev"
echo ""
print_message "Thank you for installing Jimmy Yodeler!"
