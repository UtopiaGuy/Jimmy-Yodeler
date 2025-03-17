# Jimmy Yodeler - Military Voice Procedure Trainer

Jimmy Yodeler is an interactive web application designed to help military personnel and enthusiasts practice and improve their radio voice procedure skills. The application uses speech recognition and text-to-speech technologies to provide a realistic training environment with immediate feedback.

## Features

- **Interactive Voice Training**: Practice military radio procedures with voice recognition
- **Realistic Scenarios**: Multiple training scenarios with varying difficulty levels
- **Audio Filters**: Simulate different radio conditions (clear, radio static, background noise)
- **Immediate Feedback**: Get scored on accuracy, procedure adherence, and clarity
- **Progress Tracking**: Monitor improvement over time with detailed statistics
- **User Accounts**: Save training history and track long-term progress

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: MySQL
- **Voice Processing**: 
  - Speech-to-Text: OpenAI Whisper API
  - Text-to-Speech: Web Speech API
- **Authentication**: JWT (JSON Web Tokens)

## Prerequisites

- Node.js (v14.0.0 or higher)
- MySQL (v8.0 or higher)
- API keys for OpenAI (for Whisper API)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/jimmy-yodeler.git
   cd jimmy-yodeler
   ```

2. Run the installation script:
   ```
   ./scripts/install.sh
   ```
   
   This script will:
   - Install all required dependencies
   - Set up the database
   - Create necessary configuration files

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your database credentials and API keys

## Running the Application

1. Start the application:
   ```
   ./scripts/start.sh
   ```

2. Access the application in your browser:
   ```
   http://localhost:3000
   ```

## Usage Guide

### Getting Started

1. **Create an Account**: Register with a username, email, and password
2. **Login**: Access your account
3. **Select a Scenario**: Choose from available training scenarios
4. **Configure Audio**: Select an audio filter to simulate different radio conditions
5. **Begin Training**: Listen to the prompt and respond using proper voice procedure

### Training Process

1. **Listen to Prompt**: The system will play a scenario-based prompt
2. **Record Response**: Click the record button and speak your response
3. **Receive Feedback**: Get scored on your performance with specific improvement suggestions
4. **Review Transcript**: See what the system heard and how it compares to the expected response
5. **Continue or Retry**: Move to the next prompt or practice the current one again

## Development

### Project Structure

```
jimmy-yodeler/
├── backend/
│   ├── config.js         # Configuration settings
│   ├── db.js             # Database connection
│   ├── server.js         # Express server setup
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   └── services/         # Business logic services
├── frontend/
│   ├── index.html        # Main HTML file
│   ├── styles.css        # CSS styles
│   ├── app.js            # Main application logic
│   ├── voiceHandler.js   # Voice recording/playback
│   └── feedbackUI.js     # Feedback display logic
├── database/
│   ├── schema.sql        # Database schema
│   └── seed.sql          # Initial data
├── scripts/
│   ├── install.sh        # Installation script
│   └── start.sh          # Startup script
├── tests/
│   ├── apiTests.js       # Backend API tests
│   └── uiTests.js        # Frontend UI tests
├── .env.example          # Environment variables template
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

### Running Tests

- Run API tests:
  ```
  npm test
  ```

- Run UI tests:
  ```
  npm run test:ui
  ```

## API Documentation

The application provides a RESTful API with the following endpoints:

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/verify` - Verify JWT token

### User Management

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Training

- `GET /api/training/scenarios` - List all training scenarios
- `GET /api/training/scenarios/:id` - Get specific scenario details
- `POST /api/training/sessions` - Create a new training session
- `GET /api/training/sessions` - List user's training sessions
- `POST /api/training/sessions/:id/submit` - Submit a voice response

### Feedback

- `GET /api/feedback/user` - Get user's feedback history and statistics

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request


## Acknowledgments

- OpenAI for the Whisper API
- 38 Signal Regt Regina Signal Operators who provided guidance on proper voice procedures
