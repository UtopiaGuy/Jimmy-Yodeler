/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * Feedback Model
 */

const { query, queryOne, insert, update } = require('../db');
const scoringService = require('../services/scoringService');

/**
 * Feedback model class
 */
class Feedback {
  /**
   * Create feedback for a training response
   * @param {Object} feedbackData - Feedback data
   * @returns {Promise<Object>} - Created feedback
   */
  static async create(feedbackData) {
    try {
      // Validate required fields
      if (!feedbackData.trainingSessionId || 
          feedbackData.promptIndex === undefined || 
          !feedbackData.userResponse || 
          !feedbackData.expectedResponse) {
        throw new Error('Training session ID, prompt index, user response, and expected response are required');
      }
      
      // Score the response if not provided
      let accuracyScore = feedbackData.accuracyScore;
      let feedbackText = feedbackData.feedbackText;
      
      if (accuracyScore === undefined || feedbackText === undefined) {
        const scoringResult = await scoringService.scoreResponse(
          feedbackData.userResponse,
          feedbackData.expectedResponse
        );
        
        accuracyScore = scoringResult.score;
        feedbackText = scoringResult.feedback;
      }
      
      // Insert feedback
      const feedbackId = await insert('feedback', {
        training_session_id: feedbackData.trainingSessionId,
        prompt_index: feedbackData.promptIndex,
        user_response: feedbackData.userResponse,
        expected_response: feedbackData.expectedResponse,
        accuracy_score: accuracyScore,
        feedback_text: feedbackText,
        created_at: new Date()
      });
      
      // Get created feedback
      return await this.getById(feedbackId);
    } catch (error) {
      console.error('Feedback creation error:', error);
      throw error;
    }
  }
  
  /**
   * Get feedback by ID
   * @param {number} id - Feedback ID
   * @returns {Promise<Object|null>} - Feedback or null
   */
  static async getById(id) {
    try {
      const feedback = await queryOne(
        `SELECT id, training_session_id, prompt_index, user_response, 
        expected_response, accuracy_score, feedback_text, created_at
        FROM feedback
        WHERE id = ?`,
        [id]
      );
      
      return feedback;
    } catch (error) {
      console.error('Get feedback by ID error:', error);
      throw error;
    }
  }
  
  /**
   * Get all feedback for a training session
   * @param {number} sessionId - Training session ID
   * @returns {Promise<Array>} - Array of feedback items
   */
  static async getBySessionId(sessionId) {
    try {
      const feedback = await query(
        `SELECT id, training_session_id, prompt_index, user_response, 
        expected_response, accuracy_score, feedback_text, created_at
        FROM feedback
        WHERE training_session_id = ?
        ORDER BY prompt_index ASC`,
        [sessionId]
      );
      
      return feedback;
    } catch (error) {
      console.error('Get feedback by session ID error:', error);
      throw error;
    }
  }
  
  /**
   * Get feedback for a user
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of feedback items
   */
  static async getByUserId(userId, options = {}) {
    try {
      let sql = `
        SELECT f.id, f.training_session_id, f.prompt_index, 
        f.user_response, f.expected_response, f.accuracy_score, 
        f.feedback_text, f.created_at,
        ts.scenario_id, sc.title as scenario_title
        FROM feedback f
        JOIN training_sessions ts ON f.training_session_id = ts.id
        JOIN training_scenarios sc ON ts.scenario_id = sc.id
        WHERE ts.user_id = ?
      `;
      
      const params = [userId];
      
      // Add filters
      if (options.minScore !== undefined) {
        sql += ' AND f.accuracy_score >= ?';
        params.push(options.minScore);
      }
      
      if (options.maxScore !== undefined) {
        sql += ' AND f.accuracy_score <= ?';
        params.push(options.maxScore);
      }
      
      if (options.scenarioId) {
        sql += ' AND ts.scenario_id = ?';
        params.push(options.scenarioId);
      }
      
      // Add ORDER BY clause
      sql += ' ORDER BY ' + (options.orderBy || 'f.created_at DESC');
      
      // Add LIMIT and OFFSET for pagination
      if (options.limit) {
        sql += ' LIMIT ?';
        params.push(options.limit);
        
        if (options.offset) {
          sql += ' OFFSET ?';
          params.push(options.offset);
        }
      }
      
      return await query(sql, params);
    } catch (error) {
      console.error('Get feedback by user ID error:', error);
      throw error;
    }
  }
  
