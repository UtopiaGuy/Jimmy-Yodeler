/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * Main Application JavaScript
 */

// Global state
const appState = {
  user: null,
  token: null,
  currentSection: 'authSection',
  scenarios: [],
  currentScenario: null,
  currentSession: null,
  currentPromptIndex: 0,
  transcript: [],
  userCallsign: 'Alpha-1',
  prompterCallsign: 'Command',
  apiBaseUrl: 'http://localhost:3000/api' // Change this to your API URL
};

// DOM Elements
const elements = {
  // Sections
  authSection: document.getElementById('authSection'),
  dashboardSection: document.getElementById('dashboardSection'),
  trainingSection: document.getElementById('trainingSection'),
  profileSection: document.getElementById('profileSection'),
  statsSection: document.getElementById('statsSection'),
  resultsSection: document.getElementById('resultsSection'),
  
  // Auth
  authTabs: document.querySelectorAll('.auth-tab'),
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  loginMessage: document.getElementById('loginMessage'),
  registerMessage: document.getElementById('registerMessage'),
  
  // User Menu
  userMenu: document.getElementById('userMenu'),
  userDisplayName: document.getElementById('userDisplayName'),
  userDropdown: document.getElementById('userDropdown'),
  profileLink: document.getElementById('profileLink'),
  statsLink: document.getElementById('statsLink'),
  logoutLink: document.getElementById('logoutLink'),
  
  // Dashboard
  scenariosList: document.getElementById('scenariosList'),
  difficultyFilter: document.getElementById('difficultyFilter'),
  categoryFilter: document.getElementById('categoryFilter'),
  
  // Training
  scenarioTitle: document.getElementById('scenarioTitle'),
  scenarioDifficulty: document.getElementById('scenarioDifficulty'),
  scenarioCategory: document.getElementById('scenarioCategory'),
  audioFilterSelect: document.getElementById('audioFilterSelect'),
  userCallsignInput: document.getElementById('userCallsignInput'),
  prompterCallsign: document.getElementById('prompterCallsign'),
  phaseContext: document.getElementById('phaseContext'),
  transcriptContent: document.getElementById('transcriptContent'),
  currentPrompt: document.getElementById('currentPrompt'),
  playPromptBtn: document.getElementById('playPromptBtn'),
  recordingStatus: document.getElementById('recordingStatus'),
  recordResponseBtn: document.getElementById('recordResponseBtn'),
  responseText: document.getElementById('responseText'),
  submitResponseBtn: document.getElementById('submitResponseBtn'),
  feedbackContent: document.getElementById('feedbackContent'),
  backToDashboard: document.getElementById('backToDashboard'),
  
  // Profile
  profileForm: document.getElementById('profileForm'),
  profileUsername: document.getElementById('profileUsername'),
  profileEmail: document.getElementById('profileEmail'),
  profileFirstName: document.getElementById('profileFirstName'),
  profileLastName: document.getElementById('profileLastName'),
  profileMessage: document.getElementById('profileMessage'),
  totalSessions: document.getElementById('totalSessions'),
  avgScore: document.getElementById('avgScore'),
  highestScore: document.getElementById('highestScore'),
  completedScenarios: document.getElementById('completedScenarios'),
  recentSessionsList: document.getElementById('recentSessionsList'),
  backFromProfile: document.getElementById('backFromProfile'),
  
  // Stats
  performanceChart: document.getElementById('performanceChart'),
  improvementList: document.getElementById('improvementList'),
  recentFeedbackList: document.getElementById('recentFeedbackList'),
  backFromStats: document.getElementById('backFromStats'),
  
  // Results
  finalScore: document.getElementById('finalScore'),
  resultScenarioTitle: document.getElementById('resultScenarioTitle'),
  resultDifficulty: document.getElementById('resultDifficulty'),
  resultDuration: document.getElementById('resultDuration'),
  resultTimestamp: document.getElementById('resultTimestamp'),
  responseBreakdownList: document.getElementById('responseBreakdownList'),
  retryScenarioBtn: document.getElementById('retryScenarioBtn'),
  newScenarioBtn: document.getElementById('newScenarioBtn'),
  backFromResults: document.getElementById('backFromResults'),
  
  // Audio
  audioPlayer: document.getElementById('audioPlayer')
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Check for existing session
  checkAuthStatus();
  
  // Set up event listeners
  setupEventListeners();
});

// Check if user is already logged in
function checkAuthStatus() {
  const token = localStorage.getItem('jyToken');
  if (token) {
    // Verify token with the server
    fetch(`${appState.apiBaseUrl}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Valid token, set user state
        appState.token = token;
        appState.user = data.user;
        updateUserDisplay();
        showSection('dashboardSection');
        loadScenarios();
      } else {
        // Invalid token, clear storage
        localStorage.removeItem('jyToken');
        showSection('authSection');
      }
    })
    .catch(error => {
      console.error('Auth verification error:', error);
      showSection('authSection');
    });
  } else {
    // No token found
    appState.user = null; // Ensure user is null
    updateUserDisplay(); // Update UI for guest user
    showSection('authSection');
  }
}

// Set up all event listeners
function setupEventListeners() {
  // Logo home link
  document.getElementById('homeLink').addEventListener('click', event => {
    event.preventDefault();
    showSection('dashboardSection');
  });
  
  // Auth tabs
  elements.authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      
      // Update active tab
      elements.authTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show corresponding form
      document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
      });
      document.getElementById(`${tabName}Form`).classList.add('active');
    });
  });
  
  // Login form
  elements.loginForm.addEventListener('submit', event => {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    login(username, password);
  });
  
  // Register form
  elements.registerForm.addEventListener('submit', event => {
    event.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (password !== confirmPassword) {
      showMessage(elements.registerMessage, 'Passwords do not match', 'error');
      return;
    }
    
    register(username, email, password);
  });
  
  // User menu dropdown
  elements.userMenu.addEventListener('click', () => {
    elements.userDropdown.classList.toggle('active');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', event => {
    if (!elements.userMenu.contains(event.target)) {
      elements.userDropdown.classList.remove('active');
    }
  });
  
  // User menu links
  elements.profileLink.addEventListener('click', event => {
    event.preventDefault();
    elements.userDropdown.classList.remove('active');
    loadUserProfile();
    showSection('profileSection');
  });
  
  elements.statsLink.addEventListener('click', event => {
    event.preventDefault();
    elements.userDropdown.classList.remove('active');
    loadUserStats();
    showSection('statsSection');
  });
  
  elements.logoutLink.addEventListener('click', event => {
    event.preventDefault();
    logout();
  });
  
  // Scenario filters
  elements.difficultyFilter.addEventListener('change', filterScenarios);
  elements.categoryFilter.addEventListener('change', filterScenarios);
  
  // Training controls
  elements.backToDashboard.addEventListener('click', () => {
    showSection('dashboardSection');
  });
  
  elements.playPromptBtn.addEventListener('click', playCurrentPrompt);
  elements.recordResponseBtn.addEventListener('click', toggleRecording);
  elements.submitResponseBtn.addEventListener('click', submitResponse);
  elements.audioFilterSelect.addEventListener('change', updateAudioFilter);
  elements.userCallsignInput.addEventListener('change', updateUserCallsign);
  
  // Profile controls
  elements.profileForm.addEventListener('submit', event => {
    event.preventDefault();
    updateProfile();
  });
  
  elements.backFromProfile.addEventListener('click', () => {
    showSection('dashboardSection');
  });
  
  // Stats controls
  elements.backFromStats.addEventListener('click', () => {
    showSection('dashboardSection');
  });
  
  // Results controls
  elements.retryScenarioBtn.addEventListener('click', retryScenario);
  elements.newScenarioBtn.addEventListener('click', () => {
    showSection('dashboardSection');
  });
  
  elements.backFromResults.addEventListener('click', () => {
    showSection('dashboardSection');
  });
}

// Authentication functions
function login(username, password) {
  fetch(`${appState.apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Store token and user data
      localStorage.setItem('jyToken', data.token);
      appState.token = data.token;
      appState.user = data.user;
      
      // Update UI
      updateUserDisplay();
      showSection('dashboardSection');
      loadScenarios();
      
      // Clear form
      elements.loginForm.reset();
    } else {
      showMessage(elements.loginMessage, data.message || 'Login failed', 'error');
    }
  })
  .catch(error => {
    console.error('Login error:', error);
    showMessage(elements.loginMessage, 'An error occurred during login', 'error');
  });
}

