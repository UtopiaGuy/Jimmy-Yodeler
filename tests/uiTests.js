/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * UI Tests
 * 
 * This file contains tests for the frontend UI components.
 * Run with: npm run test:ui
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Setup JSDOM environment
let dom;
let window;
let document;
let mockAudioContext;
let mockMediaRecorder;

// Mock audio/voice functionality
class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.destination = {};
    this.sampleRate = 44100;
  }
  
  createMediaStreamSource() {
    return {
      connect: jest.fn()
    };
  }
  
  createAnalyser() {
    return {
      connect: jest.fn(),
      fftSize: 2048,
      getByteFrequencyData: jest.fn(),
      getFloatTimeDomainData: jest.fn()
    };
  }
  
  createGain() {
    return {
      connect: jest.fn(),
      gain: { value: 1.0 }
    };
  }
  
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
  
  suspend() {
    this.state = 'suspended';
    return Promise.resolve();
  }
}

class MockMediaRecorder {
  constructor() {
    this.state = 'inactive';
    this.ondataavailable = jest.fn();
    this.onstop = jest.fn();
  }
  
  start() {
    this.state = 'recording';
  }
  
  stop() {
    this.state = 'inactive';
    // Simulate data available event
    const event = { data: new Blob(['mock audio data'], { type: 'audio/webm' }) };
    if (this.ondataavailable) this.ondataavailable(event);
    if (this.onstop) this.onstop();
  }
}

// Setup and teardown
beforeAll(() => {
  // Load HTML file
  const html = fs.readFileSync(path.resolve(__dirname, '../frontend/index.html'), 'utf8');
  dom = new JSDOM(html, {
    url: 'http://localhost/',
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true
  });
  
  window = dom.window;
  document = window.document;
  
  // Mock browser APIs
  window.HTMLMediaElement.prototype.play = jest.fn().mockImplementation(() => Promise.resolve());
  window.HTMLMediaElement.prototype.pause = jest.fn();
  window.HTMLMediaElement.prototype.load = jest.fn();
  
  // Mock AudioContext and MediaRecorder
  mockAudioContext = new MockAudioContext();
  mockMediaRecorder = new MockMediaRecorder();
  
  window.AudioContext = jest.fn().mockImplementation(() => mockAudioContext);
  window.MediaRecorder = jest.fn().mockImplementation(() => mockMediaRecorder);
  
  // Mock fetch API
  window.fetch = jest.fn().mockImplementation((url, options) => {
    if (url.includes('/api/auth/login')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          token: 'mock-token',
          user: { id: 1, username: 'testuser' }
        })
      });
    }
    
    if (url.includes('/api/training/scenarios')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          scenarios: [
            { id: 1, name: 'Basic Radio Check', difficulty: 'beginner' },
            { id: 2, name: 'Field Report', difficulty: 'intermediate' }
          ]
        })
      });
    }
    
    if (url.includes('/api/training/sessions')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          session: { id: 1, scenarioId: 1, status: 'in_progress' }
        })
      });
    }
    
    if (url.includes('/api/training/sessions/1/submit')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          feedback: {
            accuracyScore: 85,
            procedureScore: 90,
            clarityScore: 80,
            overallScore: 85,
            corrections: ['Use "OVER" at the end of your transmission'],
            transcript: 'Command, this is Alpha-1. I read you loud and clear.'
          }
        })
      });
    }
    
    return Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ success: false, message: 'Not found' })
    });
  });
  
  // Load scripts
  const appScript = document.createElement('script');
  appScript.textContent = fs.readFileSync(path.resolve(__dirname, '../frontend/app.js'), 'utf8');
  document.body.appendChild(appScript);
  
  const voiceHandlerScript = document.createElement('script');
  voiceHandlerScript.textContent = fs.readFileSync(path.resolve(__dirname, '../frontend/voiceHandler.js'), 'utf8');
  document.body.appendChild(voiceHandlerScript);
  
  const feedbackUIScript = document.createElement('script');
  feedbackUIScript.textContent = fs.readFileSync(path.resolve(__dirname, '../frontend/feedbackUI.js'), 'utf8');
  document.body.appendChild(feedbackUIScript);
});

afterAll(() => {
  window.close();
});

// UI Tests
describe('Login UI', () => {
  test('Login form submission', async () => {
    // Setup
    document.getElementById('username').value = 'testuser';
    document.getElementById('password').value = 'password123';
    
    // Spy on fetch
    const fetchSpy = jest.spyOn(window, 'fetch');
    
    // Trigger login
    const loginForm = document.getElementById('login-form');
    loginForm.dispatchEvent(new window.Event('submit'));
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Assertions
    expect(fetchSpy).toHaveBeenCalledWith('/api/auth/login', expect.any(Object));
    expect(document.getElementById('login-container').style.display).toBe('none');
    expect(document.getElementById('app-container').style.display).toBe('block');
  });
});

