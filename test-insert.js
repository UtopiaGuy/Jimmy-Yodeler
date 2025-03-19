/**
 * Test script for the insert function in db.js
 */

const { connectDB, insert } = require('./backend/db');

async function testInsert() {
  try {
    // Connect to the database
    await connectDB();
    console.log('Connected to database');
    
    // Test data for a training session
    const testData = {
      user_id: 1, // Assuming user ID 1 exists
      scenario_id: 1, // Assuming scenario ID 1 exists
      audio_filter_type: 'radio',
      status: 'in_progress',
      started_at: new Date(),
      user_callsign: 'Test-1'
    };
    
    // Try to insert the test data
    console.log('Attempting to insert test data:', testData);
    const insertId = await insert('training_sessions', testData);
    console.log('Insert successful! Inserted ID:', insertId);
    
    console.log('Test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testInsert();
