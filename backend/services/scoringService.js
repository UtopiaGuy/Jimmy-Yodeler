/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * Scoring Service for Accuracy Evaluation
 */

const config = require('../config');

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} - Edit distance
 */
function levenshteinDistance(a, b) {
  const matrix = [];
  
  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score between two strings (0-1)
 * @param {string} userResponse - User's response
 * @param {string} expectedResponse - Expected response
 * @returns {number} - Similarity score (0-1)
 */
function calculateSimilarity(userResponse, expectedResponse) {
  // Normalize strings for comparison
  const normalizedUser = normalizeText(userResponse);
  const normalizedExpected = normalizeText(expectedResponse);
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(normalizedUser, normalizedExpected);
  
  // Calculate similarity score (1 - normalized distance)
  const maxLength = Math.max(normalizedUser.length, normalizedExpected.length);
  const similarity = maxLength > 0 ? 1 - (distance / maxLength) : 1;
  
  return similarity;
}

/**
 * Normalize text for comparison
 * @param {string} text - Text to normalize
 * @returns {string} - Normalized text
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')                        // Replace multiple spaces with single space
    .trim();
}

/**
 * Score a user's response against the expected response
 * @param {string} userResponse - User's response
 * @param {string} expectedResponse - Expected response
 * @returns {Object} - Score and feedback
 */
async function scoreResponse(userResponse, expectedResponse) {
  try {
    // Calculate similarity score
    const similarityScore = calculateSimilarity(userResponse, expectedResponse);
    
    // Round to 2 decimal places
    const score = Math.round(similarityScore * 100) / 100;
    
    // Generate feedback based on score
    const feedback = generateFeedback(userResponse, expectedResponse, score);
    
    return {
      score,
      feedback
    };
  } catch (error) {
    console.error('Scoring error:', error);
    throw error;
  }
}

/**
 * Generate feedback based on user response and score
 * @param {string} userResponse - User's response
 * @param {string} expectedResponse - Expected response
 * @param {number} score - Similarity score (0-1)
 * @returns {string} - Feedback message
 */
function generateFeedback(userResponse, expectedResponse, score) {
  // Normalize for analysis
  const normalizedUser = normalizeText(userResponse);
  const normalizedExpected = normalizeText(expectedResponse);
  
  // Split into words for detailed comparison
  const userWords = normalizedUser.split(' ');
  const expectedWords = normalizedExpected.split(' ');
  
  // Find missing and extra words
  const missingWords = expectedWords.filter(word => !userWords.includes(word));
  const extraWords = userWords.filter(word => !expectedWords.includes(word));
  
  // Generate feedback based on score
  let feedback = '';
  
  if (score >= 0.9) {
    feedback = 'Excellent! Your response closely matches the expected voice procedure.';
    
    if (score < 1) {
      feedback += ' Minor variations detected, but overall very good.';
    }
  } else if (score >= 0.75) {
    feedback = 'Good response. Your voice procedure is mostly correct with some variations.';
    
    if (missingWords.length > 0) {
      feedback += ` Missing key elements: "${missingWords.join(', ')}".`;
    }
    
    if (extraWords.length > 0) {
      feedback += ` Unnecessary additions: "${extraWords.join(', ')}".`;
    }
  } else if (score >= 0.5) {
    feedback = 'Your response needs improvement. Several elements of proper voice procedure are missing or incorrect.';
    
    if (missingWords.length > 0) {
      feedback += ` Missing: "${missingWords.join(', ')}".`;
    }
    
    if (extraWords.length > 0) {
      feedback += ` Unnecessary: "${extraWords.join(', ')}".`;
    }
    
    feedback += ` Expected: "${expectedResponse}".`;
  } else {
    feedback = `Your response significantly differs from standard voice procedure. Please review the correct format: "${expectedResponse}".`;
  }
  
  return feedback;
}

/**
 * Analyze a complete training session and provide overall feedback
 * @param {Array} feedbackItems - Array of feedback items from the session
 * @returns {Object} - Analysis results
 */
function analyzeTrainingSession(feedbackItems) {
  // Calculate average score
  const totalScore = feedbackItems.reduce((sum, item) => sum + item.accuracy_score, 0);
  const averageScore = feedbackItems.length > 0 ? totalScore / feedbackItems.length : 0;
  
  // Find strongest and weakest responses
  let strongestResponse = null;
  let weakestResponse = null;
  
  if (feedbackItems.length > 0) {
    strongestResponse = feedbackItems.reduce((prev, current) => 
      prev.accuracy_score > current.accuracy_score ? prev : current
    );
    
    weakestResponse = feedbackItems.reduce((prev, current) => 
      prev.accuracy_score < current.accuracy_score ? prev : current
    );
  }
  
  // Generate overall assessment
  let overallAssessment = '';
  
  if (averageScore >= 0.9) {
    overallAssessment = 'Excellent performance! You demonstrate strong proficiency in military voice procedures.';
  } else if (averageScore >= 0.75) {
    overallAssessment = 'Good performance. You have a solid grasp of military voice procedures with some areas for improvement.';
  } else if (averageScore >= 0.5) {
    overallAssessment = 'Fair performance. You understand the basics of military voice procedures but need more practice for consistency.';
  } else {
    overallAssessment = 'Needs improvement. Focus on learning the standard formats and terminology of military voice procedures.';
  }
  
  return {
    averageScore,
    strongestResponse,
    weakestResponse,
    overallAssessment
  };
}

module.exports = {
  scoreResponse,
  calculateSimilarity,
  analyzeTrainingSession
};
