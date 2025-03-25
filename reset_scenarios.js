/**
 * Reset and update training scenarios and scenario lines
 * This script executes the SQL in update_scenarios.sql to reset and repopulate
 * the training_scenarios and scenario_lines tables with fresh data
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetScenarios() {
  console.log('Starting scenario reset process...');
  
  // Read the SQL file
  const sqlFilePath = path.join(__dirname, 'update_scenarios.sql');
  const sql = fs.readFileSync(sqlFilePath, 'utf8');
  
  // Create database connection
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jimmy_yodeler',
    multipleStatements: true // Important for executing multiple SQL statements
  });
  
  try {
    console.log('Connected to database. Executing SQL...');
    
    // Execute the SQL statements
    await connection.query(sql);
    
    console.log('✅ Successfully reset and updated scenarios!');
    console.log('Summary:');
    console.log('- Deleted all existing scenario lines and training scenarios');
    console.log('- Added 7 training scenarios including the new Basic Radio Check');
    console.log('- Added 41 scenario lines with proper sequential IDs');
    
  } catch (error) {
    console.error('❌ Error executing SQL:', error.message);
    if (error.sqlMessage) {
      console.error('SQL Error:', error.sqlMessage);
    }
  } finally {
    // Close the connection
    await connection.end();
    console.log('Database connection closed.');
  }
}

// Run the function
resetScenarios().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
