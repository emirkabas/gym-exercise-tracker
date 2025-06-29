-- Add workout_tracking column to user_workouts table
-- This column will store JSON data for tracking sets, reps, and weights

ALTER TABLE user_workouts 
ADD COLUMN workout_tracking JSONB DEFAULT '{}';

-- Add a comment to explain the column
COMMENT ON COLUMN user_workouts.workout_tracking IS 'JSONB field to store workout tracking data (sets, reps, weights) for specific dates';

-- Example structure of workout_tracking data:
-- {
--   "2024-01-15": {
--     "exercises": [
--       {
--         "exercise_name": "Bench Press",
--         "sets": [
--           {
--             "set_number": 1,
--             "weight": 100,
--             "reps": 8,
--             "rest_time": 120,
--             "completed": true
--           }
--         ]
--       }
--     ]
--   }
-- } 