  /**
   * Calculate user performance statistics
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Performance statistics
   */
  static async getUserStats(userId) {
    try {
      const stats = await queryOne(
        `SELECT 
          COUNT(DISTINCT ts.id) as total_sessions,
          AVG(ts.score) as average_score,
          MAX(ts.score) as highest_score,
          COUNT(DISTINCT ts.scenario_id) as unique_scenarios,
          SUM(CASE WHEN ts.status = 'completed' THEN 1 ELSE 0 END) as completed_sessions
        FROM training_sessions ts
        WHERE ts.user_id = ?`,
        [userId]
      );
      
      // Get recent improvement trend
      const recentSessions = await query(
        `SELECT ts.id, ts.score, ts.completed_at
        FROM training_sessions ts
        WHERE ts.user_id = ? AND ts.status = 'completed'
        ORDER BY ts.completed_at DESC
        LIMIT 5`,
        [userId]
      );
      
      // Calculate improvement trend
      let improvementTrend = null;
      if (recentSessions.length >= 2) {
        const oldestScore = recentSessions[recentSessions.length - 1].score;
        const newestScore = recentSessions[0].score;
        improvementTrend = newestScore - oldestScore;
      }
      
      return {
        totalSessions: stats.total_sessions || 0,
        completedSessions: stats.completed_sessions || 0,
        averageScore: stats.average_score || 0,
        highestScore: stats.highest_score || 0,
        uniqueScenarios: stats.unique_scenarios || 0,
        improvementTrend,
        recentSessions: recentSessions.map(session => ({
          id: session.id,
          score: session.score,
          completedAt: session.completed_at
        }))
      };
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }
  
  /**
   * Get common error patterns for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - Common error patterns
   */
  static async getUserErrorPatterns(userId) {
    try {
      // Get user's feedback with low scores
      const lowScoreFeedback = await query(
        `SELECT f.user_response, f.expected_response, f.accuracy_score
        FROM feedback f
        JOIN training_sessions ts ON f.training_session_id = ts.id
        WHERE ts.user_id = ? AND f.accuracy_score < 0.7
        ORDER BY f.created_at DESC
        LIMIT 50`,
        [userId]
      );
      
      if (lowScoreFeedback.length === 0) {
        return [];
      }
      
      // Analyze common errors
      const errorTypes = {
        missingCallsigns: 0,
        incorrectPhrasing: 0,
        missingAcknowledgments: 0,
        verbosity: 0,
        phonetics: 0
      };
      
      // Analyze each feedback item
      for (const item of lowScoreFeedback) {
        const userResponse = item.user_response.toLowerCase();
        const expectedResponse = item.expected_response.toLowerCase();
        
        // Check for missing callsigns
        const expectedCallsigns = expectedResponse.match(/\b[a-z]+-?[0-9]+\b/g) || [];
        const userCallsigns = userResponse.match(/\b[a-z]+-?[0-9]+\b/g) || [];
        
        if (expectedCallsigns.length > userCallsigns.length) {
          errorTypes.missingCallsigns++;
        }
        
        // Check for missing acknowledgments
        if ((expectedResponse.includes('roger') || expectedResponse.includes('copy') || 
             expectedResponse.includes('wilco') || expectedResponse.includes('acknowledge')) && 
            !(userResponse.includes('roger') || userResponse.includes('copy') || 
              userResponse.includes('wilco') || userResponse.includes('acknowledge'))) {
          errorTypes.missingAcknowledgments++;
        }
        
        // Check for verbosity
        if (userResponse.split(' ').length > expectedResponse.split(' ').length * 1.5) {
          errorTypes.verbosity++;
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
          errorTypes.phonetics++;
        }
        
        // Check for incorrect phrasing
        if (item.accuracy_score < 0.7 && 
            errorTypes.missingCallsigns === 0 && 
            errorTypes.missingAcknowledgments === 0 && 
            errorTypes.verbosity === 0 && 
            errorTypes.phonetics === 0) {
          errorTypes.incorrectPhrasing++;
        }
      }
      
      // Convert to array and sort by frequency
      const errorPatterns = Object.entries(errorTypes)
        .map(([type, count]) => ({ type, count }))
        .filter(error => error.count > 0)
        .sort((a, b) => b.count - a.count);
      
      return errorPatterns;
    } catch (error) {
      console.error('Get user error patterns error:', error);
      throw error;
    }
  }
}

module.exports = Feedback;
