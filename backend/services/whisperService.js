/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * Whisper API Integration Service (Voice-to-Text)
 */

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const config = require('../config');

/**
 * Transcribe audio using OpenAI's Whisper API
 * @param {Buffer|string} audioData - Audio data as buffer or path to audio file
 * @param {Object} options - Transcription options
 * @returns {Promise<string>} - Transcribed text
 */
async function transcribeAudio(audioData, options = {}) {
  try {
    const apiKey = config.WHISPER_API.API_KEY;
    
    if (!apiKey) {
      throw new Error('Whisper API key is not configured');
    }
    
    const formData = new FormData();
    
    // Add the audio file
    if (Buffer.isBuffer(audioData)) {
      formData.append('file', audioData, {
        filename: 'audio.webm',
        contentType: 'audio/webm',
      });
    } else if (typeof audioData === 'string') {
      // If audioData is a file path
      formData.append('file', fs.createReadStream(audioData));
    } else {
      throw new Error('Invalid audio data format');
    }
    
    // Add model parameter (default to whisper-1)
    formData.append('model', options.model || 'whisper-1');
    
    // Add optional parameters
    if (options.language) formData.append('language', options.language);
    if (options.prompt) formData.append('prompt', options.prompt);
    if (options.responseFormat) formData.append('response_format', options.responseFormat);
    if (options.temperature) formData.append('temperature', options.temperature);
    
    // Make API request
    const response = await axios.post(
      config.WHISPER_API.ENDPOINT,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${apiKey}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );
    
    return response.data.text;
  } catch (error) {
    console.error('Whisper API transcription error:', error);
    
    if (error.response) {
      console.error('API response error:', error.response.data);
      throw new Error(`Whisper API error: ${error.response.data.error || error.message}`);
    }
    
    throw error;
  }
}

/**
 * Process audio for military voice procedure recognition
 * This enhances the basic transcription with military-specific context
 * @param {Buffer|string} audioData - Audio data as buffer or path to audio file
 * @param {Object} context - Additional context to improve transcription accuracy
 * @returns {Promise<string>} - Processed transcription
 */
async function processMilitaryAudio(audioData, context = {}) {
  try {
    // Create a prompt that helps Whisper understand military terminology
    const militaryPrompt = context.prompt || 
      "The following audio contains military voice procedure communication. " +
      "It may include callsigns, phonetic alphabet (Alpha, Bravo, Charlie...), " +
      "and standard military communication protocols.";
    
    // Set options with military context
    const options = {
      model: 'whisper-1',
      prompt: militaryPrompt,
      language: context.language || 'en',
      temperature: context.temperature || 0.2, // Lower temperature for more deterministic output
    };
    
    // Get basic transcription
    const transcription = await transcribeAudio(audioData, options);
    
    // Post-process the transcription to correct common military terms
    // This could be expanded with a more comprehensive military terminology dictionary
    const processedText = postProcessMilitaryTranscription(transcription, context);
    
    return processedText;
  } catch (error) {
    console.error('Military audio processing error:', error);
    throw error;
  }
}

/**
 * Post-process transcription to correct military terminology
 * @param {string} text - Raw transcription text
 * @param {Object} context - Additional context for processing
 * @returns {string} - Processed text
 */
function postProcessMilitaryTranscription(text, context = {}) {
  // Common military voice procedure corrections
  const corrections = {
    // Phonetic alphabet corrections
    'alfa': 'alpha',
    'charley': 'charlie',
    'juliet': 'juliett',
    'xray': 'x-ray',
    'yankee': 'yankee',
    'zulu': 'zulu',
    
    // Common military phrases
    'over and out': 'out', // "over and out" is not correct procedure
    'roger that': 'roger',
    'copy that': 'copy',
    
    // Numbers
    'one': '1',
    'two': '2',
    'three': '3',
    'four': '4',
    'five': '5',
    'six': '6',
    'seven': '7',
    'eight': '8',
    'nine': '9',
    'zero': '0',
    'niner': '9',
    'fife': '5',
  };
  
  // Add any scenario-specific corrections from context
  if (context.corrections && typeof context.corrections === 'object') {
    Object.assign(corrections, context.corrections);
  }
  
  // Apply corrections
  let processedText = text;
  for (const [incorrect, correct] of Object.entries(corrections)) {
    // Use word boundary in regex to avoid partial word matches
    const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
    processedText = processedText.replace(regex, correct);
  }
  
  return processedText;
}

module.exports = {
  transcribeAudio,
  processMilitaryAudio
};