function register(username, email, password) {
  fetch(`${appState.apiBaseUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, email, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Store token and user data
      localStorage.setItem('jyToken', data.token);
      appState.token = data.token;
      appState.user = data.user;
      
      // Update UI
      updateUserDisplay();
      showSection('dashboardSection');
      loadScenarios();
      
      // Clear form
      elements.registerForm.reset();
    } else {
      showMessage(elements.registerMessage, data.message || 'Registration failed', 'error');
    }
  })
  .catch(error => {
    console.error('Registration error:', error);
    showMessage(elements.registerMessage, 'An error occurred during registration', 'error');
  });
}

function logout() {
  // Clear local storage and state
  localStorage.removeItem('jyToken');
  appState.token = null;
  appState.user = null;
  
  // Update UI to hide dropdown items
  updateUserDisplay();
  elements.userDropdown.classList.remove('active');
  
  // Show auth section
  showSection('authSection');
}

// Scenario functions
function loadScenarios() {
  // Show loading indicator
  elements.scenariosList.innerHTML = `
    <div class="loading-indicator">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading scenarios...</span>
    </div>
  `;
  
  fetch(`${appState.apiBaseUrl}/training/scenarios`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${appState.token}`
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      appState.scenarios = data.scenarios;
      renderScenarios();
    } else {
      elements.scenariosList.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <span>${data.message || 'Failed to load scenarios'}</span>
        </div>
      `;
    }
  })
  .catch(error => {
    console.error('Load scenarios error:', error);
    elements.scenariosList.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <span>An error occurred while loading scenarios</span>
      </div>
    `;
  });
}

function renderScenarios() {
  if (appState.scenarios.length === 0) {
    elements.scenariosList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-info-circle"></i>
        <span>No scenarios available</span>
      </div>
    `;
    return;
  }
  
  // Apply filters
  const difficultyFilter = elements.difficultyFilter.value;
  const categoryFilter = elements.categoryFilter.value;
  
  const filteredScenarios = appState.scenarios.filter(scenario => {
    const matchesDifficulty = difficultyFilter === 'all' || scenario.difficulty === difficultyFilter;
    const matchesCategory = categoryFilter === 'all' || scenario.category === categoryFilter;
    return matchesDifficulty && matchesCategory;
  });
  
  if (filteredScenarios.length === 0) {
    elements.scenariosList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-filter"></i>
        <span>No scenarios match the selected filters</span>
      </div>
    `;
    return;
  }
  
  // Render scenarios
  elements.scenariosList.innerHTML = filteredScenarios.map(scenario => `
    <div class="scenario-card" data-id="${scenario.id}">
      <div class="scenario-card-header">
        <h3>${scenario.title}</h3>
      </div>
      <div class="scenario-card-body">
        <p>${scenario.description || 'No description available'}</p>
      </div>
      <div class="scenario-card-footer">
        <span class="difficulty-badge difficulty-${scenario.difficulty}">
          ${scenario.difficulty.charAt(0).toUpperCase() + scenario.difficulty.slice(1)}
        </span>
        <button class="btn btn-primary start-scenario-btn" data-id="${scenario.id}">
          Start Training
        </button>
      </div>
    </div>
  `).join('');
  
  // Add event listeners to start buttons
  document.querySelectorAll('.start-scenario-btn').forEach(button => {
    button.addEventListener('click', () => {
      const scenarioId = button.getAttribute('data-id');
      startScenario(scenarioId);
    });
  });
}

function filterScenarios() {
  renderScenarios();
}

function startScenario(scenarioId) {
  // Find scenario
  const scenario = appState.scenarios.find(s => s.id == scenarioId);
  if (!scenario) return;
  
  // Set current scenario
  appState.currentScenario = scenario;
  
  // Get user callsign
  appState.userCallsign = elements.userCallsignInput.value || 'Alpha-1';
  
  // Create new training session
  fetch(`${appState.apiBaseUrl}/training/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${appState.token}`
    },
    body: JSON.stringify({
      scenarioId: scenario.id,
      audioFilterType: elements.audioFilterSelect.value,
      userCallsign: appState.userCallsign
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Set current session
      appState.currentSession = data.session;
      appState.currentPromptIndex = 0;
      appState.transcript = [];
      
      // Load scenario details
      loadScenarioDetails(scenario.id);
      
      // Show training section
      showSection('trainingSection');
    } else {
      alert(data.message || 'Failed to start training session');
    }
  })
  .catch(error => {
    console.error('Start session error:', error);
    alert('An error occurred while starting the training session');
  });
}

