#!/bin/bash
# Jimmy Yodeler - Startup Script

# Exit on error and show commands
set -ex

# Load environment
source .env

# Start the backend server
node backend/server.js
