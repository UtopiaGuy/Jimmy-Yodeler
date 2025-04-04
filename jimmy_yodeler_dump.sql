-- Jimmy Yodeler - Military Voice Procedure Trainer
-- Minimal Database Dump for Production Setup

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS training_sessions;
DROP TABLE IF EXISTS scenario_lines;
DROP TABLE IF EXISTS training_scenarios;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  role ENUM('admin', 'trainee') NOT NULL DEFAULT 'trainee',
  created_at DATETIME NOT NULL,
  updated_at DATETIME
);

-- Create training_scenarios table
CREATE TABLE training_scenarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  difficulty ENUM('beginner', 'intermediate', 'advanced') NOT NULL DEFAULT 'beginner',
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  script_content JSON COMMENT 'Legacy: Array of script prompts',
  expected_responses JSON COMMENT 'Legacy: Array of expected responses',
  audio_filter_type VARCHAR(20) NOT NULL DEFAULT 'radio' COMMENT 'Type of audio filter to apply',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create scenario_lines table for detailed scenario content
CREATE TABLE scenario_lines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  scenario_id INT NOT NULL,
  line_number INT NOT NULL,
  is_prompter BOOLEAN NOT NULL COMMENT '1 for prompter line, 0 for user line',
  prompter_text TEXT,
  user_text TEXT,
  phase_context TEXT COMMENT 'Background information for the current phase of the scenario',
  prompter_callsign VARCHAR(50) DEFAULT 'Command' COMMENT 'Callsign of the prompter for this line',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (scenario_id) REFERENCES training_scenarios(id) ON DELETE CASCADE
);

-- Create training_sessions table
CREATE TABLE training_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  scenario_id INT NOT NULL,
  audio_filter_type VARCHAR(20) NOT NULL DEFAULT 'radio',
  status ENUM('in_progress', 'completed', 'abandoned') NOT NULL DEFAULT 'in_progress',
  started_at DATETIME NOT NULL,
  completed_at DATETIME,
  score DECIMAL(5,2) COMMENT 'Score out of 100',
  user_callsign VARCHAR(50) DEFAULT 'Alpha-1' COMMENT 'User callsign for this training session',
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (scenario_id) REFERENCES training_scenarios(id)
);

-- Create feedback table
CREATE TABLE feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  training_session_id INT NOT NULL,
  prompt_index INT NOT NULL COMMENT 'Index of the prompt in the scenario script',
  user_response TEXT NOT NULL,
  expected_response TEXT NOT NULL,
  accuracy_score DECIMAL(5,2) NOT NULL COMMENT 'Score between 0 and 1',
  feedback_text TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (training_session_id) REFERENCES training_sessions(id)
);

-- Create indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_training_sessions_user_id ON training_sessions(user_id);
CREATE INDEX idx_training_sessions_scenario_id ON training_sessions(scenario_id);
CREATE INDEX idx_feedback_training_session_id ON feedback(training_session_id);
CREATE INDEX idx_training_scenarios_category ON training_scenarios(category);
CREATE INDEX idx_training_scenarios_difficulty ON training_scenarios(difficulty);
CREATE INDEX idx_training_scenarios_is_active ON training_scenarios(is_active);
CREATE INDEX idx_scenario_lines_scenario_id ON scenario_lines(scenario_id);
CREATE INDEX idx_scenario_lines_line_number ON scenario_lines(line_number);

-- Add full-text search capability for scenarios
ALTER TABLE training_scenarios ADD FULLTEXT INDEX ft_scenario_content(title, description);

-- Insert admin user (password is 'changeme' hashed with bcrypt)
INSERT INTO users (username, password, email, first_name, last_name, role, created_at)
VALUES 
  ('admin', '$2b$10$3euPcmQFCiblsZeEu5s7p.9MUZWg1IkU7RfaEm0SyuCGC3LxQW4Vy', 'admin@example.com', 'Admin', 'User', 'admin', NOW());

-- Insert a sample training scenario
INSERT INTO training_scenarios (
  title, 
  description, 
  difficulty, 
  category, 
  script_content, 
  expected_responses, 
  audio_filter_type, 
  created_at, 
  updated_at, 
  is_active
)
VALUES (
  'Basic Radio Check',
  'Practice basic radio checks and acknowledgments',
  'beginner',
  'general',
  JSON_ARRAY(
    'Alpha-1, this is Command. Radio check, over.',
    'Alpha-1, this is Command. Send your location, over.',
    'Roger Alpha-1. Proceed to checkpoint Bravo, over.',
    'Command out.'
  ),
  JSON_ARRAY(
    'Command, this is Alpha-1. I read you loud and clear, over.',
    'Command, this is Alpha-1. Current location grid reference 123456, over.',
    'Command, this is Alpha-1. Roger, moving to checkpoint Bravo, out.'
  ),
  'radio',
  NOW(),
  NOW(),
  TRUE
);

-- Insert scenario lines for Basic Radio Check
INSERT INTO scenario_lines (
  scenario_id,
  line_number,
  is_prompter,
  prompter_text,
  user_text,
  phase_context,
  prompter_callsign,
  created_at,
  updated_at
)
VALUES
  -- Line 1: Command prompt
  (
    1, -- Basic Radio Check scenario
    1,
    1, -- is_prompter = true
    'Alpha-1, this is Command. Radio check, over.',
    NULL,
    'Initial radio check phase. Your team is beginning a patrol mission in a non-hostile area.',
    'Command',
    NOW(),
    NOW()
  ),
  -- Line 2: User response
  (
    1, -- Basic Radio Check scenario
    2,
    0, -- is_prompter = false
    NULL,
    'Command, this is Alpha-1. I read you loud and clear, over.',
    'Initial radio check phase. Your team is beginning a patrol mission in a non-hostile area.',
    NULL,
    NOW(),
    NOW()
  ),
  -- Line 3: Command prompt
  (
    1, -- Basic Radio Check scenario
    3,
    1, -- is_prompter = true
    'Alpha-1, this is Command. Send your location, over.',
    NULL,
    'Location reporting phase. Command needs to verify your position before proceeding with the mission.',
    'Command',
    NOW(),
    NOW()
  ),
  -- Line 4: User response
  (
    1, -- Basic Radio Check scenario
    4,
    0, -- is_prompter = false
    NULL,
    'Command, this is Alpha-1. Current location grid reference 123456, over.',
    'Location reporting phase. Command needs to verify your position before proceeding with the mission.',
    NULL,
    NOW(),
    NOW()
  );
