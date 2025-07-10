// Gym Exercise Tracker - Netlify App JavaScript

// Supabase configuration
const SUPABASE_URL = 'https://sbrahbuoulzroqlzfdfz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicmFoYnVvdWx6cm9xbHpmZGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NTc5MTYsImV4cCI6MjA2NjUzMzkxNn0.Jj_3PxN0IaumlMd-G3GfzkQ0nh4UKduUHDvS7c9yC2s';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// App state
let currentPage = 'workout-calendar';
let exercises = [];
let muscleGroups = [];
let workoutPrograms = [];
let userWorkouts = [];
let navigationHistory = [];
let currentParams = {};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    loadPage(currentPage);
    loadInitialData();
}

// Navigation setup
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            navigateToPage(page);
        });
    });
}

function navigateToPage(page, params = {}) {
    // Add current page to history
    if (currentPage !== page) {
        navigationHistory.push({ page: currentPage, params: currentParams });
    }
    
    currentPage = page;
    currentParams = params;
    updateActiveNavLink();
    loadPage(page, params);
}

function goBack() {
    if (navigationHistory.length > 0) {
        const previous = navigationHistory.pop();
        currentPage = previous.page;
        currentParams = previous.params;
        updateActiveNavLink();
        loadPage(currentPage, currentParams);
    } else {
        // If no history, go to calendar
        navigateToPage('workout-calendar');
    }
}

function updateActiveNavLink() {
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === currentPage) {
            link.classList.add('active');
        }
    });
}

// Page loading
function loadPage(page, params = {}) {
    const mainContent = document.querySelector('.main-content');
    
    switch(page) {
        case 'exercises':
            loadExercisesPage(mainContent);
            break;
        case 'muscle-groups':
            loadMuscleGroupsPage(mainContent);
            break;
        case 'muscle-group-exercises':
            loadMuscleGroupExercisesPage(mainContent, params);
            break;
        case 'workout-programs':
            loadWorkoutProgramsPage(mainContent);
            break;
        case 'workout-program-details':
            loadWorkoutProgramDetailsPage(mainContent, params);
            break;
        case 'exercise-tracking':
            loadExerciseTrackingPage(mainContent, params);
            break;
        case 'exercise-details':
            loadExerciseDetailsPage(mainContent, params);
            break;
        case 'workout-calendar':
            loadWorkoutCalendarPage(mainContent);
            break;
        default:
            loadExercisesPage(mainContent);
    }
}



// Exercises page
function loadExercisesPage(container) {
    container.innerHTML = `
        <div class="container">
            <div class="page-header">
                <button class="back-button" onclick="goBack()">
                    <img src="icons/icons-back-50.png" alt="Back" class="back-icon">
                </button>
                <h1 class="page-title">Exercises</h1>
            </div>
            
            <div class="search-container">
                <input type="text" class="form-control search-input" placeholder="Search exercises..." id="exerciseSearch">
                <select class="form-control filter-select" id="muscleGroupFilter">
                    <option value="">All Muscle Groups</option>
                </select>
                <select class="form-control filter-select" id="difficultyFilter">
                    <option value="">All Difficulties</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                </select>
            </div>
            
            <div id="exercisesList" class="card-grid">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading exercises...</p>
                </div>
            </div>
        </div>
    `;
    
    loadExercises();
    setupExerciseFilters();
}

// Muscle Groups page
function loadMuscleGroupsPage(container) {
    container.innerHTML = `
        <div class="container">
            <div class="page-header">
                <button class="back-button" onclick="goBack()">
                    <img src="icons/icons-back-50.png" alt="Back" class="back-icon">
                </button>
                <h1 class="page-title">Muscle Groups</h1>
            </div>
            
            <div id="muscleGroupsList" class="card-grid">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading muscle groups...</p>
                </div>
            </div>
        </div>
    `;
    
    loadMuscleGroups();
}

// Workout Programs page
function loadWorkoutProgramsPage(container) {
    container.innerHTML = `
        <div class="container">
            <div class="page-header">
                <button class="back-button" onclick="goBack()">
                    <img src="icons/icons-back-50.png" alt="Back" class="back-icon">
                </button>
                <h1 class="page-title">Workout Programs</h1>
            </div>
            
            <div id="workoutProgramsList" class="card-grid">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading workout programs...</p>
                </div>
            </div>
        </div>
    `;
    
    loadWorkoutPrograms();
}

