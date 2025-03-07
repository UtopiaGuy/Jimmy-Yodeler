-- Jimmy Yodeler - Military Voice Procedure Trainer
-- Database Schema

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS training_sessions;
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
  script_content JSON NOT NULL COMMENT 'Array of script prompts',
  expected_responses JSON NOT NULL COMMENT 'Array of expected responses',
  audio_filter_type VARCHAR(20) NOT NULL DEFAULT 'radio' COMMENT 'Type of audio filter to apply',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
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

-- Add full-text search capability for scenarios
ALTER TABLE training_scenarios ADD FULLTEXT INDEX ft_scenario_content(title, description);