function loadScenarioDetails(scenarioId) {
  fetch(`${appState.apiBaseUrl}/training/scenarios/${scenarioId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${appState.token}`
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Update scenario with full details
      appState.currentScenario = data.scenario;
      
      // Update UI
      elements.scenarioTitle.textContent = data.scenario.title;
      elements.scenarioDifficulty.textContent = data.scenario.difficulty.charAt(0).toUpperCase() + data.scenario.difficulty.slice(1);
      elements.scenarioCategory.textContent = data.scenario.category.charAt(0).toUpperCase() + data.scenario.category.slice(1);
      elements.audioFilterSelect.value = data.scenario.audio_filter_type;
      
      // Special handling for Checkpoint Security Incident scenario
      if (data.scenario.title === "Checkpoint Security Incident") {
        console.log("Detected Checkpoint Security Incident scenario, using special handling");
        handleCheckpointSecurityIncident(data.scenario);
      } else {
        // Set first prompt for other scenarios
        setCurrentPrompt();
      }
    } else {
      alert(data.message || 'Failed to load scenario details');
    }
  })
  .catch(error => {
    console.error('Load scenario details error:', error);
    alert('An error occurred while loading scenario details');
  });
}

// Special handling for Checkpoint Security Incident scenario
function handleCheckpointSecurityIncident(scenario) {
  console.log("Handling Checkpoint Security Incident scenario");
  
  // Get all scenario lines in order
  const orderedLines = [...scenario.scenario_lines].sort((a, b) => a.line_number - b.line_number);
  console.log("Ordered lines:", orderedLines);
  
  // Find the first prompter line
  const firstPrompterIndex = orderedLines.findIndex(line => line.is_prompter === 1 || line.is_prompter === true);
  console.log("First prompter index:", firstPrompterIndex);
  
  // Get the initial user lines
  const initialUserLines = orderedLines.slice(0, firstPrompterIndex);
  console.log("Initial user lines:", initialUserLines);
  
  // Set the phase context from the first user line
  if (initialUserLines.length > 0) {
    const firstUserLine = initialUserLines[0];
    console.log("First user line:", firstUserLine);
    if (firstUserLine.phase_context) {
      elements.phaseContext.textContent = firstUserLine.phase_context;
      console.log("Set phase context:", firstUserLine.phase_context);
    }
  }
  
  // Set the user callsign if provided in the first user line
  if (initialUserLines.length > 0 && initialUserLines[0].user_callsign) {
    appState.userCallsign = initialUserLines[0].user_callsign;
    elements.userCallsignInput.value = initialUserLines[0].user_callsign;
    console.log("Set user callsign:", initialUserLines[0].user_callsign);
  }
  
  // Clear the response text - let the user figure out what to say
  elements.responseText.textContent = '';
  elements.submitResponseBtn.disabled = false;
  
  // Set a special prompt that indicates the user needs to initiate
  elements.currentPrompt.textContent = "Based on the mission context, initiate communication...";
  console.log("Set special prompt text");
  
  // Set the prompter callsign to empty since this is user-initiated
  elements.prompterCallsign.textContent = "";
  console.log("Cleared prompter callsign");
  
  // Store the first prompter line for later use after the user submits their first response
  appState.firstPrompterLine = orderedLines[firstPrompterIndex];
  console.log("Stored first prompter line:", appState.firstPrompterLine);
  
  // Store the expected first user line for validation
  appState.expectedFirstUserLine = initialUserLines[0].user_text;
  console.log("Expected first user line:", appState.expectedFirstUserLine);
  
  // Flag that this is a user-initiated scenario
  appState.isUserInitiatedScenario = true;
  console.log("Set isUserInitiatedScenario flag to true");
  
  // Clear the transcript
  elements.transcriptContent.innerHTML = '';
  appState.transcript = [];
  console.log("Cleared transcript");
}

function setCurrentPrompt() {
  if (!appState.currentScenario) return;
  
  console.log("Setting current prompt. Current prompt index:", appState.currentPromptIndex);
  console.log("Current transcript length:", appState.transcript.length);
  
  // Check if we have scenario_lines
  if (appState.currentScenario.scenario_lines && appState.currentScenario.scenario_lines.length > 0) {
    // Get all scenario lines in order
    const orderedLines = [...appState.currentScenario.scenario_lines].sort((a, b) => a.line_number - b.line_number);
    console.log("Ordered lines:", orderedLines);
    
    // Check if this is the first time we're setting the prompt and if the scenario starts with user lines
    if (appState.currentPromptIndex === 0 && appState.transcript.length === 0) {
      console.log("First time setting prompt");
      
      // Find the first prompter line
      const firstPrompterIndex = orderedLines.findIndex(line => line.is_prompter === 1 || line.is_prompter === true);
      console.log("First prompter index:", firstPrompterIndex);
      
      // If there are user lines before the first prompter line, set the phase context
      if (firstPrompterIndex > 0) {
        const initialUserLines = orderedLines.slice(0, firstPrompterIndex);
        console.log("Found initial user lines:", initialUserLines);
        
        // Set the phase context from the first user line
        if (initialUserLines.length > 0) {
          const firstUserLine = initialUserLines[0];
          console.log("First user line:", firstUserLine);
          if (firstUserLine.phase_context) {
            elements.phaseContext.textContent = firstUserLine.phase_context;
            console.log("Set phase context:", firstUserLine.phase_context);
          }
        }
        
        // Set the user callsign if provided in the first user line
        if (initialUserLines.length > 0 && initialUserLines[0].user_callsign) {
          appState.userCallsign = initialUserLines[0].user_callsign;
          elements.userCallsignInput.value = initialUserLines[0].user_callsign;
          console.log("Set user callsign:", initialUserLines[0].user_callsign);
        }
        
        // For scenarios that start with user lines, we need to handle the first prompt differently
        if (initialUserLines.length > 0 && initialUserLines[0].user_text) {
          console.log("Scenario starts with user lines, setting special prompt");
          
          // Clear the response text - let the user figure out what to say
          elements.responseText.textContent = '';
          elements.submitResponseBtn.disabled = false;
          
          // Set a special prompt that indicates the user needs to initiate
          elements.currentPrompt.textContent = "Based on the mission context, initiate communication...";
          console.log("Set special prompt text");
          
          // Set the prompter callsign to empty since this is user-initiated
          elements.prompterCallsign.textContent = "";
          console.log("Cleared prompter callsign");
          
          // Store the first prompter line for later use after the user submits their first response
          appState.firstPrompterLine = orderedLines[firstPrompterIndex];
          console.log("Stored first prompter line:", appState.firstPrompterLine);
          
          // Store the expected first user line for validation
          appState.expectedFirstUserLine = initialUserLines[0].user_text;
          console.log("Expected first user line:", appState.expectedFirstUserLine);
          
          // Flag that this is a user-initiated scenario
          appState.isUserInitiatedScenario = true;
          console.log("Set isUserInitiatedScenario flag to true");
          
          // Don't add anything to the transcript yet
          console.log("Returning early from setCurrentPrompt");
          return;
        }
      }
    }
    
    // Standard prompt handling for non-first prompts or scenarios that don't start with user lines
    // Find the current prompter line
    const prompterLines = appState.currentScenario.scenario_lines.filter(line => line.is_prompter === 1 || line.is_prompter === true);
    
    if (appState.currentPromptIndex >= prompterLines.length) {
      // End of scenario
      showSessionResults();
      return;
    }
    
    const currentLine = prompterLines[appState.currentPromptIndex];
    const prompt = currentLine.prompter_text;
    
    // Set the prompt text
    elements.currentPrompt.textContent = prompt;
    
    // Set the prompter callsign
    appState.prompterCallsign = currentLine.prompter_callsign || 'Command';
    elements.prompterCallsign.textContent = appState.prompterCallsign;
    
    // Set the user callsign if provided in the scenario line
    if (currentLine.user_callsign) {
      appState.userCallsign = currentLine.user_callsign;
      elements.userCallsignInput.value = currentLine.user_callsign;
    }
    
    // Set the phase context
    const phaseContext = currentLine.phase_context;
    if (phaseContext) {
      elements.phaseContext.textContent = phaseContext;
    } else if (!elements.phaseContext.textContent) {
      elements.phaseContext.textContent = 'No mission context available for this phase.';
    }
    
    // Reset response but keep feedback until a new response is submitted
    elements.responseText.textContent = '';
    elements.submitResponseBtn.disabled = true;
    
    // Add to transcript
    addToTranscript('command', prompt, appState.prompterCallsign);
  } 
  // Fallback to legacy script_content if scenario_lines is not available
  else if (appState.currentScenario.script_content) {
    const scriptContent = appState.currentScenario.script_content;
    if (appState.currentPromptIndex >= scriptContent.length) {
      // End of scenario
      showSessionResults();
      return;
    }
    
    const prompt = scriptContent[appState.currentPromptIndex];
    elements.currentPrompt.textContent = prompt;
    elements.prompterCallsign.textContent = 'Command';
    appState.prompterCallsign = 'Command';
    elements.phaseContext.textContent = 'No mission context available for this phase.';
    elements.responseText.textContent = '';
    elements.submitResponseBtn.disabled = true;
    
    // Add to transcript
    addToTranscript('command', prompt, 'Command');
  }
}

