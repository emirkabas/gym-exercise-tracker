const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Initialize Supabase client with the same credentials as server.js
const supabaseUrl = 'https://sbrahbuoulzroqlzfdfz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicmFoYnVvdWx6cm9xbHpmZGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NTc5MTYsImV4cCI6MjA2NjUzMzkxNn0.Jj_3PxN0IaumlMd-G3Gf';
const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper function to ask questions
function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

// Get all muscle groups
async function getMuscleGroups() {
    const { data: muscleGroups, error } = await supabase
        .from('muscle_groups')
        .select('id, name')
        .order('name');
    
    if (error) {
        console.error('Error fetching muscle groups:', error);
        return [];
    }
    
    return muscleGroups;
}

// Add a new exercise
async function addExercise() {
    console.log('\n=== Add New Exercise to Supabase ===\n');
    
    // Get exercise name
    const name = await askQuestion('Exercise name: ');
    if (!name) {
        console.log('Exercise name is required!');
        return;
    }
    
    // Get description
    const description = await askQuestion('Description (optional): ');
    
    // Get muscle group
    const muscleGroups = await getMuscleGroups();
    if (muscleGroups.length === 0) {
        console.log('No muscle groups found. Please add muscle groups first.');
        return;
    }
    
    console.log('\nAvailable muscle groups:');
    muscleGroups.forEach((mg, index) => {
        console.log(`${index + 1}. ${mg.name}`);
    });
    
    const muscleGroupChoice = await askQuestion('\nSelect muscle group (enter number): ');
    const muscleGroupIndex = parseInt(muscleGroupChoice) - 1;
    
    if (muscleGroupIndex < 0 || muscleGroupIndex >= muscleGroups.length) {
        console.log('Invalid muscle group selection!');
        return;
    }
    
    const muscleGroupId = muscleGroups[muscleGroupIndex].id;
    
    // Get equipment
    const equipment = await askQuestion('Equipment (optional): ');
    
    // Get difficulty level
    console.log('\nDifficulty levels:');
    console.log('1. beginner');
    console.log('2. intermediate');
    console.log('3. advanced');
    
    const difficultyChoice = await askQuestion('Select difficulty level (enter number): ');
    const difficultyLevels = ['beginner', 'intermediate', 'advanced'];
    const difficultyIndex = parseInt(difficultyChoice) - 1;
    
    if (difficultyIndex < 0 || difficultyIndex >= difficultyLevels.length) {
        console.log('Invalid difficulty level selection!');
        return;
    }
    
    const difficultyLevel = difficultyLevels[difficultyIndex];
    
    // Get instructions
    const instructions = await askQuestion('Instructions (optional): ');
    
    // Get video URL
    const videoUrl = await askQuestion('Video URL (optional): ');
    
    // Get image URL
    const imageUrl = await askQuestion('Image URL (optional): ');
    
    // Get link
    const link = await askQuestion('Link (optional): ');
    
    // Confirm before adding
    console.log('\n=== Exercise Summary ===');
    console.log(`Name: ${name}`);
    console.log(`Description: ${description || 'N/A'}`);
    console.log(`Muscle Group: ${muscleGroups[muscleGroupIndex].name}`);
    console.log(`Equipment: ${equipment || 'N/A'}`);
    console.log(`Difficulty: ${difficultyLevel}`);
    console.log(`Instructions: ${instructions || 'N/A'}`);
    console.log(`Video URL: ${videoUrl || 'N/A'}`);
    console.log(`Image URL: ${imageUrl || 'N/A'}`);
    console.log(`Link: ${link || 'N/A'}`);
    
    const confirm = await askQuestion('\nAdd this exercise? (y/n): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
        console.log('Exercise addition cancelled.');
        return;
    }
    
    // Insert the exercise
    const { data: exercise, error: exerciseError } = await supabase
        .from('exercises')
        .insert({
            name,
            description: description || null,
            muscle_group_id: muscleGroupId,
            equipment: equipment || null,
            difficulty_level: difficultyLevel,
            instructions: instructions || null,
            video_url: videoUrl || null,
            image_url: imageUrl || null,
            link: link || null
        })
        .select()
        .single();
    
    if (exerciseError) {
        console.error('Error adding exercise:', exerciseError);
        return;
    }
    
    console.log('\n✅ Exercise added successfully!');
    console.log(`Exercise ID: ${exercise.id}`);
    console.log(`Name: ${exercise.name}`);
}

// List all exercises
async function listExercises() {
    console.log('\n=== All Exercises ===\n');
    
    const { data: exercises, error } = await supabase
        .from('exercises')
        .select(`
            id,
            name,
            description,
            equipment,
            difficulty_level,
            muscle_groups (name)
        `)
        .order('name');
    
    if (error) {
        console.error('Error fetching exercises:', error);
        return;
    }
    
    if (exercises.length === 0) {
        console.log('No exercises found.');
        return;
    }
    
    exercises.forEach((exercise, index) => {
        console.log(`${index + 1}. ${exercise.name}`);
        console.log(`   Muscle Group: ${exercise.muscle_groups?.name || 'N/A'}`);
        console.log(`   Equipment: ${exercise.equipment || 'N/A'}`);
        console.log(`   Difficulty: ${exercise.difficulty_level || 'N/A'}`);
        console.log(`   Description: ${exercise.description || 'N/A'}`);
        console.log('');
    });
}

// Main menu
async function showMenu() {
    console.log('\n=== Exercise Management Tool ===');
    console.log('1. Add new exercise');
    console.log('2. List all exercises');
    console.log('3. Exit');
    
    const choice = await askQuestion('\nSelect an option (1-3): ');
    
    switch (choice) {
        case '1':
            await addExercise();
            break;
        case '2':
            await listExercises();
            break;
        case '3':
            console.log('Goodbye!');
            rl.close();
            return;
        default:
            console.log('Invalid option. Please try again.');
    }
    
    // Show menu again unless exiting
    if (choice !== '3') {
        await showMenu();
    }
}

// Start the application
async function main() {
    try {
        await showMenu();
    } catch (error) {
        console.error('An error occurred:', error);
        rl.close();
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\nGoodbye!');
    rl.close();
    process.exit(0);
});

// Run the application
main(); 