-- Jimmy Yodeler - Military Voice Procedure Trainer
-- Sample Data for Development

-- Insert admin and test users
-- Default password is 'password123' (hashed with bcrypt)
INSERT INTO users (username, password, email, first_name, last_name, role, created_at)
VALUES 
  ('admin', '$2b$10$3euPcmQFCiblsZeEu5s7p.9MUZWg1IkU7RfaEm0SyuCGC3LxQW4Vy', 'admin@jimmyyodeler.com', 'Admin', 'User', 'admin', NOW()),
  ('trainee1', '$2b$10$3euPcmQFCiblsZeEu5s7p.9MUZWg1IkU7RfaEm0SyuCGC3LxQW4Vy', 'trainee1@example.com', 'John', 'Smith', 'trainee', NOW()),
  ('trainee2', '$2b$10$3euPcmQFCiblsZeEu5s7p.9MUZWg1IkU7RfaEm0SyuCGC3LxQW4Vy', 'trainee2@example.com', 'Jane', 'Doe', 'trainee', NOW());

-- Insert training scenarios
-- Beginner scenario: Basic radio check
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

-- Intermediate scenario: Situation report
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
  'Situation Report',
  'Practice delivering a detailed situation report',
  'intermediate',
  'reports',
  JSON_ARRAY(
    'All stations, this is Command. SITREP follows, over.',
    'Alpha-1, this is Command. Send SITREP, over.',
    'Alpha-1, confirm number of personnel, over.',
    'Alpha-1, this is Command. Roger. Stand by for further instructions, over.'
  ),
  JSON_ARRAY(
    'Command, this is Alpha-1. Roger, standing by for SITREP, over.',
    'Command, this is Alpha-1. SITREP as follows: Location grid 123456, 3 personnel, 2 vehicles operational, 1 casualty, ammunition 80 percent, fuel 70 percent, over.',
    'Command, this is Alpha-1. 3 personnel, 1 casualty, over.',
    'Command, this is Alpha-1. Roger, standing by, out.'
  ),
  'static',
  NOW(),
  NOW(),
  TRUE
);

-- Advanced scenario: Emergency procedure
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
  'Emergency Procedure',
  'Practice emergency communications under stress',
  'advanced',
  'emergency',
  JSON_ARRAY(
    'Alpha-1, this is Command. Be advised, hostile forces reported in your area, over.',
    'Alpha-1, this is Command. What is your status? Over.',
    'Alpha-1, this is Command. Roger. QRF is inbound to your position. ETA 10 minutes. Establish defensive perimeter, over.',
    'Alpha-1, this is Command. Understood. Maintain radio contact. Command out.'
  ),
  JSON_ARRAY(
    'Command, this is Alpha-1. Roger, implementing security measures, over.',
    'Command, this is Alpha-1. Taking fire from the north! Two personnel wounded! Request immediate assistance! Over!',
    'Command, this is Alpha-1. Roger, establishing defensive perimeter. Will maintain current position. Over.',
    'Command, this is Alpha-1. Wilco, will maintain radio contact. Alpha-1 out.'
  ),
  'lowpass',
  NOW(),
  NOW(),
  TRUE
);

-- Insert some sample training sessions
-- Completed session for trainee1
INSERT INTO training_sessions (
  user_id,
  scenario_id,
  audio_filter_type,
  status,
  started_at,
  completed_at,
  score
)
VALUES (
  2, -- trainee1
  1, -- Basic Radio Check
  'radio',
  'completed',
  DATE_SUB(NOW(), INTERVAL 2 DAY),
  DATE_SUB(NOW(), INTERVAL 2 DAY),
  85.50
);

-- Insert feedback for the completed session
INSERT INTO feedback (
  training_session_id,
  prompt_index,
  user_response,
  expected_response,
  accuracy_score,
  feedback_text,
  created_at
)
VALUES 
  (
    1, -- training_session_id
    0, -- prompt_index
    'Command, this is Alpha-1. I read you loud and clear, over.',
    'Command, this is Alpha-1. I read you loud and clear, over.',
    1.00,
    'Excellent! Your response perfectly matches the expected voice procedure.',
    DATE_SUB(NOW(), INTERVAL 2 DAY)
  ),
  (
    1, -- training_session_id
    1, -- prompt_index
    'Command, Alpha-1. Current location grid reference 123456, over.',
    'Command, this is Alpha-1. Current location grid reference 123456, over.',
    0.85,
    'Good response. Your voice procedure is mostly correct with some variations. Missing key elements: "this is".',
    DATE_SUB(NOW(), INTERVAL 2 DAY)
  ),
  (
    1, -- training_session_id
    2, -- prompt_index
    'Command, this is Alpha-1. Roger, moving to checkpoint Bravo, out.',
    'Command, this is Alpha-1. Roger, moving to checkpoint Bravo, out.',
    1.00,
    'Excellent! Your response perfectly matches the expected voice procedure.',
    DATE_SUB(NOW(), INTERVAL 2 DAY)
  );

