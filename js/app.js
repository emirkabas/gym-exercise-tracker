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
let currentDate = new Date();
let selectedDate = new Date(); // Today's date by default
let calendarView = 'month'; // 'day', 'week', 'month'
let showWorkoutToday = false;
let selectedProgram = '';
let scheduledWorkouts = {}; // Store scheduled workouts

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
            
            <div class="workout-actions">
                <button class="btn btn-secondary" onclick="goBack()">
                    ← Back to Calendar
                </button>
                <button class="btn btn-primary" onclick="saveAllProgress()">
                    Save All Progress
                </button>
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
                <h1 class="page-title">Calendar</h1>
            </div>
            
            <!-- View Toggle Buttons -->
            <div class="calendar-view-toggle">
                <button class="view-toggle-btn ${calendarView === 'day' ? 'active' : ''}" onclick="switchCalendarView('day')">Day</button>
                <button class="view-toggle-btn ${calendarView === 'week' ? 'active' : ''}" onclick="switchCalendarView('week')">Week</button>
                <button class="view-toggle-btn ${calendarView === 'month' ? 'active' : ''}" onclick="switchCalendarView('month')">Month</button>
            </div>
            
            <div class="calendar">
                <div class="calendar-header">
                    <button class="btn btn-secondary" onclick="previousPeriod()">Previous</button>
                    <h2 id="currentPeriod">January 2024</h2>
                    <button class="btn btn-secondary" onclick="nextPeriod()">Next</button>
                </div>
                
                <div id="calendarGrid" class="calendar-grid">
                    <!-- Calendar will be generated here -->
                </div>
            </div>
            
            <!-- Workout Today Section (only for today) -->
            <div id="workoutTodaySection" class="workout-today-section" style="display: none;">
                <div class="workout-toggle">
                    <span>Workout Today?</span>
                    <label class="switch">
                        <input type="checkbox" id="workoutTodayToggle" onchange="toggleWorkoutToday()">
                        <span class="slider round"></span>
                    </label>
                </div>
                
                <div id="programSelection" class="program-selection" style="display: none;">
                    <button class="btn btn-primary" onclick="showProgramSelectionModal()">
                        ${selectedProgram || 'Select Workout Program'}
                    </button>
                </div>
            </div>
            
            <!-- Selected Date Workout Section (for non-today dates) -->
            <div id="selectedDateSection" class="selected-date-section" style="display: none;">
                <h3 id="selectedDateTitle">Workout for Selected Date</h3>
                <div id="selectedDateContent">
                    <button class="btn btn-primary" onclick="showProgramSelectionModal()">
                        Add Workout
                    </button>
                </div>
            </div>
        </div>
    `;
    
    generateCalendar();
    updateWorkoutSections();
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

function generateSetInputsForTracking(exercise, sets, targetReps = 10) {
    let html = '';
    for (let i = 1; i <= sets; i++) {
        html += `
            <div class="set-input-group">
                <h4>Set ${i}</h4>
                <div class="set-inputs">
                    <div class="input-group">
                        <label>Weight (kg/lbs):</label>
                        <input type="number" class="form-control weight-input" 
                               data-exercise="${exercise.exercise_id || exercise.id}" data-set="${i}" data-field="weight" 
                               placeholder="0" min="0" step="0.5">
                    </div>
                    <div class="input-group">
                        <label>Reps Completed:</label>
                        <input type="number" class="form-control reps-input" 
                               data-exercise="${exercise.exercise_id || exercise.id}" data-set="${i}" data-field="reps" 
                               placeholder="${targetReps}" min="0" max="100">
                        <small class="target-reps">Target: ${targetReps} reps</small>
                    </div>
                    <div class="input-group">
                        <label>Notes:</label>
                        <input type="text" class="form-control notes-input" 
                               data-exercise="${exercise.exercise_id || exercise.id}" data-set="${i}" data-field="notes" 
                               placeholder="How did it feel? Any issues?">
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
    const program = workoutPrograms.find(p => p.id == programId);
    if (program) {
        selectedProgram = program.name;
        scheduledWorkouts[dateString] = program;
        
        // Update the UI
        const programSelection = document.getElementById('programSelection');
        if (programSelection) {
            const button = programSelection.querySelector('button');
            button.textContent = selectedProgram;
        }
        
        // Show success message
        showSuccess(`Workout "${program.name}" scheduled for ${new Date(dateString).toLocaleDateString()}`);
        
        // Regenerate calendar to show the new workout
        generateCalendar();
        
        // Show exercise selection for this program
        showExerciseSelection(programId, dateString);
    }
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

function generateCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    let calendarHTML = '';
    
    switch(calendarView) {
        case 'day':
            calendarHTML = generateDayView();
            document.getElementById('currentPeriod').textContent = selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
            });
            break;
        case 'week':
            calendarHTML = generateWeekView();
            const weekStart = getWeekStart(selectedDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            document.getElementById('currentPeriod').textContent = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            break;
        case 'month':
            calendarHTML = generateMonthView();
            document.getElementById('currentPeriod').textContent = `${monthNames[month]} ${year}`;
            break;
    }
    
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = calendarHTML;
}

function generateDayView() {
    const dateString = selectedDate.toISOString().split('T')[0];
    const hasWorkout = scheduledWorkouts[dateString];
    
    return `
        <div class="day-view">
            <div class="day-schedule">
                <h3>Today's Schedule</h3>
                ${hasWorkout ? `
                    <div class="scheduled-workout">
                        <h4>${hasWorkout.name}</h4>
                        <p>Duration: ${hasWorkout.duration || 'Not specified'}</p>
                        <button class="btn btn-primary" onclick="showWorkoutDetails('${dateString}')">View Details</button>
                    </div>
                ` : `
                    <p>No workout scheduled</p>
                `}
            </div>
        </div>
    `;
}

function generateWeekView() {
    const weekStart = getWeekStart(selectedDate);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let weekHTML = '<div class="week-view">';
    
    // Day headers
    weekHTML += '<div class="week-header">';
    dayNames.forEach(day => {
        weekHTML += `<div class="week-day-header">${day}</div>`;
    });
    weekHTML += '</div>';
    
    // Week grid
    weekHTML += '<div class="week-grid">';
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        const hasWorkout = scheduledWorkouts[dateString];
        const isSelected = date.toDateString() === selectedDate.toDateString();
        const isToday = date.toDateString() === new Date().toDateString();
        
        weekHTML += `
            <div class="week-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" onclick="selectDateFromWeek('${dateString}')">
                <div class="week-day-number">${date.getDate()}</div>
                ${hasWorkout ? '<div class="workout-indicator"></div>' : ''}
            </div>
        `;
    }
    weekHTML += '</div></div>';
    
    return weekHTML;
}

function generateMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    let calendarHTML = '';
    
    // Add day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        calendarHTML += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
        calendarHTML += '<div class="calendar-day empty"></div>';
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = date.toISOString().split('T')[0];
        const hasWorkout = scheduledWorkouts[dateString];
        const isSelected = date.toDateString() === selectedDate.toDateString();
        const isToday = date.toDateString() === new Date().toDateString();
        
        calendarHTML += `
            <div class="calendar-day ${hasWorkout ? 'has-workout' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" onclick="selectDateFromMonth(${year}, ${month + 1}, ${day})">
                <div class="calendar-day-number">${day}</div>
                ${hasWorkout ? '<div class="workout-indicator"></div>' : ''}
            </div>
        `;
    }
    
    return calendarHTML;
}

function checkForWorkout(year, month, day) {
    const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return userWorkouts.some(workout => 
        workout.workout_days && Array.isArray(workout.workout_days) && workout.workout_days.includes(dateString)
    );
}

function selectDate(year, month, day) {
    const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    showWorkoutForDate(dateString);
}

function showWorkoutForDate(dateString) {
    // Always show program selection, regardless of existing workouts
    showProgramSelection(dateString);
}

