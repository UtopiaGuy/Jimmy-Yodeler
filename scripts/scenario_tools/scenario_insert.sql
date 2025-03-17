-- Jimmy Yodeler - Generated Scenario SQL
-- Generated on: 2025-03-17T17:32:46.585Z

-- Scenario: Radio Check Example
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
  'Radio Check Example', 
  'Practice basic radio checks and acknowledgments', 
  'beginner', 
  'general', 
  JSON_ARRAY('Alpha-1, this is Command. Radio check, over.', 'Alpha-1, this is Command. Send your location, over.', 'Roger Alpha-1. Proceed to checkpoint Bravo, over.', 'Command out.'), 
  JSON_ARRAY('Command, this is Alpha-1. I read you loud and clear, over.', 'Command, this is Alpha-1. Current location grid reference 123456, over.', 'Command, this is Alpha-1. Roger, moving to checkpoint Bravo, out.'), 
  'radio', 
  NOW(), 
  NOW(), 
  TRUE
);

-- Script lines for scenario: Radio Check Example
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
  (
    (SELECT id FROM training_scenarios WHERE title = 'Radio Check Example' ORDER BY id DESC LIMIT 1), -- Radio Check Example
    1,
    1, -- is_prompter = true
    'Alpha-1, this is Command. Radio check, over.',
    NULL,
    'Initial radio check phase. Your team is beginning a patrol mission in a non-hostile area.',
    'Command',
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM training_scenarios WHERE title = 'Radio Check Example' ORDER BY id DESC LIMIT 1), -- Radio Check Example
    2,
    0, -- is_prompter = false
    NULL,
    'Command, this is Alpha-1. I read you loud and clear, over.',
    'Initial radio check phase. Your team is beginning a patrol mission in a non-hostile area.',
    NULL,
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM training_scenarios WHERE title = 'Radio Check Example' ORDER BY id DESC LIMIT 1), -- Radio Check Example
    3,
    1, -- is_prompter = true
    'Alpha-1, this is Command. Send your location, over.',
    NULL,
    'Location reporting phase. Command needs to verify your position before proceeding with the mission.',
    'Command',
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM training_scenarios WHERE title = 'Radio Check Example' ORDER BY id DESC LIMIT 1), -- Radio Check Example
    4,
    0, -- is_prompter = false
    NULL,
    'Command, this is Alpha-1. Current location grid reference 123456, over.',
    'Location reporting phase. Command needs to verify your position before proceeding with the mission.',
    NULL,
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM training_scenarios WHERE title = 'Radio Check Example' ORDER BY id DESC LIMIT 1), -- Radio Check Example
    5,
    1, -- is_prompter = true
    'Roger Alpha-1. Proceed to checkpoint Bravo, over.',
    NULL,
    'Movement order phase. You are being directed to your next objective.',
    'Command',
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM training_scenarios WHERE title = 'Radio Check Example' ORDER BY id DESC LIMIT 1), -- Radio Check Example
    6,
    0, -- is_prompter = false
    NULL,
    'Command, this is Alpha-1. Roger, moving to checkpoint Bravo, out.',
    'Movement order phase. You are being directed to your next objective.',
    NULL,
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM training_scenarios WHERE title = 'Radio Check Example' ORDER BY id DESC LIMIT 1), -- Radio Check Example
    7,
    1, -- is_prompter = true
    'Command out.',
    NULL,
    'Mission completion phase. The initial communication check is complete.',
    'Command',
    NOW(),
    NOW()
  );

-- Scenario: Situation Report Example
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
  'Situation Report Example', 
  'Practice delivering a detailed situation report', 
  'intermediate', 
  'reports', 
  JSON_ARRAY('All stations, this is Command. SITREP follows, over.', 'Alpha-1, this is Command. Send SITREP, over.'), 
  JSON_ARRAY('Command, this is Alpha-1. Roger, standing by for SITREP, over.', 'Command, this is Alpha-1. SITREP as follows: Location grid 123456, 3 personnel, 2 vehicles operational, 1 casualty, ammunition 80 percent, fuel 70 percent, over.'), 
  'static', 
  NOW(), 
  NOW(), 
  TRUE
);

-- Script lines for scenario: Situation Report Example
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
  (
    (SELECT id FROM training_scenarios WHERE title = 'Situation Report Example' ORDER BY id DESC LIMIT 1), -- Situation Report Example
    1,
    1, -- is_prompter = true
    'All stations, this is Command. SITREP follows, over.',
    NULL,
    'Initial SITREP phase. Command is preparing to deliver a situation report to all units in the area.',
    'Command',
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM training_scenarios WHERE title = 'Situation Report Example' ORDER BY id DESC LIMIT 1), -- Situation Report Example
    2,
    0, -- is_prompter = false
    NULL,
    'Command, this is Alpha-1. Roger, standing by for SITREP, over.',
    'Initial SITREP phase. Command is preparing to deliver a situation report to all units in the area.',
    NULL,
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM training_scenarios WHERE title = 'Situation Report Example' ORDER BY id DESC LIMIT 1), -- Situation Report Example
    3,
    1, -- is_prompter = true
    'Alpha-1, this is Command. Send SITREP, over.',
    NULL,
    'SITREP request phase. Command is requesting your team to provide a detailed situation report.',
    'Command',
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM training_scenarios WHERE title = 'Situation Report Example' ORDER BY id DESC LIMIT 1), -- Situation Report Example
    4,
    0, -- is_prompter = false
    NULL,
    'Command, this is Alpha-1. SITREP as follows: Location grid 123456, 3 personnel, 2 vehicles operational, 1 casualty, ammunition 80 percent, fuel 70 percent, over.',
    'SITREP request phase. Command is requesting your team to provide a detailed situation report.',
    NULL,
    NOW(),
    NOW()
  );

