-- SQL Script to Add Additional Muscle Groups to Supabase
-- Run this in your Supabase SQL Editor

-- Add the new muscle groups
INSERT INTO muscle_groups (name, description) VALUES 
    ('DELTS', 'Deltoid muscles - anterior, lateral, and posterior deltoids'),
    ('HAMSTRINGS', 'Hamstring muscles - biceps femoris, semitendinosus, semimembranosus'),
    ('QUADS', 'Quadriceps muscles - rectus femoris, vastus lateralis, vastus medialis, vastus intermedius')
ON CONFLICT (name) DO NOTHING;

-- Verify the muscle groups were added
SELECT id, name, description FROM muscle_groups WHERE name IN ('DELTS', 'HAMSTRINGS', 'QUADS');

-- Show all muscle groups to confirm
SELECT id, name, description FROM muscle_groups ORDER BY name; 