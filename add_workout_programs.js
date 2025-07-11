const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sbrahbuoulzroqlzfdfz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicmFoYnVvdWx6cm9xbHpmZGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NTc5MTYsImV4cCI6MjA2NjUzMzkxNn0.Jj_3PxN0IaumlMd-G3GfzkQ0nh4UKduUHDvS7c9yC2s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function addWorkoutPrograms() {
  try {
    console.log('Adding workout programs...');

    // 1. Upper Body Strength Program
    const { data: upperBodyProgram, error: upperError } = await supabase
      .from('workout_programs')
      .insert({
        name: 'Upper Body Strength',
        description: 'Focus on chest, back, and shoulders',
        difficulty_level: 'intermediate',
        duration_weeks: 8
      })
      .select()
      .single();

    if (upperError) throw upperError;
    console.log('Added Upper Body Strength program');

    // 2. Lower Body Power Program
    const { data: lowerBodyProgram, error: lowerError } = await supabase
      .from('workout_programs')
      .insert({
        name: 'Lower Body Power',
        description: 'Build strength in legs and glutes',
        difficulty_level: 'beginner',
        duration_weeks: 6
      })
      .select()
      .single();

    if (lowerError) throw lowerError;
    console.log('Added Lower Body Power program');

    // 3. Full Body Circuit Program
    const { data: fullBodyProgram, error: fullError } = await supabase
      .from('workout_programs')
      .insert({
        name: 'Full Body Circuit',
        description: 'Complete body workout with cardio',
        difficulty_level: 'advanced',
        duration_weeks: 4
      })
      .select()
      .single();

    if (fullError) throw fullError;
    console.log('Added Full Body Circuit program');

    // 4. Core & Arms Program
    const { data: coreArmsProgram, error: coreError } = await supabase
      .from('workout_programs')
      .insert({
        name: 'Core & Arms',
        description: 'Strengthen core and arm muscles',
        difficulty_level: 'beginner',
        duration_weeks: 6
      })
      .select()
      .single();

    if (coreError) throw coreError;
    console.log('Added Core & Arms program');

    // 5. Push Pull Program
    const { data: pushPullProgram, error: pushError } = await supabase
      .from('workout_programs')
      .insert({
        name: 'Push Pull Split',
        description: 'Push and pull day split routine',
        difficulty_level: 'intermediate',
        duration_weeks: 8
      })
      .select()
      .single();

    if (pushError) throw pushError;
    console.log('Added Push Pull Split program');

    // Now add exercises to each program
    await addExercisesToProgram(upperBodyProgram.id, 'Upper Body');
    await addExercisesToProgram(lowerBodyProgram.id, 'Lower Body');
    await addExercisesToProgram(fullBodyProgram.id, 'Full Body');
    await addExercisesToProgram(coreArmsProgram.id, 'Core Arms');
    await addExercisesToProgram(pushPullProgram.id, 'Push Pull');

    console.log('All workout programs and exercises added successfully!');

  } catch (error) {
    console.error('Error adding workout programs:', error);
  }
}

async function addExercisesToProgram(programId, programType) {
  try {
    // Get exercises based on program type
    let exercises = [];
    
    if (programType === 'Upper Body') {
      exercises = [
        { name: 'Bench Press', sets: 4, reps: 8, day_of_week: 1 },
        { name: 'Pull-ups', sets: 3, reps: 10, day_of_week: 1 },
        { name: 'Overhead Press', sets: 3, reps: 10, day_of_week: 1 },
        { name: 'Barbell Rows', sets: 3, reps: 12, day_of_week: 1 },
        { name: 'Dumbbell Flyes', sets: 3, reps: 12, day_of_week: 1 }
      ];
    } else if (programType === 'Lower Body') {
      exercises = [
        { name: 'Squats', sets: 4, reps: 10, day_of_week: 1 },
        { name: 'Deadlifts', sets: 3, reps: 8, day_of_week: 1 },
        { name: 'Lunges', sets: 3, reps: 12, day_of_week: 1 },
        { name: 'Leg Press', sets: 3, reps: 12, day_of_week: 1 },
        { name: 'Calf Raises', sets: 4, reps: 15, day_of_week: 1 }
      ];
    } else if (programType === 'Full Body') {
      exercises = [
        { name: 'Burpees', sets: 3, reps: 15, day_of_week: 1 },
        { name: 'Mountain Climbers', sets: 3, reps: 20, day_of_week: 1 },
        { name: 'Push-ups', sets: 3, reps: 12, day_of_week: 1 },
        { name: 'Squat Jumps', sets: 3, reps: 15, day_of_week: 1 },
        { name: 'Plank', sets: 3, reps: 30, day_of_week: 1 }
      ];
    } else if (programType === 'Core Arms') {
      exercises = [
        { name: 'Bicep Curls', sets: 3, reps: 12, day_of_week: 1 },
        { name: 'Tricep Dips', sets: 3, reps: 12, day_of_week: 1 },
        { name: 'Crunches', sets: 3, reps: 20, day_of_week: 1 },
        { name: 'Russian Twists', sets: 3, reps: 20, day_of_week: 1 },
        { name: 'Hammer Curls', sets: 3, reps: 12, day_of_week: 1 }
      ];
    } else if (programType === 'Push Pull') {
      exercises = [
        { name: 'Bench Press', sets: 4, reps: 8, day_of_week: 1 },
        { name: 'Overhead Press', sets: 3, reps: 10, day_of_week: 1 },
        { name: 'Dips', sets: 3, reps: 12, day_of_week: 1 },
        { name: 'Pull-ups', sets: 4, reps: 8, day_of_week: 2 },
        { name: 'Barbell Rows', sets: 3, reps: 12, day_of_week: 2 }
      ];
    }

    // Add exercises to the program
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      
      // Get exercise ID from database
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('exercises')
        .select('id')
        .eq('name', exercise.name)
        .single();

      if (exerciseError) {
        console.log(`Exercise ${exercise.name} not found, skipping...`);
        continue;
      }

      // Add to workout program exercises
      const { error: programExerciseError } = await supabase
        .from('workout_program_exercises')
        .insert({
          workout_program_id: programId,
          exercise_id: exerciseData.id,
          sets: exercise.sets,
          reps: exercise.reps,
          day_of_week: exercise.day_of_week,
          order_in_workout: i + 1
        });

      if (programExerciseError) {
        console.error(`Error adding ${exercise.name} to program:`, programExerciseError);
      } else {
        console.log(`Added ${exercise.name} to ${programType} program`);
      }
    }

  } catch (error) {
    console.error(`Error adding exercises to ${programType} program:`, error);
  }
}

addWorkoutPrograms(); 