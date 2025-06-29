-- Gym Exercise Tracker Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security (RLS) - you can disable this if you want
-- ALTER TABLE muscle_groups ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE workout_programs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE workout_program_exercises ENABLE ROW LEVEL SECURITY;

-- Create muscle_groups table
CREATE TABLE IF NOT EXISTS muscle_groups (
    id BIGSERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    muscle_group_id BIGINT REFERENCES muscle_groups(id) ON DELETE CASCADE,
    equipment TEXT,
    difficulty_level TEXT CHECK(difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    instructions TEXT,
    video_url TEXT,
    image_url TEXT,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workout_programs table
CREATE TABLE IF NOT EXISTS workout_programs (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    difficulty_level TEXT CHECK(difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    duration_weeks INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workout_program_exercises table (junction table)
CREATE TABLE IF NOT EXISTS workout_program_exercises (
    id BIGSERIAL PRIMARY KEY,
    workout_program_id BIGINT REFERENCES workout_programs(id) ON DELETE CASCADE,
    exercise_id BIGINT REFERENCES exercises(id) ON DELETE CASCADE,
    sets INTEGER,
    reps INTEGER,
    rest_time_seconds INTEGER,
    day_of_week INTEGER CHECK(day_of_week >= 1 AND day_of_week <= 7),
    week_number INTEGER,
    order_in_workout INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_workouts table to track which programs users have added
CREATE TABLE IF NOT EXISTS user_workouts (
    id BIGSERIAL PRIMARY KEY,
    workout_program_id BIGINT REFERENCES workout_programs(id) ON DELETE CASCADE,
    user_id TEXT, -- For future user authentication
    workout_days JSONB, -- Array of workout dates
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workout_program_id, user_id)
);

-- Insert sample muscle groups
INSERT INTO muscle_groups (name, description) VALUES
    ('Chest', 'Pectoralis major and minor muscles'),
    ('Back', 'Latissimus dorsi, rhomboids, and trapezius muscles'),
    ('Shoulders', 'Deltoid muscles (anterior, lateral, posterior)'),
    ('Biceps', 'Biceps brachii muscles'),
    ('Triceps', 'Triceps brachii muscles'),
    ('Legs', 'Quadriceps, hamstrings, and glutes'),
    ('Core', 'Abdominal and lower back muscles'),
    ('Calves', 'Gastrocnemius and soleus muscles'),
    ('Forearms', 'Flexor and extensor muscles of the forearm')
ON CONFLICT (name) DO NOTHING;

-- Insert sample exercises
INSERT INTO exercises (name, description, muscle_group_id, equipment, difficulty_level, instructions, video_url, link) VALUES
    ('Bench Press', 'Compound exercise for chest development', 
     (SELECT id FROM muscle_groups WHERE name = 'Chest'), 
     'Barbell, Bench', 'intermediate', 'Lie on bench, lower bar to chest, press up', NULL, NULL),
    
    ('Squats', 'Compound lower body exercise', 
     (SELECT id FROM muscle_groups WHERE name = 'Legs'), 
     'Barbell', 'intermediate', 'Stand with bar on shoulders, squat down, stand up', NULL, NULL),
    
    ('Deadlift', 'Compound full body exercise', 
     (SELECT id FROM muscle_groups WHERE name = 'Back'), 
     'Barbell', 'advanced', 'Stand over bar, grip and lift with proper form', NULL, NULL),
    
    ('Pull-ups', 'Bodyweight back exercise', 
     (SELECT id FROM muscle_groups WHERE name = 'Back'), 
     'Pull-up bar', 'intermediate', 'Hang from bar, pull body up until chin over bar', NULL, NULL),
    
    ('Push-ups', 'Bodyweight chest exercise', 
     (SELECT id FROM muscle_groups WHERE name = 'Chest'), 
     'None', 'beginner', 'Plank position, lower body, push back up', NULL, NULL),
    
    ('Overhead Press', 'Compound shoulder exercise', 
     (SELECT id FROM muscle_groups WHERE name = 'Shoulders'), 
     'Barbell', 'intermediate', 'Stand with bar at shoulders, press overhead', NULL, NULL),
    
    ('Bicep Curls', 'Isolation exercise for biceps', 
     (SELECT id FROM muscle_groups WHERE name = 'Biceps'), 
     'Dumbbells', 'beginner', 'Stand with dumbbells, curl up and down', NULL, NULL),
    
    ('Tricep Dips', 'Bodyweight tricep exercise', 
     (SELECT id FROM muscle_groups WHERE name = 'Triceps'), 
     'Dip bars', 'intermediate', 'Support body on bars, lower and push up', NULL, NULL),
    
    ('M/C PEC DEC ', 'Chest exercise', 
     (SELECT id FROM muscle_groups WHERE name = 'Chest'), 
     'None', 'intermediate', 'Perform chest press using the Technogym machine', 'https://drive.google.com/file/d/1om00-i0VoP7UKDHOc27ZqzaaW0CYzgpV/view', NULL),
    
    ('Plank', 'Core stability exercise', 
     (SELECT id FROM muscle_groups WHERE name = 'Core'), 
     'None', 'beginner', 'Hold plank position with straight body', NULL, NULL),

    ('Calf Raises', 'Isolation exercise for calves', 
     (SELECT id FROM muscle_groups WHERE name = 'Calves'), 
     'None', 'beginner', 'Stand on edge of step, raise and lower heels', NULL, NULL),
    
    ('M/C TECHNOGYM SHOULDER PRESS', 'Shoulder Press with a Machine', 
     (SELECT id FROM muscle_groups WHERE name = 'Shoulders'), 
     'SHOULDER PRESS', 'intermediate', 'Perform shoulder press using the Technogym machine', 
     'https://www.youtube.com/watch?v=d7yQMvVQaXQ', NULL),

     ('CHEST PRESS', 'Chest Press with a Machine', 
     (SELECT id FROM muscle_groups WHERE name = 'Chest'), 
     'Chest Press', 'intermediate', 'Perform chess press using the Technogym machine', 
     'https://drive.google.com/file/d/1om00-i0VoP7UKDHOc27ZqzaaW0CYzgpV/view', NULL),

     ('LYING BICEP CURL', 'Biceps Curl with a dumbbell while sitting', 
     (SELECT id FROM muscle_groups WHERE name = 'Biceps'), 
     'Dumbbell', 'beginner', 'Biceps Curl with a dumbbell while sitting', 
     'https://drive.google.com/file/d/1Ka4olDCSCQGj4QdE1tP23pajczWS09M7/view', NULL)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group_id ON exercises(muscle_group_id);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty_level ON exercises(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_workout_program_exercises_program_id ON workout_program_exercises(workout_program_id);
CREATE INDEX IF NOT EXISTS idx_workout_program_exercises_exercise_id ON workout_program_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_user_workouts_user_id ON user_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_workouts_program_id ON user_workouts(workout_program_id);

-- Optional: Create a sample workout program
INSERT INTO workout_programs (name, description, difficulty_level, duration_weeks) VALUES
    ('Beginner Full Body', 'A simple full body workout for beginners', 'beginner', 4)
ON CONFLICT DO NOTHING;

-- Add some exercises to the sample workout program
INSERT INTO workout_program_exercises (workout_program_id, exercise_id, sets, reps, rest_time_seconds, day_of_week, week_number, order_in_workout) VALUES
    ((SELECT id FROM workout_programs WHERE name = 'Beginner Full Body'), 
     (SELECT id FROM exercises WHERE name = 'Push-ups'), 3, 10, 60, 1, 1, 1),
    
    ((SELECT id FROM workout_programs WHERE name = 'Beginner Full Body'), 
     (SELECT id FROM exercises WHERE name = 'Squats'), 3, 12, 90, 1, 1, 2),
    
    ((SELECT id FROM workout_programs WHERE name = 'Beginner Full Body'), 
     (SELECT id FROM exercises WHERE name = 'Plank'), 3, 30, 60, 1, 1, 3)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon; 