function playCurrentPrompt() {
  if (!appState.currentScenario) return;
  
  let prompt;
  
  // Check if we have scenario_lines
  if (appState.currentScenario.scenario_lines && appState.currentScenario.scenario_lines.length > 0) {
    // Find the current prompter line
    const prompterLines = appState.currentScenario.scenario_lines.filter(line => line.is_prompter);
    
    if (appState.currentPromptIndex >= prompterLines.length) {
      return;
    }
    
    prompt = prompterLines[appState.currentPromptIndex].prompter_text;
  } 
  // Fallback to legacy script_content if scenario_lines is not available
  else if (appState.currentScenario.script_content) {
    if (appState.currentPromptIndex >= appState.currentScenario.script_content.length) {
      return;
    }
    
    prompt = appState.currentScenario.script_content[appState.currentPromptIndex];
  } else {
    return;
  }
  
  // Show loading indicator on the play button
  elements.playPromptBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  elements.playPromptBtn.disabled = true;
  
  // Get the selected filter type
  const filterType = elements.audioFilterSelect.value;
  
  // Use the browser's TTS with the selected filter type
  fetch(`${appState.apiBaseUrl}/audio/filter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${appState.token}`
    },
    body: JSON.stringify({
      text: prompt,
      filterType: filterType,
      sessionId: appState.currentSession ? appState.currentSession.id : null
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Reset button
      elements.playPromptBtn.innerHTML = '<i class="fas fa-play"></i> Play Prompt';
      elements.playPromptBtn.disabled = false;
      
      // Use browser TTS with the selected filter
      const utterance = new SpeechSynthesisUtterance(prompt);
      
      // Apply filter effects using Web Audio API if possible
      if (window.AudioContext || window.webkitAudioContext) {
        try {
          // Create audio context
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          
          // Create filter nodes based on filter type
          let filterNode;
          
          switch (filterType) {
            case 'lowpass':
              filterNode = audioContext.createBiquadFilter();
              filterNode.type = 'lowpass';
              filterNode.frequency.value = 1000;
              break;
              
            case 'highpass':
              filterNode = audioContext.createBiquadFilter();
              filterNode.type = 'highpass';
              filterNode.frequency.value = 1000;
              break;
              
            case 'radio':
              // For radio effect, we'll use a combination of filters
              const bandpassFilter = audioContext.createBiquadFilter();
              bandpassFilter.type = 'bandpass';
              bandpassFilter.frequency.value = 1500;
              bandpassFilter.Q.value = 0.5;
              
              const distortion = audioContext.createWaveShaper();
              const curve = new Float32Array(44100);
              for (let i = 0; i < 44100; i++) {
                curve[i] = Math.tanh(i / 44100 * 3);
              }
              distortion.curve = curve;
              
              // Connect the nodes
              bandpassFilter.connect(distortion);
              filterNode = distortion;
              break;
              
            case 'static':
              // For static, we'll add noise
              const noiseNode = audioContext.createBufferSource();
              const noiseBuffer = audioContext.createBuffer(1, 44100, 44100);
              const noiseData = noiseBuffer.getChannelData(0);
              for (let i = 0; i < 44100; i++) {
                noiseData[i] = Math.random() * 0.05;
              }
              noiseNode.buffer = noiseBuffer;
              noiseNode.loop = true;
              noiseNode.start();
              
              const gainNode = audioContext.createGain();
              gainNode.gain.value = 0.05;
              noiseNode.connect(gainNode);
              filterNode = gainNode;
              break;
              
            default:
              // No filter
              filterNode = null;
          }
          
          // Apply the filter if it exists
          if (filterNode) {
            // We can't directly filter the utterance, so we'll just play the filtered audio
            // This is a limitation of the Web Speech API
            console.log(`Applied ${filterType} filter effect using Web Audio API`);
          }
        } catch (error) {
          console.error('Error applying audio filter:', error);
        }
      }
      
      // Play the audio using browser TTS
      speechSynthesis.speak(utterance);
    } else {
      console.error('Error generating audio:', data.message);
      elements.playPromptBtn.innerHTML = '<i class="fas fa-play"></i> Play Prompt';
      elements.playPromptBtn.disabled = false;
      
      // Fallback to browser TTS without filters
      const utterance = new SpeechSynthesisUtterance(prompt);
      speechSynthesis.speak(utterance);
    }
  })
  .catch(error => {
    console.error('Audio fetch error:', error);
    elements.playPromptBtn.innerHTML = '<i class="fas fa-play"></i> Play Prompt';
    elements.playPromptBtn.disabled = false;
    
    // Fallback to browser TTS without filters
    const utterance = new SpeechSynthesisUtterance(prompt);
    speechSynthesis.speak(utterance);
  });
}

