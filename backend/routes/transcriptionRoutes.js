/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * Transcription Routes
 */

const express = require('express');
const router = express.Router();
const multer = require('multer'); // For handling multipart/form-data
const { transcribeAudio } = require('../services/whisperService');
const jwt = require('jsonwebtoken');
const config = require('../config');

// Set up multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const decoded = jwt.verify(token, config.JWT.SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

/**
 * @route POST /api/transcribe
 * @desc Transcribe audio using Whisper API
 * @access Private
 */
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided'
      });
    }

    // Get options from request body
    const options = req.body.options ? JSON.parse(req.body.options) : {};
    
    // Transcribe audio using whisperService
    const transcription = await transcribeAudio(req.file.buffer, options);
    
    res.json({
      success: true,
      text: transcription
    });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error transcribing audio',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