function showProgramSelection(dateString) {
    if (workoutPrograms.length === 0) {
        alert('No workout programs available. Please add programs first.');
        return;
    }
    
    // Create a modal to show program selection
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.zIndex = '1000';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.background = '#1a1a1a';
    modalContent.style.border = '1px solid rgba(255,255,255,0.1)';
    modalContent.style.borderRadius = '15px';
    modalContent.style.padding = '30px';
    modalContent.style.maxWidth = '500px';
    modalContent.style.width = '90%';
    modalContent.style.maxHeight = '80vh';
    modalContent.style.overflowY = 'auto';
    
    modalContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #ffffff; margin-bottom: 10px;">Select Workout Program</h2>
            <p style="color: #cccccc; margin-bottom: 20px;">Choose a workout program for ${new Date(dateString).toLocaleDateString()}</p>
        </div>
        <div id="programOptions" style="display: flex; flex-direction: column; gap: 10px;">
            ${workoutPrograms.map(program => `
                <button 
                    class="btn btn-secondary program-option" 
                    data-program-id="${program.id}"
                    data-date-string="${dateString}"
                    style="text-align: left; padding: 15px; margin: 0; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #ffffff; cursor: pointer; transition: all 0.3s ease;">
                    <div style="font-weight: 600; margin-bottom: 5px;">${program.name}</div>
                    <div style="font-size: 0.9rem; color: #cccccc;">${program.difficulty_level || 'Not specified'} • ${program.duration_weeks || 'Unknown'} weeks</div>
                </button>
            `).join('')}
        </div>
        <div style="text-align: center; margin-top: 20px;">
            <button class="btn btn-secondary" onclick="closeModal(this)" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);">Cancel</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Add event listeners to program options
    const programButtons = modal.querySelectorAll('.program-option');
    programButtons.forEach(button => {
        button.addEventListener('click', function() {
            const programId = this.getAttribute('data-program-id');
            const dateString = this.getAttribute('data-date-string');
            closeModal(modal);
            selectWorkoutProgram(programId, dateString);
        });
    });
}

// Helper functions
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}

function isToday(date) {
    return date.toDateString() === new Date().toDateString();
}

function isSameDate(date1, date2) {
    return date1.toDateString() === date2.toDateString();
}

// Calendar view switching
function switchCalendarView(view) {
    calendarView = view;
    
    // Update toggle buttons
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    generateCalendar();
    updateWorkoutSections();
}

// Date selection functions
function selectDateFromMonth(year, month, day) {
    selectedDate = new Date(year, month - 1, day);
    currentDate = new Date(year, month - 1, 1);
    generateCalendar();
    updateWorkoutSections();
}

function selectDateFromWeek(dateString) {
    selectedDate = new Date(dateString);
    generateCalendar();
    updateWorkoutSections();
}

// Navigation functions
function previousPeriod() {
    switch(calendarView) {
        case 'day':
            selectedDate.setDate(selectedDate.getDate() - 1);
            break;
        case 'week':
            selectedDate.setDate(selectedDate.getDate() - 7);
            break;
        case 'month':
            currentDate.setMonth(currentDate.getMonth() - 1);
            break;
    }
    generateCalendar();
    updateWorkoutSections();
}

function nextPeriod() {
    switch(calendarView) {
        case 'day':
            selectedDate.setDate(selectedDate.getDate() + 1);
            break;
        case 'week':
            selectedDate.setDate(selectedDate.getDate() + 7);
            break;
        case 'month':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
    }
    generateCalendar();
    updateWorkoutSections();
}

// Workout section management
function updateWorkoutSections() {
    const workoutTodaySection = document.getElementById('workoutTodaySection');
    const selectedDateSection = document.getElementById('selectedDateSection');
    
    if (isToday(selectedDate)) {
        workoutTodaySection.style.display = 'block';
        selectedDateSection.style.display = 'none';
    } else {
        workoutTodaySection.style.display = 'none';
        selectedDateSection.style.display = 'block';
        document.getElementById('selectedDateTitle').textContent = `Workout for ${selectedDate.toLocaleDateString()}`;
    }
}

function toggleWorkoutToday() {
    showWorkoutToday = !showWorkoutToday;
    const programSelection = document.getElementById('programSelection');
    programSelection.style.display = showWorkoutToday ? 'block' : 'none';
}

function showProgramSelectionModal() {
    if (workoutPrograms.length === 0) {
        alert('No workout programs available. Please add programs first.');
        return;
    }
    
    const dateString = selectedDate.toISOString().split('T')[0];
    showProgramSelection(dateString);
}

function showWorkoutDetails(dateString) {
    const workout = scheduledWorkouts[dateString];
    if (workout) {
        showWorkoutProgramDetails(workout.id, dateString);
    }
}

