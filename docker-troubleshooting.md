# Docker Troubleshooting Guide

If your Docker setup is only running the database container but not the app container, follow these steps to diagnose and fix the issue:

## 1. Check Container Status

First, check the status of all containers:

```bash
docker-compose ps
```

This will show you all containers defined in your docker-compose.yml file and their current status.

## 2. Check Container Logs

If the app container is not running, check its logs to see what went wrong:

```bash
docker-compose logs app
```

Look for error messages that might indicate why the container failed to start.

## 3. Common Issues and Solutions

### Issue: Environment Variable Problems

If there are issues with environment variables in your .env file:

**Solution:**
```bash
# Check if .env file exists
ls -la .env

# Make sure .env file has the correct variables
cat .env | grep -v PASSWORD | grep -v SECRET | grep -v KEY
# (This shows non-sensitive variables)

# Update any missing variables in your .env file
nano .env
```

Make sure your .env file contains all the necessary variables:
- PORT
- NODE_ENV
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- WHISPER_API_KEY
- JWT_SECRET, JWT_EXPIRES_IN

### Issue: Build Errors

If there were errors during the build process:

**Solution:**
```bash
# Rebuild with verbose output
docker-compose build --no-cache app
```

### Issue: Port Conflicts

If port 3000 is already in use on your host machine:

**Solution:**
```bash
# Check what's using port 3000
sudo lsof -i :3000

# Either stop that process or change the port in docker-compose.yml
# For example, change "3000:3000" to "3001:3000"
```

### Issue: Database Connection Problems

The app might be failing because it can't connect to your local MySQL database:

**Solution:**
```bash
# Check if MySQL is running on your host machine
sudo systemctl status mysql  # Linux
brew services list  # macOS

# Start MySQL if it's not running
sudo systemctl start mysql  # Linux
brew services start mysql  # macOS

# Try to connect to the database manually
mysql -u root -p -h localhost jimmy_yodeler
# Enter your MySQL password

# Make sure the database exists
mysql -u root -p -e "SHOW DATABASES;"
# If jimmy_yodeler is not listed, create it:
mysql -u root -p -e "CREATE DATABASE jimmy_yodeler;"

# Check that your .env file has the correct database settings
cat .env | grep DB_
```

### Issue: "ECONNREFUSED ::1:3306" Error

If you see an error like "connect ECONNREFUSED ::1:3306", it means the Docker container can't connect to MySQL on IPv6 localhost:

**Solution:**
```bash
# Make sure MySQL is configured to listen on all interfaces, not just localhost
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Find the bind-address line and change it to:
# bind-address = 0.0.0.0

# Restart MySQL
sudo systemctl restart mysql

# Alternatively, you can configure MySQL to listen on IPv4 only
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# Add this line:
# skip-name-resolve
```

For macOS:
```bash
# Edit MySQL configuration
sudo nano /usr/local/etc/my.cnf

# Add or modify these lines:
# bind-address = 0.0.0.0
# skip-name-resolve

# Restart MySQL
brew services restart mysql
```

You can also check if MySQL is listening on the correct interfaces:
```bash
# Check MySQL listening status
sudo netstat -tlnp | grep mysql
```

### Issue: Volume Mount Problems

If there are issues with volume mounts:

**Solution:**
```bash
# Check volume mounts
docker volume ls
docker inspect jimmy-yodeler_mysql_data

# Recreate volumes
docker-compose down -v
docker-compose up -d
```

## 4. Manual Container Start

Try starting the app container manually:

```bash
# Start just the app container
docker-compose up app
```

This will run the app container in the foreground, showing you any startup errors directly in the terminal.

## 5. Check Dockerfile

Ensure your Dockerfile is correctly configured:

```bash
# Validate Dockerfile
docker build -t jimmy-yodeler-app-test .
```

## 6. Network Issues

Check if the containers can communicate with each other:

```bash
# Check Docker networks
docker network ls
docker network inspect jimmy-yodeler_default

# Make sure the containers are on the same network
docker inspect --format='{{range .NetworkSettings.Networks}}{{.NetworkID}}{{end}}' jimmy-yodeler_app_1
docker inspect --format='{{range .NetworkSettings.Networks}}{{.NetworkID}}{{end}}' jimmy-yodeler_db_1
```

## 7. Container Name Issues

If the container names are different than expected:

```bash
# List all containers to see their actual names
docker ps -a
```

Then adjust your commands to use the correct container names.

## 8. Restart Docker

If all else fails, try restarting the Docker daemon:

```bash
# On Linux
sudo systemctl restart docker

# On macOS
osascript -e 'quit app "Docker"'
# Then restart Docker Desktop manually

# On Windows
Restart-Service docker
```

## 9. Rebuild Everything

As a last resort, rebuild everything from scratch:

```bash
docker-compose down -v
docker system prune -a --volumes
docker-compose build --no-cache
docker-compose up -d
```

This will remove all containers, images, and volumes, then rebuild everything from scratch.
