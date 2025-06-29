const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file in the project root
const dbPath = path.join(__dirname, '..', 'gym_exercises.db');
const db = new sqlite3.Database(dbPath);

console.log('Initializing database...');

// Create tables
db.serialize(() => {
  // Muscle Groups table
  db.run(`CREATE TABLE IF NOT EXISTS muscle_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Exercises table
  db.run(`CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    muscle_group_id INTEGER,
    equipment TEXT,
    difficulty_level TEXT CHECK(difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    instructions TEXT,
    video_url TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (muscle_group_id) REFERENCES muscle_groups (id)
  )`);

  // Workout Programs table
  db.run(`CREATE TABLE IF NOT EXISTS workout_programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    difficulty_level TEXT CHECK(difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    duration_weeks INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Workout Program Exercises (junction table)
  db.run(`CREATE TABLE IF NOT EXISTS workout_program_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_program_id INTEGER,
    exercise_id INTEGER,
    sets INTEGER,
    reps INTEGER,
    rest_time_seconds INTEGER,
    day_of_week INTEGER CHECK(day_of_week >= 1 AND day_of_week <= 7),
    week_number INTEGER,
    order_in_workout INTEGER,
    FOREIGN KEY (workout_program_id) REFERENCES workout_programs (id),
    FOREIGN KEY (exercise_id) REFERENCES exercises (id)
  )`);

  // Insert sample muscle groups
  const muscleGroups = [
    { name: 'Chest', description: 'Pectoralis major and minor muscles' },
    { name: 'Back', description: 'Latissimus dorsi, rhomboids, and trapezius muscles' },
    { name: 'Shoulders', description: 'Deltoid muscles (anterior, lateral, posterior)' },
    { name: 'Biceps', description: 'Biceps brachii muscles' },
    { name: 'Triceps', description: 'Triceps brachii muscles' },
    { name: 'Legs', description: 'Quadriceps, hamstrings, and glutes' },
    { name: 'Core', description: 'Abdominal and lower back muscles' },
    { name: 'Calves', description: 'Gastrocnemius and soleus muscles' },
    { name: 'Forearms', description: 'Flexor and extensor muscles of the forearm' }
  ];

  const insertMuscleGroup = db.prepare('INSERT OR IGNORE INTO muscle_groups (name, description) VALUES (?, ?)');
  muscleGroups.forEach(group => {
    insertMuscleGroup.run(group.name, group.description);
  });
  insertMuscleGroup.finalize();

  // Insert sample exercises
  const exercises = [
    {
      name: 'Bench Press',
      description: 'Compound exercise for chest development',
      muscle_group: 'Chest',
      equipment: 'Barbell, Bench',
      difficulty_level: 'intermediate',
      instructions: 'Lie on bench, lower bar to chest, press up'
    },
    {
      name: 'Squats',
      description: 'Compound lower body exercise',
      muscle_group: 'Legs',
      equipment: 'Barbell',
      difficulty_level: 'intermediate',
      instructions: 'Stand with bar on shoulders, squat down, stand up'
    },
    {
      name: 'Deadlift',
      description: 'Compound full body exercise',
      muscle_group: 'Back',
      equipment: 'Barbell',
      difficulty_level: 'advanced',
      instructions: 'Stand over bar, grip and lift with proper form'
    },
    {
      name: 'Pull-ups',
      description: 'Bodyweight back exercise',
      muscle_group: 'Back',
      equipment: 'Pull-up bar',
      difficulty_level: 'intermediate',
      instructions: 'Hang from bar, pull body up until chin over bar'
    },
    {
      name: 'Push-ups',
      description: 'Bodyweight chest exercise',
      muscle_group: 'Chest',
      equipment: 'None',
      difficulty_level: 'beginner',
      instructions: 'Plank position, lower body, push back up'
    },
    {
      name: 'Overhead Press',
      description: 'Compound shoulder exercise',
      muscle_group: 'Shoulders',
      equipment: 'Barbell',
      difficulty_level: 'intermediate',
      instructions: 'Stand with bar at shoulders, press overhead'
    },
    {
      name: 'Bicep Curls',
      description: 'Isolation exercise for biceps',
      muscle_group: 'Biceps',
      equipment: 'Dumbbells',
      difficulty_level: 'beginner',
      instructions: 'Stand with dumbbells, curl up and down'
    },
    {
      name: 'Tricep Dips',
      description: 'Bodyweight tricep exercise',
      muscle_group: 'Triceps',
      equipment: 'Dip bars',
      difficulty_level: 'intermediate',
      instructions: 'Support body on bars, lower and push up'
    },
    {
      name: 'Plank',
      description: 'Core stability exercise',
      muscle_group: 'Core',
      equipment: 'None',
      difficulty_level: 'beginner',
      instructions: 'Hold plank position with straight body'
    },
    {
      name: 'Calf Raises',
      description: 'Isolation exercise for calves',
      muscle_group: 'Calves',
      equipment: 'None',
      difficulty_level: 'beginner',
      instructions: 'Stand on edge of step, raise and lower heels'
    }
  ];

  // Insert exercises with proper muscle group IDs
  exercises.forEach(exercise => {
    db.get('SELECT id FROM muscle_groups WHERE name = ?', [exercise.muscle_group], (err, row) => {
      if (row) {
        db.run(`INSERT OR IGNORE INTO exercises 
          (name, description, muscle_group_id, equipment, difficulty_level, instructions) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          [exercise.name, exercise.description, row.id, exercise.equipment, 
           exercise.difficulty_level, exercise.instructions]
        );
      }
    });
  });

  console.log('Database initialized successfully!');
  console.log('Sample muscle groups and exercises have been added.');
});

db.close(); 