// Muscle Group Exercises page
function loadMuscleGroupExercisesPage(container, params) {
    const group = muscleGroups.find(g => g.id === params.muscleGroupId);
    const groupExercises = exercises.filter(e => e.muscle_group_id === params.muscleGroupId);
    
    container.innerHTML = `
        <div class="container">
            <div class="page-header">
                <button class="back-button" onclick="goBack()">
                    <img src="icons/icons-back-50.png" alt="Back" class="back-icon">
                </button>
                <h1 class="page-title">${group ? group.name : 'Muscle Group'} Exercises</h1>
            </div>
            
            <div id="muscleGroupExercisesList" class="card-grid">
                ${groupExercises.map(exercise => `
                    <div class="card exercise-card" onclick="navigateToPage('exercise-details', { exerciseId: ${exercise.id} })">
                        <h3>${exercise.name}</h3>
                        <p><strong>Difficulty:</strong> ${exercise.difficulty_level || 'Not specified'}</p>
                        <p><strong>Equipment:</strong> ${exercise.equipment || 'None required'}</p>
                        ${exercise.description ? `<p>${exercise.description}</p>` : ''}
                        <div class="exercise-card-overlay">
                            <span>Click to view details</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Workout Program Details page
function loadWorkoutProgramDetailsPage(container, params) {
    const program = workoutPrograms.find(p => p.id === params.programId);
    
    container.innerHTML = `
        <div class="container">
            <div class="page-header">
                <button class="back-button" onclick="goBack()">
                    <img src="icons/icons-back-50.png" alt="Back" class="back-icon">
                </button>
                <h1 class="page-title">${program ? program.name : 'Workout Program'}</h1>
            </div>
            
            <div class="program-info">
                ${program ? `
                    <p><strong>Difficulty:</strong> ${program.difficulty_level || 'Not specified'}</p>
                    <p><strong>Duration:</strong> ${program.duration_weeks || 'Not specified'} weeks</p>
                    <p>${program.description || 'No description available.'}</p>
                ` : ''}
            </div>
            
            <div id="programExercisesList" class="card-grid">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading exercises...</p>
                </div>
            </div>
        </div>
    `;
    
    loadProgramExercisesForPage(params.programId, params.dateString);
}

// Exercise Tracking page
function loadExerciseTrackingPage(container, params) {
    const program = workoutPrograms.find(p => p.id === params.programId);
    
    container.innerHTML = `
        <div class="container">
            <div class="page-header">
                <button class="back-button" onclick="goBack()">
                    <img src="icons/icons-back-50.png" alt="Back" class="back-icon">
                </button>
                <h1 class="page-title">Track Workout</h1>
            </div>
            
            <div class="workout-info">
                <p><strong>Program:</strong> ${program ? program.name : 'Unknown'}</p>
                <p><strong>Date:</strong> ${params.dateString ? new Date(params.dateString).toLocaleDateString() : 'Today'}</p>
            </div>
            
            <div id="exerciseTrackingList" class="exercise-tracking-container">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading exercises...</p>
                </div>
            </div>
        </div>
    `;
    
    loadExerciseTrackingData(params.programId, params.dateString);
}

// Exercise Details page
function loadExerciseDetailsPage(container, params) {
    const exercise = exercises.find(e => e.id === params.exerciseId);
    
    if (!exercise) {
        container.innerHTML = `
            <div class="container">
                <div class="page-header">
                    <button class="back-button" onclick="goBack()">
                        <img src="icons/icons-back-50.png" alt="Back" class="back-icon">
                    </button>
                    <h1 class="page-title">Exercise Not Found</h1>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="container">
            <div class="page-header">
                <button class="back-button" onclick="goBack()">
                    <img src="icons/icons-back-50.png" alt="Back" class="back-icon">
                </button>
                <h1 class="page-title">${exercise.name}</h1>
            </div>
            
            <div class="exercise-details">
                <p><strong>Muscle Group:</strong> ${exercise.muscle_group_name}</p>
                <p><strong>Difficulty:</strong> ${exercise.difficulty_level || 'Not specified'}</p>
                <p><strong>Equipment:</strong> ${exercise.equipment || 'None required'}</p>
                ${exercise.description ? `<p><strong>Description:</strong> ${exercise.description}</p>` : ''}
                ${exercise.instructions ? `<p><strong>Instructions:</strong> ${exercise.instructions}</p>` : ''}
                ${exercise.video_url ? `<p><strong>Video:</strong> <a href="${exercise.video_url}" target="_blank">Watch Video</a></p>` : ''}
            </div>
        </div>
    `;
}

// Workout Calendar page
function loadWorkoutCalendarPage(container) {
    container.innerHTML = `
        <div class="container">
            <div class="page-header">
                <h1 class="page-title">Workout Calendar</h1>
            </div>
            
            <div class="calendar">
                <div class="calendar-header">
                    <button class="btn btn-secondary" onclick="previousMonth()">Previous</button>
                    <h2 id="currentMonth">January 2024</h2>
                    <button class="btn btn-secondary" onclick="nextMonth()">Next</button>
                </div>
                
                <div id="calendarGrid" class="calendar-grid">
                    <!-- Calendar will be generated here -->
                </div>
            </div>
        </div>
    `;
    
    generateCalendar();
}

// Data loading functions
async function loadInitialData() {
    try {
        await Promise.all([
            loadExercises(),
            loadMuscleGroups(),
            loadWorkoutPrograms(),
            loadUserWorkouts()
        ]);
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

async function loadExercises() {
    try {
        const { data, error } = await supabase
            .from('exercises')
            .select('*, muscle_groups(name)')
            .order('name');
        
        if (error) throw error;
        
        exercises = data.map(e => ({
            ...e,
            muscle_group_name: e.muscle_groups?.name || ''
        }));
        
        if (currentPage === 'exercises') {
            displayExercises(exercises);
        }
    } catch (error) {
        console.error('Error loading exercises:', error);
        showError('Failed to load exercises');
    }
}

async function fetchExercises() {
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
}

async function loadMuscleGroups() {
    try {
        const { data, error } = await supabase
            .from('muscle_groups')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        muscleGroups = data;
        
        if (currentPage === 'muscle-groups') {
            displayMuscleGroups(muscleGroups);
        }
        
        // Update muscle group filter options
        updateMuscleGroupFilter();
    } catch (error) {
        console.error('Error loading muscle groups:', error);
        showError('Failed to load muscle groups');
    }
}

async function loadWorkoutPrograms() {
    try {
        const { data, error } = await supabase
            .from('workout_programs')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        workoutPrograms = data;
        
        if (currentPage === 'workout-programs') {
            displayWorkoutPrograms(workoutPrograms);
        }
    } catch (error) {
        console.error('Error loading workout programs:', error);
        showError('Failed to load workout programs');
    }
}

async function loadUserWorkouts() {
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
        
        userWorkouts = data.map(item => ({
            id: item.id,
            added_at: item.added_at,
            program: item.workout_programs
        }));
    } catch (error) {
        console.error('Error loading user workouts:', error);
    }
}

// Display functions
function displayExercises(exercisesToShow) {
    const container = document.getElementById('exercisesList');
    
    if (!exercisesToShow || exercisesToShow.length === 0) {
        container.innerHTML = '<p class="loading">No exercises found.</p>';
        return;
    }
    
    container.innerHTML = exercisesToShow.map(exercise => `
        <div class="card" data-exercise-id="${exercise.id}">
            <div class="exercise-header">
                <h3 class="editable-field" data-field="name" data-exercise-id="${exercise.id}">${exercise.name}</h3>
                <button class="btn btn-secondary edit-btn" onclick="toggleEditMode(${exercise.id})">Edit</button>
            </div>
            
            <div class="exercise-content">
                <p><strong>Muscle Group:</strong> 
                    <span class="editable-field" data-field="muscle_group_name" data-exercise-id="${exercise.id}">${exercise.muscle_group_name}</span>
                </p>
                <p><strong>Difficulty:</strong> 
                    <span class="editable-field" data-field="difficulty_level" data-exercise-id="${exercise.id}">${exercise.difficulty_level || 'Not specified'}</span>
                </p>
                <p><strong>Equipment:</strong> 
                    <span class="editable-field" data-field="equipment" data-exercise-id="${exercise.id}">${exercise.equipment || 'None required'}</span>
                </p>
                <p><strong>Description:</strong> 
                    <span class="editable-field" data-field="description" data-exercise-id="${exercise.id}">${exercise.description || 'No description'}</span>
                </p>
                <p><strong>Instructions:</strong> 
                    <span class="editable-field" data-field="instructions" data-exercise-id="${exercise.id}">${exercise.instructions || 'No instructions'}</span>
                </p>
                <p><strong>Video URL:</strong> 
                    <span class="editable-field" data-field="video_url" data-exercise-id="${exercise.id}">${exercise.video_url || 'No video'}</span>
                </p>
                <p><strong>Link:</strong> 
                    <span class="editable-field" data-field="link" data-exercise-id="${exercise.id}">${exercise.link || 'No link'}</span>
                </p>
            </div>
            
            <div class="exercise-actions">
                <button class="btn btn-secondary" onclick="showExerciseDetails(${exercise.id})">View Details</button>
                <button class="btn btn-secondary save-btn" onclick="saveExerciseChanges(${exercise.id})" style="display: none;">Save Changes</button>
                <button class="btn btn-secondary cancel-btn" onclick="cancelEditMode(${exercise.id})" style="display: none;">Cancel</button>
            </div>
        </div>
    `).join('');
}

function displayMuscleGroups(groups) {
    const container = document.getElementById('muscleGroupsList');
    
    if (!groups || groups.length === 0) {
        container.innerHTML = '<p class="loading">No muscle groups found.</p>';
        return;
    }
    
    container.innerHTML = groups.map(group => `
        <div class="card">
            <h3>${group.name}</h3>
            <p>${group.description || 'No description available.'}</p>
            <button class="btn btn-secondary" onclick="navigateToPage('muscle-group-exercises', { muscleGroupId: ${group.id} })">View Exercises</button>
        </div>
    `).join('');
}

function displayWorkoutPrograms(programs) {
    const container = document.getElementById('workoutProgramsList');
    
    if (!programs || programs.length === 0) {
        container.innerHTML = '<p class="loading">No workout programs found.</p>';
        return;
    }
    
    container.innerHTML = programs.map(program => `
        <div class="card">
            <h3>${program.name}</h3>
            <p><strong>Difficulty:</strong> ${program.difficulty_level || 'Not specified'}</p>
            <p><strong>Duration:</strong> ${program.duration_weeks || 'Not specified'} weeks</p>
            <p>${program.description || 'No description available.'}</p>
            <button class="btn btn-secondary" onclick="showWorkoutProgramDetails(${program.id})">View Details</button>
        </div>
    `).join('');
}

// Filter functions
function setupExerciseFilters() {
    const searchInput = document.getElementById('exerciseSearch');
    const muscleGroupFilter = document.getElementById('muscleGroupFilter');
    const difficultyFilter = document.getElementById('difficultyFilter');
    
    searchInput.addEventListener('input', filterExercises);
    muscleGroupFilter.addEventListener('change', filterExercises);
    difficultyFilter.addEventListener('change', filterExercises);
}

function filterExercises() {
    const searchTerm = document.getElementById('exerciseSearch').value.toLowerCase();
    const muscleGroupId = document.getElementById('muscleGroupFilter').value;
    const difficulty = document.getElementById('difficultyFilter').value;
    
    let filtered = exercises.filter(exercise => {
        const matchesSearch = exercise.name.toLowerCase().includes(searchTerm) ||
                            exercise.description?.toLowerCase().includes(searchTerm) ||
                            exercise.muscle_group_name.toLowerCase().includes(searchTerm);
        
        const matchesMuscleGroup = !muscleGroupId || exercise.muscle_group_id == muscleGroupId;
        const matchesDifficulty = !difficulty || exercise.difficulty_level === difficulty;
        
        return matchesSearch && matchesMuscleGroup && matchesDifficulty;
    });
    
    displayExercises(filtered);
}

function updateMuscleGroupFilter() {
    const filter = document.getElementById('muscleGroupFilter');
    if (!filter) return;
    
    const options = muscleGroups.map(group => 
        `<option value="${group.id}">${group.name}</option>`
    ).join('');
    
    filter.innerHTML = '<option value="">All Muscle Groups</option>' + options;
}

// Modal functions
function showExerciseDetails(exerciseId) {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal(this)">&times;</span>
            <h2>${exercise.name}</h2>
            <p><strong>Muscle Group:</strong> ${exercise.muscle_group_name}</p>
            <p><strong>Difficulty:</strong> ${exercise.difficulty_level || 'Not specified'}</p>
            <p><strong>Equipment:</strong> ${exercise.equipment || 'None required'}</p>
            ${exercise.description ? `<p><strong>Description:</strong> ${exercise.description}</p>` : ''}
            ${exercise.instructions ? `<p><strong>Instructions:</strong> ${exercise.instructions}</p>` : ''}
            ${exercise.video_url ? `<p><strong>Video:</strong> <a href="${exercise.video_url}" target="_blank">Watch Video</a></p>` : ''}
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function showMuscleGroupExercises(muscleGroupId) {
    const group = muscleGroups.find(g => g.id === muscleGroupId);
    const groupExercises = exercises.filter(e => e.muscle_group_id === muscleGroupId);
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal(this)">&times;</span>
            <h2>${group.name} Exercises</h2>
            <div class="card-grid">
                ${groupExercises.map(exercise => `
                    <div class="card exercise-card" onclick="showExerciseDetails(${exercise.id})">
                        <h3>${exercise.name}</h3>
                        <p><strong>Difficulty:</strong> ${exercise.difficulty_level || 'Not specified'}</p>
                        <p><strong>Equipment:</strong> ${exercise.equipment || 'None required'}</p>
                        ${exercise.description ? `<p>${exercise.description}</p>` : ''}
                        <div class="exercise-card-overlay">
                            <span>Click to view details</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function showWorkoutProgramDetails(programId, dateString = null) {
    const program = workoutPrograms.find(p => p.id === programId);
    if (!program) return;
    
    // Load program exercises
    loadProgramExercises(programId, dateString).then(exercises => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="closeModal(this)">&times;</span>
                <h2>${program.name}</h2>
                ${dateString ? `<p><strong>Date:</strong> ${formatDate(dateString)}</p>` : ''}
                <p><strong>Difficulty:</strong> ${program.difficulty_level || 'Not specified'}</p>
                <p><strong>Duration:</strong> ${program.duration_weeks || 'Not specified'} weeks</p>
                <p>${program.description || 'No description available.'}</p>
                
                <div class="program-exercises">
                    <h3>Exercises</h3>
                    <div class="exercise-list">
                        ${exercises.map(exercise => `
                            <div class="program-exercise-item" onclick="showExerciseTracking(${exercise.exercise_id}, ${exercise.sets}, ${exercise.reps}, '${dateString}', ${programId})">
                                <div class="exercise-info">
                                    <h4>${exercise.exercise_name}</h4>
                                    <p><strong>Sets:</strong> ${exercise.sets} | <strong>Reps:</strong> ${exercise.reps}</p>
                                    ${exercise.rest_time_seconds ? `<p><strong>Rest:</strong> ${exercise.rest_time_seconds}s</p>` : ''}
                                </div>
                                <div class="exercise-arrow">→</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
    });
}

function showNoWorkoutModal(dateString) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal(this)">&times;</span>
            <h2>Select Workout Program</h2>
            <p>No workout is scheduled for ${formatDate(dateString)}.</p>
            <p>Choose a workout program to start your fitness journey:</p>
            <div class="workout-programs-selection">
                ${workoutPrograms.map(program => `
                    <div class="program-selection-card" onclick="selectWorkoutProgram(${program.id}, '${dateString}')">
                        <h3>${program.name}</h3>
                        <p><strong>Difficulty:</strong> ${program.difficulty_level || 'Not specified'}</p>
                        <p><strong>Duration:</strong> ${program.duration_weeks || 'Not specified'} weeks</p>
                        <p>${program.description || 'No description available.'}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

async function loadProgramExercises(programId, dateString = null) {
    try {
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
        
        if (dateString) {
            // Get day of week (1-7, where 1 is Monday)
            const date = new Date(dateString);
            const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // Convert Sunday from 0 to 7
            query = query.eq('day_of_week', dayOfWeek);
        }
        
        const { data, error } = await query.order('order_in_workout');
        
        if (error) throw error;
        
        return data.map(item => ({
            ...item,
            exercise_name: item.exercises?.name || 'Unknown Exercise'
        }));
    } catch (error) {
        console.error('Error loading program exercises:', error);
        return [];
    }
}

async function loadProgramExercisesForPage(programId, dateString = null) {
    try {
        const programExercises = await loadProgramExercises(programId, dateString);
        const allExercises = await fetchExercises();
        
        // Merge exercise details
        const exercisesWithDetails = programExercises.map(programExercise => {
            const exerciseDetails = allExercises.find(e => e.id === programExercise.exercise_id);
            return {
                ...programExercise,
                ...exerciseDetails,
            };
        });
        
        const container = document.getElementById('programExercisesList');
        if (container) {
            container.innerHTML = exercisesWithDetails.map(exercise => `
                <div class="card exercise-card" onclick="navigateToPage('exercise-details', { exerciseId: ${exercise.exercise_id} })">
                    <h3>${exercise.exercise_name}</h3>
                    <p><strong>Sets:</strong> ${exercise.sets} | <strong>Reps:</strong> ${exercise.reps}</p>
                    ${exercise.rest_time_seconds ? `<p><strong>Rest:</strong> ${exercise.rest_time_seconds}s</p>` : ''}
                    ${exercise.description ? `<p>${exercise.description}</p>` : ''}
                    <div class="exercise-card-overlay">
                        <span>Click to view details</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading program exercises for page:', error);
    }
}

async function loadExerciseTrackingData(programId, dateString) {
    try {
        const programExercises = await loadProgramExercises(programId, dateString);
        const allExercises = await fetchExercises();
        
        // Merge exercise details
        const exercisesWithDetails = programExercises.map(programExercise => {
            const exerciseDetails = allExercises.find(e => e.id === programExercise.exercise_id);
            return {
                ...programExercise,
                ...exerciseDetails,
            };
        });
        
        const container = document.getElementById('exerciseTrackingList');
        if (container) {
            container.innerHTML = exercisesWithDetails.map(exercise => `
                <div class="exercise-tracking-item">
                    <div class="exercise-header">
                        <h3>${exercise.exercise_name}</h3>
                        <p><strong>Target:</strong> ${exercise.sets} sets × ${exercise.reps} reps</p>
                    </div>
                    
                    <div class="sets-container">
                        ${generateSetInputsForTracking(exercise, exercise.sets)}
                    </div>
                    
                    <button class="btn btn-secondary" onclick="navigateToPage('exercise-details', { exerciseId: ${exercise.exercise_id} })">
                        View Exercise Details
                    </button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading exercise tracking data:', error);
    }
}

function generateSetInputsForTracking(exercise, sets) {
    let html = '';
    for (let i = 1; i <= sets; i++) {
        html += `
            <div class="set-input-group">
                <h4>Set ${i}</h4>
                <div class="set-inputs">
                    <div class="input-group">
                        <label>Weight (kg/lbs):</label>
                        <input type="number" class="form-control weight-input" 
                               data-exercise="${exercise.exercise_id}" data-set="${i}" data-field="weight" 
                               placeholder="0">
                    </div>
                    <div class="input-group">
                        <label>Reps:</label>
                        <input type="number" class="form-control reps-input" 
                               data-exercise="${exercise.exercise_id}" data-set="${i}" data-field="reps" 
                               placeholder="0">
                    </div>
                    <div class="input-group">
                        <label>Notes:</label>
                        <input type="text" class="form-control notes-input" 
                               data-exercise="${exercise.exercise_id}" data-set="${i}" data-field="notes" 
                               placeholder="Optional notes">
                    </div>
                </div>
            </div>
        `;
    }
    return html;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function selectWorkoutProgram(programId, dateString) {
    // Add workout to user's calendar
    addWorkoutToCalendar(programId, dateString).then(() => {
        // Navigate to exercise tracking
        navigateToPage('exercise-tracking', { 
            programId: programId, 
            dateString: dateString 
        });
    });
}

async function addWorkoutToCalendar(programId, dateString) {
    try {
        // Check if workout already exists for this date
        const existingWorkout = userWorkouts.find(workout => 
            workout.workout_days && workout.workout_days.includes(dateString)
        );
        
        if (existingWorkout) {
            // Update existing workout
            const { error } = await supabase
                .from('user_workouts')
                .update({
                    workout_days: [...(existingWorkout.workout_days || []), dateString],
                    last_updated: new Date().toISOString()
                })
                .eq('id', existingWorkout.id);
            
            if (error) throw error;
        } else {
            // Create new workout
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
        }
        
        // Refresh user workouts
        await loadUserWorkouts();
        
    } catch (error) {
        console.error('Error adding workout to calendar:', error);
        showError('Failed to add workout to calendar');
    }
}

function closeModal(element) {
    const modal = element.closest('.modal');
    modal.remove();
}

// Calendar functions
let currentDate = new Date();

function generateCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
    
    const calendarGrid = document.getElementById('calendarGrid');
    let calendarHTML = '';
    
    // Add day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        calendarHTML += `<div class="calendar-day" style="background: rgba(255,255,255,0.1); font-weight: bold;">${day}</div>`;
    });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
        calendarHTML += '<div class="calendar-day"></div>';
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const hasWorkout = checkForWorkout(year, month + 1, day);
        calendarHTML += `
            <div class="calendar-day ${hasWorkout ? 'has-workout' : ''}" onclick="selectDate(${year}, ${month + 1}, ${day})">
                <div class="calendar-day-number">${day}</div>
                ${hasWorkout ? '<div class="workout-indicator"></div>' : ''}
            </div>
        `;
    }
    
    calendarGrid.innerHTML = calendarHTML;
}

function checkForWorkout(year, month, day) {
    // This is a placeholder - in a real app, you'd check against actual workout data
    const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return userWorkouts.some(workout => 
        workout.workout_days && workout.workout_days.includes(dateString)
    );
}

function selectDate(year, month, day) {
    const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    showWorkoutForDate(dateString);
}

function showWorkoutForDate(dateString) {
    // Find workouts for this date
    const workoutsForDate = userWorkouts.filter(workout => 
        workout.workout_days && workout.workout_days.includes(dateString)
    );
    
    if (workoutsForDate.length === 0) {
        showProgramSelection(dateString);
        return;
    }
    
    // Show the first workout program
    const workout = workoutsForDate[0];
    navigateToPage('exercise-tracking', { 
        programId: workout.program.id, 
        dateString: dateString 
    });
}

function showProgramSelection(dateString) {
    if (workoutPrograms.length === 0) {
        alert('No workout programs available. Please add programs first.');
        return;
    }
    
    const programOptions = workoutPrograms.map(program => ({
        text: `${program.name} (${program.difficulty_level || 'Not specified'})`,
        onPress: () => selectWorkoutProgram(program.id, dateString),
    }));
    
    // For now, just select the first program
    if (programOptions.length > 0) {
        selectWorkoutProgram(workoutPrograms[0].id, dateString);
    }
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    generateCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    generateCalendar();
}

// Utility functions
function showError(message) {
    console.error(message);
    // You could implement a toast notification system here
}

// Exercise editing functions
function toggleEditMode(exerciseId) {
    const card = document.querySelector(`[data-exercise-id="${exerciseId}"]`);
    const editBtn = card.querySelector('.edit-btn');
    const saveBtn = card.querySelector('.save-btn');
    const cancelBtn = card.querySelector('.cancel-btn');
    const editableFields = card.querySelectorAll('.editable-field');
    
    // Store original values for cancel
    editableFields.forEach(field => {
        field.setAttribute('data-original-value', field.textContent);
    });
    
    // Show/hide buttons
    editBtn.style.display = 'none';
    saveBtn.style.display = 'inline-block';
    cancelBtn.style.display = 'inline-block';
    
    // Make fields editable
    editableFields.forEach(field => {
        const fieldName = field.getAttribute('data-field');
        const currentValue = field.textContent;
        
        if (fieldName === 'difficulty_level') {
            // Create dropdown for difficulty
            field.innerHTML = `
                <select class="form-control edit-input">
                    <option value="">Select Difficulty</option>
                    <option value="beginner" ${currentValue === 'beginner' ? 'selected' : ''}>Beginner</option>
                    <option value="intermediate" ${currentValue === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                    <option value="advanced" ${currentValue === 'advanced' ? 'selected' : ''}>Advanced</option>
                </select>
            `;
        } else if (fieldName === 'muscle_group_name') {
            // Create dropdown for muscle groups
            const options = muscleGroups.map(group => 
                `<option value="${group.id}" ${currentValue === group.name ? 'selected' : ''}>${group.name}</option>`
            ).join('');
            field.innerHTML = `
                <select class="form-control edit-input">
                    <option value="">Select Muscle Group</option>
                    ${options}
                </select>
            `;
        } else {
            // Create text input for other fields
            field.innerHTML = `<input type="text" class="form-control edit-input" value="${currentValue}">`;
        }
    });
}

function cancelEditMode(exerciseId) {
    const card = document.querySelector(`[data-exercise-id="${exerciseId}"]`);
    const editBtn = card.querySelector('.edit-btn');
    const saveBtn = card.querySelector('.save-btn');
    const cancelBtn = card.querySelector('.cancel-btn');
    const editableFields = card.querySelectorAll('.editable-field');
    
    // Show/hide buttons
    editBtn.style.display = 'inline-block';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
    
    // Restore original values
    editableFields.forEach(field => {
        const originalValue = field.getAttribute('data-original-value');
        field.textContent = originalValue;
    });
}

async function saveExerciseChanges(exerciseId) {
    const card = document.querySelector(`[data-exercise-id="${exerciseId}"]`);
    const editableFields = card.querySelectorAll('.editable-field');
    const editBtn = card.querySelector('.edit-btn');
    const saveBtn = card.querySelector('.save-btn');
    const cancelBtn = card.querySelector('.cancel-btn');
    
    // Collect updated values
    const updates = {};
    editableFields.forEach(field => {
        const fieldName = field.getAttribute('data-field');
        const input = field.querySelector('.edit-input');
        
        if (input) {
            if (input.tagName === 'SELECT') {
                updates[fieldName] = input.value;
            } else {
                updates[fieldName] = input.value;
            }
        }
    });
    
    try {
        // Update in Supabase
        const { error } = await supabase
            .from('exercises')
            .update(updates)
            .eq('id', exerciseId);
        
        if (error) throw error;
        
        // Update local data
        const exerciseIndex = exercises.findIndex(e => e.id === exerciseId);
        if (exerciseIndex !== -1) {
            exercises[exerciseIndex] = { ...exercises[exerciseIndex], ...updates };
        }
        
        // Show/hide buttons
        editBtn.style.display = 'inline-block';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
        
        // Update display
        editableFields.forEach(field => {
            const fieldName = field.getAttribute('data-field');
            const newValue = updates[fieldName] || field.getAttribute('data-original-value');
            field.textContent = newValue;
        });
        
        // Show success message
        showSuccess('Exercise updated successfully!');
        
    } catch (error) {
        console.error('Error updating exercise:', error);
        showError('Failed to update exercise');
        // Restore original values on error
        cancelEditMode(exerciseId);
    }
}

function showSuccess(message) {
    // Simple success notification
    alert(message); // You could implement a better notification system
}

function showExerciseTracking(exerciseId, sets, reps, dateString, programId) {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;
    
    // Load existing tracking data
    loadExerciseTrackingData(exerciseId, dateString).then(trackingData => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content exercise-tracking-modal">
                <span class="close" onclick="closeModal(this)">&times;</span>
                <h2>${exercise.name}</h2>
                <p><strong>Date:</strong> ${formatDate(dateString)}</p>
                <p><strong>Target:</strong> ${sets} sets × ${reps} reps</p>
                
                <div class="exercise-tracking-form">
                    <h3>Track Your Sets</h3>
                    <div class="sets-container">
                        ${generateSetInputs(sets, trackingData)}
                    </div>
                    
                    <div class="tracking-actions">
                        <button class="btn btn-secondary" onclick="saveExerciseTracking(${exerciseId}, '${dateString}', ${programId})">Save Progress</button>
                        <button class="btn btn-secondary" onclick="showExerciseDetails(${exerciseId})">View Exercise Details</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // Add event listeners for input changes
        setupTrackingInputs();
    });
}

function generateSetInputs(sets, trackingData) {
    let html = '';
    for (let i = 1; i <= sets; i++) {
        const setData = trackingData[i] || {};
        html += `
            <div class="set-input-group">
                <h4>Set ${i}</h4>
                <div class="set-inputs">
                    <div class="input-group">
                        <label>Weight (kg/lbs):</label>
                        <input type="number" class="form-control weight-input" 
                               data-set="${i}" data-field="weight" 
                               value="${setData.weight || ''}" placeholder="0">
                    </div>
                    <div class="input-group">
                        <label>Reps:</label>
                        <input type="number" class="form-control reps-input" 
                               data-set="${i}" data-field="reps" 
                               value="${setData.reps || ''}" placeholder="0">
                    </div>
                    <div class="input-group">
                        <label>Notes:</label>
                        <input type="text" class="form-control notes-input" 
                               data-set="${i}" data-field="notes" 
                               value="${setData.notes || ''}" placeholder="Optional notes">
                    </div>
                </div>
            </div>
        `;
    }
    return html;
}

function setupTrackingInputs() {
    // Add event listeners for real-time updates if needed
    const inputs = document.querySelectorAll('.exercise-tracking-modal input');
    inputs.forEach(input => {
        input.addEventListener('change', function() {
            // You can add real-time validation or auto-save here
        });
    });
}

async function loadExerciseTrackingData(exerciseId, dateString) {
    try {
        // This would load from your database
        // For now, we'll use localStorage as a simple solution
        const key = `tracking_${exerciseId}_${dateString}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('Error loading tracking data:', error);
        return {};
    }
}

async function saveExerciseTracking(exerciseId, dateString, programId) {
    try {
        const trackingData = {};
        const inputs = document.querySelectorAll('.exercise-tracking-modal input');
        
        inputs.forEach(input => {
            const set = input.getAttribute('data-set');
            const field = input.getAttribute('data-field');
            const value = input.value;
            
            if (set && field) {
                if (!trackingData[set]) trackingData[set] = {};
                trackingData[set][field] = value;
            }
        });
        
        // Save to localStorage for now
        const key = `tracking_${exerciseId}_${dateString}`;
        localStorage.setItem(key, JSON.stringify(trackingData));
        
        // You can also save to your database here
        // await saveToDatabase(exerciseId, dateString, trackingData);
        
        showSuccess('Progress saved successfully!');
        
        // Close the modal
        const modal = document.querySelector('.exercise-tracking-modal').closest('.modal');
        modal.remove();
        
    } catch (error) {
        console.error('Error saving tracking data:', error);
        showError('Failed to save progress');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.remove();
    }
} 