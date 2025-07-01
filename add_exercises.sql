-- SQL Script to Add Exercises to Supabase
-- Run this in your Supabase SQL Editor

-- First, let's see what muscle groups we have
SELECT id, name FROM muscle_groups ORDER BY name;

-- Example: Add a new exercise
-- Replace the values below with your exercise details

INSERT INTO exercises (
    name, 
    description, 
    muscle_group_id, 
    equipment, 
    difficulty_level, 
    instructions, 
    video_url, 
    image_url, 
    link
) VALUES (
    'Dumbbell Shoulder Press',  -- Exercise name
    'Standing shoulder press with dumbbells for shoulder development',  -- Description
    (SELECT id FROM muscle_groups WHERE name = 'Shoulders'),  -- Muscle group (change this)
    'Dumbbells',  -- Equipment
    'intermediate',  -- Difficulty level (beginner, intermediate, advanced)
    'Stand with dumbbells at shoulder level, press overhead while maintaining good form',  -- Instructions
    'https://example.com/video-url',  -- Video URL (optional)
    NULL,  -- Image URL (optional)
    NULL   -- Link (optional)
);

-- Add multiple exercises at once (uncomment and modify as needed):

/*
INSERT INTO exercises (name, description, muscle_group_id, equipment, difficulty_level, instructions, video_url, image_url, link) VALUES
    ('Barbell Row', 'Bent-over barbell row for back development', 
     (SELECT id FROM muscle_groups WHERE name = 'Back'), 
     'Barbell', 'intermediate', 'Bend over with barbell, pull to lower chest', NULL, NULL, NULL),
    
    ('Leg Press', 'Machine leg press for quad development', 
     (SELECT id FROM muscle_groups WHERE name = 'Legs'), 
     'Leg Press Machine', 'beginner', 'Sit in machine, press weight with legs', NULL, NULL, NULL),
    
    ('Lat Pulldown', 'Cable lat pulldown for back width', 
     (SELECT id FROM muscle_groups WHERE name = 'Back'), 
     'Cable Machine', 'beginner', 'Pull bar down to upper chest', NULL, NULL, NULL),
    
    ('Dumbbell Flyes', 'Chest flyes with dumbbells', 
     (SELECT id FROM muscle_groups WHERE name = 'Chest'), 
     'Dumbbells, Bench', 'intermediate', 'Lie on bench, lower dumbbells in arc motion', NULL, NULL, NULL),
    
    ('Hammer Curls', 'Dumbbell hammer curls for biceps and forearms', 
     (SELECT id FROM muscle_groups WHERE name = 'Biceps'), 
     'Dumbbells', 'beginner', 'Hold dumbbells like hammers, curl up', NULL, NULL, NULL);
*/

-- Verify the exercise was added
SELECT 
    e.id,
    e.name,
    e.description,
    mg.name as muscle_group,
    e.equipment,
    e.difficulty_level,
    e.instructions
FROM exercises e
JOIN muscle_groups mg ON e.muscle_group_id = mg.id
ORDER BY e.name;

-- To add a specific exercise, copy this template and modify the values:

/*
INSERT INTO exercises (
    name, 
    description, 
    muscle_group_id, 
    equipment, 
    difficulty_level, 
    instructions, 
    video_url, 
    image_url, 
    link
) VALUES (
    'YOUR_EXERCISE_NAME',  -- Replace with exercise name
    'YOUR_DESCRIPTION',    -- Replace with description
    (SELECT id FROM muscle_groups WHERE name = 'YOUR_MUSCLE_GROUP'),  -- Replace muscle group name
    'YOUR_EQUIPMENT',      -- Replace with equipment
    'YOUR_DIFFICULTY',     -- beginner, intermediate, or advanced
    'YOUR_INSTRUCTIONS',   -- Replace with instructions
    'YOUR_VIDEO_URL',      -- Replace with video URL or NULL
    'YOUR_IMAGE_URL',      -- Replace with image URL or NULL
    'YOUR_LINK'            -- Replace with link or NULL
);
*/

-- Available muscle groups for reference:
-- Chest, Back, Shoulders, Biceps, Triceps, Legs, Core, Calves, Forearms

-- Available difficulty levels:
-- beginner, intermediate, advanced 