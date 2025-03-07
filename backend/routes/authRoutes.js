/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { query, queryOne } = require('../db');
const config = require('../config');

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, firstName, lastName, role } = req.body;
    
    // Validate input
    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and email are required'
      });
    }
    
    // Check if username already exists
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Insert new user
    const sql = `
      INSERT INTO users (username, password, email, first_name, last_name, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const result = await query(sql, [
      username,
      hashedPassword,
      email,
      firstName || null,
      lastName || null,
      role || 'trainee'
    ]);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: result.insertId, username, role: role || 'trainee' },
      config.JWT.SECRET,
      { expiresIn: config.JWT.EXPIRES_IN }
    );
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: result.insertId,
        username,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        role: role || 'trainee'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login user and return JWT token
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    
    // Find user
    const user = await queryOne(
      'SELECT id, username, password, email, first_name, last_name, role FROM users WHERE username = ?',
      [username]
    );
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.JWT.SECRET,
      { expiresIn: config.JWT.EXPIRES_IN }
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/auth/verify
 * @desc Verify JWT token and return user data
 * @access Private
 */
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, config.JWT.SECRET);
    
    // Get user data
    const user = await queryOne(
      'SELECT id, username, email, first_name, last_name, role FROM users WHERE id = ?',
      [decoded.id]
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
        role: user.role
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