// Exercise selection and tracking functions
function showExerciseSelection(programId, dateString) {
    const program = workoutPrograms.find(p => p.id == programId);
    if (!program) return;
    
    // Get exercises for this program
    const programExercises = getProgramExercises(program.name);
    
    // Create exercise selection section
    const exerciseSection = document.createElement('div');
    exerciseSection.id = 'exerciseSelectionSection';
    exerciseSection.className = 'exercise-selection-section';
    exerciseSection.innerHTML = `
        <h3>Select Exercise</h3>
        <div class="exercise-select-container">
            <select id="exerciseSelect" class="exercise-select" onchange="onExerciseSelected('${programId}', '${dateString}')">
                <option value="">Choose an exercise...</option>
                ${programExercises.map(exercise => `
                    <option value="${exercise.id}">${exercise.name}</option>
                `).join('')}
            </select>
        </div>
        <div id="exerciseTrackingSection" class="exercise-tracking-section" style="display: none;">
            <!-- Exercise tracking will be loaded here -->
        </div>
    `;
    
    // Add to the page
    const container = document.querySelector('.container');
    const existingSection = document.getElementById('exerciseSelectionSection');
    if (existingSection) {
        existingSection.remove();
    }
    container.appendChild(exerciseSection);
}

function getProgramExercises(programName) {
    // Mock exercises based on program name
    switch(programName) {
        case 'Cardio & Strength Mix':
            return [
                { id: 1, name: 'Burpees', sets: 3, reps: 15 },
                { id: 2, name: 'Push-ups', sets: 3, reps: 12 },
                { id: 3, name: 'Squats', sets: 3, reps: 20 },
                { id: 4, name: 'Mountain Climbers', sets: 3, reps: 30 },
                { id: 5, name: 'Plank', sets: 3, reps: 45 }
            ];
        case 'Beginner Full Body':
            return [
                { id: 6, name: 'Wall Push-ups', sets: 3, reps: 10 },
                { id: 7, name: 'Assisted Squats', sets: 3, reps: 15 },
                { id: 8, name: 'Knee Plank', sets: 3, reps: 30 },
                { id: 9, name: 'Marching in Place', sets: 3, reps: 60 }
            ];
        case 'Advanced Power':
            return [
                { id: 10, name: 'Power Clean', sets: 5, reps: 3 },
                { id: 11, name: 'Snatch', sets: 4, reps: 2 },
                { id: 12, name: 'Box Jumps', sets: 4, reps: 8 },
                { id: 13, name: 'Push Press', sets: 4, reps: 5 },
                { id: 14, name: 'Kettlebell Swings', sets: 3, reps: 15 }
            ];
        default:
            return [
                { id: 15, name: 'Push-ups', sets: 3, reps: 10 },
                { id: 16, name: 'Squats', sets: 3, reps: 15 },
                { id: 17, name: 'Plank', sets: 3, reps: 30 }
            ];
    }
}

function onExerciseSelected(programId, dateString) {
    const exerciseSelect = document.getElementById('exerciseSelect');
    const exerciseId = exerciseSelect.value;
    
    if (!exerciseId) {
        document.getElementById('exerciseTrackingSection').style.display = 'none';
        return;
    }
    
    const program = workoutPrograms.find(p => p.id == programId);
    const programExercises = getProgramExercises(program.name);
    const selectedExercise = programExercises.find(e => e.id == parseInt(exerciseId));
    
    if (selectedExercise) {
        showExerciseTracking(selectedExercise, programId, dateString);
    }
}

function showExerciseTracking(exercise, programId, dateString) {
    const trackingSection = document.getElementById('exerciseTrackingSection');
    
    trackingSection.innerHTML = `
        <div class="exercise-tracking-card">
            <h4>${exercise.name}</h4>
            <p>Target: ${exercise.sets} sets × ${exercise.reps} reps</p>
            
            <div class="sets-container">
                ${generateSetInputs(exercise.sets, exercise.reps)}
            </div>
            
            <div class="tracking-actions">
                <button class="btn btn-primary" onclick="saveExerciseProgress('${exercise.id}', '${programId}', '${dateString}')">
                    Save Progress
                </button>
                <button class="btn btn-secondary" onclick="resetExerciseTracking()">
                    Reset
                </button>
            </div>
        </div>
    `;
    
    trackingSection.style.display = 'block';
}

function generateSetInputs(sets, targetReps) {
    let html = '';
    for (let i = 1; i <= sets; i++) {
        html += `
            <div class="set-input-group">
                <h5>Set ${i}</h5>
                <div class="set-inputs">
                    <div class="input-group">
                        <label>Reps:</label>
                        <input type="number" id="reps_${i}" class="set-input" placeholder="${targetReps}" min="0" max="100">
                    </div>
                    <div class="input-group">
                        <label>Weight (lbs):</label>
                        <input type="number" id="weight_${i}" class="set-input" placeholder="0" min="0" max="500">
                    </div>
                </div>
            </div>
        `;
    }
    return html;
}

