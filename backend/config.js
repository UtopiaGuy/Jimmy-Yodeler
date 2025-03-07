/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * Configuration File
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const config = {
  // Server configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database configuration
  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    USER: process.env.DB_USER || 'root',
    PASSWORD: process.env.DB_PASSWORD || '',
    NAME: process.env.DB_NAME || 'jimmy_yodeler',
    PORT: process.env.DB_PORT || 3306,
    CONNECTION_LIMIT: 10
  },
  
  // JWT configuration for authentication
  JWT: {
    SECRET: process.env.JWT_SECRET || 'jimmy_yodeler_secret_key',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // Whisper API configuration (for voice-to-text)
  WHISPER_API: {
    API_KEY: process.env.WHISPER_API_KEY,
    ENDPOINT: process.env.WHISPER_API_ENDPOINT || 'https://api.openai.com/v1/audio/transcriptions'
  },
  
  // Text-to-Speech configuration
  TTS: {
    API_KEY: process.env.TTS_API_KEY,
    VOICE_ID: process.env.TTS_VOICE_ID || 'en-US-Standard-B', // Default voice
    AUDIO_ENCODING: 'MP3',
    SPEAKING_RATE: 1.0,
    PITCH: 0.0
  },
  
  // Scoring configuration
  SCORING: {
    ACCURACY_THRESHOLD: 0.75, // Minimum accuracy score to pass
    SIMILARITY_ALGORITHM: 'levenshtein' // Algorithm to compare responses
  },
  
  // Audio filter settings
  AUDIO_FILTERS: {
    DEFAULT_FILTER: 'radio', // Default filter type
    AVAILABLE_FILTERS: ['none', 'radio', 'static', 'lowpass', 'highpass']
  }
};

module.exports = config;
