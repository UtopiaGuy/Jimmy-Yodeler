# Docker Deployment Guide for Jimmy Yodeler

This guide provides step-by-step terminal commands to deploy the Jimmy Yodeler application using Docker and set up port forwarding to GitHub Pages.

## Prerequisites

- Docker and Docker Compose installed
- Git installed
- A server with a public IP address (for hosting the backend)
- A GitHub account (for hosting the frontend)

## Deployment Steps

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/JimmyYodeler.git
cd JimmyYodeler
```

### 2. Configure Environment Variables

Make sure your `.env` file is properly configured:

```bash
# Copy the example file if you don't have a .env file
cp .env.example .env

# Edit the .env file with your settings
nano .env
```

Ensure these important variables are set:
- `DB_PASSWORD` - Password for the MySQL database
- `WHISPER_API_KEY` - Your OpenAI API key for voice transcription
- `JWT_SECRET` - Secret key for JWT token generation

### 3. Ensure Your Local MySQL Database is Ready

Make sure your local MySQL database is running and has the necessary data:

```bash
# Check if MySQL is running
sudo systemctl status mysql  # Linux
brew services list  # macOS

# Start MySQL if it's not running
sudo systemctl start mysql  # Linux
brew services start mysql  # macOS

# Verify the database exists
mysql -u root -p -e "SHOW DATABASES;"
```

If you need to create and populate the database:

```bash
# Create the database
npm run create-db

# Set up the database schema and seed data
npm run setup-db
```

### 4. Build and Start Docker Container

```bash
# Build the Docker image
docker-compose build

# Start the container in detached mode
docker-compose up -d
```

The docker-compose.yml file is configured to use the variables from your .env file and connect to your local MySQL database.

### 3. Verify the Containers are Running

```bash
# List running containers
docker ps

# Check logs for the app container
docker logs jimmy-yodeler_app_1

# Check logs for the database container
docker logs jimmy-yodeler_db_1
```

### 4. Test the Application Locally

```bash
# Test the API endpoint
curl http://localhost:3000/api/auth/verify

# Open the application in a browser
open http://localhost:3000
```

### 5. Deploy to a Public Server

If you're deploying to a remote server:

```bash
# Copy the project files to your server
scp -r ./* user@your-server-ip:/path/to/deployment/

# SSH into your server
ssh user@your-server-ip

# Navigate to the deployment directory
cd /path/to/deployment/

# Build and start the containers
docker-compose build
docker-compose up -d
```

### 6. Configure Port Forwarding

If your server is behind a router/firewall, you'll need to set up port forwarding:

```bash
# Check if the port is open
sudo netstat -tulpn | grep 3000

# Configure firewall to allow traffic on port 3000
sudo ufw allow 3000/tcp

# If using iptables directly
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables-save > /etc/iptables/rules.v4
```

### 7. Deploy Frontend to GitHub Pages

```bash
# Create a new repository for GitHub Pages
mkdir -p ~/github-pages-repo
cp -r frontend/* ~/github-pages-repo/
cp github-pages/app.js ~/github-pages-repo/
cp github-pages/README.md ~/github-pages-repo/

# Initialize Git repository
cd ~/github-pages-repo
git init
git add .
git commit -m "Initial commit for GitHub Pages"

# Create repository on GitHub and push
git remote add origin https://github.com/yourusername/jimmy-yodeler-frontend.git
git push -u origin main
```

Then enable GitHub Pages in the repository settings on GitHub.

### 8. Update API URL in Frontend

Edit the `app.js` file in your GitHub Pages repository to point to your server's public IP:

```javascript
apiBaseUrl: window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : 'http://your-server-ip:3000/api'
```

Then commit and push the changes:

```bash
git add app.js
git commit -m "Update API URL to point to production server"
git push
```

## Docker Management Commands

### Container Management

```bash
# Start containers
docker-compose start

# Stop containers
docker-compose stop

# Restart containers
docker-compose restart

# Stop and remove containers
docker-compose down

# Stop and remove containers including volumes
docker-compose down -v
```

### Viewing Logs

```bash
# View logs for all containers
docker-compose logs

# View logs for a specific container
docker-compose logs app
docker-compose logs db

# Follow logs in real-time
docker-compose logs -f
```

### Updating the Application

```bash
# Pull latest changes from Git
git pull

# Rebuild and restart containers
docker-compose build
docker-compose up -d
```

### Database Management

```bash
# Access MySQL CLI
docker exec -it jimmy-yodeler_db_1 mysql -u root -p

# Backup database
docker exec jimmy-yodeler_db_1 mysqldump -u root -p jimmy_yodeler > backup.sql

# Restore database
cat backup.sql | docker exec -i jimmy-yodeler_db_1 mysql -u root -p jimmy_yodeler
```

### Container Shell Access

```bash
# Access shell in app container
docker exec -it jimmy-yodeler_app_1 /bin/sh

# Access shell in database container
docker exec -it jimmy-yodeler_db_1 /bin/bash
```

## Troubleshooting

### Container Issues

```bash
# Check container status
docker-compose ps

# View detailed container information
docker inspect jimmy-yodeler_app_1

# Restart a specific container
docker-compose restart app
```

### Network Issues

```bash
# List Docker networks
docker network ls

# Inspect Docker network
docker network inspect jimmy-yodeler_default

# Check if port is exposed
docker port jimmy-yodeler_app_1
```

### Volume Issues

```bash
# List Docker volumes
docker volume ls

# Inspect a volume
docker volume inspect jimmy-yodeler_mysql_data
```

## Monitoring

```bash
# View container resource usage
docker stats

# View container processes
docker top jimmy-yodeler_app_1
