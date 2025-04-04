# Jimmy Yodeler - Military Voice Procedure Trainer

Jimmy Yodeler is a web-based application for training military voice procedures. It provides interactive scenarios where users can practice proper voice communication protocols.

## Running with Docker

The application can be run using Docker, which simplifies setup and ensures consistent environments.

### Prerequisites

- Docker and Docker Compose installed on your system
- Git for cloning the repository

### Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/JimmyYodeler.git
cd JimmyYodeler
```

2. Build and start the Docker containers:
```bash
docker-compose up -d
```

This will:
- Build the Node.js application container
- Start a MySQL database container
- Set up the necessary network connections
- Mount volumes for data persistence

3. Access the application:
- Frontend: http://localhost:3000
- API: http://localhost:3000/api

### Environment Variables

The Docker setup uses environment variables defined in the `docker-compose.yml` file. You can modify these as needed:

- `PORT`: The port the application runs on (default: 3000)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database connection details
- `JWT_SECRET`: Secret key for JWT token generation
- `WHISPER_API_KEY`: API key for the Whisper voice-to-text service

## Deploying Frontend to GitHub Pages

You can deploy the frontend to GitHub Pages while keeping the backend running in Docker.

### Setup Instructions

1. Copy the frontend files to a separate GitHub repository:
```bash
# From the project root
cp -r frontend/* /path/to/github-pages-repo/
```

2. Update the API URL in the GitHub Pages version:
Edit `app.js` in your GitHub Pages repository to point to your Docker container's public IP or domain:

```javascript
apiBaseUrl: window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : 'http://your-server-ip:3000/api' // Update with your Docker container's public IP
```

3. Push the changes to GitHub and enable GitHub Pages in the repository settings.

4. Make sure your Docker container is accessible from the internet (configure port forwarding, firewall rules, etc.)

## Project Structure

- `backend/`: Node.js Express server
  - `models/`: Database models
  - `routes/`: API routes
  - `services/`: Business logic
- `frontend/`: HTML, CSS, and JavaScript frontend
- `database/`: SQL schema and seed data
- `scripts/`: Utility scripts
- `docker-compose.yml`: Docker Compose configuration
- `Dockerfile`: Docker container definition

## Features

- Military voice procedure training
- Interactive voice recognition
- Scenario-based training
- Performance feedback and scoring
- User profiles and progress tracking

## Technologies Used

- Backend: Node.js, Express, MySQL
- Frontend: HTML5, CSS3, JavaScript
- Authentication: JWT
- Voice Processing: Whisper API
- Containerization: Docker