function addToTranscript(sender, text, callsign) {
  // Add to state
  appState.transcript.push({ sender, text, callsign });
  
  // Update UI
  const messageElement = document.createElement('div');
  messageElement.className = 'transcript-message';
  
  const senderDisplay = sender === 'command' ? 'Command' : 'You';
  const callsignDisplay = callsign || (sender === 'command' ? appState.prompterCallsign : appState.userCallsign);
  
  messageElement.innerHTML = `
    <div class="message-sender ${sender}">
      <span class="message-callsign">${callsignDisplay}:</span> ${senderDisplay}
    </div>
    <div class="message-text">${text}</div>
  `;
  
  elements.transcriptContent.appendChild(messageElement);
  elements.transcriptContent.scrollTop = elements.transcriptContent.scrollHeight;
}

function submitResponse() {
  if (!appState.currentSession || !elements.responseText.textContent) return;
  
  const userResponse = elements.responseText.textContent;
  
  // Add to transcript
  addToTranscript('user', userResponse, appState.userCallsign);
  
  // Handle user-initiated scenario first response
  if (appState.isUserInitiatedScenario) {
    console.log("Handling user-initiated scenario first response");
    
    // Check if the user's response matches the expected first user line
    const expectedResponse = appState.expectedFirstUserLine;
    const isCorrect = compareResponses(userResponse, expectedResponse);
    
    // Show feedback for the first response
    showInitialResponseFeedback(userResponse, expectedResponse, isCorrect);
    
    // After the user submits their first response, show the first prompter line
    const prompterLine = appState.firstPrompterLine;
    const prompt = prompterLine.prompter_text;
    
    // Set the prompter callsign
    appState.prompterCallsign = prompterLine.prompter_callsign || 'Command';
    elements.prompterCallsign.textContent = appState.prompterCallsign;
    
    // Set the prompt text
    elements.currentPrompt.textContent = prompt;
    
    // Update the phase context if available in the prompter line
    if (prompterLine.phase_context) {
      elements.phaseContext.textContent = prompterLine.phase_context;
      console.log("Updated phase context:", prompterLine.phase_context);
    }
    
    // Add to transcript
    addToTranscript('command', prompt, appState.prompterCallsign);
    
    // Reset flag
    appState.isUserInitiatedScenario = false;
    
    // Reset response
    elements.responseText.textContent = '';
    elements.submitResponseBtn.disabled = true;
    
    return;
  }
  
  // Submit to server
  fetch(`${appState.apiBaseUrl}/training/sessions/${appState.currentSession.id}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${appState.token}`
    },
    body: JSON.stringify({
      promptIndex: appState.currentPromptIndex,
      userResponse,
      userCallsign: appState.userCallsign
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Show feedback
      showFeedback(data.feedback);
      
      // Check if this was the last prompt
      if (data.isLastPrompt) {
        // Show session results
        showSessionResults(data.sessionResult);
      } else {
        // Move to next prompt
        appState.currentPromptIndex = data.nextPromptIndex;
        
        // Set a small delay before showing the next prompt
        setTimeout(() => {
          setCurrentPrompt();
        }, 3000);
      }
    } else {
      alert(data.message || 'Failed to submit response');
    }
  })
  .catch(error => {
    console.error('Submit response error:', error);
    alert('An error occurred while submitting your response');
  });
}

function showFeedback(feedback) {
  // Create feedback element
  const feedbackElement = document.createElement('div');
  feedbackElement.className = 'feedback-item';
  
  // Determine score class
  let scoreClass = 'score-low';
  if (feedback.accuracyScore >= 0.9) {
    scoreClass = 'score-high';
  } else if (feedback.accuracyScore >= 0.7) {
    scoreClass = 'score-medium';
  }
  
  // Format score as percentage
  const scorePercent = Math.round(feedback.accuracyScore * 100);
  
  feedbackElement.innerHTML = `
    <div class="feedback-score ${scoreClass}">${scorePercent}% Accuracy</div>
    <div class="feedback-text">${feedback.feedbackText}</div>
    <div class="response-comparison">
      <div class="user-said">
        <strong>You said:</strong><br>
        ${feedback.userResponse}
      </div>
      <div class="expected-response">
        <strong>Expected:</strong><br>
        ${feedback.expectedResponse}
      </div>
    </div>
  `;
  
  // Clear previous feedback when submitting a new response
  elements.feedbackContent.innerHTML = '';
  elements.feedbackContent.appendChild(feedbackElement);
}

function showSessionResults(sessionResult) {
  if (!appState.currentSession) return;
  
  console.log('showSessionResults called with sessionResult:', sessionResult);
  
  // If sessionResult is not provided, fetch it
  if (!sessionResult) {
    fetch(`${appState.apiBaseUrl}/training/sessions/${appState.currentSession.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${appState.token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Fetched session data:', data.session);
        displayResults(data.session, data.feedback);
      } else {
        alert(data.message || 'Failed to load session results');
      }
    })
    .catch(error => {
      console.error('Load session results error:', error);
      alert('An error occurred while loading session results');
    });
  } else {
    // Use provided session result
    console.log('Using provided sessionResult, overallScore:', sessionResult.overallScore);
    displayResults({
      ...appState.currentSession,
      score: parseFloat(sessionResult.overallScore || 0),
      completedAt: sessionResult.completedAt
    });
  }
}

function displayResults(session, feedback) {
  console.log('displayResults called with session:', session);
  
  // Update results UI - ensure score is a number and handle null/undefined
  const finalScore = parseFloat(session.score || 0);
  console.log('Final score being displayed:', finalScore);
  
  // Show both actual score and max possible score (100%)
  // Multiply by 100 to convert from decimal (0.8) to percentage (80%)
  elements.finalScore.innerHTML = `${Math.round(finalScore * 100)}<span class="max-score">/100</span>`;
  // Set scenario title and difficulty - ensure we have valid values
  if (appState.currentScenario && appState.currentScenario.title) {
    elements.resultScenarioTitle.textContent = appState.currentScenario.title;
  } else if (session.scenarioTitle) {
    elements.resultScenarioTitle.textContent = session.scenarioTitle;
  } else {
    console.error('Missing scenario title');
    elements.resultScenarioTitle.textContent = 'Unknown Scenario';
  }
  
  if (appState.currentScenario && appState.currentScenario.difficulty) {
    elements.resultDifficulty.textContent = appState.currentScenario.difficulty.charAt(0).toUpperCase() + appState.currentScenario.difficulty.slice(1);
  } else if (session.difficulty) {
    elements.resultDifficulty.textContent = session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1);
  } else {
    console.error('Missing difficulty');
    elements.resultDifficulty.textContent = 'Unknown';
  }
  
  // Calculate duration - ensure we have valid dates
  console.log('Session start time:', session.startedAt);
  console.log('Session completion time:', session.completedAt);
  
  if (session.startedAt && session.completedAt) {
    try {
      const startTime = new Date(session.startedAt);
      const endTime = new Date(session.completedAt);
      
      // Ensure both dates are valid
      if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
        const durationMs = endTime - startTime;
        
        // Ensure duration is positive
        if (durationMs >= 0) {
          const durationMinutes = Math.floor(durationMs / 60000);
          const durationSeconds = Math.floor((durationMs % 60000) / 1000);
          elements.resultDuration.textContent = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
        } else {
          console.error('Negative duration calculated:', durationMs);
          elements.resultDuration.textContent = 'N/A';
        }
      } else {
        console.error('Invalid date objects:', { startTime, endTime });
        elements.resultDuration.textContent = 'N/A';
      }
    } catch (error) {
      console.error('Error calculating duration:', error);
      elements.resultDuration.textContent = 'N/A';
    }
  } else {
    console.error('Missing date values:', { startedAt: session.startedAt, completedAt: session.completedAt });
    elements.resultDuration.textContent = 'N/A';
  }
  
  // Format timestamp - ensure we have a valid date
  if (session.completedAt) {
    try {
      const completedDate = new Date(session.completedAt);
      if (!isNaN(completedDate.getTime())) {
        elements.resultTimestamp.textContent = completedDate.toLocaleString();
      } else {
        console.error('Invalid completion date:', session.completedAt);
        elements.resultTimestamp.textContent = 'N/A';
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      elements.resultTimestamp.textContent = 'N/A';
    }
  } else {
    console.error('Missing completion date');
    elements.resultTimestamp.textContent = 'N/A';
  }
  
  // Show response breakdown
  if (feedback) {
    renderResponseBreakdown(feedback);
  } else {
    // Fetch feedback if not provided
    fetch(`${appState.apiBaseUrl}/feedback/session/${session.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${appState.token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        renderResponseBreakdown(data.feedback);
      }
    })
    .catch(error => {
      console.error('Load feedback error:', error);
    });
  }
  
  // Show results section
  showSection('resultsSection');
}

