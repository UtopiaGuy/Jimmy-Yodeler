/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * Feedback Service for User Accuracy Feedback
 */

const { query, queryOne } = require('../db');
const scoringService = require('./scoringService');

/**
 * Analyze feedback for a specific training session
 * @param {number} sessionId - Training session ID
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeSessionFeedback(sessionId) {
  try {
    // Get all feedback items for the session
    const feedbackItems = await query(
      `SELECT id, prompt_index, user_response, expected_response, 
      accuracy_score, feedback_text, created_at
      FROM feedback
      WHERE training_session_id = ?
      ORDER BY prompt_index ASC`,
      [sessionId]
    );
    
    if (feedbackItems.length === 0) {
      return {
        message: 'No feedback data available for this session',
        analysis: null
      };
    }
    
    // Use scoring service to analyze the session
    const analysis = scoringService.analyzeTrainingSession(feedbackItems);
    
    // Get session details
    const session = await queryOne(
      `SELECT ts.score, ts.started_at, ts.completed_at,
      sc.title as scenario_title, sc.difficulty
      FROM training_sessions ts
      JOIN training_scenarios sc ON ts.scenario_id = sc.id
      WHERE ts.id = ?`,
      [sessionId]
    );
    
    // Calculate time spent
    let timeSpent = null;
    if (session.started_at && session.completed_at) {
      const startTime = new Date(session.started_at);
      const endTime = new Date(session.completed_at);
      timeSpent = Math.round((endTime - startTime) / 1000); // in seconds
    }
    
    // Generate improvement suggestions
    const improvementSuggestions = generateImprovementSuggestions(feedbackItems);
    
    return {
      sessionDetails: {
        score: session.score,
        scenarioTitle: session.scenario_title,
        difficulty: session.difficulty,
        timeSpent,
        responseCount: feedbackItems.length
      },
      analysis: {
        ...analysis,
        improvementSuggestions
      }
    };
  } catch (error) {
    console.error('Session feedback analysis error:', error);
    throw error;
  }
}

/**
 * Generate improvement suggestions based on feedback items
 * @param {Array} feedbackItems - Array of feedback items
 * @returns {Array} - Improvement suggestions
 */
