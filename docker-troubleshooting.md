# Docker Troubleshooting Guide

Common issues and solutions when running Jimmy Yodeler with Docker.

## Container Issues

### Containers Not Starting

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs
```

Common causes:
- Port conflicts (3000, 80, 443)
- Database connection issues
- Permission problems with volumes

## Database Issues

### Connection Failures

1. Check if database is running: `docker-compose ps db`
2. Verify environment variables:
   - DB_HOST should be "db"
   - DB_USER, DB_PASSWORD match docker-compose.yml

### Data Issues

If database isn't initialized properly:
```bash
# Check logs
docker-compose logs db

# Manually connect
docker-compose exec db mysql -u root -p
```

## Nginx and HTTPS Issues

### SSL Certificate Problems

1. Check certificates: `docker-compose exec nginx ls -la /etc/letsencrypt/live/`
2. Verify Certbot logs: `docker-compose logs certbot`
3. Ensure domain is correctly configured
4. Check ports 80/443 are open on firewall

## Application Issues

### API Errors

1. Check app logs: `docker-compose logs app`
2. Verify environment variables in .env
3. Check database tables

### Volume Permissions

If you see permission errors:
```bash
# Fix permissions
chmod -R 755 ./audio-cache
```

## Quick Fixes

### Restart Services

```bash
docker-compose restart [service_name]
```

### Rebuild Application

```bash
docker-compose up -d --build app
```

### Reset Everything

```bash
docker-compose down
docker volume prune  # Caution: removes all unused volumes
docker-compose up -d
