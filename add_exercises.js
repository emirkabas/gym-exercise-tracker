const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const SUPABASE_URL = 'https://sbrahbuoulzroqlzfdfz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicmFoYnVvdWx6cm9xbHpmZGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NTc5MTYsImV4cCI6MjA2NjUzMzkxNn0.Jj_3PxN0IaumlMd-G3GfzkQ0nh4UKduUHDvS7c9yC2s';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function addExercises() {
  try {
    // Get muscle group IDs
    const { data: muscleGroups, error: muscleError } = await supabase
      .from('muscle_groups')
      .select('id, name');
    
    if (muscleError) {
      console.error('Error fetching muscle groups:', muscleError);
      return;
    }

    const muscleGroupMap = {};
    muscleGroups.forEach(group => {
      muscleGroupMap[group.name.toLowerCase()] = group.id;
    });

    console.log('Available muscle groups:', muscleGroups.map(g => g.name));

    // New exercises to add (without link column for now)
    const newExercises = [
      {
        name: 'M/C TECHNOGYM SHOULDER PRESS',
        description: 'Shoulder Press with a Machine',
        muscle_group_id: muscleGroupMap['shoulders'],
        equipment: 'SHOULDER PRESS',
        difficulty_level: 'intermediate',
        instructions: 'Perform shoulder press using the Technogym machine',
        video_url: 'https://www.youtube.com/watch?v=d7yQMvVQaXQ'
      },
      {
        name: 'CHEST PRESS',
        description: 'Chest Press with a Machine',
        muscle_group_id: muscleGroupMap['chest'],
        equipment: 'Chest Press',
        difficulty_level: 'intermediate',
        instructions: 'Perform chest press using the Technogym machine',
        video_url: 'https://drive.google.com/file/d/1om00-i0VoP7UKDHOc27ZqzaaW0CYzgpV/view'
      }
    ];

    console.log('Adding new exercises...');
    
    for (const exercise of newExercises) {
      const { data, error } = await supabase
        .from('exercises')
        .insert([exercise])
        .select();
      
      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`Exercise "${exercise.name}" already exists, skipping...`);
        } else {
          console.error(`Error adding exercise "${exercise.name}":`, error.message);
        }
      } else {
        console.log(`Successfully added exercise: ${exercise.name}`);
      }
    }

    console.log('Done! Check your exercises page to see the new exercises.');

  } catch (error) {
    console.error('Error:', error);
  }
}

addExercises(); 