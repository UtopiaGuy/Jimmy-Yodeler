/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * Test Server (No Database Connection)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Import real transcription routes
const transcriptionRoutes = require('./routes/transcriptionRoutes');

// Mock authentication middleware for transcription routes
app.use('/api/transcribe', (req, res, next) => {
  // Add mock user to request
  req.user = { id: 1, username: 'testuser' };
  next();
});

// Use real transcription routes
app.use('/api/transcribe', transcriptionRoutes);

// Mock API responses

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    token: 'mock-token-for-testing',
    user: { id: 1, username: req.body.username || 'testuser' }
  });
});

app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    token: 'mock-token-for-testing',
    user: { id: 1, username: req.body.username || 'testuser' }
  });
});

app.get('/api/training/scenarios', (req, res) => {
  res.json({
    success: true,
    scenarios: [
      { id: 1, name: 'Basic Radio Check', difficulty: 'beginner', description: 'Practice basic radio check procedures' },
      { id: 2, name: 'Field Report', difficulty: 'intermediate', description: 'Report field conditions to command' },
      { id: 3, name: 'Emergency Call', difficulty: 'advanced', description: 'Handle emergency communications' }
    ]
  });
});

app.post('/api/training/sessions', (req, res) => {
  res.json({
    success: true,
    session: { 
      id: 1, 
      scenarioId: req.body.scenarioId || 1, 
      status: 'in_progress',
      prompts: [
        { id: 1, text: 'Initiate radio check with Command', audioUrl: '/audio/prompt1.mp3' },
        { id: 2, text: 'Report your position and status', audioUrl: '/audio/prompt2.mp3' },
        { id: 3, text: 'Request permission to proceed to checkpoint Alpha', audioUrl: '/audio/prompt3.mp3' }
      ]
    }
  });
});

app.post('/api/training/sessions/:id/submit', (req, res) => {
  res.json({
    success: true,
    feedback: {
      accuracyScore: 85,
      procedureScore: 90,
      clarityScore: 80,
      overallScore: 85,
      corrections: ['Use "OVER" at the end of your transmission', 'Start with your callsign'],
      transcript: req.body.userResponse || 'Command, this is Alpha-1. I read you loud and clear.'
    }
  });
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'An error occurred on the server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Jimmy Yodeler TEST server running on port ${PORT}`);
  console.log('NOTE: This is a test server with mock data (no database connection)');
});

module.exports = app; // For testing purposes