function renderResponseBreakdown(feedback) {
  elements.responseBreakdownList.innerHTML = '';
  
  feedback.forEach((item, index) => {
    const scorePercent = Math.round(item.accuracy_score * 100);
    let scoreClass = 'score-low';
    if (item.accuracy_score >= 0.9) {
      scoreClass = 'score-high';
    } else if (item.accuracy_score >= 0.7) {
      scoreClass = 'score-medium';
    }
    
    // Get the prompt text
    let promptText = '';
    
    // Try to get prompt from scenario_lines first
    if (appState.currentScenario.scenario_lines) {
      const prompterLines = appState.currentScenario.scenario_lines.filter(line => line.is_prompter);
      if (item.prompt_index < prompterLines.length) {
        promptText = prompterLines[item.prompt_index].prompter_text;
      }
    }
    
    // Fallback to script_content if needed
    if (!promptText && appState.currentScenario.script_content) {
      promptText = appState.currentScenario.script_content[item.prompt_index];
    }
    
    // If still no prompt text, use a placeholder
    if (!promptText) {
      promptText = 'Prompt text not available';
    }
    
    const breakdownItem = document.createElement('div');
    breakdownItem.className = 'breakdown-item';
    breakdownItem.innerHTML = `
      <div class="breakdown-prompt">
        <strong>Prompt ${index + 1}:</strong> ${promptText}
      </div>
      <div class="feedback-score ${scoreClass}">${scorePercent}% Accuracy</div>
      <div class="feedback-text">${item.feedback_text}</div>
      <div class="response-comparison">
        <div class="user-said">
          <strong>You said:</strong><br>
          ${item.user_response}
        </div>
        <div class="expected-response">
          <strong>Expected:</strong><br>
          ${item.expected_response}
        </div>
      </div>
    `;
    
    elements.responseBreakdownList.appendChild(breakdownItem);
  });
}

function retryScenario() {
  if (!appState.currentScenario) return;
  
  // Start the same scenario again
  startScenario(appState.currentScenario.id);
}

// Profile functions
function loadUserProfile() {
  fetch(`${appState.apiBaseUrl}/users/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${appState.token}`
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Update profile form
      elements.profileUsername.value = data.user.username;
      elements.profileEmail.value = data.user.email;
      elements.profileFirstName.value = data.user.firstName || '';
      elements.profileLastName.value = data.user.lastName || '';
      
      // Update stats - multiply scores by 100 to convert from decimal (0.8) to percentage (80%)
      elements.totalSessions.textContent = data.user.stats.sessionCount;
      elements.avgScore.textContent = data.user.stats.averageScore ? Math.round(data.user.stats.averageScore * 100) : 0;
      elements.highestScore.textContent = data.user.stats.highestScore ? Math.round(data.user.stats.highestScore * 100) : 0;
      elements.completedScenarios.textContent = data.user.stats.uniqueScenarios || 0;
      
      // Load recent sessions
      loadRecentSessions();
    } else {
      showMessage(elements.profileMessage, data.message || 'Failed to load profile', 'error');
    }
  })
  .catch(error => {
    console.error('Load profile error:', error);
    showMessage(elements.profileMessage, 'An error occurred while loading profile', 'error');
  });
}

function updateProfile() {
  const profileData = {
    email: elements.profileEmail.value,
    firstName: elements.profileFirstName.value,
    lastName: elements.profileLastName.value
  };
  
  fetch(`${appState.apiBaseUrl}/users/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${appState.token}`
    },
    body: JSON.stringify(profileData)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Update user state
      appState.user = data.user;
      updateUserDisplay();
      
      showMessage(elements.profileMessage, 'Profile updated successfully', 'success');
    } else {
      showMessage(elements.profileMessage, data.message || 'Failed to update profile', 'error');
    }
  })
  .catch(error => {
    console.error('Update profile error:', error);
    showMessage(elements.profileMessage, 'An error occurred while updating profile', 'error');
  });
}

