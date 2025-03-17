/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * Training Routes
 */

const express = require('express');
const router = express.Router();
const { query, queryOne, insert } = require('../db');
const jwt = require('jsonwebtoken');
const config = require('../config');
const scoringService = require('../services/scoringService');

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

/**
 * @route GET /api/training/scenarios
 * @desc Get all training scenarios
 * @access Private
 */
router.get('/scenarios', authenticateToken, async (req, res) => {
  try {
    const scenarios = await query(
      `SELECT id, title, description, difficulty, category, 
      created_at, updated_at, is_active
      FROM training_scenarios
      WHERE is_active = 1
      ORDER BY difficulty ASC, title ASC`
    );
    
    res.json({
      success: true,
      count: scenarios.length,
      scenarios
    });
  } catch (error) {
    console.error('Get scenarios error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving training scenarios',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/training/scenarios/:id
 * @desc Get training scenario by ID
 * @access Private
 */
router.get('/scenarios/:id', authenticateToken, async (req, res) => {
  try {
    const scenarioId = req.params.id;
    
    // Get scenario details
    const scenario = await queryOne(
      `SELECT id, title, description, difficulty, category, 
      script_content, expected_responses, audio_filter_type,
      created_at, updated_at, is_active
      FROM training_scenarios
      WHERE id = ? AND is_active = 1`,
      [scenarioId]
    );
    
    if (!scenario) {
      return res.status(404).json({
        success: false,
        message: 'Training scenario not found'
      });
    }
    
    // Get scenario lines - this is the primary source of data now
    const scenarioLines = await query(
      `SELECT id, line_number, is_prompter, prompter_text, user_text, phase_context, prompter_callsign
       FROM scenario_lines
       WHERE scenario_id = ?
       ORDER BY line_number ASC`,
      [scenarioId]
    );
    
    // Add scenario lines to the response
    scenario.scenario_lines = scenarioLines;
    
    // Construct script_content and expected_responses from scenario_lines
    // This is the preferred approach now, rather than using the legacy JSON fields
    scenario.script_content = scenarioLines
      .filter(line => line.is_prompter)
      .map(line => line.prompter_text);
    
    scenario.expected_responses = scenarioLines
      .filter(line => !line.is_prompter)
      .map(line => line.user_text);
    
    // If no scenario lines exist, fall back to legacy JSON fields (with error handling)
    if (scenarioLines.length === 0 && scenario.script_content) {
      console.warn(`No scenario lines found for scenario ${scenario.id}, falling back to legacy fields`);
      
      // Check if it's already an object (MySQL might have already parsed it)
      if (typeof scenario.script_content === 'object') {
        // Already an object, no need to parse
      } else {
        try {
          scenario.script_content = JSON.parse(scenario.script_content);
        } catch (error) {
          console.warn(`Invalid JSON in script_content for scenario ${scenario.id}: ${error.message}`);
          // Convert to array with the string as a single element
          scenario.script_content = [scenario.script_content];
        }
      }
    }
    
    if (scenarioLines.length === 0 && scenario.expected_responses) {
      // Check if it's already an object (MySQL might have already parsed it)
      if (typeof scenario.expected_responses === 'object') {
        // Already an object, no need to parse
      } else {
        try {
          scenario.expected_responses = JSON.parse(scenario.expected_responses);
        } catch (error) {
          console.warn(`Invalid JSON in expected_responses for scenario ${scenario.id}: ${error.message}`);
          // Convert to array with the string as a single element
          scenario.expected_responses = [scenario.expected_responses];
        }
      }
    }
    
    res.json({
      success: true,
      scenario
    });
  } catch (error) {
    console.error('Get scenario by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving training scenario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/training/scenarios/:id/lines
 * @desc Get scenario lines for a training scenario
 * @access Private
 */
router.get('/scenarios/:id/lines', authenticateToken, async (req, res) => {
  try {
    const scenarioId = req.params.id;
    
    // Check if scenario exists
    const scenario = await queryOne(
      'SELECT id FROM training_scenarios WHERE id = ? AND is_active = 1',
      [scenarioId]
    );
    
    if (!scenario) {
      return res.status(404).json({
        success: false,
        message: 'Training scenario not found'
      });
    }
    
    // Get scenario lines
    const scenarioLines = await query(
      `SELECT id, line_number, is_prompter, prompter_text, user_text, phase_context, prompter_callsign
       FROM scenario_lines
       WHERE scenario_id = ?
       ORDER BY line_number ASC`,
      [scenarioId]
    );
    
    res.json({
      success: true,
      scenarioId,
      scenarioLines
    });
  } catch (error) {
    console.error('Get scenario lines error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving scenario lines',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/training/sessions
 * @desc Start a new training session
 * @access Private
 */
router.post('/sessions', authenticateToken, async (req, res) => {
  try {
    const { scenarioId, audioFilterType, userCallsign } = req.body;
    
    // Validate input
    if (!scenarioId) {
      return res.status(400).json({
        success: false,
        message: 'Scenario ID is required'
      });
    }
    
    // Check if scenario exists
    const scenario = await queryOne(
      'SELECT id, title FROM training_scenarios WHERE id = ? AND is_active = 1',
      [scenarioId]
    );
    
    if (!scenario) {
      return res.status(404).json({
        success: false,
        message: 'Training scenario not found'
      });
    }
    
    // Create new session
    const sessionId = await insert('training_sessions', {
      user_id: req.user.id,
      scenario_id: scenarioId,
      audio_filter_type: audioFilterType || config.AUDIO_FILTERS.DEFAULT_FILTER,
      status: 'in_progress',
      started_at: new Date(),
      score: null,
      user_callsign: userCallsign || 'Alpha-1'
    });
    
    res.status(201).json({
      success: true,
      message: 'Training session started',
      session: {
        id: sessionId,
        scenarioId,
        scenarioTitle: scenario.title,
        audioFilterType: audioFilterType || config.AUDIO_FILTERS.DEFAULT_FILTER,
        status: 'in_progress',
        startedAt: new Date(),
        userCallsign: userCallsign || 'Alpha-1'
      }
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting training session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/training/sessions
 * @desc Get user's training sessions
 * @access Private
 */
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await query(
      `SELECT ts.id, ts.scenario_id, ts.audio_filter_type, ts.status, 
      ts.started_at, ts.completed_at, ts.score, ts.user_callsign,
      sc.title as scenario_title, sc.difficulty, sc.category
      FROM training_sessions ts
      JOIN training_scenarios sc ON ts.scenario_id = sc.id
      WHERE ts.user_id = ?
      ORDER BY ts.started_at DESC`,
      [req.user.id]
    );
    
    res.json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving training sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/training/sessions/:id
 * @desc Get training session by ID
 * @access Private
 */
router.get('/sessions/:id', authenticateToken, async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Get session details
    const session = await queryOne(
      `SELECT ts.id, ts.user_id, ts.scenario_id, ts.audio_filter_type, 
      ts.status, ts.started_at, ts.completed_at, ts.score, ts.user_callsign,
      sc.title as scenario_title, sc.difficulty, sc.category,
      sc.script_content, sc.expected_responses
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
    
    // Get scenario lines - this is the primary source of data now
    const scenarioLines = await query(
      `SELECT id, line_number, is_prompter, prompter_text, user_text, phase_context, prompter_callsign
       FROM scenario_lines
       WHERE scenario_id = ?
       ORDER BY line_number ASC`,
      [session.scenario_id]
    );
    
    // Add scenario lines to the response
    session.scenario_lines = scenarioLines;
    
    // Construct script_content and expected_responses from scenario_lines
    // This is the preferred approach now, rather than using the legacy JSON fields
    session.script_content = scenarioLines
      .filter(line => line.is_prompter)
      .map(line => line.prompter_text);
    
    session.expected_responses = scenarioLines
      .filter(line => !line.is_prompter)
      .map(line => line.user_text);
    
    // If no scenario lines exist, fall back to legacy JSON fields (with error handling)
    if (scenarioLines.length === 0 && session.script_content) {
      console.warn(`No scenario lines found for session ${session.id}, falling back to legacy fields`);
      
      // Check if it's already an object (MySQL might have already parsed it)
      if (typeof session.script_content === 'object') {
        // Already an object, no need to parse
      } else {
        try {
          session.script_content = JSON.parse(session.script_content);
        } catch (error) {
          console.warn(`Invalid JSON in script_content for session ${session.id}: ${error.message}`);
          // Convert to array with the string as a single element
          session.script_content = [session.script_content];
        }
      }
    }
    
    if (scenarioLines.length === 0 && session.expected_responses) {
      // Check if it's already an object (MySQL might have already parsed it)
      if (typeof session.expected_responses === 'object') {
        // Already an object, no need to parse
      } else {
        try {
          session.expected_responses = JSON.parse(session.expected_responses);
        } catch (error) {
          console.warn(`Invalid JSON in expected_responses for session ${session.id}: ${error.message}`);
          // Convert to array with the string as a single element
          session.expected_responses = [session.expected_responses];
        }
      }
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
    
    res.json({
      success: true,
      session,
      feedback
    });
  } catch (error) {
    console.error('Get session by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving training session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route PATCH /api/training/sessions/:id
 * @desc Update a training session
 * @access Private
 */
router.patch('/sessions/:id', authenticateToken, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { userCallsign, audioFilterType } = req.body;
    
    // Get session details
    const session = await queryOne(
      'SELECT id, user_id, status FROM training_sessions WHERE id = ?',
      [sessionId]
    );
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Training session not found'
      });
    }
    
    // Check if user owns this session
    if (session.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this session.'
      });
    }
    
    // Check if session is still in progress
    if (session.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'This training session is already completed'
      });
    }
    
    // Update fields
    const updateFields = {};
    if (userCallsign) updateFields.user_callsign = userCallsign;
    if (audioFilterType) updateFields.audio_filter_type = audioFilterType;
    
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    // Build update query
    const updateQuery = Object.keys(updateFields)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const updateValues = [...Object.values(updateFields), sessionId];
    
    // Update session
    await query(
      `UPDATE training_sessions SET ${updateQuery} WHERE id = ?`,
      updateValues
    );
    
    res.json({
      success: true,
      message: 'Training session updated',
      updatedFields: Object.keys(updateFields)
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating training session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/training/sessions/:id/submit
 * @desc Submit a response for a training session
 * @access Private
 */
router.post('/sessions/:id/submit', authenticateToken, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { promptIndex, userResponse, userCallsign } = req.body;
    
    // Validate input
    if (promptIndex === undefined || !userResponse) {
      return res.status(400).json({
        success: false,
        message: 'Prompt index and user response are required'
      });
    }
    
    // Get session details
    const session = await queryOne(
      `SELECT ts.id, ts.user_id, ts.scenario_id, ts.status, ts.user_callsign,
      sc.expected_responses
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
    
    // Check if user owns this session
    if (session.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this session.'
      });
    }
    
    // Check if session is still in progress
    if (session.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'This training session is already completed'
      });
    }
    
    // Update user callsign if provided
    if (userCallsign && userCallsign !== session.user_callsign) {
      await query(
        'UPDATE training_sessions SET user_callsign = ? WHERE id = ?',
        [userCallsign, sessionId]
      );
    }
    
    let expectedResponse;
    
    // Try to get expected response from scenario_lines first
    const scenarioLine = await queryOne(
      `SELECT user_text
       FROM scenario_lines
       WHERE scenario_id = ? AND is_prompter = 0
       ORDER BY line_number ASC
       LIMIT 1 OFFSET ?`,
      [session.scenario_id, promptIndex]
    );
    
    if (scenarioLine) {
      expectedResponse = scenarioLine.user_text;
    } else {
      // Fall back to legacy expected_responses JSON field
      let expectedResponses;
      
      // Check if it's already an object (MySQL might have already parsed it)
      if (typeof session.expected_responses === 'object') {
        expectedResponses = session.expected_responses;
      } else {
        try {
          expectedResponses = JSON.parse(session.expected_responses);
        } catch (error) {
          console.warn(`Invalid JSON in expected_responses for session ${session.id}: ${error.message}`);
          // Convert to array with the string as a single element
          expectedResponses = [session.expected_responses];
        }
      }
      
      // Check if prompt index is valid
      if (promptIndex < 0 || promptIndex >= expectedResponses.length) {
        return res.status(400).json({
          success: false,
          message: 'Invalid prompt index'
        });
      }
      
      expectedResponse = expectedResponses[promptIndex];
    }
    
    // Ensure we have an expected response
    if (!expectedResponse) {
      return res.status(400).json({
        success: false,
        message: 'Expected response not found for this prompt index'
      });
    }
    
    // Score the response
    const { score, feedback } = await scoringService.scoreResponse(
      userResponse,
      expectedResponse
    );
    
    // Save feedback
    const feedbackId = await insert('feedback', {
      training_session_id: sessionId,
      prompt_index: promptIndex,
      user_response: userResponse,
      expected_response: expectedResponse,
      accuracy_score: score,
      feedback_text: feedback,
      created_at: new Date()
    });
    
    // Check if this is the last prompt
    let isLastPrompt = false;
    
    // Try to determine if this is the last prompt using scenario_lines
    const userResponseLines = await query(
      `SELECT COUNT(*) as count
       FROM scenario_lines
       WHERE scenario_id = ? AND is_prompter = 0`,
      [session.scenario_id]
    );
    
    if (userResponseLines && userResponseLines.length > 0) {
      isLastPrompt = promptIndex === userResponseLines[0].count - 1;
    } else if (session.expected_responses) {
      // Fall back to legacy expected_responses
      let expectedResponses;
      
      // Check if it's already an object (MySQL might have already parsed it)
      if (typeof session.expected_responses === 'object') {
        expectedResponses = session.expected_responses;
      } else {
        try {
          expectedResponses = JSON.parse(session.expected_responses);
        } catch (error) {
          console.warn(`Invalid JSON in expected_responses for session ${session.id}: ${error.message}`);
          // Convert to array with the string as a single element
          expectedResponses = [session.expected_responses];
        }
      }
      
      isLastPrompt = promptIndex === expectedResponses.length - 1;
    }
    
    // If last prompt, calculate overall score and complete session
    if (isLastPrompt) {
      // Get all feedback for this session
      const allFeedback = await query(
        'SELECT accuracy_score FROM feedback WHERE training_session_id = ?',
        [sessionId]
      );
      
      // Calculate average score
      const totalScore = allFeedback.reduce((sum, item) => sum + item.accuracy_score, 0);
      const averageScore = Math.round((totalScore / allFeedback.length) * 100) / 100;
      
      // Update session
      await query(
        'UPDATE training_sessions SET status = ?, completed_at = NOW(), score = ? WHERE id = ?',
        ['completed', averageScore, sessionId]
      );
      
      res.json({
        success: true,
        message: 'Training session completed',
        isLastPrompt: true,
        feedback: {
          id: feedbackId,
          promptIndex,
          userResponse,
          expectedResponse,
          accuracyScore: score,
          feedbackText: feedback
        },
        sessionResult: {
          sessionId,
          overallScore: averageScore,
          status: 'completed',
          completedAt: new Date()
        }
      });
    } else {
      // Not the last prompt, just return feedback
      res.json({
        success: true,
        message: 'Response submitted',
        isLastPrompt: false,
        feedback: {
          id: feedbackId,
          promptIndex,
          userResponse,
          expectedResponse,
          accuracyScore: score,
          feedbackText: feedback
        },
        nextPromptIndex: promptIndex + 1
      });
    }
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting response',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