-- In-progress session for trainee1
INSERT INTO training_sessions (
  user_id,
  scenario_id,
  audio_filter_type,
  status,
  started_at
)
VALUES (
  2, -- trainee1
  2, -- Situation Report
  'static',
  'in_progress',
  DATE_SUB(NOW(), INTERVAL 1 HOUR)
);

-- Completed session for trainee2
INSERT INTO training_sessions (
  user_id,
  scenario_id,
  audio_filter_type,
  status,
  started_at,
  completed_at,
  score
)
VALUES (
  3, -- trainee2
  1, -- Basic Radio Check
  'radio',
  'completed',
  DATE_SUB(NOW(), INTERVAL 3 DAY),
  DATE_SUB(NOW(), INTERVAL 3 DAY),
  72.33
);

-- Insert feedback for trainee2's session
INSERT INTO feedback (
  training_session_id,
  prompt_index,
  user_response,
  expected_response,
  accuracy_score,
  feedback_text,
  created_at
)
VALUES 
  (
    3, -- training_session_id
    0, -- prompt_index
    'Command, Alpha-1 here. Reading you clear, over.',
    'Command, this is Alpha-1. I read you loud and clear, over.',
    0.70,
    'Your response needs improvement. Several elements of proper voice procedure are missing or incorrect. Missing: "this is", "I", "loud and". Expected: "Command, this is Alpha-1. I read you loud and clear, over."',
    DATE_SUB(NOW(), INTERVAL 3 DAY)
  ),
  (
    3, -- training_session_id
    1, -- prompt_index
    'Command, this is Alpha-1. Current location grid reference 123456, over.',
    'Command, this is Alpha-1. Current location grid reference 123456, over.',
    1.00,
    'Excellent! Your response perfectly matches the expected voice procedure.',
    DATE_SUB(NOW(), INTERVAL 3 DAY)
  ),
  (
    3, -- training_session_id
    2, -- prompt_index
    'Command, Alpha-1. Roger, will proceed to checkpoint Bravo, out.',
    'Command, this is Alpha-1. Roger, moving to checkpoint Bravo, out.',
    0.75,
    'Good response. Your voice procedure is mostly correct with some variations. Missing key elements: "this is". Unnecessary additions: "will proceed".',
    DATE_SUB(NOW(), INTERVAL 3 DAY)
  );

-- Another completed session for trainee1 (to show improvement)
INSERT INTO training_sessions (
  user_id,
  scenario_id,
  audio_filter_type,
  status,
  started_at,
  completed_at,
  score
)
VALUES (
  2, -- trainee1
  1, -- Basic Radio Check
  'radio',
  'completed',
  DATE_SUB(NOW(), INTERVAL 1 DAY),
  DATE_SUB(NOW(), INTERVAL 1 DAY),
  93.33
);

-- Insert feedback showing improvement
INSERT INTO feedback (
  training_session_id,
  prompt_index,
  user_response,
  expected_response,
  accuracy_score,
  feedback_text,
  created_at
)
VALUES 
  (
    4, -- training_session_id
    0, -- prompt_index
    'Command, this is Alpha-1. I read you loud and clear, over.',
    'Command, this is Alpha-1. I read you loud and clear, over.',
    1.00,
    'Excellent! Your response perfectly matches the expected voice procedure.',
    DATE_SUB(NOW(), INTERVAL 1 DAY)
  ),
  (
    4, -- training_session_id
    1, -- prompt_index
    'Command, this is Alpha-1. Current location grid reference 123456, over.',
    'Command, this is Alpha-1. Current location grid reference 123456, over.',
    1.00,
    'Excellent! Your response perfectly matches the expected voice procedure.',
    DATE_SUB(NOW(), INTERVAL 1 DAY)
  ),
  (
    4, -- training_session_id
    2, -- prompt_index
    'Command, this is Alpha-1. Roger, moving to checkpoint Bravo, over.',
    'Command, this is Alpha-1. Roger, moving to checkpoint Bravo, out.',
    0.90,
    'Excellent! Your response closely matches the expected voice procedure. Minor variations detected, but overall very good.',
    DATE_SUB(NOW(), INTERVAL 1 DAY)
  );
