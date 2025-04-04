/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * Main Backend Server
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./db');
const config = require('./config');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const trainingRoutes = require('./routes/trainingRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const transcriptionRoutes = require('./routes/transcriptionRoutes');
const audioRoutes = require('./routes/audioRoutes');

// Initialize Express app
const app = express();
const PORT = config.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // Allow requests from any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Allow credentials (cookies, authorization headers, etc.)
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve audio files from audio-cache directory
app.use('/audio-cache', express.static(path.join(__dirname, '../audio-cache')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/transcribe', transcriptionRoutes);
app.use('/api/audio', audioRoutes);

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
async function startServer() {
  try {
    // Connect to database
    await connectDB();
    console.log('Database connected successfully');
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`Jimmy Yodeler server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app; // For testing purposes
