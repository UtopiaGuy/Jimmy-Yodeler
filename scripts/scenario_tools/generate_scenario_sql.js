#!/usr/bin/env node

/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * Scenario SQL Generator
 * 
 * This script reads CSV templates for scenarios and script lines,
 * and generates SQL statements to insert them into the database.
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// Configuration
const CONFIG = {
  scenarioTemplatePath: path.join(__dirname, 'scenario_template.csv'),
  scriptLinesTemplatePath: path.join(__dirname, 'script_lines_template.csv'),
  outputPath: path.join(__dirname, 'scenario_insert.sql'),
  defaultPrompterCallsign: 'Command'
};

// Main function
async function main() {
  try {
    console.log('Jimmy Yodeler - Scenario SQL Generator');
    console.log('======================================');
    
    // Read CSV files
    console.log(`Reading scenario template from: ${CONFIG.scenarioTemplatePath}`);
    const scenarioData = readCsvFile(CONFIG.scenarioTemplatePath);
    
    console.log(`Reading script lines template from: ${CONFIG.scriptLinesTemplatePath}`);
    const scriptLinesData = readCsvFile(CONFIG.scriptLinesTemplatePath);
    
    // Process data and generate SQL
    console.log('Generating SQL statements...');
    const sqlStatements = generateSql(scenarioData, scriptLinesData);
    
    // Write SQL to file
    console.log(`Writing SQL to: ${CONFIG.outputPath}`);
    fs.writeFileSync(CONFIG.outputPath, sqlStatements);
    
    console.log('Done! SQL file generated successfully.');
    console.log(`\nTo execute the SQL, run: mysql -u <username> -p <database_name> < ${CONFIG.outputPath}`);
    console.log('Or copy and paste the SQL into your database management tool.');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Read CSV file and return parsed data
function readCsvFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  } catch (error) {
    throw new Error(`Failed to read or parse CSV file ${filePath}: ${error.message}`);
  }
}

// Generate SQL statements from the parsed data
function generateSql(scenarios, scriptLines) {
  let sql = '-- Jimmy Yodeler - Generated Scenario SQL\n';
  sql += `-- Generated on: ${new Date().toISOString()}\n\n`;
  
  // Process each scenario
  for (const scenario of scenarios) {
    // Validate scenario data
    validateScenario(scenario);
    
    // Find script lines for this scenario
    const scenarioLines = scriptLines.filter(line => 
      line.scenario_title.trim() === scenario.title.trim()
    );
    
    if (scenarioLines.length === 0) {
      console.warn(`Warning: No script lines found for scenario "${scenario.title}"`);
      continue;
    }
    
    // Sort script lines by line number
    scenarioLines.sort((a, b) => parseInt(a.line_number) - parseInt(b.line_number));
    
    // Generate script_content and expected_responses JSON arrays
    const prompterLines = scenarioLines
      .filter(line => line.is_prompter === '1')
      .map(line => line.prompter_text);
    
    const userLines = scenarioLines
      .filter(line => line.is_prompter === '0')
      .map(line => line.user_text);
    
    // Add scenario insert statement
    sql += `-- Scenario: ${scenario.title}\n`;
    sql += 'INSERT INTO training_scenarios (\n';
    sql += '  title, \n';
    sql += '  description, \n';
    sql += '  difficulty, \n';
    sql += '  category, \n';
    sql += '  script_content, \n';
    sql += '  expected_responses, \n';
    sql += '  audio_filter_type, \n';
    sql += '  created_at, \n';
    sql += '  updated_at, \n';
    sql += '  is_active\n';
    sql += ')\n';
    sql += 'VALUES (\n';
    sql += `  ${sqlString(scenario.title)}, \n`;
    sql += `  ${sqlString(scenario.description)}, \n`;
    sql += `  ${sqlString(scenario.difficulty)}, \n`;
    sql += `  ${sqlString(scenario.category)}, \n`;
    sql += `  JSON_ARRAY(${prompterLines.map(line => sqlString(line)).join(', ')}), \n`;
    sql += `  JSON_ARRAY(${userLines.map(line => sqlString(line)).join(', ')}), \n`;
    sql += `  ${sqlString(scenario.audio_filter_type)}, \n`;
    sql += '  NOW(), \n';
    sql += '  NOW(), \n';
    sql += '  TRUE\n';
    sql += ');\n\n';
    
    // Add script lines insert statement
    sql += `-- Script lines for scenario: ${scenario.title}\n`;
    sql += 'INSERT INTO scenario_lines (\n';
    sql += '  scenario_id,\n';
    sql += '  line_number,\n';
    sql += '  is_prompter,\n';
    sql += '  prompter_text,\n';
    sql += '  user_text,\n';
    sql += '  phase_context,\n';
    sql += '  prompter_callsign,\n';
    sql += '  created_at,\n';
    sql += '  updated_at\n';
    sql += ')\n';
    sql += 'VALUES\n';
    
    // Add each script line
    const lineValues = scenarioLines.map((line, index) => {
      return `  (\n` +
        `    (SELECT id FROM training_scenarios WHERE title = ${sqlString(scenario.title)} ORDER BY id DESC LIMIT 1), -- ${scenario.title}\n` +
        `    ${parseInt(line.line_number)},\n` +
        `    ${parseInt(line.is_prompter)}, -- is_prompter = ${line.is_prompter === '1' ? 'true' : 'false'}\n` +
        `    ${line.is_prompter === '1' ? sqlString(line.prompter_text) : 'NULL'},\n` +
        `    ${line.is_prompter === '0' ? sqlString(line.user_text) : 'NULL'},\n` +
        `    ${sqlString(line.phase_context)},\n` +
        `    ${line.is_prompter === '1' ? sqlString(line.prompter_callsign || CONFIG.defaultPrompterCallsign) : 'NULL'},\n` +
        `    NOW(),\n` +
        `    NOW()\n` +
        `  )${index < scenarioLines.length - 1 ? ',' : ';'}`;
    });
    
    sql += lineValues.join('\n') + '\n\n';
  }
  
  return sql;
}

// Validate scenario data
function validateScenario(scenario) {
  // Required fields
  const requiredFields = ['title', 'difficulty', 'category', 'audio_filter_type'];
  for (const field of requiredFields) {
    if (!scenario[field]) {
      throw new Error(`Scenario is missing required field: ${field}`);
    }
  }
  
  // Validate difficulty
  const validDifficulties = ['beginner', 'intermediate', 'advanced'];
  if (!validDifficulties.includes(scenario.difficulty.toLowerCase())) {
    throw new Error(`Invalid difficulty: ${scenario.difficulty}. Must be one of: ${validDifficulties.join(', ')}`);
  }
  
  // Validate audio filter type
  const validAudioFilters = ['radio', 'static', 'lowpass', 'highpass', 'none'];
  if (!validAudioFilters.includes(scenario.audio_filter_type.toLowerCase())) {
    throw new Error(`Invalid audio filter type: ${scenario.audio_filter_type}. Must be one of: ${validAudioFilters.join(', ')}`);
  }
}

// Helper function to properly escape and quote strings for SQL
function sqlString(value) {
  if (value === undefined || value === null || value === '') {
    return 'NULL';
  }
  
  // Escape single quotes by doubling them
  const escaped = value.replace(/'/g, "''");
  return `'${escaped}'`;
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