function generateImprovementSuggestions(feedbackItems) {
  // Common issues to look for
  const issues = {
    missingCallsigns: 0,
    incorrectPhrasing: 0,
    missingAcknowledgments: 0,
    verbosity: 0,
    phonetics: 0
  };
  
  // Analyze each feedback item for common issues
  for (const item of feedbackItems) {
    const userResponse = item.user_response.toLowerCase();
    const expectedResponse = item.expected_response.toLowerCase();
    
    // Check for missing callsigns (look for words ending with numbers which are likely callsigns)
    const expectedCallsigns = expectedResponse.match(/\b[a-z]+-?[0-9]+\b/g) || [];
    const userCallsigns = userResponse.match(/\b[a-z]+-?[0-9]+\b/g) || [];
    
    if (expectedCallsigns.length > userCallsigns.length) {
      issues.missingCallsigns++;
    }
    
    // Check for missing acknowledgments
    if ((expectedResponse.includes('roger') || expectedResponse.includes('copy') || 
         expectedResponse.includes('wilco') || expectedResponse.includes('acknowledge')) && 
        !(userResponse.includes('roger') || userResponse.includes('copy') || 
          userResponse.includes('wilco') || userResponse.includes('acknowledge'))) {
      issues.missingAcknowledgments++;
    }
    
    // Check for verbosity (user response significantly longer than expected)
    if (userResponse.split(' ').length > expectedResponse.split(' ').length * 1.5) {
      issues.verbosity++;
    }
    
    // Check for phonetic alphabet usage
    const phoneticAlphabet = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 
                             'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 
                             'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 
                             'sierra', 'tango', 'uniform', 'victor', 'whiskey', 
                             'xray', 'yankee', 'zulu'];
    
    const expectedPhonetics = phoneticAlphabet.filter(word => expectedResponse.includes(word));
    const userPhonetics = phoneticAlphabet.filter(word => userResponse.includes(word));
    
    if (expectedPhonetics.length > userPhonetics.length) {
      issues.phonetics++;
    }
    
    // Check for incorrect phrasing (if score is low but none of the above issues are detected)
    if (item.accuracy_score < 0.7 && 
        issues.missingCallsigns === 0 && 
        issues.missingAcknowledgments === 0 && 
        issues.verbosity === 0 && 
        issues.phonetics === 0) {
      issues.incorrectPhrasing++;
    }
  }
  
  // Generate suggestions based on identified issues
  const suggestions = [];
  
  if (issues.missingCallsigns > 0) {
    suggestions.push({
      issue: 'Missing Callsigns',
      suggestion: 'Always include proper callsigns at the beginning of your transmission. This identifies who you are and who you are calling.'
    });
  }
  
  if (issues.missingAcknowledgments > 0) {
    suggestions.push({
      issue: 'Missing Acknowledgments',
      suggestion: 'Use proper acknowledgment terms like "Roger," "Copy," or "Wilco" to confirm receipt of messages.'
    });
  }
  
  if (issues.verbosity > 0) {
    suggestions.push({
      issue: 'Excessive Verbosity',
      suggestion: 'Keep transmissions brief and to the point. Use standard terminology and avoid unnecessary words.'
    });
  }
  
  if (issues.phonetics > 0) {
    suggestions.push({
      issue: 'Phonetic Alphabet Usage',
      suggestion: 'Use the NATO phonetic alphabet (Alpha, Bravo, Charlie...) when spelling out words or identifying letters to ensure clarity.'
    });
  }
  
  if (issues.incorrectPhrasing > 0) {
    suggestions.push({
      issue: 'Non-Standard Phrasing',
      suggestion: 'Follow standard military voice procedure formats. Study the correct phrases and practice their exact usage.'
    });
  }
  
  return suggestions;
}

/**
 * Get improvement areas for a specific user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} - Improvement areas
 */
async function getImprovementAreas(userId) {
  try {
    // Get user's recent feedback
    const feedbackItems = await query(
      `SELECT f.user_response, f.expected_response, f.accuracy_score
      FROM feedback f
      JOIN training_sessions ts ON f.training_session_id = ts.id
      WHERE ts.user_id = ?
      ORDER BY f.created_at DESC
      LIMIT 50`,
      [userId]
    );
    
    if (feedbackItems.length === 0) {
      return [];
    }
    
    // Generate improvement suggestions
    return generateImprovementSuggestions(feedbackItems);
  } catch (error) {
    console.error('Get improvement areas error:', error);
    throw error;
  }
}

/**
 * Get common error patterns across all users
 * @returns {Promise<Array>} - Common error patterns
 */
async function getCommonErrorPatterns() {
  try {
    // Get recent feedback across all users
    const feedbackItems = await query(
      `SELECT f.user_response, f.expected_response, f.accuracy_score
      FROM feedback f
      ORDER BY f.created_at DESC
      LIMIT 200`
    );
    
    if (feedbackItems.length === 0) {
      return [];
    }
    
    // Group feedback by accuracy score ranges
    const lowScoreFeedback = feedbackItems.filter(item => item.accuracy_score < 0.6);
    
    // Generate improvement suggestions from low-scoring responses
    const commonErrors = generateImprovementSuggestions(lowScoreFeedback);
    
    // Add frequency data
    const totalLowScoreItems = lowScoreFeedback.length;
    
    return commonErrors.map(error => ({
      ...error,
      frequency: Math.round((error.count / totalLowScoreItems) * 100) || 'N/A'
    }));
  } catch (error) {
    console.error('Get common error patterns error:', error);
    throw error;
  }
}

module.exports = {
  analyzeSessionFeedback,
  getImprovementAreas,
  getCommonErrorPatterns
};
