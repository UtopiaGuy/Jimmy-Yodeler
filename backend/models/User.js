/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * User Model
 */

const { query, queryOne, insert, update } = require('../db');
const bcrypt = require('bcrypt');

/**
 * User model class
 */
class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user
   */
  static async create(userData) {
    try {
      // Check if username already exists
      const existingUser = await queryOne(
        'SELECT id FROM users WHERE username = ?',
        [userData.username]
      );
      
      if (existingUser) {
        throw new Error('Username already exists');
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Insert new user
      const userId = await insert('users', {
        username: userData.username,
        password: hashedPassword,
        email: userData.email,
        first_name: userData.firstName || null,
        last_name: userData.lastName || null,
        role: userData.role || 'trainee',
        created_at: new Date()
      });
      
      // Get created user
      return await this.findById(userId);
    } catch (error) {
      console.error('User creation error:', error);
      throw error;
    }
  }
  
  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} - User object or null
   */
  static async findById(id) {
    try {
      const user = await queryOne(
        `SELECT id, username, email, first_name, last_name, role, created_at,
        (SELECT COUNT(*) FROM training_sessions WHERE user_id = users.id) as session_count,
        (SELECT AVG(score) FROM training_sessions WHERE user_id = users.id AND status = 'completed') as avg_score,
        (SELECT COUNT(DISTINCT scenario_id) FROM training_sessions WHERE user_id = users.id AND status = 'completed') as unique_scenarios,
        (SELECT MAX(score) FROM training_sessions WHERE user_id = users.id AND status = 'completed') as highest_score
        FROM users WHERE id = ?`,
        [id]
      );
      
      if (!user) {
        return null;
      }
      
      // Format user data
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at,
        stats: {
          sessionCount: user.session_count,
          averageScore: user.avg_score || 0,
          uniqueScenarios: user.unique_scenarios || 0,
          highestScore: user.highest_score || 0
        }
      };
    } catch (error) {
      console.error('Find user by ID error:', error);
      throw error;
    }
  }
  
  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} - User object or null
   */
  static async findByUsername(username) {
    try {
      const user = await queryOne(
        'SELECT id, username, password, email, first_name, last_name, role, created_at FROM users WHERE username = ?',
        [username]
      );
      
      if (!user) {
        return null;
      }
      
      // Format user data
      return {
        id: user.id,
        username: user.username,
        password: user.password, // Hashed password for authentication
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at
      };
    } catch (error) {
      console.error('Find user by username error:', error);
      throw error;
    }
  }
  
  /**
   * Update user
   * @param {number} id - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} - Updated user
   */
  static async update(id, userData) {
    try {
      // Prepare update data
      const updateData = {};
      
      if (userData.email) updateData.email = userData.email;
      if (userData.firstName !== undefined) updateData.first_name = userData.firstName;
      if (userData.lastName !== undefined) updateData.last_name = userData.lastName;
      if (userData.role) updateData.role = userData.role;
      
      // Update password if provided
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(userData.password, salt);
      }
      
      // Update user
      const result = await update(
        'users',
        updateData,
        'id = ?',
        [id]
      );
      
      if (result === 0) {
        throw new Error('User not found');
      }
      
      // Get updated user
      return await this.findById(id);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }
  
  /**
   * Delete user
   * @param {number} id - User ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    try {
      // Check if user exists
      const user = await queryOne(
        'SELECT id FROM users WHERE id = ?',
        [id]
      );
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Delete user's training sessions and feedback
      await query('DELETE FROM feedback WHERE training_session_id IN (SELECT id FROM training_sessions WHERE user_id = ?)', [id]);
      await query('DELETE FROM training_sessions WHERE user_id = ?', [id]);
      
      // Delete user
      await query('DELETE FROM users WHERE id = ?', [id]);
      
      return true;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }
  
  /**
   * Find all users
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of users
   */
  static async findAll(options = {}) {
    try {
      let sql = `
        SELECT id, username, email, first_name, last_name, role, created_at,
        (SELECT COUNT(*) FROM training_sessions WHERE user_id = users.id) as session_count,
        (SELECT AVG(score) FROM training_sessions WHERE user_id = users.id AND status = 'completed') as avg_score,
        (SELECT COUNT(DISTINCT scenario_id) FROM training_sessions WHERE user_id = users.id AND status = 'completed') as unique_scenarios,
        (SELECT MAX(score) FROM training_sessions WHERE user_id = users.id AND status = 'completed') as highest_score
        FROM users
      `;
      
      const params = [];
      
      // Add WHERE clause if role filter is provided
      if (options.role) {
        sql += ' WHERE role = ?';
        params.push(options.role);
      }
      
      // Add ORDER BY clause
      sql += ' ORDER BY ' + (options.orderBy || 'id DESC');
      
      // Add LIMIT and OFFSET for pagination
      if (options.limit) {
        sql += ' LIMIT ?';
        params.push(options.limit);
        
        if (options.offset) {
          sql += ' OFFSET ?';
          params.push(options.offset);
        }
      }
      
      const users = await query(sql, params);
      
      // Format user data
      return users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at,
        stats: {
          sessionCount: user.session_count,
          averageScore: user.avg_score || 0,
          uniqueScenarios: user.unique_scenarios || 0,
          highestScore: user.highest_score || 0
        }
      }));
    } catch (error) {
      console.error('Find all users error:', error);
      throw error;
    }
  }
  
  /**
   * Authenticate user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object|null>} - Authenticated user or null
   */
  static async authenticate(username, password) {
    try {
      // Find user by username
      const user = await this.findByUsername(username);
      
      if (!user) {
        return null;
      }
      
      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return null;
      }
      
      // Remove password from user object
      delete user.password;
      
      return user;
    } catch (error) {
      console.error('User authentication error:', error);
      throw error;
    }
  }
}

module.exports = User;
