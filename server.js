const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase credentials (keep these server-side only!)
const SUPABASE_URL = 'https://sbrahbuoulzroqlzfdfz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicmFoYnVvdWx6cm9xbHpmZGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NTc5MTYsImV4cCI6MjA2NjUzMzkxNn0.Jj_3PxN0IaumlMd-G3GfzkQ0nh4UKduUHDvS7c9yC2s';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configure multer for file uploads
const upload = multer({ 
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel' ||
            file.mimetype === 'text/csv') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel and CSV files are allowed'));
        }
    }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// API Routes

// Get all muscle groups
app.get('/api/muscle-groups', async (req, res) => {
  const { data, error } = await supabase
    .from('muscle_groups')
    .select('*')
    .order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get exercises by muscle group
app.get('/api/exercises', async (req, res) => {
  const { muscle_group_id, difficulty_level } = req.query;
  let query = supabase
    .from('exercises')
    .select('*, muscle_groups(name)')
    .order('name');
  if (muscle_group_id) query = query.eq('muscle_group_id', muscle_group_id);
  if (difficulty_level) query = query.eq('difficulty_level', difficulty_level);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  // Add muscle_group_name for compatibility with frontend
  const exercises = data.map(e => ({
    ...e,
    muscle_group_name: e.muscle_groups?.name || '',
  }));
  res.json(exercises);
});

// Get single exercise
app.get('/api/exercises/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('exercises')
    .select('*, muscle_groups(name)')
    .eq('id', id)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Exercise not found' });
  res.json({ ...data, muscle_group_name: data.muscle_groups?.name || '' });
});

// Add new exercise
app.post('/api/exercises', async (req, res) => {
  const { name, description, muscle_group_id, equipment, difficulty_level, instructions, video_url, image_url, link } = req.body;
  if (!name || !muscle_group_id) {
    return res.status(400).json({ error: 'Name and muscle group are required' });
  }
  const { data, error } = await supabase
    .from('exercises')
    .insert([{ name, description, muscle_group_id, equipment, difficulty_level, instructions, video_url, image_url, link }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: data.id, message: 'Exercise added successfully' });
});

// Get all workout programs
app.get('/api/workout-programs', async (req, res) => {
  const { data, error } = await supabase
    .from('workout_programs')
    .select('*')
    .order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get workout program with exercises
app.get('/api/workout-programs/:id', async (req, res) => {
  const { id } = req.params;
  const { data: program, error: programError } = await supabase
    .from('workout_programs')
    .select('*')
    .eq('id', id)
    .single();
  if (programError) return res.status(500).json({ error: programError.message });
  if (!program) return res.status(404).json({ error: 'Workout program not found' });

  const { data: exercises, error: exercisesError } = await supabase
    .from('workout_program_exercises')
    .select('*, exercises(name, description, equipment, difficulty_level, muscle_groups(name))')
    .eq('workout_program_id', id)
    .order('week_number')
    .order('day_of_week')
    .order('order_in_workout');
  if (exercisesError) return res.status(500).json({ error: exercisesError.message });
  // Map for frontend compatibility
  const mapped = exercises.map(e => ({
    ...e,
    exercise_name: e.exercises?.name || '',
    exercise_description: e.exercises?.description || '',
    equipment: e.exercises?.equipment || '',
    difficulty_level: e.exercises?.difficulty_level || '',
    muscle_group_name: e.exercises?.muscle_groups?.name || '',
  }));
  res.json({ ...program, exercises: mapped });
});

// Add new workout program
app.post('/api/workout-programs', async (req, res) => {
  const { name, description, difficulty_level, duration_weeks } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const { data, error } = await supabase
    .from('workout_programs')
    .insert([{ name, description, difficulty_level, duration_weeks }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: data.id, message: 'Workout program added successfully' });
});

// Delete workout program
app.delete('/api/workout-programs/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // First delete related workout program exercises
    const { error: exercisesError } = await supabase
      .from('workout_program_exercises')
      .delete()
      .eq('workout_program_id', id);
    
    if (exercisesError) {
      return res.status(500).json({ error: exercisesError.message });
    }
    
    // Then delete the workout program
    const { error: programError } = await supabase
      .from('workout_programs')
      .delete()
      .eq('id', id);
    
    if (programError) {
      return res.status(500).json({ error: programError.message });
    }
    
    res.json({ message: 'Workout program deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add exercise to workout program
app.post('/api/workout-programs/:id/exercises', async (req, res) => {
  const { id } = req.params;
  const { exercise_id, sets, reps, rest_time_seconds, day_of_week, week_number, order_in_workout } = req.body;
  if (!exercise_id || !sets || !reps) {
    return res.status(400).json({ error: 'Exercise ID, sets, and reps are required' });
  }
  const { data, error } = await supabase
    .from('workout_program_exercises')
    .insert([{ workout_program_id: id, exercise_id, sets, reps, rest_time_seconds, day_of_week, week_number, order_in_workout }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: data.id, message: 'Exercise added to workout program' });
});

// Search exercises
app.get('/api/search/exercises', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Search query is required' });
  const { data, error } = await supabase
    .from('exercises')
    .select('*, muscle_groups(name)')
    .or(`name.ilike.%${q}%,description.ilike.%${q}%,muscle_groups.name.ilike.%${q}%`)
    .order('name');
  if (error) return res.status(500).json({ error: error.message });
  const exercises = data.map(e => ({
    ...e,
    muscle_group_name: e.muscle_groups?.name || '',
  }));
  res.json(exercises);
});

// Upload Excel file and import exercises
app.post('/api/upload-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File uploaded:', req.file.originalname, 'Size:', req.file.size);

    // Read the Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log('Raw data rows:', data.length);
    console.log('First few rows:', data.slice(0, 3));

    // Remove header row and empty rows
    const rows = data.slice(1).filter(row => row.length > 0 && row[0]);

    console.log('Filtered rows:', rows.length);
    console.log('Sample filtered row:', rows[0]);

    let imported = 0;
    let errors = [];

    // Get all muscle groups for validation
    const { data: muscleGroups } = await supabase
      .from('muscle_groups')
      .select('id, name');

    console.log('Available muscle groups:', muscleGroups.map(g => g.name));

    const muscleGroupMap = {};
    muscleGroups.forEach(group => {
      muscleGroupMap[group.name.toLowerCase()] = group.id;
    });

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      console.log(`Processing row ${i + 2}:`, row);
      
      try {
        const exerciseName = row[0]?.toString().trim();
        const description = row[1]?.toString().trim() || null;
        const muscleGroupName = row[2]?.toString().trim();
        const equipment = row[3]?.toString().trim() || null;
        const difficultyLevel = row[4]?.toString().trim().toLowerCase();
        const instructions = row[5]?.toString().trim() || null;
        const videoUrl = row[6]?.toString().trim() || null;
        const imageUrl = row[7]?.toString().trim() || null;
        const link = row[8]?.toString().trim() || null;

        console.log(`Row ${i + 2} parsed:`, {
          exerciseName,
          muscleGroupName,
          difficultyLevel,
          equipment
        });

        // Validation
        if (!exerciseName) {
          errors.push(`Row ${i + 2}: Exercise name is required`);
          continue;
        }

        if (!muscleGroupName) {
          errors.push(`Row ${i + 2}: Muscle group is required`);
          continue;
        }

        const muscleGroupId = muscleGroupMap[muscleGroupName.toLowerCase()];
        if (!muscleGroupId) {
          errors.push(`Row ${i + 2}: Invalid muscle group "${muscleGroupName}". Valid options: ${Object.keys(muscleGroupMap).join(', ')}`);
          continue;
        }

        if (difficultyLevel && !['beginner', 'intermediate', 'advanced'].includes(difficultyLevel)) {
          errors.push(`Row ${i + 2}: Invalid difficulty level "${difficultyLevel}". Must be beginner, intermediate, or advanced`);
          continue;
        }

        console.log(`Row ${i + 2} validation passed, inserting exercise...`);

        // Insert exercise
        const { error: insertError } = await supabase
          .from('exercises')
          .insert([{
            name: exerciseName,
            description: description,
            muscle_group_id: muscleGroupId,
            equipment: equipment,
            difficulty_level: difficultyLevel || 'beginner',
            instructions: instructions,
            video_url: videoUrl,
            image_url: imageUrl,
            link: link
          }]);

        if (insertError) {
          console.error(`Row ${i + 2} insert error:`, insertError);
          errors.push(`Row ${i + 2}: ${insertError.message}`);
        } else {
          console.log(`Row ${i + 2} successfully imported`);
          imported++;
        }

      } catch (error) {
        console.error(`Row ${i + 2} processing error:`, error);
        errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    console.log('Import completed. Imported:', imported, 'Errors:', errors.length);

    // Clean up uploaded file
    const fs = require('fs');
    fs.unlinkSync(req.file.path);

    res.json({
      imported,
      errors,
      message: `Successfully imported ${imported} exercises${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    });

  } catch (error) {
    console.error('Error processing Excel file:', error);
    res.status(500).json({ error: 'Error processing Excel file' });
  }
});

// User Workouts API Endpoints

// Get user's workouts (for now using a default user_id)
app.get('/api/my-workouts', async (req, res) => {
  const userId = 'default_user'; // For now, using a default user ID
  
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
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    
    // Transform the data for easier frontend consumption
    const workouts = data.map(item => ({
      id: item.id,
      added_at: item.added_at,
      program: item.workout_programs
    }));
    
    res.json(workouts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add workout program to user's workouts
app.post('/api/my-workouts', async (req, res) => {
  const { workout_program_id } = req.body;
  const userId = 'default_user'; // For now, using a default user ID
  
  if (!workout_program_id) {
    return res.status(400).json({ error: 'Workout program ID is required' });
  }

  try {
    const { data, error } = await supabase
      .from('user_workouts')
      .insert([{ 
        workout_program_id: parseInt(workout_program_id), 
        user_id: userId 
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'This workout program is already in your collection' });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({ id: data.id, message: 'Workout program added to your collection' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove workout program from user's workouts
app.delete('/api/my-workouts/:id', async (req, res) => {
  const { id } = req.params;
  const userId = 'default_user'; // For now, using a default user ID

  try {
    const { error } = await supabase
      .from('user_workouts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) return res.status(500).json({ error: error.message });
    
    res.json({ message: 'Workout program removed from your collection' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if a workout program is in user's collection
app.get('/api/my-workouts/check/:programId', async (req, res) => {
  const { programId } = req.params;
  const userId = 'default_user'; // For now, using a default user ID

  try {
    const { data, error } = await supabase
      .from('user_workouts')
      .select('id')
      .eq('workout_program_id', programId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      return res.status(500).json({ error: error.message });
    }

    res.json({ isAdded: !!data, userWorkoutId: data?.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('API endpoints available at /api/');
}); 