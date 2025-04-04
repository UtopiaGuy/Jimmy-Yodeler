# Docker Deployment Guide for Jimmy Yodeler

This guide provides instructions for deploying the Jimmy Yodeler application using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Git for cloning the repository
- A domain name (optional, for HTTPS)

## Deployment Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/JimmyYodeler.git
cd JimmyYodeler
```

### 2. Configure Environment Variables

Create a `.env` file based on the provided `.env.example`:

```bash
cp .env.example .env
```

Edit the `.env` file to set your environment-specific variables.

### 3. Build and Start the Containers

For a basic deployment without HTTPS:

```bash
docker-compose up -d
```

### 4. Setting Up HTTPS (Optional)

For a production deployment, it's recommended to set up HTTPS. Follow the instructions in the `nginx-https-setup.md` file.

### 5. Verify the Deployment

Check if all containers are running:

```bash
docker-compose ps
```

Check the logs for any errors:

```bash
docker-compose logs
```

### 6. Access the Application

- Basic setup: `http://your-server-ip:3000`
- With HTTPS: `https://your-domain.com`

## Managing the Deployment

### Stopping the Application

```bash
docker-compose down
```

### Restarting the Application

```bash
docker-compose restart
```

### Updating the Application

1. Pull the latest changes: `git pull`
2. Rebuild and restart: `docker-compose up -d --build`

### Viewing Logs

```bash
docker-compose logs -f
```

## Troubleshooting

If you encounter issues, check:

1. Docker container status: `docker-compose ps`
2. Application logs: `docker-compose logs app`
3. Database logs: `docker-compose logs db`
4. Nginx logs (if using): `docker-compose logs nginx`

For more detailed troubleshooting, refer to `docker-troubleshooting.md`.
