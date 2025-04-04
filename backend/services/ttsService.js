/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * Text-to-Speech Service with Audio Filtering
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const config = require('../config');

// Ensure audio cache directory exists
const AUDIO_CACHE_DIR = path.join(__dirname, '../../audio-cache');
if (!fs.existsSync(AUDIO_CACHE_DIR)) {
  fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true });
}

/**
 * Generate speech from text using a TTS API
 * @param {string} text - Text to convert to speech
 * @param {Object} options - TTS options
 * @returns {Promise<Buffer>} - Audio data as buffer
 */
async function generateSpeech(text, options = {}) {
  try {
    const apiKey = config.TTS.API_KEY;
    
    if (!apiKey) {
      console.warn('TTS API key is not configured, using local audio generation');
      return await generateLocalAudio(text, options);
    }
    
    // Configure TTS request
    const ttsOptions = {
      voice: options.voice || config.TTS.VOICE_ID,
      audioConfig: {
        audioEncoding: options.audioEncoding || config.TTS.AUDIO_ENCODING,
        speakingRate: options.speakingRate || config.TTS.SPEAKING_RATE,
        pitch: options.pitch || config.TTS.PITCH,
      },
      input: { text }
    };
    
    // Make API request to Google Cloud TTS (or other TTS provider)
    const response = await axios.post(
      'https://texttospeech.googleapis.com/v1/text:synthesize',
      ttsOptions,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Decode base64 audio content
    const audioContent = Buffer.from(response.data.audioContent, 'base64');
    return audioContent;
  } catch (error) {
    console.error('TTS generation error:', error);
    
    if (error.response) {
      console.error('API response error:', error.response.data);
      throw new Error(`TTS API error: ${error.response.data.error || error.message}`);
    }
    
    throw error;
  }
}

/**
 * Apply audio filter to simulate radio communication
 * @param {Buffer} audioBuffer - Original audio buffer
 * @param {string} filterType - Type of filter to apply
 * @returns {Promise<Buffer>} - Filtered audio buffer
 */
async function applyAudioFilter(audioBuffer, filterType = 'radio') {
  try {
    // Skip filtering if 'none' is specified or if the audio buffer is empty
    if (filterType === 'none' || !audioBuffer || audioBuffer.length === 0) {
      return audioBuffer;
    }
    
    // Create temporary files for processing
    const tempInputPath = path.join(AUDIO_CACHE_DIR, `temp_input_${Date.now()}.mp3`);
    const tempOutputPath = path.join(AUDIO_CACHE_DIR, `temp_output_${Date.now()}.mp3`);
    
    // Write input audio to temp file
    fs.writeFileSync(tempInputPath, audioBuffer);
    
    // Apply filter based on type using FFmpeg
    let ffmpegCommand;
    
    switch (filterType) {
      case 'radio':
        // Simulate radio transmission with bandpass filter, compression, and noise
        ffmpegCommand = `ffmpeg -i ${tempInputPath} -af "bandpass=f=1500:width_type=h:width=1000,compand=0.3|0.3:1|1:-90/-60|-60/-40|-40/-30|-20/-20:6:0:-90:0.2,highpass=f=800,lowpass=f=3000" ${tempOutputPath}`;
        break;
        
      case 'static':
        // Add static noise to the audio
        ffmpegCommand = `ffmpeg -i ${tempInputPath} -filter_complex "anoisesrc=amplitude=0.05:color=1:seed=12345[noise];[0][noise]amix=inputs=2:duration=shortest" ${tempOutputPath}`;
        break;
        
      case 'lowpass':
        // Apply low-pass filter (cuts high frequencies)
        ffmpegCommand = `ffmpeg -i ${tempInputPath} -af "lowpass=f=1000" ${tempOutputPath}`;
        break;
        
      case 'highpass':
        // Apply high-pass filter (cuts low frequencies)
        ffmpegCommand = `ffmpeg -i ${tempInputPath} -af "highpass=f=1000" ${tempOutputPath}`;
        break;
        
      default:
        // Default to radio filter
        ffmpegCommand = `ffmpeg -i ${tempInputPath} -af "bandpass=f=1500:width_type=h:width=1000,compand=0.3|0.3:1|1:-90/-60|-60/-40|-40/-30|-20/-20:6:0:-90:0.2" ${tempOutputPath}`;
    }
    
    // Execute FFmpeg command
    await exec(ffmpegCommand);
    
    // Read processed audio
    const filteredAudio = fs.readFileSync(tempOutputPath);
    
    // Clean up temp files
    fs.unlinkSync(tempInputPath);
    fs.unlinkSync(tempOutputPath);
    
    return filteredAudio;
  } catch (error) {
    console.error('Audio filtering error:', error);
    // If filtering fails, return original audio
    return audioBuffer;
  }
}

/**
 * Generate military voice procedure audio
 * @param {string} text - Text to convert to speech
 * @param {Object} options - Options including filter type
 * @returns {Promise<Buffer>} - Processed audio buffer
 */
async function generateMilitaryAudio(text, options = {}) {
  try {
    // Generate base speech
    const audioBuffer = await generateSpeech(text, {
      voice: options.voice || config.TTS.VOICE_ID,
      speakingRate: options.speakingRate || 0.9, // Slightly slower for clarity
      pitch: options.pitch || 0.0,
    });
    
    // Apply audio filter if specified
    const filterType = options.filterType || config.AUDIO_FILTERS.DEFAULT_FILTER;
    const filteredAudio = await applyAudioFilter(audioBuffer, filterType);
    
    return filteredAudio;
  } catch (error) {
    console.error('Military audio generation error:', error);
    throw error;
  }
}

/**
 * Generate and cache audio for a training scenario
 * @param {Object} scenario - Training scenario with script content
 * @returns {Promise<Object>} - Object mapping prompt indices to audio file paths
 */
async function generateScenarioAudio(scenario) {
  try {
    const scenarioId = scenario.id;
    const filterType = scenario.audio_filter_type || config.AUDIO_FILTERS.DEFAULT_FILTER;
    const scriptContent = typeof scenario.script_content === 'string' 
      ? JSON.parse(scenario.script_content) 
      : scenario.script_content;
    
    // Create scenario-specific cache directory
    const scenarioCacheDir = path.join(AUDIO_CACHE_DIR, `scenario_${scenarioId}`);
    if (!fs.existsSync(scenarioCacheDir)) {
      fs.mkdirSync(scenarioCacheDir, { recursive: true });
    }
    
    const audioMap = {};
    
    // Generate audio for each prompt in the script
    for (let i = 0; i < scriptContent.length; i++) {
      const prompt = scriptContent[i];
      const audioPath = path.join(scenarioCacheDir, `prompt_${i}.mp3`);
      
      // Check if audio already exists in cache
      if (fs.existsSync(audioPath)) {
        audioMap[i] = audioPath;
        continue;
      }
      
      // Generate new audio
      const audio = await generateMilitaryAudio(prompt, { filterType });
      
      // Save to cache
      fs.writeFileSync(audioPath, audio);
      audioMap[i] = audioPath;
    }
    
    return audioMap;
  } catch (error) {
    console.error('Scenario audio generation error:', error);
    throw error;
  }
}

/**
 * Generate audio locally using FFmpeg
 * @param {string} text - Text to convert to speech
 * @param {Object} options - Options for audio generation
 * @returns {Promise<Buffer>} - Audio data as buffer
 */
async function generateLocalAudio(text, options = {}) {
  try {
    // Create temporary files for processing
    const tempTextPath = path.join(AUDIO_CACHE_DIR, `temp_text_${Date.now()}.txt`);
    const tempOutputPath = path.join(AUDIO_CACHE_DIR, `temp_output_${Date.now()}.mp3`);
    
    // Write text to temp file
    fs.writeFileSync(tempTextPath, text);
    
    // Generate a noise audio file with text as metadata
    // This creates a white noise audio file that can be filtered
    // In a real implementation, you would use a local TTS engine
    const ffmpegCommand = `ffmpeg -f lavfi -i "sine=frequency=440:sample_rate=44100:duration=3" -af "volume=0.3" -metadata title="${text}" ${tempOutputPath}`;
    
    // Execute FFmpeg command
    await exec(ffmpegCommand);
    
    // Read generated audio
    const audioBuffer = fs.readFileSync(tempOutputPath);
    
    // Clean up temp files
    fs.unlinkSync(tempTextPath);
    fs.unlinkSync(tempOutputPath);
    
    return audioBuffer;
  } catch (error) {
    console.error('Local audio generation error:', error);
    
    // If FFmpeg fails, create an empty audio buffer
    // This is a last resort fallback
    return Buffer.from([]);
  }
}

module.exports = {
  generateSpeech,
  applyAudioFilter,
  generateMilitaryAudio,
  generateScenarioAudio,
  generateLocalAudio
};