describe('Scenario Selection UI', () => {
  test('Scenario list rendering', async () => {
    // Setup - ensure we're logged in
    window.localStorage.setItem('token', 'mock-token');
    
    // Trigger scenario loading
    window.loadScenarios();
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Assertions
    const scenarioList = document.getElementById('scenario-list');
    expect(scenarioList.children.length).toBe(2);
    expect(scenarioList.children[0].textContent).toContain('Basic Radio Check');
    expect(scenarioList.children[1].textContent).toContain('Field Report');
  });
  
  test('Scenario selection', async () => {
    // Setup - ensure scenarios are loaded
    await window.loadScenarios();
    
    // Select first scenario
    const firstScenario = document.getElementById('scenario-list').children[0];
    firstScenario.querySelector('button').click();
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Assertions
    expect(document.getElementById('scenario-container').style.display).toBe('none');
    expect(document.getElementById('training-container').style.display).toBe('block');
  });
});

describe('Voice Handler UI', () => {
  test('Start recording button', async () => {
    // Setup
    const startButton = document.getElementById('start-recording');
    const stopButton = document.getElementById('stop-recording');
    
    // Initial state
    expect(startButton.disabled).toBe(false);
    expect(stopButton.disabled).toBe(true);
    
    // Click start recording
    startButton.click();
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Assertions
    expect(startButton.disabled).toBe(true);
    expect(stopButton.disabled).toBe(false);
    expect(mockMediaRecorder.state).toBe('recording');
  });
  
  test('Stop recording button', async () => {
    // Setup - ensure recording is started
    document.getElementById('start-recording').click();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const stopButton = document.getElementById('stop-recording');
    
    // Click stop recording
    stopButton.click();
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Assertions
    expect(document.getElementById('start-recording').disabled).toBe(false);
    expect(stopButton.disabled).toBe(true);
    expect(mockMediaRecorder.state).toBe('inactive');
  });
});

describe('Feedback UI', () => {
  test('Feedback display after submission', async () => {
    // Setup - simulate recording and submission
    document.getElementById('start-recording').click();
    await new Promise(resolve => setTimeout(resolve, 100));
    document.getElementById('stop-recording').click();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate submission
    window.submitRecording(new Blob(['mock audio data'], { type: 'audio/webm' }));
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Assertions
    const feedbackContainer = document.getElementById('feedback-container');
    expect(feedbackContainer.style.display).toBe('block');
    expect(feedbackContainer.querySelector('.overall-score').textContent).toContain('85');
    expect(feedbackContainer.querySelector('.accuracy-score').textContent).toContain('85');
    expect(feedbackContainer.querySelector('.procedure-score').textContent).toContain('90');
    expect(feedbackContainer.querySelector('.clarity-score').textContent).toContain('80');
    
    // Check corrections
    const corrections = feedbackContainer.querySelector('.corrections');
    expect(corrections.textContent).toContain('Use "OVER" at the end of your transmission');
    
    // Check transcript
    const transcript = feedbackContainer.querySelector('.transcript');
    expect(transcript.textContent).toContain('Command, this is Alpha-1. I read you loud and clear.');
  });
  
  test('Try again button', async () => {
    // Setup - ensure feedback is displayed
    await window.submitRecording(new Blob(['mock audio data'], { type: 'audio/webm' }));
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Click try again
    const tryAgainButton = document.querySelector('.try-again-button');
    tryAgainButton.click();
    
    // Assertions
    expect(document.getElementById('feedback-container').style.display).toBe('none');
    expect(document.getElementById('training-container').style.display).toBe('block');
    expect(document.getElementById('start-recording').disabled).toBe(false);
  });
});

describe('Audio Filter UI', () => {
  test('Audio filter selection', () => {
    // Setup
    const filterSelect = document.getElementById('audio-filter');
    
    // Change filter
    filterSelect.value = 'radio';
    filterSelect.dispatchEvent(new window.Event('change'));
    
    // Assertions
    expect(window.currentAudioFilter).toBe('radio');
  });
  
  test('Audio playback with filter', async () => {
    // Setup
    const playPromptButton = document.getElementById('play-prompt');
    
    // Click play prompt
    playPromptButton.click();
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Assertions
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });
});

describe('Progress Tracking UI', () => {
  test('Progress indicator update', async () => {
    // Setup - complete one prompt
    await window.submitRecording(new Blob(['mock audio data'], { type: 'audio/webm' }));
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Click next prompt
    const nextPromptButton = document.querySelector('.next-prompt-button');
    nextPromptButton.click();
    
    // Assertions
    const progressIndicator = document.querySelector('.progress-indicator');
    expect(progressIndicator.textContent).toContain('2');
  });
});
