/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * Voice Handler Module
 * 
 * This module handles voice recording, processing, and integration with the Whisper API.
 * In a production environment, this would send audio to the backend for processing with Whisper.
 * For the demo, it simulates transcription locally.
 */

// Voice Handler Class
class VoiceHandler {
  constructor() {
    // Configuration
    this.config = {
      recordingTimeLimit: 30000, // 30 seconds max recording time
      autoStopSilence: 2000,     // Auto-stop after 2 seconds of silence
      silenceThreshold: -50,     // dB threshold for silence detection
      sampleRate: 44100,         // Sample rate for audio recording
      mimeType: 'audio/webm'     // MIME type for audio recording
    };
    
    // State
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioContext = null;
    this.audioStream = null;
    this.audioChunks = [];
    this.recordingTimer = null;
    this.silenceTimer = null;
    this.audioAnalyser = null;
    this.audioDataArray = null;
    
    // Callbacks
    this.onRecordingStart = null;
    this.onRecordingStop = null;
    this.onTranscriptionComplete = null;
    this.onRecordingProgress = null;
    this.onError = null;
    
    // Bind methods
    this.startRecording = this.startRecording.bind(this);
    this.stopRecording = this.stopRecording.bind(this);
    this.processAudio = this.processAudio.bind(this);
    this.checkSilence = this.checkSilence.bind(this);
    this.cleanup = this.cleanup.bind(this);
  }
  
  /**
   * Initialize the voice handler
   * @param {Object} callbacks - Callback functions
   */
  init(callbacks = {}) {
    // Set callbacks
    this.onRecordingStart = callbacks.onRecordingStart || (() => {});
    this.onRecordingStop = callbacks.onRecordingStop || (() => {});
    this.onTranscriptionComplete = callbacks.onTranscriptionComplete || (() => {});
    this.onRecordingProgress = callbacks.onRecordingProgress || (() => {});
    this.onError = callbacks.onError || ((error) => console.error('Voice Handler Error:', error));
    
    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.onError(new Error('Your browser does not support audio recording'));
      return false;
    }
    
    // Check Web Audio API support
    if (!window.AudioContext && !window.webkitAudioContext) {
      this.onError(new Error('Your browser does not support Web Audio API'));
      return false;
    }
    
    return true;
  }
  
  /**
   * Start recording audio
   * @returns {Promise<boolean>} - Success status
   */
  async startRecording() {
    if (this.isRecording) {
      return false;
    }
    
    try {
      // Reset state
      this.audioChunks = [];
      this.isRecording = true;
      
      // Request microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Set up audio context for silence detection
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioSource = this.audioContext.createMediaStreamSource(this.audioStream);
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 256;
      audioSource.connect(this.audioAnalyser);
      
      // Set up audio data array for analysis
      const bufferLength = this.audioAnalyser.frequencyBinCount;
      this.audioDataArray = new Uint8Array(bufferLength);
      
      // Create media recorder
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: this.config.mimeType,
        audioBitsPerSecond: 128000
      });
      
      // Set up event handlers
      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      });
      
      this.mediaRecorder.addEventListener('stop', () => {
        this.processAudio();
      });
      
      // Start recording
      this.mediaRecorder.start(100); // Collect data in 100ms chunks
      
      // Set up recording time limit
      this.recordingTimer = setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording();
        }
      }, this.config.recordingTimeLimit);
      
      // Start silence detection
      this.startSilenceDetection();
      
      // Call recording start callback
      this.onRecordingStart();
      
      return true;
    } catch (error) {
      this.onError(error);
      this.cleanup();
      return false;
    }
  }
  
  /**
   * Stop recording audio
   */
  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) {
      return;
    }
    
    // Stop media recorder
    if (this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    // Stop silence detection
    this.stopSilenceDetection();
    
    // Clear recording timer
    if (this.recordingTimer) {
      clearTimeout(this.recordingTimer);
      this.recordingTimer = null;
    }
    
    // Update state
    this.isRecording = false;
    
    // Call recording stop callback
    this.onRecordingStop();
  }
  
  /**
   * Start silence detection
   */
  startSilenceDetection() {
    // Check for silence every 100ms
    this.silenceCheckInterval = setInterval(this.checkSilence, 100);
  }
  
  /**
   * Stop silence detection
   */
  stopSilenceDetection() {
    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval);
      this.silenceCheckInterval = null;
    }
    
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }
  
  /**
   * Check for silence in the audio stream
   */
  checkSilence() {
    if (!this.audioAnalyser || !this.audioDataArray) {
      return;
    }
    
    // Get audio data
    this.audioAnalyser.getByteFrequencyData(this.audioDataArray);
    
    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < this.audioDataArray.length; i++) {
      sum += this.audioDataArray[i];
    }
    const average = sum / this.audioDataArray.length;
    
    // Convert to dB (rough approximation)
    const volume = average === 0 ? -100 : 20 * Math.log10(average / 255);
    
    // Update progress callback with volume level
    this.onRecordingProgress(volume);
    
    // Check if below silence threshold
    if (volume < this.config.silenceThreshold) {
      // Start silence timer if not already started
      if (!this.silenceTimer) {
        this.silenceTimer = setTimeout(() => {
          // Stop recording after silence duration
          this.stopRecording();
        }, this.config.autoStopSilence);
      }
    } else {
      // Reset silence timer if sound detected
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }
    }
  }
  
  /**
   * Process recorded audio
   */
  processAudio() {
    if (this.audioChunks.length === 0) {
      this.onError(new Error('No audio data recorded'));
      this.cleanup();
      return;
    }
    
    // Create audio blob
    const audioBlob = new Blob(this.audioChunks, { type: this.config.mimeType });
    
    // In a production environment, this would send the audio to the backend
    // For the demo, we'll simulate transcription locally
    this.simulateTranscription(audioBlob);
  }
  
  /**
   * Send audio to Whisper API via backend
   * @param {Blob} audioBlob - Audio data blob
   */
  async simulateTranscription(audioBlob) {
    try {
      // Create audio URL for playback
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create form data for API request
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      // Add options for military context
      const options = {
        model: 'whisper-1',
        prompt: "The following audio contains military voice procedure communication. " +
          "It may include callsigns, phonetic alphabet (Alpha, Bravo, Charlie...), " +
          "and standard military communication protocols.",
        language: 'en',
        temperature: 0.2
      };
      formData.append('options', JSON.stringify(options));
      
      // Send to backend API
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Transcription failed');
      }
      
      // Call transcription complete callback
      this.onTranscriptionComplete({
        text: data.text,
        audioUrl: audioUrl,
        confidence: 0.9 // API doesn't provide confidence, so we use a default
      });
    } catch (error) {
      this.onError(error);
    } finally {
      // Clean up
      this.cleanup();
    }
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    // Stop all tracks in the audio stream
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    
    // Close audio context
    if (this.audioContext) {
      if (this.audioContext.state !== 'closed') {
        this.audioContext.close();
      }
      this.audioContext = null;
    }
    
    // Clear timers and intervals
    this.stopSilenceDetection();
    
    if (this.recordingTimer) {
      clearTimeout(this.recordingTimer);
      this.recordingTimer = null;
    }
    
    // Reset state
    this.mediaRecorder = null;
    this.audioAnalyser = null;
    this.audioDataArray = null;
    this.isRecording = false;
  }
}

