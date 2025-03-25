/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * Database Update Script
 * 
 * This script updates the training_scenarios and scenario_lines tables
 * with new scenario data from the CSV files.
 */

const fs = require('fs');
const path = require('path');
const { connectDB, query } = require('./backend/db');

async function updateDatabase() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('Reading SQL file...');
    const sqlFilePath = path.join(process.cwd(), 'update_scenarios.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Executing SQL statements...');
    
    // First, update training_scenarios table
    console.log('Updating training_scenarios table...');
    
    // Process each scenario from the template
    for (let i = 1; i <= 6; i++) {
      const scenarioRegex = new RegExp(`-- Scenario ${i}: (.+?)\\s*INSERT INTO training_scenarios[\\s\\S]+?is_active = 1;`, 'g');
      const scenarioMatch = scenarioRegex.exec(sqlContent);
      
      if (scenarioMatch) {
        const scenarioSql = scenarioMatch[0].split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n');
        
        try {
          await query(scenarioSql);
          console.log(`Updated scenario ${i}`);
        } catch (error) {
          console.error(`Error updating scenario ${i}:`, error.message);
        }
      }
    }
    
    // Then, update scenario_lines table
    console.log('Updating scenario_lines table...');
    
    // Process each scenario's lines
    for (let i = 1; i <= 6; i++) {
      // First delete existing lines
      try {
        await query(`DELETE FROM scenario_lines WHERE scenario_id = ${i};`);
        console.log(`Deleted existing lines for scenario ${i}`);
      } catch (error) {
        console.error(`Error deleting lines for scenario ${i}:`, error.message);
      }
      
      // Extract insert statements for this scenario
      const insertRegex = new RegExp(`INSERT INTO scenario_lines \\(scenario_id, line_number, is_prompter, prompter_text, user_text, phase_context, prompter_callsign, created_at, updated_at\\)\\s*VALUES \\(${i}, [\\s\\S]+?\\);`, 'g');
      let match;
      let insertCount = 0;
      
      // Reset regex lastIndex
      insertRegex.lastIndex = 0;
      
      // Find all insert statements for this scenario
      while ((match = insertRegex.exec(sqlContent)) !== null) {
        try {
          await query(match[0]);
          insertCount++;
        } catch (error) {
          console.error(`Error inserting line for scenario ${i}:`, error.message);
          console.error('Statement:', match[0]);
        }
      }
      
      console.log(`Inserted ${insertCount} lines for scenario ${i}`);
    }
    
    console.log('Database update completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database update failed:', error.message);
    process.exit(1);
  }
}

// Run the update
updateDatabase();
