/**
 * Script to generate SQL statements for updating scenario tables
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Read the scenario template CSV
const templatePath = path.join(process.cwd(), 'scripts/scenario_tools/scenario_template.csv');
const templateContent = fs.readFileSync(templatePath, 'utf8');
const templates = parse(templateContent, { columns: true, skip_empty_lines: true });

// Read the scenario lines CSV
const linesPath = path.join(process.cwd(), 'scripts/scenario_tools/Scenario Lines Mar 20 2025.csv');
const linesContent = fs.readFileSync(linesPath, 'utf8');
const lines = parse(linesContent, { columns: true, skip_empty_lines: true });

// Group lines by scenario_id
const scenarioLines = {};
lines.forEach(line => {
  const scenarioId = line.scenario_id;
  if (!scenarioLines[scenarioId]) {
    scenarioLines[scenarioId] = [];
  }
  scenarioLines[scenarioId].push(line);
});

// Generate SQL for training_scenarios
console.log('-- SQL to update training_scenarios table');
templates.forEach((template, index) => {
  const scenarioId = index + 1;
  console.log(`
-- Scenario ${scenarioId}: ${template.title}
INSERT INTO training_scenarios (id, title, description, difficulty, category, audio_filter_type, created_at, updated_at, is_active)
VALUES (${scenarioId}, '${template.title.replace(/'/g, "''")}', '${template.description.replace(/'/g, "''")}', '${template.difficulty}', '${template.category}', '${template.audio_filter_type}', NOW(), NOW(), 1)
ON DUPLICATE KEY UPDATE
  title = '${template.title.replace(/'/g, "''")}',
  description = '${template.description.replace(/'/g, "''")}',
  difficulty = '${template.difficulty}',
  category = '${template.category}',
  audio_filter_type = '${template.audio_filter_type}',
  updated_at = NOW(),
  is_active = 1;`);
});

// Generate SQL for scenario_lines
console.log('\n-- SQL to update scenario_lines table');
Object.keys(scenarioLines).forEach(scenarioId => {
  console.log(`-- Lines for Scenario ${scenarioId}`);
  
  // Delete existing lines for this scenario
  console.log(`DELETE FROM scenario_lines WHERE scenario_id = ${scenarioId};`);
  
  // Insert new lines
  scenarioLines[scenarioId].forEach(line => {
    // Handle null values and escape single quotes
    const prompterText = line.prompter_text ? `'${line.prompter_text.replace(/'/g, "''")}'` : 'NULL';
    const userText = line.user_text ? `'${line.user_text.replace(/'/g, "''")}'` : 'NULL';
    const phaseContext = line.phase_context ? `'${line.phase_context.replace(/'/g, "''")}'` : 'NULL';
    const prompterCallsign = line.prompter_callsign ? `'${line.prompter_callsign}'` : 'NULL';
    const userCallsign = line.User_callsign ? `'${line.User_callsign}'` : 'NULL';
    
    console.log(`INSERT INTO scenario_lines (scenario_id, line_number, is_prompter, prompter_text, user_text, phase_context, prompter_callsign, created_at, updated_at)
VALUES (${scenarioId}, ${line.line_number}, ${line.is_prompter ? 1 : 0}, ${prompterText}, ${userText}, ${phaseContext}, ${prompterCallsign}, NOW(), NOW());`);
  });
  console.log();
});
