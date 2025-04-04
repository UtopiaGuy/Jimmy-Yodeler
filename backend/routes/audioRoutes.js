/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * Audio Routes
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { generateMilitaryAudio } = require('../services/ttsService');
const jwt = require('jsonwebtoken');
const config = require('../config');

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
 * @route POST /api/audio/filter
 * @desc Apply audio filter to an audio file
 * @access Private
 */
router.post('/filter', authenticateToken, async (req, res) => {
  try {
    const { filterType, sessionId } = req.body;
    
    // Check if audio file is provided
    if (!req.body.text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required for browser TTS'
      });
    }
    
    // Create a unique filename based on text content and filter type
    const text = req.body.text;
    const hash = Buffer.from(text).toString('base64').replace(/[/+=]/g, '_');
    const filename = `prompt_${hash}_${filterType || 'radio'}.mp3`;
    
    // Define the cache directory
    const AUDIO_CACHE_DIR = path.join(__dirname, '../../audio-cache');
    if (!fs.existsSync(AUDIO_CACHE_DIR)) {
      fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true });
    }
    
    // Define session-specific directory if sessionId is provided
    let audioDir = AUDIO_CACHE_DIR;
    if (sessionId) {
      audioDir = path.join(AUDIO_CACHE_DIR, `session_${sessionId}`);
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }
    }
    
    const audioPath = path.join(audioDir, filename);
    
    // Check if audio file already exists in cache
    if (fs.existsSync(audioPath)) {
      return res.json({
        success: true,
        audioUrl: `/audio-cache${sessionId ? `/session_${sessionId}` : ''}/${filename}`,
        useBrowserTTS: true,
        text: text
      });
    }
    
    // Since we're using browser TTS, we'll just create an empty file to cache the filter type
    fs.writeFileSync(audioPath, Buffer.from([]));
    
    // Return the text for browser TTS and filter type
    res.json({
      success: true,
      useBrowserTTS: true,
      text: text,
      filterType: filterType || config.AUDIO_FILTERS.DEFAULT_FILTER
    });
  } catch (error) {
    console.error('Audio generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating audio',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
