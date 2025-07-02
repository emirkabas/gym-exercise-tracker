// Gym Exercise Tracker - Netlify App JavaScript

// Supabase configuration
const SUPABASE_URL = 'https://sbrahbuoulzroqlzfdfz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicmFoYnVvdWx6cm9xbHpmZGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NTc5MTYsImV4cCI6MjA2NjUzMzkxNn0.Jj_3PxN0IaumlMd-G3GfzkQ0nh4UKduUHDvS7c9yC2s';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// App state
let currentPage = 'home';
let exercises = [];
let muscleGroups = [];
let workoutPrograms = [];
let userWorkouts = [];

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

function navigateToPage(page) {
    currentPage = page;
    updateActiveNavLink();
    loadPage(page);
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
function loadPage(page) {
    const mainContent = document.querySelector('.main-content');
    
    switch(page) {
        case 'home':
            loadHomePage(mainContent);
            break;
        case 'exercises':
            loadExercisesPage(mainContent);
            break;
        case 'muscle-groups':
            loadMuscleGroupsPage(mainContent);
            break;
        case 'workout-programs':
            loadWorkoutProgramsPage(mainContent);
            break;
        case 'workout-calendar':
            loadWorkoutCalendarPage(mainContent);
            break;
        default:
            loadHomePage(mainContent);
    }
}

// Home page
function loadHomePage(container) {
    container.innerHTML = `
        <section class="hero">
            <div class="overlay">
                <h1>The Workout</h1>
                <p>Strength, flexibility, and results—powered by science.</p>
            </div>
        </section>
        
        <div class="container">
            <div class="card-grid">
                <div class="card">
                    <h3>Exercises</h3>
                    <p>Browse our comprehensive library of exercises with detailed instructions, difficulty levels, and equipment requirements.</p>
                    <a href="#" class="btn" onclick="navigateToPage('exercises')">View Exercises</a>
                </div>
                
                <div class="card">
                    <h3>Muscle Groups</h3>
                    <p>Explore exercises organized by muscle groups to target specific areas of your body.</p>
                    <a href="#" class="btn" onclick="navigateToPage('muscle-groups')">View Muscle Groups</a>
                </div>
                
                <div class="card">
                    <h3>Workout Programs</h3>
                    <p>Discover structured workout programs designed for different fitness levels and goals.</p>
                    <a href="#" class="btn" onclick="navigateToPage('workout-programs')">View Programs</a>
                </div>
                
                <div class="card">
                    <h3>Workout Calendar</h3>
                    <p>Track your workout progress and maintain consistency with our calendar feature.</p>
                    <a href="#" class="btn" onclick="navigateToPage('workout-calendar')">View Calendar</a>
                </div>
            </div>
        </div>
    `;
}

// Exercises page
function loadExercisesPage(container) {
    container.innerHTML = `
        <div class="container">
            <h1 class="page-title">Exercises</h1>
            
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
            <h1 class="page-title">Muscle Groups</h1>
            
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
            <h1 class="page-title">Workout Programs</h1>
            
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

// Workout Calendar page
function loadWorkoutCalendarPage(container) {
    container.innerHTML = `
        <div class="container">
            <h1 class="page-title">Workout Calendar</h1>
            
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
        <div class="card">
            <h3>${exercise.name}</h3>
            <p><strong>Muscle Group:</strong> ${exercise.muscle_group_name}</p>
            <p><strong>Difficulty:</strong> ${exercise.difficulty_level || 'Not specified'}</p>
            <p><strong>Equipment:</strong> ${exercise.equipment || 'None required'}</p>
            ${exercise.description ? `<p>${exercise.description}</p>` : ''}
            <button class="btn btn-secondary" onclick="showExerciseDetails(${exercise.id})">View Details</button>
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
            <button class="btn btn-secondary" onclick="showMuscleGroupExercises(${group.id})">View Exercises</button>
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
                    <div class="card">
                        <h3>${exercise.name}</h3>
                        <p><strong>Difficulty:</strong> ${exercise.difficulty_level || 'Not specified'}</p>
                        <p><strong>Equipment:</strong> ${exercise.equipment || 'None required'}</p>
                        ${exercise.description ? `<p>${exercise.description}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function showWorkoutProgramDetails(programId) {
    const program = workoutPrograms.find(p => p.id === programId);
    if (!program) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal(this)">&times;</span>
            <h2>${program.name}</h2>
            <p><strong>Difficulty:</strong> ${program.difficulty_level || 'Not specified'}</p>
            <p><strong>Duration:</strong> ${program.duration_weeks || 'Not specified'} weeks</p>
            <p>${program.description || 'No description available.'}</p>
            <p>Program details and exercises will be loaded here.</p>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
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
    alert(`Selected date: ${dateString}\nThis would show workout details for this date.`);
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

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.remove();
    }
} 