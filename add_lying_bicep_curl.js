const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with the same credentials as server.js
const supabaseUrl = 'https://sbrahbuoulzroqlzfdfz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicmFoYnVvdWx6cm9xbHpmZGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NTc5MTYsImV4cCI6MjA2NjUzMzkxNn0.Jj_3PxN0IaumlMd-G3GfzkQ0nh4UKduUHDvS7c9yC2s';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addLyingBicepCurl() {
    try {
        // First, get the Biceps muscle group ID
        const { data: muscleGroup, error: muscleError } = await supabase
            .from('muscle_groups')
            .select('id')
            .eq('name', 'Biceps')
            .single();

        if (muscleError) {
            console.error('Error finding Biceps muscle group:', muscleError);
            return;
        }

        // Add the LYING BICEP CURL exercise
        const { data: exercise, error: exerciseError } = await supabase
            .from('exercises')
            .insert([
                {
                    name: 'LYING BICEP CURL',
                    description: 'Biceps Curl with a dumbbell while sitting',
                    muscle_group_id: muscleGroup.id,
                    equipment: 'Dumbbell',
                    difficulty_level: 'beginner',
                    instructions: 'Biceps Curl with a dumbbell while sitting',
                    video_url: 'https://drive.google.com/file/d/1Ka4olDCSCQGj4QdE1tP23pajczWS09M7/view',
                    link: null
                }
            ])
            .select();

        if (exerciseError) {
            console.error('Error adding LYING BICEP CURL:', exerciseError);
        } else {
            console.log('Successfully added LYING BICEP CURL exercise:', exercise);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

addLyingBicepCurl(); 