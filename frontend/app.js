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
    showSection('authSection');
  }
}

// Set up all event listeners
function setupEventListeners() {
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
  
  // Reset UI
  elements.userDisplayName.textContent = 'Guest';
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
      
      // Set first prompt
      setCurrentPrompt();
    } else {
      alert(data.message || 'Failed to load scenario details');
    }
  })
  .catch(error => {
    console.error('Load scenario details error:', error);
    alert('An error occurred while loading scenario details');
  });
}

function setCurrentPrompt() {
  if (!appState.currentScenario) return;
  
  // Check if we have scenario_lines
  if (appState.currentScenario.scenario_lines && appState.currentScenario.scenario_lines.length > 0) {
    // Find the current prompter line
    const prompterLines = appState.currentScenario.scenario_lines.filter(line => line.is_prompter);
    
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
    
    // Set the phase context
    const phaseContext = currentLine.phase_context;
    if (phaseContext) {
      elements.phaseContext.textContent = phaseContext;
    } else {
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
  
  // In a real implementation, this would fetch the audio from the server
  // For now, we'll use the browser's TTS
  const utterance = new SpeechSynthesisUtterance(prompt);
  speechSynthesis.speak(utterance);
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
    displayResults({
      ...appState.currentSession,
      score: sessionResult.overallScore,
      completedAt: sessionResult.completedAt
    });
  }
}

function displayResults(session, feedback) {
  // Update results UI
  elements.finalScore.textContent = Math.round(session.score);
  elements.resultScenarioTitle.textContent = appState.currentScenario.title;
  elements.resultDifficulty.textContent = appState.currentScenario.difficulty.charAt(0).toUpperCase() + appState.currentScenario.difficulty.slice(1);
  
  // Calculate duration
  const startTime = new Date(session.startedAt);
  const endTime = new Date(session.completedAt);
  const durationMs = endTime - startTime;
  const durationMinutes = Math.floor(durationMs / 60000);
  const durationSeconds = Math.floor((durationMs % 60000) / 1000);
  elements.resultDuration.textContent = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
  
  // Format timestamp
  elements.resultTimestamp.textContent = new Date(session.completedAt).toLocaleString();
  
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
      
      // Update stats
      elements.totalSessions.textContent = data.user.stats.sessionCount;
      elements.avgScore.textContent = data.user.stats.averageScore ? Math.round(data.user.stats.averageScore) : 0;
      elements.highestScore.textContent = data.user.stats.highestScore ? Math.round(data.user.stats.highestScore) : 0;
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
    // Format date
    const date = new Date(session.startedAt).toLocaleDateString();
    
    // Format score
    const scoreDisplay = session.score !== null 
      ? `<span class="session-score">${Math.round(session.score)}%</span>`
      : '<span class="session-status">In Progress</span>';
    
    return `
      <div class="session-card">
        <div class="session-title">${session.scenarioTitle}</div>
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
      // Set current session and scenario
      appState.currentSession = data.session;
      appState.currentScenario = {
        id: data.session.scenarioId,
        title: data.session.scenarioTitle,
        difficulty: data.session.difficulty,
        category: data.session.category,
        script_content: data.session.script_content
      };
      
      // Display results
      displayResults(data.session, data.feedback);
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

function renderPerformanceChart(stats) {
  if (!elements.performanceChart) return;
  
  // If Chart.js is available
  if (window.Chart) {
    // Destroy existing chart if it exists
    if (window.performanceChart) {
      window.performanceChart.destroy();
    }
    
    // Create chart data from recent sessions
    const labels = stats.recentSessions.map(session => {
      return new Date(session.completedAt).toLocaleDateString();
    }).reverse();
    
    const scores = stats.recentSessions.map(session => session.score).reverse();
    
    // Create chart
    const ctx = elements.performanceChart.getContext('2d');
    window.performanceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Session Score',
          data: scores,
          backgroundColor: 'rgba(52, 152, 219, 0.2)',
          borderColor: 'rgba(52, 152, 219, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(52, 152, 219, 1)',
          pointRadius: 4,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Score'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          }
        }
      }
    });
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

function simulateUserResponse(expectedResponse) {
  // This function simulates a user response that's close to the expected response
  // In a real implementation, this would be replaced by the actual transcription
  
  // For demo purposes, we'll randomly decide how accurate the response should be
  const accuracy = Math.random();
  
  if (accuracy > 0.8) {
    // High accuracy - return the exact expected response
    return expectedResponse;
  } else if (accuracy > 0.5) {
    // Medium accuracy - make some minor changes
    return introduceMinorErrors(expectedResponse);
  } else {
    // Low accuracy - make significant changes
    return introduceMajorErrors(expectedResponse);
  }
}

function introduceMinorErrors(text) {
  // Introduce minor errors like missing words or slight phrasing differences
  const words = text.split(' ');
  
  // Randomly remove 1-2 words
  const removeCount = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < removeCount; i++) {
    if (words.length > 3) {
      const indexToRemove = Math.floor(Math.random() * words.length);
      words.splice(indexToRemove, 1);
    }
  }
  
  return words.join(' ');
}

function introduceMajorErrors(text) {
  // Introduce major errors like completely different phrasing
  const phrases = [
    "I'm not sure what to say here",
    "Can you repeat that please?",
    "Roger that, moving to position",
    "Copy, will proceed as instructed",
    "Understood, over and out",
    "This is Alpha team, standing by"
  ];
  
  // Return a random phrase
  return phrases[Math.floor(Math.random() * phrases.length)];
}

// Utility functions
function updateAudioFilter() {
  // In a real implementation, this would update the audio filter on the server
  // For now, we'll just update the local state
  if (appState.currentSession) {
    appState.currentSession.audioFilterType = elements.audioFilterSelect.value;
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
    elements.userDisplayName.textContent = appState.user.username;
  } else {
    elements.userDisplayName.textContent = 'Guest';
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
