/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * API Tests
 * 
 * This file contains tests for the backend API endpoints.
 * Run with: npm test
 */

const request = require('supertest');
const app = require('../backend/server');
const jwt = require('jsonwebtoken');
const { query } = require('../backend/db');

// Mock user for testing
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

// Store auth token for authenticated requests
let authToken;

// Clean up test data before and after tests
beforeAll(async () => {
  try {
    // Clean up any existing test user
    await query('DELETE FROM feedback WHERE training_session_id IN (SELECT id FROM training_sessions WHERE user_id IN (SELECT id FROM users WHERE username = ?))', [testUser.username]);
    await query('DELETE FROM training_sessions WHERE user_id IN (SELECT id FROM users WHERE username = ?)', [testUser.username]);
    await query('DELETE FROM users WHERE username = ?', [testUser.username]);
  } catch (error) {
    console.error('Test setup error:', error);
  }
});

afterAll(async () => {
  try {
    // Clean up test user
    await query('DELETE FROM feedback WHERE training_session_id IN (SELECT id FROM training_sessions WHERE user_id IN (SELECT id FROM users WHERE username = ?))', [testUser.username]);
    await query('DELETE FROM training_sessions WHERE user_id IN (SELECT id FROM users WHERE username = ?)', [testUser.username]);
    await query('DELETE FROM users WHERE username = ?', [testUser.username]);
  } catch (error) {
    console.error('Test cleanup error:', error);
  }
});

// Authentication Tests
describe('Authentication API', () => {
  // Test user registration
  test('POST /api/auth/register - Register new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
    expect(response.body.user).toBeDefined();
    expect(response.body.user.username).toBe(testUser.username);
    
    // Store token for later tests
    authToken = response.body.token;
  });
  
  // Test login
  test('POST /api/auth/login - Login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: testUser.password
      })
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
    expect(response.body.user).toBeDefined();
    expect(response.body.user.username).toBe(testUser.username);
  });
  
  // Test login with invalid credentials
  test('POST /api/auth/login - Login with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: 'wrongpassword'
      })
      .expect('Content-Type', /json/)
      .expect(401);
    
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBeDefined();
  });
  
  // Test token verification
  test('GET /api/auth/verify - Verify valid token', async () => {
    const response = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${authToken}`)
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.username).toBe(testUser.username);
  });
  
  // Test token verification with invalid token
  test('GET /api/auth/verify - Verify invalid token', async () => {
    const response = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', 'Bearer invalidtoken')
      .expect('Content-Type', /json/)
      .expect(401);
    
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBeDefined();
  });
});

// User API Tests
describe('User API', () => {
  // Test get user profile
  test('GET /api/users/profile - Get user profile', async () => {
    const response = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.username).toBe(testUser.username);
    expect(response.body.user.email).toBe(testUser.email);
  });
  
  // Test update user profile
  test('PUT /api/users/profile - Update user profile', async () => {
    const updatedData = {
      email: 'updated@example.com',
      firstName: 'Test',
      lastName: 'User'
    };
    
    const response = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send(updatedData)
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe(updatedData.email);
    expect(response.body.user.firstName).toBe(updatedData.firstName);
    expect(response.body.user.lastName).toBe(updatedData.lastName);
  });
});

// Training API Tests
describe('Training API', () => {
  let scenarioId;
  let sessionId;
  
  // Test get all scenarios
  test('GET /api/training/scenarios - Get all scenarios', async () => {
    const response = await request(app)
      .get('/api/training/scenarios')
      .set('Authorization', `Bearer ${authToken}`)
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.scenarios).toBeDefined();
    expect(Array.isArray(response.body.scenarios)).toBe(true);
    
    // Store a scenario ID for later tests
    if (response.body.scenarios.length > 0) {
      scenarioId = response.body.scenarios[0].id;
    }
  });
  
  // Test get scenario by ID
  test('GET /api/training/scenarios/:id - Get scenario by ID', async () => {
    // Skip if no scenario ID available
    if (!scenarioId) {
      console.log('Skipping scenario detail test - no scenarios available');
      return;
    }
    
    const response = await request(app)
      .get(`/api/training/scenarios/${scenarioId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.scenario).toBeDefined();
    expect(response.body.scenario.id).toBe(scenarioId);
  });
  
  // Test create training session
  test('POST /api/training/sessions - Create training session', async () => {
    // Skip if no scenario ID available
    if (!scenarioId) {
      console.log('Skipping session creation test - no scenarios available');
      return;
    }
    
    const response = await request(app)
      .post('/api/training/sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        scenarioId,
        audioFilterType: 'radio',
        userCallsign: 'Bravo-2'
      })
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.session).toBeDefined();
    expect(response.body.session.scenarioId).toBe(scenarioId);
    expect(response.body.session.status).toBe('in_progress');
    expect(response.body.session.userCallsign).toBe('Bravo-2');
    
    // Store session ID for later tests
    sessionId = response.body.session.id;
  });
  
  // Test submit response
  test('POST /api/training/sessions/:id/submit - Submit response', async () => {
    // Skip if no session ID available
    if (!sessionId) {
      console.log('Skipping response submission test - no session available');
      return;
    }
    
    const response = await request(app)
      .post(`/api/training/sessions/${sessionId}/submit`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        promptIndex: 0,
        userResponse: 'Command, this is Alpha-1. I read you loud and clear, over.'
      })
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.feedback).toBeDefined();
    expect(response.body.feedback.accuracyScore).toBeDefined();
  });
  
  // Test get user sessions
  test('GET /api/training/sessions - Get user sessions', async () => {
    const response = await request(app)
      .get('/api/training/sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.sessions).toBeDefined();
    expect(Array.isArray(response.body.sessions)).toBe(true);
    
    // Verify our created session is in the list
    if (sessionId) {
      const foundSession = response.body.sessions.find(s => s.id === sessionId);
      expect(foundSession).toBeDefined();
    }
  });
});

// Feedback API Tests
describe('Feedback API', () => {
  // Test get user feedback
  test('GET /api/feedback/user - Get user feedback', async () => {
    const response = await request(app)
      .get('/api/feedback/user')
      .set('Authorization', `Bearer ${authToken}`)
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.stats).toBeDefined();
    expect(response.body.improvementAreas).toBeDefined();
    expect(response.body.feedback).toBeDefined();
  });
});
