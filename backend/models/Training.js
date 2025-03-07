/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * Training Model
 */

const { query, queryOne, insert, update } = require('../db');

/**
 * Training model class
 */
class Training {
  /**
   * Create a new training session
   * @param {Object} sessionData - Training session data
   * @returns {Promise<Object>} - Created training session
   */
  static async createSession(sessionData) {
    try {
      // Validate required fields
      if (!sessionData.userId || !sessionData.scenarioId) {
        throw new Error('User ID and scenario ID are required');
      }
      
      // Insert new training session
      const sessionId = await insert('training_sessions', {
        user_id: sessionData.userId,
        scenario_id: sessionData.scenarioId,
        audio_filter_type: sessionData.audioFilterType || 'radio',
        status: 'in_progress',
        started_at: new Date(),
        score: null
      });
      
      // Get created session
      return await this.getSessionById(sessionId);
    } catch (error) {
      console.error('Training session creation error:', error);
      throw error;
    }
  }
  
  /**
   * Get training session by ID
   * @param {number} id - Session ID
   * @returns {Promise<Object|null>} - Training session or null
   */
  static async getSessionById(id) {
    try {
      const session = await queryOne(
        `SELECT ts.id, ts.user_id, ts.scenario_id, ts.audio_filter_type, 
        ts.status, ts.started_at, ts.completed_at, ts.score,
        sc.title as scenario_title, sc.difficulty, sc.category
        FROM training_sessions ts
        JOIN training_scenarios sc ON ts.scenario_id = sc.id
        WHERE ts.id = ?`,
        [id]
      );
      
      if (!session) {
        return null;
      }
      
      // Format session data
      return {
        id: session.id,
        userId: session.user_id,
        scenarioId: session.scenario_id,
        scenarioTitle: session.scenario_title,
        difficulty: session.difficulty,
        category: session.category,
        audioFilterType: session.audio_filter_type,
        status: session.status,
        startedAt: session.started_at,
        completedAt: session.completed_at,
        score: session.score
      };
    } catch (error) {
      console.error('Get training session error:', error);
      throw error;
    }
  }
  
  /**
   * Get training sessions for a user
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of training sessions
   */
  static async getUserSessions(userId, options = {}) {
    try {
      let sql = `
        SELECT ts.id, ts.scenario_id, ts.audio_filter_type, ts.status, 
        ts.started_at, ts.completed_at, ts.score,
        sc.title as scenario_title, sc.difficulty, sc.category
        FROM training_sessions ts
        JOIN training_scenarios sc ON ts.scenario_id = sc.id
        WHERE ts.user_id = ?
      `;
      
      const params = [userId];
      
      // Add status filter if provided
      if (options.status) {
        sql += ' AND ts.status = ?';
        params.push(options.status);
      }
      
      // Add ORDER BY clause
      sql += ' ORDER BY ' + (options.orderBy || 'ts.started_at DESC');
      
      // Add LIMIT and OFFSET for pagination
      if (options.limit) {
        sql += ' LIMIT ?';
        params.push(options.limit);
        
        if (options.offset) {
          sql += ' OFFSET ?';
          params.push(options.offset);
        }
      }
      
      const sessions = await query(sql, params);
      
      // Format session data
      return sessions.map(session => ({
        id: session.id,
        scenarioId: session.scenario_id,
        scenarioTitle: session.scenario_title,
        difficulty: session.difficulty,
        category: session.category,
        audioFilterType: session.audio_filter_type,
        status: session.status,
        startedAt: session.started_at,
        completedAt: session.completed_at,
        score: session.score
      }));
    } catch (error) {
      console.error('Get user sessions error:', error);
      throw error;
    }
  }
  
  /**
   * Complete a training session
   * @param {number} id - Session ID
   * @param {number} score - Final score
   * @returns {Promise<Object>} - Updated training session
   */
  static async completeSession(id, score) {
    try {
      // Update session
      const result = await update(
        'training_sessions',
        {
          status: 'completed',
          completed_at: new Date(),
          score
        },
        'id = ?',
        [id]
      );
      
      if (result === 0) {
        throw new Error('Training session not found');
      }
      
      // Get updated session
      return await this.getSessionById(id);
    } catch (error) {
      console.error('Complete training session error:', error);
      throw error;
    }
  }
  
  /**
   * Get all training scenarios
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of training scenarios
   */
  static async getAllScenarios(options = {}) {
    try {
      let sql = `
        SELECT id, title, description, difficulty, category, 
        created_at, updated_at, is_active
        FROM training_scenarios
      `;
      
      const params = [];
      
      // Add WHERE clauses
      const whereConditions = [];
      
      if (options.isActive !== undefined) {
        whereConditions.push('is_active = ?');
        params.push(options.isActive ? 1 : 0);
      }
      
      if (options.difficulty) {
        whereConditions.push('difficulty = ?');
        params.push(options.difficulty);
      }
      
      if (options.category) {
        whereConditions.push('category = ?');
        params.push(options.category);
      }
      
      if (whereConditions.length > 0) {
        sql += ' WHERE ' + whereConditions.join(' AND ');
      }
      
      // Add ORDER BY clause
      sql += ' ORDER BY ' + (options.orderBy || 'difficulty ASC, title ASC');
      
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
      console.error('Get all scenarios error:', error);
      throw error;
    }
  }
  
