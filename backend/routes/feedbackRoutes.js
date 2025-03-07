/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * Feedback Routes
 */

const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../db');
const jwt = require('jsonwebtoken');
const config = require('../config');
const feedbackService = require('../services/feedbackService');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const decoded = jwt.verify(token, config.JWT.SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

/**
 * @route GET /api/feedback/user
 * @desc Get feedback for the current user
 * @access Private
 */
router.get('/user', authenticateToken, async (req, res) => {
  try {
    // Get user's feedback from all sessions
    const feedback = await query(
      `SELECT f.id, f.training_session_id, f.prompt_index, 
      f.user_response, f.expected_response, f.accuracy_score, 
      f.feedback_text, f.created_at,
      ts.scenario_id, sc.title as scenario_title
      FROM feedback f
      JOIN training_sessions ts ON f.training_session_id = ts.id
      JOIN training_scenarios sc ON ts.scenario_id = sc.id
      WHERE ts.user_id = ?
      ORDER BY f.created_at DESC
      LIMIT 100`,
      [req.user.id]
    );
    
    // Get user's performance stats
    const stats = await queryOne(
      `SELECT 
        COUNT(DISTINCT ts.id) as total_sessions,
        AVG(ts.score) as average_score,
        MAX(ts.score) as highest_score,
        COUNT(DISTINCT ts.scenario_id) as unique_scenarios,
        SUM(CASE WHEN ts.score >= ? THEN 1 ELSE 0 END) as passed_sessions
      FROM training_sessions ts
      WHERE ts.user_id = ? AND ts.status = 'completed'`,
      [config.SCORING.ACCURACY_THRESHOLD, req.user.id]
    );
    
    // Get common mistakes and improvement areas
    const improvementAreas = await feedbackService.getImprovementAreas(req.user.id);
    
    res.json({
      success: true,
      feedback: {
        items: feedback,
        count: feedback.length
      },
      stats: {
        totalSessions: stats.total_sessions || 0,
        averageScore: stats.average_score || 0,
        highestScore: stats.highest_score || 0,
        uniqueScenarios: stats.unique_scenarios || 0,
        passedSessions: stats.passed_sessions || 0,
        passRate: stats.total_sessions ? (stats.passed_sessions / stats.total_sessions) * 100 : 0
      },
      improvementAreas
    });
  } catch (error) {
    console.error('Get user feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/feedback/session/:id
 * @desc Get feedback for a specific training session
 * @access Private
 */
router.get('/session/:id', authenticateToken, async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Get session details
    const session = await queryOne(
      `SELECT ts.id, ts.user_id, ts.scenario_id, ts.status, 
      ts.started_at, ts.completed_at, ts.score,
      sc.title as scenario_title
      FROM training_sessions ts
      JOIN training_scenarios sc ON ts.scenario_id = sc.id
      WHERE ts.id = ?`,
      [sessionId]
    );
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Training session not found'
      });
    }
    
    // Check if user owns this session or is admin
    if (session.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this session.'
      });
    }
    
    // Get feedback for this session
    const feedback = await query(
      `SELECT id, prompt_index, user_response, expected_response, 
      accuracy_score, feedback_text, created_at
      FROM feedback
      WHERE training_session_id = ?
      ORDER BY prompt_index ASC`,
      [sessionId]
    );
    
    // Get detailed analysis
    const analysis = await feedbackService.analyzeSessionFeedback(sessionId);
    
    res.json({
      success: true,
      session,
      feedback,
      analysis
    });
  } catch (error) {
    console.error('Get session feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving session feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/feedback/stats
 * @desc Get overall feedback statistics (admin only)
 * @access Private/Admin
 */
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Get overall system stats
    const overallStats = await queryOne(
      `SELECT 
        COUNT(DISTINCT ts.id) as total_sessions,
        COUNT(DISTINCT ts.user_id) as total_users,
        AVG(ts.score) as average_score,
        COUNT(DISTINCT ts.scenario_id) as total_scenarios_used
      FROM training_sessions ts
      WHERE ts.status = 'completed'`
    );
    
    // Get scenario performance stats
    const scenarioStats = await query(
      `SELECT 
        sc.id, sc.title, sc.difficulty, sc.category,
        COUNT(DISTINCT ts.id) as session_count,
        AVG(ts.score) as average_score,
        MIN(ts.score) as min_score,
        MAX(ts.score) as max_score
      FROM training_scenarios sc
      LEFT JOIN training_sessions ts ON sc.id = ts.scenario_id AND ts.status = 'completed'
      GROUP BY sc.id
      ORDER BY session_count DESC, average_score DESC`
    );
    
    // Get user performance ranking
    const userRanking = await query(
      `SELECT 
        u.id, u.username,
        COUNT(DISTINCT ts.id) as session_count,
        AVG(ts.score) as average_score,
        MAX(ts.score) as highest_score
      FROM users u
      JOIN training_sessions ts ON u.id = ts.user_id
      WHERE ts.status = 'completed'
      GROUP BY u.id
      ORDER BY average_score DESC
      LIMIT 10`
    );
    
    // Get common error patterns
    const commonErrors = await feedbackService.getCommonErrorPatterns();
    
    res.json({
      success: true,
      overallStats: {
        totalSessions: overallStats.total_sessions || 0,
        totalUsers: overallStats.total_users || 0,
        averageScore: overallStats.average_score || 0,
        totalScenariosUsed: overallStats.total_scenarios_used || 0
      },
      scenarioStats,
      userRanking,
      commonErrors
    });
  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving feedback statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/feedback/user/:id
 * @desc Get feedback for a specific user (admin only)
 * @access Private/Admin
 */
router.get('/user/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const user = await queryOne(
      'SELECT id, username, email, first_name, last_name, role FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user's sessions
    const sessions = await query(
      `SELECT ts.id, ts.scenario_id, ts.status, ts.started_at, 
      ts.completed_at, ts.score, sc.title as scenario_title
      FROM training_sessions ts
      JOIN training_scenarios sc ON ts.scenario_id = sc.id
      WHERE ts.user_id = ?
      ORDER BY ts.started_at DESC`,
      [userId]
    );
    
    // Get user's performance stats
    const stats = await queryOne(
      `SELECT 
        COUNT(DISTINCT ts.id) as total_sessions,
        AVG(ts.score) as average_score,
        MAX(ts.score) as highest_score,
        COUNT(DISTINCT ts.scenario_id) as unique_scenarios,
        SUM(CASE WHEN ts.score >= ? THEN 1 ELSE 0 END) as passed_sessions
      FROM training_sessions ts
      WHERE ts.user_id = ? AND ts.status = 'completed'`,
      [config.SCORING.ACCURACY_THRESHOLD, userId]
    );
    
    // Get improvement areas
    const improvementAreas = await feedbackService.getImprovementAreas(userId);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      sessions,
      stats: {
        totalSessions: stats.total_sessions || 0,
        averageScore: stats.average_score || 0,
        highestScore: stats.highest_score || 0,
        uniqueScenarios: stats.unique_scenarios || 0,
        passedSessions: stats.passed_sessions || 0,
        passRate: stats.total_sessions ? (stats.passed_sessions / stats.total_sessions) * 100 : 0
      },
      improvementAreas
    });
  } catch (error) {
    console.error('Get user feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