function loadRecentSessions() {
  fetch(`${appState.apiBaseUrl}/training/sessions`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${appState.token}`
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      renderRecentSessions(data.sessions);
    } else {
      elements.recentSessionsList.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <span>${data.message || 'Failed to load sessions'}</span>
        </div>
      `;
    }
  })
  .catch(error => {
    console.error('Load sessions error:', error);
    elements.recentSessionsList.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <span>An error occurred while loading sessions</span>
      </div>
    `;
  });
}

function renderRecentSessions(sessions) {
  if (sessions.length === 0) {
    elements.recentSessionsList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-info-circle"></i>
        <span>No training sessions yet</span>
      </div>
    `;
    return;
  }
  
  // Limit to 6 most recent sessions
  const recentSessions = sessions.slice(0, 6);
  
  elements.recentSessionsList.innerHTML = recentSessions.map(session => {
    // Format date - handle snake_case field names from backend
    const date = new Date(session.started_at).toLocaleDateString();
    
    // Format score - multiply by 100 to convert from decimal (0.8) to percentage (80%)
    const scoreDisplay = session.score !== null 
      ? `<span class="session-score">${Math.round(session.score * 100)}%</span>`
      : '<span class="session-status">In Progress</span>';
    
    return `
      <div class="session-card">
        <div class="session-title">${session.scenario_title || 'Unknown Scenario'}</div>
        <div class="session-date">${date}</div>
        ${scoreDisplay}
      </div>
    `;
  }).join('');
  
  // Add click event to session cards
  document.querySelectorAll('.session-card').forEach((card, index) => {
    card.addEventListener('click', () => {
      const session = recentSessions[index];
      if (session.status === 'completed') {
        // Load session details and show results
        loadSessionDetails(session.id);
      }
    });
  });
  
  // Log sessions data for debugging
  console.log('Recent sessions data:', recentSessions);
}

function loadSessionDetails(sessionId) {
  fetch(`${appState.apiBaseUrl}/training/sessions/${sessionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${appState.token}`
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('Received session data:', data.session);
      
      // Convert snake_case to camelCase for session data
      const sessionData = {
        id: data.session.id,
        scenarioId: data.session.scenario_id,
        scenarioTitle: data.session.scenario_title,
        difficulty: data.session.difficulty,
        category: data.session.category,
        audioFilterType: data.session.audio_filter_type,
        status: data.session.status,
        startedAt: data.session.started_at,
        completedAt: data.session.completed_at,
        score: data.session.score,
        userCallsign: data.session.user_callsign,
        script_content: data.session.script_content,
        expected_responses: data.session.expected_responses,
        scenario_lines: data.session.scenario_lines
      };
      
      console.log('Converted session data:', sessionData);
      
      // Set current session and scenario
      appState.currentSession = sessionData;
      appState.currentScenario = {
        id: sessionData.scenarioId,
        title: sessionData.scenarioTitle,
        difficulty: sessionData.difficulty,
        category: sessionData.category,
        script_content: sessionData.script_content
      };
      
      // Display results
      displayResults(sessionData, data.feedback);
    } else {
      alert(data.message || 'Failed to load session details');
    }
  })
  .catch(error => {
    console.error('Load session details error:', error);
    alert('An error occurred while loading session details');
  });
}

// Stats functions
function loadUserStats() {
  fetch(`${appState.apiBaseUrl}/feedback/user`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${appState.token}`
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      renderPerformanceChart(data.stats);
      renderImprovementAreas(data.improvementAreas);
      renderRecentFeedback(data.feedback.items);
    } else {
      alert(data.message || 'Failed to load statistics');
    }
  })
  .catch(error => {
    console.error('Load stats error:', error);
    alert('An error occurred while loading statistics');
  });
}

// Global variable to track if a chart rendering is in progress
let chartRenderingInProgress = false;

function renderPerformanceChart(stats) {
  // Reset the chart rendering flag
  chartRenderingInProgress = false;
  
  // Check if the canvas element exists
  if (!elements.performanceChart) {
    console.log('Performance chart canvas not found');
    return;
  }
  
  // Replace the chart with a message about the upcoming feature
  const container = elements.performanceChart.parentElement;
  
  // Create a message element
  const messageElement = document.createElement('div');
  messageElement.className = 'stats-coming-soon';
  messageElement.innerHTML = `
    <div class="coming-soon-icon">
      <i class="fas fa-chart-line"></i>
    </div>
    <h3>Performance Statistics Coming Soon!</h3>
    <p>We're working on an improved statistics dashboard that will be available in the next update.</p>
    <p>This feature will provide detailed insights into your training performance and progress over time.</p>
  `;
  
  // Replace the canvas with the message
  container.innerHTML = '';
  container.appendChild(messageElement);
  
  // Add some basic styling if not already in CSS
  const style = document.createElement('style');
  style.textContent = `
    .stats-coming-soon {
      text-align: center;
      padding: 2rem;
      background-color: #f8f9fa;
      border-radius: 8px;
      margin: 1rem 0;
    }
    .coming-soon-icon {
      font-size: 3rem;
      color: #3498db;
      margin-bottom: 1rem;
    }
    .stats-coming-soon h3 {
      color: #2c3e50;
      margin-bottom: 1rem;
    }
    .stats-coming-soon p {
      color: #7f8c8d;
      margin-bottom: 0.5rem;
    }
  `;
  
  // Only add the style if it doesn't already exist
  if (!document.querySelector('style[data-coming-soon-style]')) {
    style.setAttribute('data-coming-soon-style', 'true');
    document.head.appendChild(style);
  }
}

function renderImprovementAreas(areas) {
  if (!elements.improvementList) return;
  
  if (!areas || areas.length === 0) {
    elements.improvementList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-check-circle"></i>
        <span>No specific improvement areas identified yet</span>
      </div>
    `;
    return;
  }
  
  elements.improvementList.innerHTML = areas.map(area => `
    <div class="improvement-item">
      <div class="improvement-issue">${area.issue}</div>
      <div class="improvement-suggestion">${area.suggestion}</div>
    </div>
  `).join('');
}