  /**
   * Get training scenario by ID
   * @param {number} id - Scenario ID
   * @returns {Promise<Object|null>} - Training scenario or null
   */
  static async getScenarioById(id) {
    try {
      const scenario = await queryOne(
        `SELECT id, title, description, difficulty, category, 
        script_content, expected_responses, audio_filter_type,
        created_at, updated_at, is_active
        FROM training_scenarios
        WHERE id = ?`,
        [id]
      );
      
      if (!scenario) {
        return null;
      }
      
      // Parse JSON fields
      try {
        scenario.script_content = JSON.parse(scenario.script_content);
        scenario.expected_responses = JSON.parse(scenario.expected_responses);
      } catch (e) {
        console.error('Error parsing JSON fields:', e);
      }
      
      return scenario;
    } catch (error) {
      console.error('Get scenario by ID error:', error);
      throw error;
    }
  }
  
  /**
   * Create a new training scenario
   * @param {Object} scenarioData - Training scenario data
   * @returns {Promise<Object>} - Created training scenario
   */
  static async createScenario(scenarioData) {
    try {
      // Validate required fields
      if (!scenarioData.title || !scenarioData.scriptContent || !scenarioData.expectedResponses) {
        throw new Error('Title, script content, and expected responses are required');
      }
      
      // Prepare JSON fields
      const scriptContent = JSON.stringify(scenarioData.scriptContent);
      const expectedResponses = JSON.stringify(scenarioData.expectedResponses);
      
      // Insert new scenario
      const scenarioId = await insert('training_scenarios', {
        title: scenarioData.title,
        description: scenarioData.description || null,
        difficulty: scenarioData.difficulty || 'beginner',
        category: scenarioData.category || 'general',
        script_content: scriptContent,
        expected_responses: expectedResponses,
        audio_filter_type: scenarioData.audioFilterType || 'radio',
        created_at: new Date(),
        updated_at: new Date(),
        is_active: scenarioData.isActive !== undefined ? scenarioData.isActive : true
      });
      
      // Get created scenario
      return await this.getScenarioById(scenarioId);
    } catch (error) {
      console.error('Create scenario error:', error);
      throw error;
    }
  }
  
  /**
   * Update a training scenario
   * @param {number} id - Scenario ID
   * @param {Object} scenarioData - Training scenario data to update
   * @returns {Promise<Object>} - Updated training scenario
   */
  static async updateScenario(id, scenarioData) {
    try {
      // Prepare update data
      const updateData = {
        updated_at: new Date()
      };
      
      if (scenarioData.title) updateData.title = scenarioData.title;
      if (scenarioData.description !== undefined) updateData.description = scenarioData.description;
      if (scenarioData.difficulty) updateData.difficulty = scenarioData.difficulty;
      if (scenarioData.category) updateData.category = scenarioData.category;
      if (scenarioData.audioFilterType) updateData.audio_filter_type = scenarioData.audioFilterType;
      if (scenarioData.isActive !== undefined) updateData.is_active = scenarioData.isActive;
      
      // Update JSON fields if provided
      if (scenarioData.scriptContent) {
        updateData.script_content = JSON.stringify(scenarioData.scriptContent);
      }
      
      if (scenarioData.expectedResponses) {
        updateData.expected_responses = JSON.stringify(scenarioData.expectedResponses);
      }
      
      // Update scenario
      const result = await update(
        'training_scenarios',
        updateData,
        'id = ?',
        [id]
      );
      
      if (result === 0) {
        throw new Error('Training scenario not found');
      }
      
      // Get updated scenario
      return await this.getScenarioById(id);
    } catch (error) {
      console.error('Update scenario error:', error);
      throw error;
    }
  }
  
  /**
   * Delete a training scenario
   * @param {number} id - Scenario ID
   * @returns {Promise<boolean>} - Success status
   */
  static async deleteScenario(id) {
    try {
      // Check if scenario exists
      const scenario = await queryOne(
        'SELECT id FROM training_scenarios WHERE id = ?',
        [id]
      );
      
      if (!scenario) {
        throw new Error('Training scenario not found');
      }
      
      // Check if scenario is used in any training sessions
      const sessions = await queryOne(
        'SELECT COUNT(*) as count FROM training_sessions WHERE scenario_id = ?',
        [id]
      );
      
      if (sessions.count > 0) {
        // Soft delete by setting is_active to false
        await update(
          'training_scenarios',
          { is_active: false, updated_at: new Date() },
          'id = ?',
          [id]
        );
      } else {
        // Hard delete if not used
        await query('DELETE FROM training_scenarios WHERE id = ?', [id]);
      }
      
      return true;
    } catch (error) {
      console.error('Delete scenario error:', error);
      throw error;
    }
  }
}

module.exports = Training;
