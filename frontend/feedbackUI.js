/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * Feedback UI Module
 * 
 * This module handles the visualization and interaction with feedback data,
 * including charts, statistics, and improvement suggestions.
 */

// Feedback UI Class
class FeedbackUI {
  constructor() {
    // Chart instances
    this.performanceChart = null;
    this.accuracyDistributionChart = null;
    
    // DOM Elements
    this.elements = {
      // Performance chart
      performanceChartEl: document.getElementById('performanceChart'),
      
      // Improvement areas
      improvementList: document.getElementById('improvementList'),
      
      // Recent feedback
      recentFeedbackList: document.getElementById('recentFeedbackList'),
      
      // Session results
      finalScore: document.getElementById('finalScore'),
      resultScenarioTitle: document.getElementById('resultScenarioTitle'),
      resultDifficulty: document.getElementById('resultDifficulty'),
      resultDuration: document.getElementById('resultDuration'),
      resultTimestamp: document.getElementById('resultTimestamp'),
      responseBreakdownList: document.getElementById('responseBreakdownList')
    };
    
    // Bind methods
    this.initCharts = this.initCharts.bind(this);
    this.updatePerformanceChart = this.updatePerformanceChart.bind(this);
    this.renderImprovementAreas = this.renderImprovementAreas.bind(this);
    this.renderSessionResults = this.renderSessionResults.bind(this);
    this.renderResponseBreakdown = this.renderResponseBreakdown.bind(this);
    this.getScoreClass = this.getScoreClass.bind(this);
  }
  
  /**
   * Initialize the feedback UI
   */
  init() {
    // Initialize charts if Chart.js is available
    if (window.Chart && this.elements.performanceChartEl) {
      this.initCharts();
    }
    
    // Set up event listeners
    this.setupEventListeners();
    
    return this;
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Add event listeners for interactive elements
    document.addEventListener('DOMContentLoaded', () => {
      // Example: Toggle visibility of detailed feedback
      document.querySelectorAll('.feedback-item').forEach(item => {
        const header = item.querySelector('.feedback-header');
        const details = item.querySelector('.feedback-details');
        
        if (header && details) {
          header.addEventListener('click', () => {
            details.classList.toggle('expanded');
          });
        }
      });
    });
  }
  
