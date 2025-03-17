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
  ),
  -- Line 5: Command prompt
  (
    1, -- Basic Radio Check scenario
    5,
    1, -- is_prompter = true
    'Roger Alpha-1. Proceed to checkpoint Bravo, over.',
    NULL,
    'Movement order phase. You are being directed to your next objective.',
    'Command',
    NOW(),
    NOW()
  ),
  -- Line 6: User response
  (
    1, -- Basic Radio Check scenario
    6,
    0, -- is_prompter = false
    NULL,
    'Command, this is Alpha-1. Roger, moving to checkpoint Bravo, out.',
    'Movement order phase. You are being directed to your next objective.',
    NULL,
    NOW(),
    NOW()
  ),
  -- Line 7: Command prompt
  (
    1, -- Basic Radio Check scenario
    7,
    1, -- is_prompter = true
    'Command out.',
    NULL,
    'Mission completion phase. The initial communication check is complete.',
    'Command',
    NOW(),
    NOW()
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

-- Insert scenario lines for Situation Report
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
    2, -- Situation Report scenario
    1,
    1, -- is_prompter = true
    'All stations, this is Command. SITREP follows, over.',
    NULL,
    'Initial SITREP phase. Command is preparing to deliver a situation report to all units in the area.',
    'Command',
    NOW(),
    NOW()
  ),
  -- Line 2: User response
  (
    2, -- Situation Report scenario
    2,
    0, -- is_prompter = false
    NULL,
    'Command, this is Alpha-1. Roger, standing by for SITREP, over.',
    'Initial SITREP phase. Command is preparing to deliver a situation report to all units in the area.',
    NULL,
    NOW(),
    NOW()
  ),
  -- Line 3: Command prompt
  (
    2, -- Situation Report scenario
    3,
    1, -- is_prompter = true
    'Alpha-1, this is Command. Send SITREP, over.',
    NULL,
    'SITREP request phase. Command is requesting your team to provide a detailed situation report.',
    'Command',
    NOW(),
    NOW()
  ),
  -- Line 4: User response
  (
    2, -- Situation Report scenario
    4,
    0, -- is_prompter = false
    NULL,
    'Command, this is Alpha-1. SITREP as follows: Location grid 123456, 3 personnel, 2 vehicles operational, 1 casualty, ammunition 80 percent, fuel 70 percent, over.',
    'SITREP request phase. Command is requesting your team to provide a detailed situation report.',
    NULL,
    NOW(),
    NOW()
  ),
  -- Line 5: Command prompt
  (
    2, -- Situation Report scenario
    5,
    1, -- is_prompter = true
    'Alpha-1, confirm number of personnel, over.',
    NULL,
    'Clarification phase. Command needs to verify specific details from your report.',
    'Command',
    NOW(),
    NOW()
  ),
  -- Line 6: User response
  (
    2, -- Situation Report scenario
    6,
    0, -- is_prompter = false
    NULL,
    'Command, this is Alpha-1. 3 personnel, 1 casualty, over.',
    'Clarification phase. Command needs to verify specific details from your report.',
    NULL,
    NOW(),
    NOW()
  ),
  -- Line 7: Command prompt
  (
    2, -- Situation Report scenario
    7,
    1, -- is_prompter = true
    'Alpha-1, this is Command. Roger. Stand by for further instructions, over.',
    NULL,
    'Conclusion phase. Command has received your report and is preparing next steps.',
    'Command',
    NOW(),
    NOW()
  ),
  -- Line 8: User response
  (
    2, -- Situation Report scenario
    8,
    0, -- is_prompter = false
    NULL,
    'Command, this is Alpha-1. Roger, standing by, out.',
    'Conclusion phase. Command has received your report and is preparing next steps.',
    NULL,
    NOW(),
    NOW()
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

-- Insert scenario lines for Emergency Procedure
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
    3, -- Emergency Procedure scenario
    1,
    1, -- is_prompter = true
    'Alpha-1, this is Command. Be advised, hostile forces reported in your area, over.',
    NULL,
    'Initial warning phase. Intelligence reports indicate enemy forces are operating in your vicinity. Your team is on a routine patrol in what was believed to be a secure area.',
    'Command',
    NOW(),
    NOW()
  ),
  -- Line 2: User response
  (
    3, -- Emergency Procedure scenario
    2,
    0, -- is_prompter = false
    NULL,
    'Command, this is Alpha-1. Roger, implementing security measures, over.',
    'Initial warning phase. Intelligence reports indicate enemy forces are operating in your vicinity. Your team is on a routine patrol in what was believed to be a secure area.',
    NULL,
    NOW(),
    NOW()
  ),
  -- Line 3: Command prompt
  (
    3, -- Emergency Procedure scenario
    3,
    1, -- is_prompter = true
    'Alpha-1, this is Command. What is your status? Over.',
    NULL,
    'Contact phase. Sounds of gunfire can be heard in the distance. Your team has taken cover behind a ridge.',
    'Command',
    NOW(),
    NOW()
  ),
  -- Line 4: User response
  (
    3, -- Emergency Procedure scenario
    4,
    0, -- is_prompter = false
    NULL,
    'Command, this is Alpha-1. Taking fire from the north! Two personnel wounded! Request immediate assistance! Over!',
    'Contact phase. Sounds of gunfire can be heard in the distance. Your team has taken cover behind a ridge.',
    NULL,
    NOW(),
    NOW()
  ),
  -- Line 5: Command prompt
  (
    3, -- Emergency Procedure scenario
    5,
    1, -- is_prompter = true
    'Alpha-1, this is Command. Roger. QRF is inbound to your position. ETA 10 minutes. Establish defensive perimeter, over.',
    NULL,
    'Response phase. Your team is under heavy fire. The wounded need medical attention, but enemy forces are still in the area.',
    'Command',
    NOW(),
    NOW()
  ),
  -- Line 6: User response
  (
    3, -- Emergency Procedure scenario
    6,
    0, -- is_prompter = false
    NULL,
    'Command, this is Alpha-1. Roger, establishing defensive perimeter. Will maintain current position. Over.',
    'Response phase. Your team is under heavy fire. The wounded need medical attention, but enemy forces are still in the area.',
    NULL,
    NOW(),
    NOW()
  ),
  -- Line 7: Command prompt
  (
    3, -- Emergency Procedure scenario
    7,
    1, -- is_prompter = true
    'Alpha-1, this is Command. Understood. Maintain radio contact. Command out.',
    NULL,
    'Conclusion phase. You can hear helicopters approaching in the distance. Your team is preparing for extraction.',
    'Command',
    NOW(),
    NOW()
  ),
  -- Line 8: User response
  (
    3, -- Emergency Procedure scenario
    8,
    0, -- is_prompter = false
    NULL,
    'Command, this is Alpha-1. Wilco, will maintain radio contact. Alpha-1 out.',
    'Conclusion phase. You can hear helicopters approaching in the distance. Your team is preparing for extraction.',
    NULL,
    NOW(),
    NOW()
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
  score,
  user_callsign
)
VALUES (
  2, -- trainee1
  1, -- Basic Radio Check
  'radio',
  'completed',
  DATE_SUB(NOW(), INTERVAL 2 DAY),
  DATE_SUB(NOW(), INTERVAL 2 DAY),
  85.50,
  'Alpha-1'
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
  started_at,
  user_callsign
)
VALUES (
  2, -- trainee1
  2, -- Situation Report
  'static',
  'in_progress',
  DATE_SUB(NOW(), INTERVAL 1 HOUR),
  'Alpha-1'
);

-- Completed session for trainee2
INSERT INTO training_sessions (
  user_id,
  scenario_id,
  audio_filter_type,
  status,
  started_at,
  completed_at,
  score,
  user_callsign
)
VALUES (
  3, -- trainee2
  1, -- Basic Radio Check
  'radio',
  'completed',
  DATE_SUB(NOW(), INTERVAL 3 DAY),
  DATE_SUB(NOW(), INTERVAL 3 DAY),
  72.33,
  'Bravo-2'
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
  score,
  user_callsign
)
VALUES (
  2, -- trainee1
  1, -- Basic Radio Check
  'radio',
  'completed',
  DATE_SUB(NOW(), INTERVAL 1 DAY),
  DATE_SUB(NOW(), INTERVAL 1 DAY),
  93.33,
  'Alpha-1'
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