// Create and export a singleton instance
const voiceHandler = new VoiceHandler();

// Initialize voice handler when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const recordButton = document.getElementById('recordResponseBtn');
  const recordingStatus = document.getElementById('recordingStatus');
  const responseText = document.getElementById('responseText');
  const submitButton = document.getElementById('submitResponseBtn');
  
  // Initialize voice handler
  voiceHandler.init({
    onRecordingStart: () => {
      // Update UI
      recordingStatus.classList.add('active');
      recordingStatus.innerHTML = '<span>Recording...</span>';
      recordButton.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
      recordButton.classList.add('btn-danger');
      responseText.textContent = '';
      submitButton.disabled = true;
    },
    
    onRecordingStop: () => {
      // Update UI
      recordingStatus.classList.remove('active');
      recordingStatus.innerHTML = '<span>Processing...</span>';
      recordButton.innerHTML = '<i class="fas fa-microphone"></i> Record Response';
      recordButton.classList.remove('btn-danger');
    },
    
    onTranscriptionComplete: (result) => {
      // Update UI
      responseText.textContent = result.text;
      recordingStatus.innerHTML = '<span>Response recorded. Click Submit when ready.</span>';
      submitButton.disabled = false;
      
      // Store audio URL for playback
      if (window.appState) {
        window.appState.lastRecordingUrl = result.audioUrl;
      }
    },
    
    onRecordingProgress: (volume) => {
      // Update volume indicator (optional)
      // This could be used to show a visual indicator of audio level
    },
    
    onError: (error) => {
      console.error('Voice recording error:', error);
      alert('Error recording audio: ' + error.message);
      
      // Reset UI
      recordingStatus.classList.remove('active');
      recordingStatus.innerHTML = '<span>Recording failed. Try again.</span>';
      recordButton.innerHTML = '<i class="fas fa-microphone"></i> Record Response';
      recordButton.classList.remove('btn-danger');
    }
  });
  
  // Add click handler to record button if it exists
  if (recordButton) {
    recordButton.addEventListener('click', () => {
      if (voiceHandler.isRecording) {
        voiceHandler.stopRecording();
      } else {
        voiceHandler.startRecording();
      }
    });
  }
});

// Export for use in other modules
window.voiceHandler = voiceHandler;
