/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * Fix Duplicates Script
 * 
 * This script checks for and removes duplicate entries in the
 * training_scenarios and scenario_lines tables.
 */

const { connectDB, query } = require('./backend/db');

async function fixDuplicates() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    // First, check for duplicates in training_scenarios
    console.log('Checking for duplicates in training_scenarios table...');
    const scenarioDuplicates = await query(`
      SELECT title, COUNT(*) as count
      FROM training_scenarios
      GROUP BY title
      HAVING COUNT(*) > 1
    `);
    
    if (scenarioDuplicates.length > 0) {
      console.log(`Found ${scenarioDuplicates.length} duplicate scenario titles.`);
      
      // For each duplicate title, keep only the most recent entry
      for (const duplicate of scenarioDuplicates) {
        console.log(`Fixing duplicates for scenario: ${duplicate.title}`);
        
        // Get all entries with this title
        const entries = await query(`
          SELECT id, title, created_at, updated_at
          FROM training_scenarios
          WHERE title = ?
          ORDER BY updated_at DESC
        `, [duplicate.title]);
        
        // Keep the most recent entry, delete the others
        const keepId = entries[0].id;
        const deleteIds = entries.slice(1).map(e => e.id);
        
        console.log(`Keeping scenario ID ${keepId}, deleting IDs: ${deleteIds.join(', ')}`);
        
        // Update any scenario_lines that reference the deleted scenarios to point to the kept scenario
        for (const deleteId of deleteIds) {
          await query(`
            UPDATE scenario_lines
            SET scenario_id = ?
            WHERE scenario_id = ?
          `, [keepId, deleteId]);
          
          // Delete the duplicate scenario
          await query(`
            DELETE FROM training_scenarios
            WHERE id = ?
          `, [deleteId]);
        }
      }
    } else {
      console.log('No duplicate scenarios found.');
    }
    
    // Check for duplicates in scenario_lines
    console.log('Checking for duplicates in scenario_lines table...');
    const lineDuplicates = await query(`
      SELECT scenario_id, line_number, COUNT(*) as count
      FROM scenario_lines
      GROUP BY scenario_id, line_number
      HAVING COUNT(*) > 1
    `);
    
    if (lineDuplicates.length > 0) {
      console.log(`Found ${lineDuplicates.length} duplicate scenario lines.`);
      
      // For each duplicate line, keep only the most recent entry
      for (const duplicate of lineDuplicates) {
        console.log(`Fixing duplicates for scenario ${duplicate.scenario_id}, line ${duplicate.line_number}`);
        
        // Get all entries with this scenario_id and line_number
        const entries = await query(`
          SELECT id, scenario_id, line_number, created_at, updated_at
          FROM scenario_lines
          WHERE scenario_id = ? AND line_number = ?
          ORDER BY updated_at DESC
        `, [duplicate.scenario_id, duplicate.line_number]);
        
        // Keep the most recent entry, delete the others
        const keepId = entries[0].id;
        const deleteIds = entries.slice(1).map(e => e.id);
        
        console.log(`Keeping line ID ${keepId}, deleting IDs: ${deleteIds.join(', ')}`);
        
        // Delete the duplicate lines
        for (const deleteId of deleteIds) {
          await query(`
            DELETE FROM scenario_lines
            WHERE id = ?
          `, [deleteId]);
        }
      }
    } else {
      console.log('No duplicate scenario lines found.');
    }
    
    // Verify the fix
    const scenarioCount = await query('SELECT COUNT(*) as count FROM training_scenarios');
    const lineCount = await query('SELECT COUNT(*) as count FROM scenario_lines');
    
    console.log(`Database now has ${scenarioCount[0].count} scenarios and ${lineCount[0].count} scenario lines.`);
    
    // List all scenarios
    console.log('\nCurrent scenarios in database:');
    const scenarios = await query(`
      SELECT id, title, difficulty, category
      FROM training_scenarios
      ORDER BY id
    `);
    
    scenarios.forEach(scenario => {
      console.log(`ID: ${scenario.id}, Title: ${scenario.title}, Difficulty: ${scenario.difficulty}, Category: ${scenario.category}`);
    });
    
    // Count lines per scenario
    console.log('\nScenario lines count:');
    const lineCounts = await query(`
      SELECT scenario_id, COUNT(*) as count
      FROM scenario_lines
      GROUP BY scenario_id
      ORDER BY scenario_id
    `);
    
    lineCounts.forEach(count => {
      console.log(`Scenario ID: ${count.scenario_id}, Line Count: ${count.count}`);
    });
    
    console.log('\nDuplicate fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing duplicates:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixDuplicates();
