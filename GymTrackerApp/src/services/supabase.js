import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sbrahbuoulzroqlzfdfz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicmFoYnVvdWx6cm9xbHpmZGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NTc5MTYsImV4cCI6MjA2NjUzMzkxNn0.Jj_3PxN0IaumlMd-G3GfzkQ0nh4UKduUHDvS7c9yC2s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Data fetching functions
export const fetchExercises = async () => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*, muscle_groups(name)')
      .order('name');
    
    if (error) throw error;
    
    return data.map(e => ({
      ...e,
      muscle_group_name: e.muscle_groups?.name || ''
    }));
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return [];
  }
};

export const fetchMuscleGroups = async () => {
  try {
    const { data, error } = await supabase
      .from('muscle_groups')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching muscle groups:', error);
    return [];
  }
};

export const fetchWorkoutPrograms = async () => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching workout programs:', error);
    return [];
  }
};

export const fetchUserWorkouts = async () => {
  try {
    const { data, error } = await supabase
      .from('user_workouts')
      .select(`
        *,
        workout_programs (
          id,
          name,
          description,
          difficulty_level,
          duration_weeks
        )
      `)
      .eq('user_id', 'default_user')
      .order('added_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(item => ({
      id: item.id,
      added_at: item.added_at,
      program: item.workout_programs
    }));
  } catch (error) {
    console.error('Error fetching user workouts:', error);
    return [];
  }
};

export const fetchProgramExercises = async (programId, dateString = null) => {
  try {
    console.log('Fetching exercises for program:', programId, 'date:', dateString);
    
    let query = supabase
      .from('workout_program_exercises')
      .select(`
        *,
        exercises (
          id,
          name,
          description,
          muscle_group_id,
          equipment,
          difficulty_level,
          instructions,
          video_url
        )
      `)
      .eq('workout_program_id', programId);
    
    // For now, let's get all exercises for the program without day filtering
    // This will show all exercises regardless of the day
    const { data, error } = await query.order('order_in_workout');
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Raw data from Supabase:', data);
    
    const mappedData = data.map(item => ({
      exercise_id: item.exercise_id,
      exercise_name: item.exercises?.name || 'Unknown Exercise',
      sets: item.sets || 3,
      reps: item.reps || 10,
      description: item.exercises?.description || '',
      muscle_group_id: item.exercises?.muscle_group_id,
      equipment: item.exercises?.equipment,
      difficulty_level: item.exercises?.difficulty_level,
      instructions: item.exercises?.instructions,
      video_url: item.exercises?.video_url,
      day_of_week: item.day_of_week,
      order_in_workout: item.order_in_workout
    }));
    
    console.log('Mapped exercises:', mappedData);
    return mappedData;
  } catch (error) {
    console.error('Error fetching program exercises:', error);
    return [];
  }
};

export const addWorkoutToCalendar = async (programId, dateString) => {
  try {
    const { error } = await supabase
      .from('user_workouts')
      .insert({
        workout_program_id: programId,
        user_id: 'default_user',
        workout_days: [dateString],
        workout_tracking: {},
        last_updated: new Date().toISOString()
      });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding workout to calendar:', error);
    return false;
  }
}; 