# Setting Up HTTPS with Nginx for Jimmy Yodeler

This guide explains how to set up HTTPS with Nginx for the Jimmy Yodeler application using Let's Encrypt for SSL certificates and Duck DNS for domain management.

## Prerequisites

- Docker and Docker Compose installed
- A Duck DNS domain (or any other domain provider)
- Port 80 and 443 open on your firewall/router

## Router Configuration

To make your application accessible from the internet, you need to configure your router to forward ports 80 and 443 to your server:

1. **Find your router's admin interface**:
   - Usually accessible at your default gateway IP address


2. **Find the port forwarding section**:
   - This might be called "Port Forwarding", "Virtual Server", or "NAT/Gaming"
   - The location varies by router manufacturer (e.g., TP-Link, Netgear, Asus)

3. **Add port forwarding rules**:
   - Add a rule for HTTP:
     - External Port: 80
     - Internal Port: 80
     - Protocol: TCP
     - Internal IP: Your server's local IP address (e.g., 192.168.1.100)
   
   - Add a rule for HTTPS:
     - External Port: 443
     - Internal Port: 443
     - Protocol: TCP
     - Internal IP: Your server's local IP address (e.g., 192.168.1.100)

4. **Find your server's local IP address**:
   - On Linux: Run `ip addr show` or `hostname -I`
   - On macOS: System Preferences > Network
   - On Windows: Run `ipconfig` in Command Prompt

5. **Set a static IP for your server** (recommended):
   - This ensures your port forwarding rules remain valid
   - Configure this in your router's DHCP settings
   - Look for "DHCP Reservation" or "Static DHCP"
   - Associate your server's MAC address with a fixed IP

6. **Test your configuration**:
   - You can check if ports are open using online tools:
     - Visit https://www.yougetsignal.com/tools/open-ports/
     - Enter port 80 and 443 to check if they're open

## Files Overview

1. **docker-compose.yml**: Updated to include Nginx and Certbot services
2. **nginx/conf/app.conf**: Nginx configuration file
3. **init-ssl.sh**: Script to initialize SSL certificates (create this script based on the instructions below)
4. **update-duckdns.sh**: Script to update Duck DNS with your server's IP address (create this script based on the instructions below)
5. **setup-cron.sh**: Script to set up a cron job for automatic Duck DNS updates (create this script based on the instructions below)

## Setup Instructions

### 1. Update Duck DNS

First, make sure your Duck DNS domain is pointing to your server's IP address:

1. Create a script called `update-duckdns.sh` with the following content:
```bash
#!/bin/bash

# Update Duck DNS with the current IP address
# This script should be run periodically (e.g., via cron) to keep the DNS record updated

# Duck DNS domain and token
DOMAIN="<YOUR_DOMAIN_NAME>"  # e.g., "jimmyyodeler" for jimmyyodeler.duckdns.org
TOKEN="<YOUR_DUCKDNS_TOKEN>"

# Log file
LOG_FILE="/var/log/duckdns/duck.log"
mkdir -p "$(dirname "$LOG_FILE")"

# Update Duck DNS
echo "Updating Duck DNS for $DOMAIN.duckdns.org..."
curl "https://www.duckdns.org/update?domains=$DOMAIN&token=$TOKEN&ip=" -o "$LOG_FILE"

# Check result
if grep -q "OK" "$LOG_FILE"; then
    echo "Duck DNS update successful!"
else
    echo "Duck DNS update failed. Check $LOG_FILE for details."
fi
```

2. Make the script executable:
```bash
chmod +x update-duckdns.sh
```

3. Run the script:
```bash
./update-duckdns.sh
```

### 2. Initialize SSL Certificates

Create a script called `init-ssl.sh` to set up SSL certificates:

```bash
#!/bin/bash

# Initialize SSL certificates for your domain
# This script should be run once to set up the initial SSL certificates

# Set your domain name
DOMAIN="<YOUR_DOMAIN>"  # e.g., "example.duckdns.org"

# Create required directories
mkdir -p ./nginx/conf
mkdir -p ./nginx/certbot/conf
mkdir -p ./nginx/certbot/www
mkdir -p ./nginx/logs

# Create initial nginx conf for certbot
cat > ./nginx/conf/app.conf << EOF
server {
    listen 80;
    server_name ${DOMAIN};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF

# Start nginx
docker-compose up -d nginx

# Wait for nginx to start
echo "Waiting for nginx to start..."
sleep 5

# Get the certificates
echo "Obtaining SSL certificates from Let's Encrypt..."
read -p "Enter your email address for Let's Encrypt notifications: " EMAIL
docker-compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot \
    --email $EMAIL --agree-tos --no-eff-email \
    -d ${DOMAIN}

# Check if certificates were obtained successfully
if [ ! -d "./nginx/certbot/conf/live/${DOMAIN}" ]; then
    echo "Failed to obtain SSL certificates. Please check the error messages above."
    exit 1
fi

# Update nginx configuration with SSL settings
cat > ./nginx/conf/app.conf << EOF
# HTTP - redirect all requests to HTTPS
server {
    listen 80;
    server_name ${DOMAIN};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS - proxy requests to Node.js app
server {
    listen 443 ssl;
    server_name ${DOMAIN};
    
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # Proxy settings
    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Restart nginx to apply the new configuration
echo "Restarting nginx with SSL configuration..."
docker-compose restart nginx

echo "SSL setup complete! Your application should now be accessible at https://${DOMAIN}"
```

Make the script executable and run it:

```bash
chmod +x init-ssl.sh
./init-ssl.sh
```

### 3. Set Up Automatic Duck DNS Updates

Create a script called `setup-cron.sh` to set up a cron job for automatic Duck DNS updates:

```bash
#!/bin/bash

# Set up a cron job to update Duck DNS every 5 minutes

# Create the cron job file
CRON_FILE="/tmp/duckdns-cron"

# Create the cron job entry
echo "*/5 * * * * $(pwd)/update-duckdns.sh" > "$CRON_FILE"

# Install the cron job
echo "Installing cron job to update Duck DNS every 5 minutes..."
crontab -l | grep -v "update-duckdns.sh" | cat - "$CRON_FILE" | crontab -

# Clean up
rm "$CRON_FILE"

echo "Cron job installed successfully!"
echo "Duck DNS will be updated every 5 minutes to ensure your domain always points to the correct IP address."
```

Make the script executable and run it:

```bash
chmod +x setup-cron.sh
./setup-cron.sh
```

### 4. Start the Application

Start all the Docker containers:

```bash
docker-compose up -d
```

## Accessing the Application

Once everything is set up, you can access the application at:

```
https://<YOUR_DOMAIN>
```

## Troubleshooting

### SSL Certificate Issues

If you encounter issues with SSL certificates:

1. Check the Certbot logs:
   ```bash
   docker-compose logs certbot
   ```

2. Check the Nginx logs:
   ```bash
   docker-compose logs nginx
   ```

3. Verify that your domain is pointing to the correct IP address:
   ```bash
   nslookup <YOUR_DOMAIN>
   ```

### Nginx Configuration Issues

If Nginx is not working correctly:

1. Check the Nginx configuration:
   ```bash
   docker-compose exec nginx nginx -t
   ```

2. Restart Nginx:
   ```bash
   docker-compose restart nginx
   ```

### Duck DNS Issues

If your domain is not updating correctly:

1. Run the update script manually:
   ```bash
   ./update-duckdns.sh
   ```

2. Check the Duck DNS log file:
   ```bash
   cat /var/log/duckdns/duck.log
   ```

## SSL Certificate Renewal

Let's Encrypt certificates are valid for 90 days. The Certbot container is configured to automatically attempt renewal every 12 hours. No manual intervention is required.

## Security Considerations

- The SSL configuration uses modern, secure protocols and ciphers
- HSTS is enabled to ensure clients always use HTTPS
- All HTTP traffic is redirected to HTTPS

## Additional Notes

- If you need to make changes to the Nginx configuration, edit the `nginx/conf/app.conf` file and restart the Nginx container
- If you need to obtain new certificates, you can run the `init-ssl.sh` script again
