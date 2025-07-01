-- SQL Script to Add "Abs" Muscle Group to Supabase
-- Run this in your Supabase SQL Editor

-- Add the "Abs" muscle group
INSERT INTO muscle_groups (name, description) VALUES (
    'Abs', 
    'Abdominal muscles including rectus abdominis, obliques, and transverse abdominis'
) ON CONFLICT (name) DO NOTHING;

-- Verify the muscle group was added
SELECT id, name, description FROM muscle_groups WHERE name = 'Abs';

-- Show all muscle groups to confirm
SELECT id, name, description FROM muscle_groups ORDER BY name; 