  /**
   * Initialize charts
   */
  initCharts() {
    // Performance chart (line chart showing progress over time)
    if (this.elements.performanceChartEl) {
      const ctx = this.elements.performanceChartEl.getContext('2d');
      
      this.performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [], // Will be populated with dates
          datasets: [{
            label: 'Session Score',
            data: [], // Will be populated with scores
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
  
  /**
   * Update performance chart with new data
   * @param {Array} sessions - Array of training sessions
   */
  updatePerformanceChart(sessions) {
    if (!this.performanceChart || !sessions || sessions.length === 0) {
      return;
    }
    
    // Sort sessions by date
    const sortedSessions = [...sessions].sort((a, b) => {
      return new Date(a.completedAt) - new Date(b.completedAt);
    });
    
    // Extract dates and scores
    const labels = sortedSessions.map(session => {
      return new Date(session.completedAt).toLocaleDateString();
    });
    
    const scores = sortedSessions.map(session => {
      return session.score !== null ? Math.round(session.score) : null;
    });
    
    // Update chart data
    this.performanceChart.data.labels = labels;
    this.performanceChart.data.datasets[0].data = scores;
    
    // Update chart
    this.performanceChart.update();
  }
  
  /**
   * Render improvement areas
   * @param {Array} areas - Array of improvement areas
   */
  renderImprovementAreas(areas) {
    if (!this.elements.improvementList) {
      return;
    }
    
    if (!areas || areas.length === 0) {
      this.elements.improvementList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-check-circle"></i>
          <span>No specific improvement areas identified yet</span>
        </div>
      `;
      return;
    }
    
    // Render improvement areas
    this.elements.improvementList.innerHTML = areas.map(area => `
      <div class="improvement-item">
        <div class="improvement-issue">${area.issue}</div>
        <div class="improvement-suggestion">${area.suggestion}</div>
      </div>
    `).join('');
  }
  
  /**
   * Render session results
   * @param {Object} session - Training session data
   */
  renderSessionResults(session) {
    if (!session) {
      return;
    }
    
    // Update results UI
    if (this.elements.finalScore) {
      this.elements.finalScore.textContent = Math.round(session.score);
    }
    
    if (this.elements.resultScenarioTitle) {
      this.elements.resultScenarioTitle.textContent = session.scenarioTitle;
    }
    
    if (this.elements.resultDifficulty) {
      this.elements.resultDifficulty.textContent = session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1);
    }
    
    // Calculate duration
    if (this.elements.resultDuration && session.startedAt && session.completedAt) {
      const startTime = new Date(session.startedAt);
      const endTime = new Date(session.completedAt);
      const durationMs = endTime - startTime;
      const durationMinutes = Math.floor(durationMs / 60000);
      const durationSeconds = Math.floor((durationMs % 60000) / 1000);
      this.elements.resultDuration.textContent = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
    }
    
    // Format timestamp
    if (this.elements.resultTimestamp && session.completedAt) {
      this.elements.resultTimestamp.textContent = new Date(session.completedAt).toLocaleString();
    }
  }
  
  /**
   * Render response breakdown
   * @param {Array} feedback - Array of feedback items
   * @param {Object} scenario - Scenario data with script content
   */
  renderResponseBreakdown(feedback, scenario) {
    if (!this.elements.responseBreakdownList || !feedback || !scenario) {
      return;
    }
    
    this.elements.responseBreakdownList.innerHTML = '';
    
    feedback.forEach((item, index) => {
      const scorePercent = Math.round(item.accuracy_score * 100);
      const scoreClass = this.getScoreClass(item.accuracy_score);
      
      const breakdownItem = document.createElement('div');
      breakdownItem.className = 'breakdown-item';
      breakdownItem.innerHTML = `
        <div class="breakdown-prompt">
          <strong>Prompt ${index + 1}:</strong> ${scenario.script_content[item.prompt_index]}
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
      
      this.elements.responseBreakdownList.appendChild(breakdownItem);
    });
  }
  
  /**
   * Get CSS class for score
   * @param {number} score - Accuracy score (0-1)
   * @returns {string} - CSS class name
   */
  getScoreClass(score) {
    if (score >= 0.9) {
      return 'score-high';
    } else if (score >= 0.7) {
      return 'score-medium';
    } else {
      return 'score-low';
    }
  }
  
  /**
   * Create a visual comparison between user response and expected response
   * @param {string} userResponse - User's response
   * @param {string} expectedResponse - Expected response
   * @returns {string} - HTML for visual comparison
   */
  createVisualComparison(userResponse, expectedResponse) {
    // Normalize responses
    const normalizeText = (text) => {
      return text
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    const normalizedUser = normalizeText(userResponse);
    const normalizedExpected = normalizeText(expectedResponse);
    
    // Split into words
    const userWords = normalizedUser.split(' ');
    const expectedWords = normalizedExpected.split(' ');
    
    // Find matching, missing, and extra words
    const matchingWords = userWords.filter(word => expectedWords.includes(word));
    const missingWords = expectedWords.filter(word => !userWords.includes(word));
    const extraWords = userWords.filter(word => !expectedWords.includes(word));
    
    // Create HTML for comparison
    let comparisonHtml = '<div class="visual-comparison">';
    
    // User response with highlighting
    comparisonHtml += '<div class="comparison-user">';
    comparisonHtml += '<strong>Your Response:</strong><br>';
    comparisonHtml += userWords.map(word => {
      if (expectedWords.includes(word)) {
        return `<span class="word-match">${word}</span>`;
      } else {
        return `<span class="word-extra">${word}</span>`;
      }
    }).join(' ');
    comparisonHtml += '</div>';
    
    // Expected response with highlighting
    comparisonHtml += '<div class="comparison-expected">';
    comparisonHtml += '<strong>Expected Response:</strong><br>';
    comparisonHtml += expectedWords.map(word => {
      if (userWords.includes(word)) {
        return `<span class="word-match">${word}</span>`;
      } else {
        return `<span class="word-missing">${word}</span>`;
      }
    }).join(' ');
    comparisonHtml += '</div>';
    
    // Summary
    comparisonHtml += '<div class="comparison-summary">';
    comparisonHtml += `<div><span class="match-count">${matchingWords.length}</span> matching words</div>`;
    comparisonHtml += `<div><span class="missing-count">${missingWords.length}</span> missing words</div>`;
    comparisonHtml += `<div><span class="extra-count">${extraWords.length}</span> extra words</div>`;
    comparisonHtml += '</div>';
    
    comparisonHtml += '</div>';
    
    return comparisonHtml;
  }
}

// Create and export a singleton instance
const feedbackUI = new FeedbackUI();

// Initialize feedback UI when the page loads
document.addEventListener('DOMContentLoaded', () => {
  feedbackUI.init();
});

// Export for use in other modules
window.feedbackUI = feedbackUI;