function renderRecentFeedback(feedbackItems) {
  if (!elements.recentFeedbackList) return;
  
  if (!feedbackItems || feedbackItems.length === 0) {
    elements.recentFeedbackList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-info-circle"></i>
        <span>No feedback available yet</span>
      </div>
    `;
    return;
  }
  
  // Limit to 5 most recent feedback items
  const recentFeedback = feedbackItems.slice(0, 5);
  
  elements.recentFeedbackList.innerHTML = recentFeedback.map(item => {
    // Determine score class
    let scoreClass = 'score-low';
    if (item.accuracy_score >= 0.9) {
      scoreClass = 'score-high';
    } else if (item.accuracy_score >= 0.7) {
      scoreClass = 'score-medium';
    }
    
    // Format score as percentage
    const scorePercent = Math.round(item.accuracy_score * 100);
    
    return `
      <div class="feedback-item">
        <div class="feedback-header">
          <div class="feedback-score ${scoreClass}">${scorePercent}% Accuracy</div>
          <div class="feedback-scenario">${item.scenario_title}</div>
        </div>
        <div class="feedback-text">${item.feedback_text}</div>
      </div>
    `;
  }).join('');
}

// Voice recording functions
function toggleRecording() {
  if (appState.isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

function startRecording() {
  // Check if browser supports getUserMedia
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Your browser does not support audio recording');
    return;
  }
  
  // Request microphone access
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      appState.mediaRecorder = mediaRecorder;
      appState.audioChunks = [];
      
      // Set up event handlers
      mediaRecorder.addEventListener('dataavailable', event => {
        appState.audioChunks.push(event.data);
      });
      
      mediaRecorder.addEventListener('stop', () => {
        // Create audio blob
        const audioBlob = new Blob(appState.audioChunks, { type: 'audio/webm' });
        
        // In a real implementation, this would send the audio to the Whisper API
        // For now, we'll simulate transcription with a timeout
        simulateTranscription(audioBlob);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        appState.isRecording = false;
        updateRecordingUI(false);
      });
      
      // Start recording
      mediaRecorder.start();
      appState.isRecording = true;
      updateRecordingUI(true);
    })
    .catch(error => {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone: ' + error.message);
    });
}

function stopRecording() {
  if (appState.mediaRecorder && appState.isRecording) {
    appState.mediaRecorder.stop();
  }
}

function updateRecordingUI(isRecording) {
  if (isRecording) {
    elements.recordingStatus.classList.add('active');
    elements.recordingStatus.innerHTML = '<span>Recording...</span>';
    elements.recordResponseBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
    elements.recordResponseBtn.classList.add('btn-danger');
  } else {
    elements.recordingStatus.classList.remove('active');
    elements.recordingStatus.innerHTML = '<span>Processing...</span>';
    elements.recordResponseBtn.innerHTML = '<i class="fas fa-microphone"></i> Record Response';
    elements.recordResponseBtn.classList.remove('btn-danger');
  }
}

async function simulateTranscription(audioBlob) {
  try {
    // Create a URL for the audio blob
    const audioUrl = URL.createObjectURL(audioBlob);
    elements.audioPlayer.src = audioUrl;
    
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
    const response = await fetch(`${appState.apiBaseUrl}/transcribe`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Transcription failed');
    }
    
    // Update UI
    elements.responseText.textContent = data.text;
    elements.submitResponseBtn.disabled = false;
    elements.recordingStatus.innerHTML = '<span>Response recorded. Click Submit when ready.</span>';
  } catch (error) {
    console.error('Transcription error:', error);
    alert('Error transcribing audio: ' + error.message);
    
    // Reset UI
    elements.recordingStatus.innerHTML = '<span>Transcription failed. Try again.</span>';
  }
}

// Utility functions
function updateAudioFilter() {
  // Update the audio filter in the local state
  if (appState.currentSession) {
    const newFilterType = elements.audioFilterSelect.value;
    appState.currentSession.audioFilterType = newFilterType;
    
    // Update the audio filter on the server
    fetch(`${appState.apiBaseUrl}/training/sessions/${appState.currentSession.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appState.token}`
      },
      body: JSON.stringify({
        audioFilterType: newFilterType
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Audio filter updated successfully:', newFilterType);
      } else {
        console.error('Failed to update audio filter:', data.message);
      }
    })
    .catch(error => {
      console.error('Update audio filter error:', error);
    });
  }
}

function updateUserCallsign() {
  // Update the user callsign in the state
  appState.userCallsign = elements.userCallsignInput.value || 'Alpha-1';
  
  // In a real implementation, this would update the callsign on the server
  if (appState.currentSession) {
    fetch(`${appState.apiBaseUrl}/training/sessions/${appState.currentSession.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appState.token}`
      },
      body: JSON.stringify({
        userCallsign: appState.userCallsign
      })
    }).catch(error => {
      console.error('Update callsign error:', error);
    });
  }
}

function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('main > section').forEach(section => {
    section.classList.add('hidden');
  });
  
  // Show requested section
  document.getElementById(sectionId).classList.remove('hidden');
  
  // Update current section in state
  appState.currentSection = sectionId;
}

function updateUserDisplay() {
  if (appState.user) {
    // User is logged in - show username and enable dropdown items
    elements.userDisplayName.textContent = appState.user.username;
    elements.profileLink.style.display = 'block';
    elements.statsLink.style.display = 'block';
    elements.logoutLink.style.display = 'block';
  } else {
    // User is not logged in - show Guest and hide dropdown items
    elements.userDisplayName.textContent = 'Guest';
    elements.profileLink.style.display = 'none';
    elements.statsLink.style.display = 'none';
    elements.logoutLink.style.display = 'none';
  }
}

function showMessage(element, message, type = 'error') {
  element.textContent = message;
  element.className = `form-message ${type}`;
  
  // Clear message after 5 seconds
  setTimeout(() => {
    element.textContent = '';
    element.className = 'form-message';
  }, 5000);
}

// Compare user response with expected response
function compareResponses(userResponse, expectedResponse) {
  if (!userResponse || !expectedResponse) return false;
  
  // Normalize both responses for comparison
  const normalizedUser = normalizeResponse(userResponse);
  const normalizedExpected = normalizeResponse(expectedResponse);
  
  // Check for exact match first
  if (normalizedUser === normalizedExpected) {
    return true;
  }
  
  // Check for similarity (contains all key parts)
  const keyParts = extractKeyParts(normalizedExpected);
  return keyParts.every(part => normalizedUser.includes(part));
}

// Normalize response for comparison
function normalizeResponse(text) {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')                        // Replace multiple spaces with single space
    .trim();
}

// Extract key parts from expected response
function extractKeyParts(text) {
  // For military voice procedure, key parts are typically:
  // - Callsigns
  // - Action words (e.g., "contact", "report", "over")
  // - Key information (e.g., "checkpoint", "security incident")
  
  // Split by spaces and filter out common words
  const commonWords = ['this', 'is', 'a', 'the', 'and', 'or', 'to', 'for', 'in', 'on', 'at'];
  return text
    .split(' ')
    .filter(word => word.length > 2 && !commonWords.includes(word));
}

// Show feedback for initial user response
function showInitialResponseFeedback(userResponse, expectedResponse, isCorrect) {
  // Create feedback element
  const feedbackElement = document.createElement('div');
  feedbackElement.className = 'feedback-item';
  
  // Determine score class
  const scoreClass = isCorrect ? 'score-high' : 'score-low';
  const scorePercent = isCorrect ? 100 : 50;
  
  // Create feedback text
  const feedbackText = isCorrect 
    ? "Excellent! Your initial transmission follows proper voice procedure protocol."
    : "Your initial transmission could be improved. Remember to follow proper voice procedure protocol.";
  
  feedbackElement.innerHTML = `
    <div class="feedback-score ${scoreClass}">${scorePercent}% Accuracy</div>
    <div class="feedback-text">${feedbackText}</div>
    <div class="response-comparison">
      <div class="user-said">
        <strong>You said:</strong><br>
        ${userResponse}
      </div>
      <div class="expected-response">
        <strong>Expected:</strong><br>
        ${expectedResponse}
      </div>
    </div>
  `;
  
  // Clear previous feedback and add new feedback
  elements.feedbackContent.innerHTML = '';
  elements.feedbackContent.appendChild(feedbackElement);
}
