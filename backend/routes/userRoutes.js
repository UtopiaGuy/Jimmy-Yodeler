/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * User Routes
 */

const express = require('express');
const router = express.Router();
const { query, queryOne, update } = require('../db');
const jwt = require('jsonwebtoken');
const config = require('../config');

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
 * @route GET /api/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await queryOne(
      `SELECT id, username, email, first_name, last_name, role, created_at, 
      (SELECT COUNT(*) FROM training_sessions WHERE user_id = users.id) as session_count,
      (SELECT AVG(score) FROM training_sessions WHERE user_id = users.id) as avg_score,
      (SELECT COUNT(DISTINCT scenario_id) FROM training_sessions WHERE user_id = users.id AND status = 'completed') as unique_scenarios,
      (SELECT MAX(score) FROM training_sessions WHERE user_id = users.id AND status = 'completed') as highest_score
      FROM users WHERE id = ?`,
      [req.user.id]
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: {
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
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route PUT /api/users/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;
    
    // Update user
    const updateData = {};
    if (email) updateData.email = email;
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No update data provided'
      });
    }
    
    const result = await update(
      'users',
      updateData,
      'id = ?',
      [req.user.id]
    );
    
    if (result === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get updated user
    const updatedUser = await queryOne(
      'SELECT id, username, email, first_name, last_name, role FROM users WHERE id = ?',
      [req.user.id]
    );
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/users
 * @desc Get all users (admin only)
 * @access Private/Admin
 */
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await query(
      `SELECT id, username, email, first_name, last_name, role, created_at,
      (SELECT COUNT(*) FROM training_sessions WHERE user_id = users.id) as session_count,
      (SELECT AVG(score) FROM training_sessions WHERE user_id = users.id) as avg_score,
      (SELECT COUNT(DISTINCT scenario_id) FROM training_sessions WHERE user_id = users.id AND status = 'completed') as unique_scenarios,
      (SELECT MAX(score) FROM training_sessions WHERE user_id = users.id AND status = 'completed') as highest_score
      FROM users ORDER BY id DESC`
    );
    
    const formattedUsers = users.map(user => ({
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
    
    res.json({
      success: true,
      count: users.length,
      users: formattedUsers
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/users/:id
 * @desc Get user by ID (admin only)
 * @access Private/Admin
 */
router.get('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await queryOne(
      `SELECT id, username, email, first_name, last_name, role, created_at,
      (SELECT COUNT(*) FROM training_sessions WHERE user_id = users.id) as session_count,
      (SELECT AVG(score) FROM training_sessions WHERE user_id = users.id) as avg_score,
      (SELECT COUNT(DISTINCT scenario_id) FROM training_sessions WHERE user_id = users.id AND status = 'completed') as unique_scenarios,
      (SELECT MAX(score) FROM training_sessions WHERE user_id = users.id AND status = 'completed') as highest_score
      FROM users WHERE id = ?`,
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: {
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
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route PUT /api/users/:id
 * @desc Update user (admin only)
 * @access Private/Admin
 */
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { email, firstName, lastName, role } = req.body;
    
    // Update user
    const updateData = {};
    if (email) updateData.email = email;
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (role) updateData.role = role;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No update data provided'
      });
    }
    
    const result = await update(
      'users',
      updateData,
      'id = ?',
      [userId]
    );
    
    if (result === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get updated user
    const updatedUser = await queryOne(
      'SELECT id, username, email, first_name, last_name, role FROM users WHERE id = ?',
      [userId]
    );
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route DELETE /api/users/:id
 * @desc Delete user (admin only)
 * @access Private/Admin
 */
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const user = await queryOne(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Delete user's training sessions and feedback
    await query('DELETE FROM feedback WHERE training_session_id IN (SELECT id FROM training_sessions WHERE user_id = ?)', [userId]);
    await query('DELETE FROM training_sessions WHERE user_id = ?', [userId]);
    
    // Delete user
    await query('DELETE FROM users WHERE id = ?', [userId]);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