function saveExerciseProgress(exerciseId, programId, dateString) {
    const sets = getProgramExercises(selectedProgram).find(e => e.id == parseInt(exerciseId)).sets;
    const progress = {
        exerciseId: exerciseId,
        programId: programId,
        date: dateString,
        sets: []
    };
    
    for (let i = 1; i <= sets; i++) {
        const reps = document.getElementById(`reps_${i}`).value;
        const weight = document.getElementById(`weight_${i}`).value;
        
        if (reps || weight) {
            progress.sets.push({
                setNumber: i,
                reps: parseInt(reps) || 0,
                weight: parseInt(weight) || 0,
                completed: true
            });
        }
    }
    
    // Save to localStorage for now (in a real app, this would go to the database)
    const key = `exercise_progress_${dateString}_${exerciseId}`;
    localStorage.setItem(key, JSON.stringify(progress));
    
    showSuccess('Exercise progress saved successfully!');
    
    // Update the save button to show it's saved
    const saveBtn = document.querySelector('.tracking-actions .btn-primary');
    saveBtn.textContent = 'Saved ✓';
    saveBtn.classList.add('saved');
    saveBtn.disabled = true;
}

function resetExerciseTracking() {
    const inputs = document.querySelectorAll('.set-input');
    inputs.forEach(input => {
        input.value = '';
    });
    
    const saveBtn = document.querySelector('.tracking-actions .btn-primary');
    saveBtn.textContent = 'Save Progress';
    saveBtn.classList.remove('saved');
    saveBtn.disabled = false;
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
        const exerciseCard = document.querySelector(`[data-exercise-id="${exerciseId}"]`);
        const inputs = exerciseCard.querySelectorAll('input[data-set]');
        
        inputs.forEach(input => {
            const set = input.getAttribute('data-set');
            const field = input.getAttribute('data-field');
            const value = input.value;
            
            if (set && field) {
                if (!trackingData[set]) trackingData[set] = {};
                trackingData[set][field] = value;
            }
        });
        
        // Save to database
        const { error } = await supabase
            .from('user_workouts')
            .update({
                workout_tracking: {
                    ...trackingData,
                    [exerciseId]: {
                        date: dateString,
                        sets: trackingData
                    }
                },
                last_updated: new Date().toISOString()
            })
            .eq('workout_program_id', programId)
            .eq('user_id', 'default_user');
        
        if (error) throw error;
        
        // Also save to localStorage as backup
        const key = `tracking_${exerciseId}_${dateString}`;
        localStorage.setItem(key, JSON.stringify(trackingData));
        
        showSuccess('Progress saved successfully!');
        
        // Update the save button to show saved state
        const saveBtn = exerciseCard.querySelector('.save-tracking-btn');
        if (saveBtn) {
            saveBtn.textContent = 'Saved!';
            saveBtn.classList.add('saved');
            setTimeout(() => {
                saveBtn.textContent = 'Save Progress';
                saveBtn.classList.remove('saved');
            }, 2000);
        }
        
    } catch (error) {
        console.error('Error saving tracking data:', error);
        showError('Failed to save progress');
    }
}

// Save all progress for the current workout
async function saveAllProgress() {
    try {
        const exerciseCards = document.querySelectorAll('.exercise-tracking-card');
        let savedCount = 0;
        
        for (const card of exerciseCards) {
            const exerciseId = card.getAttribute('data-exercise-id');
            const inputs = card.querySelectorAll('input[data-set]');
            const trackingData = {};
            
            inputs.forEach(input => {
                const set = input.getAttribute('data-set');
                const field = input.getAttribute('data-field');
                const value = input.value;
                
                if (set && field && value) {
                    if (!trackingData[set]) trackingData[set] = {};
                    trackingData[set][field] = value;
                }
            });
            
            if (Object.keys(trackingData).length > 0) {
                // Save individual exercise data
                const key = `tracking_${exerciseId}_${currentParams.dateString}`;
                localStorage.setItem(key, JSON.stringify(trackingData));
                savedCount++;
            }
        }
        
        if (savedCount > 0) {
            showSuccess(`Saved progress for ${savedCount} exercises!`);
        } else {
            showError('No data to save. Please fill in some exercise details.');
        }
        
    } catch (error) {
        console.error('Error saving all progress:', error);
        showError('Failed to save progress');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.remove();
    }
} // Force redeploy - Mon Jul 28 14:45:08 CEST 2025
