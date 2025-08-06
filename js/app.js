// Gym Exercise Tracker - Netlify App JavaScript
// Version: 2025-07-29 - Critical Fixes & Performance Optimizations

// Supabase configuration
const SUPABASE_URL = 'https://sbrahbuoulzroqlzfdfz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicmFoYnVvdWx6cm9xbHpmZGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NTc5MTYsImV4cCI6MjA2NjUzMzkxNn0.Jj_3PxN0IaumlMd-G3GfzkQ0nh4UKduUHDvS7c9yC2s';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Data caching system
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedData(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

function setCachedData(key, data) {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
}

function clearCache() {
    cache.clear();
}

function clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            cache.delete(key);
        }
    }
}

// Clear expired cache every minute
setInterval(clearExpiredCache, 60 * 1000);

// Offline detection and handling
let isOnline = navigator.onLine;

function updateOnlineStatus() {
    isOnline = navigator.onLine;
    if (isOnline) {
        hideOfflineMessage();
        // Retry failed operations when back online
        retryFailedOperations();
    } else {
        showOfflineMessage();
    }
}

function showOfflineMessage() {
    let offlineBanner = document.getElementById('offline-banner');
    if (!offlineBanner) {
        offlineBanner = document.createElement('div');
        offlineBanner.id = 'offline-banner';
        offlineBanner.className = 'offline-banner';
        offlineBanner.innerHTML = `
            <div class="offline-content">
                <span class="offline-icon">📡</span>
                <span>You're offline. Some features may be limited.</span>
            </div>
        `;
        document.body.appendChild(offlineBanner);
    }
    offlineBanner.style.display = 'block';
}

function hideOfflineMessage() {
    const offlineBanner = document.getElementById('offline-banner');
    if (offlineBanner) {
        offlineBanner.style.display = 'none';
    }
}

// Failed operations queue for retry
const failedOperations = [];

function addFailedOperation(operation) {
    failedOperations.push(operation);
}

async function retryFailedOperations() {
    if (failedOperations.length === 0) return;
    
    showLoading('Syncing data...');
    
    const operations = [...failedOperations];
    failedOperations.length = 0; // Clear the array
    
    for (const operation of operations) {
        try {
            await operation();
        } catch (error) {
            // Re-add to queue if it still fails
            failedOperations.push(operation);
        }
    }
    
    hideLoading();
}

// Listen for online/offline events
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

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
let calendarView = 'day'; // 'day', 'week', 'month'
let showWorkoutToday = false;
let selectedProgram = '';
let scheduledWorkouts = new Map(); // Store scheduled workouts (optimized)

// Input validation and sanitization
const validators = {
    // Sanitize HTML to prevent XSS
    sanitizeHtml: (str) => {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
    
    // Validate email format
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Validate number input
    isValidNumber: (value, min = 0, max = 9999) => {
        const num = parseFloat(value);
        return !isNaN(num) && num >= min && num <= max;
    },
    
    // Validate date format
    isValidDate: (dateString) => {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    },
    
    // Validate required fields
    isRequired: (value) => {
        return value !== null && value !== undefined && value.toString().trim() !== '';
    },
    
    // Validate string length
    isValidLength: (str, min = 1, max = 255) => {
        return str && str.length >= min && str.length <= max;
    }
};

// Data validation schemas
const schemas = {
    exercise: {
        name: (value) => validators.isRequired(value) && validators.isValidLength(value, 1, 100),
        description: (value) => !value || validators.isValidLength(value, 0, 1000),
        muscle_group_id: (value) => validators.isRequired(value) && validators.isValidNumber(value, 1),
        difficulty_level: (value) => ['beginner', 'intermediate', 'advanced'].includes(value),
        sets: (value) => validators.isValidNumber(value, 1, 20),
        reps: (value) => validators.isValidNumber(value, 1, 100)
    },
    
    workoutProgram: {
        name: (value) => validators.isRequired(value) && validators.isValidLength(value, 1, 100),
        description: (value) => !value || validators.isValidLength(value, 0, 500),
        difficulty_level: (value) => ['beginner', 'intermediate', 'advanced'].includes(value),
        duration_weeks: (value) => validators.isValidNumber(value, 1, 52)
    }
};

// Validate data against schema
function validateData(data, schema) {
    const errors = [];
    
    for (const [field, validator] of Object.entries(schema)) {
        if (!validator(data[field])) {
            errors.push(`Invalid ${field}: ${data[field]}`);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    showLoading('Initializing app...');
    initializeApp();
});

// Loading state management
let isLoading = false;
const loadingStates = new Map();

function showLoading(message = 'Loading...', id = 'global') {
    isLoading = true;
    loadingStates.set(id, true);
    
    // Create or update loading overlay
    let loadingOverlay = document.getElementById('loading-overlay');
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p class="loading-message">${message}</p>
            </div>
        `;
        document.body.appendChild(loadingOverlay);
    } else {
        loadingOverlay.querySelector('.loading-message').textContent = message;
    }
    
    loadingOverlay.style.display = 'flex';
}

function hideLoading(id = 'global') {
    loadingStates.delete(id);
    if (loadingStates.size === 0) {
        isLoading = false;
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
}

function showPageLoading(container, message = 'Loading...') {
    if (container) {
        container.innerHTML = `
            <div class="page-loading">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
    }
}

function initializeApp() {
    try {
        // Show version in console for debugging
        console.log('🚀 Gym Exercise Tracker v2025-07-29 - Critical Fixes & Performance Optimizations');
        
    setupNavigation();
    setupDeleteAllButton();
    setupDeleteAllProgramsButton();
    loadPage(currentPage);
        loadInitialData().finally(() => {
            hideLoading();
        });
    } catch (error) {
        handleError('Failed to initialize app', error);
        hideLoading();
    }
}

function setupDeleteAllButton() {
    const deleteButton = document.getElementById('delete-all-exercises');
    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            const confirmation = confirm('Are you sure you want to delete all exercises? This action cannot be undone.');
            if (confirmation) {
                showLoading('Deleting all exercises...');
                try {
                    const response = await fetch('/api/exercises', {
                        method: 'DELETE',
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to delete exercises.');
                    }

                    const result = await response.json();
                    showSuccess(result.message);
                    
                    // Clear cache and reload data
                    clearCache();
                    await loadInitialData();
                    
                    // Reload the current page to reflect the changes
                    loadPage(currentPage, currentParams);

                } catch (error) {
                    handleError('Failed to delete exercises', error);
                } finally {
                    hideLoading();
                }
            }
        });
    }
}

function setupDeleteAllProgramsButton() {
    const deleteButton = document.getElementById('delete-all-programs');
    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            const confirmation = confirm('Are you sure you want to delete all workout programs? This action cannot be undone.');
            if (confirmation) {
                showLoading('Deleting all workout programs...');
                try {
                    const response = await fetch('/api/workout-programs', {
                        method: 'DELETE',
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to delete workout programs.');
                    }

                    const result = await response.json();
                    showSuccess(result.message);
                    
                    // Clear relevant localStorage items
                    localStorage.removeItem('workoutPrograms');
                    localStorage.removeItem('deletedPrograms');
                    localStorage.removeItem('scheduledWorkouts');

                    // Clear cache and reload data
                    clearCache();
                    await loadInitialData();
                    
                    // Reload the current page to reflect the changes
                    loadPage(currentPage, currentParams);

                } catch (error) {
                    handleError('Failed to delete workout programs', error);
                } finally {
                    hideLoading();
                }
            }
        });
    }
}

// Error handling system
function handleError(message, error = null, context = '') {
    const errorInfo = {
        message,
        error: error?.message || error,
        stack: error?.stack,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
    };
    
    // Log error for debugging (only in development)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.error('Error:', errorInfo);
    }
    
    // Show user-friendly error message
    showError(`Something went wrong: ${message}. Please try again or refresh the page.`);
    
    // Could send to error tracking service here
    // sendErrorToService(errorInfo);
}

// Wrapper for async operations with error handling
async function safeAsync(operation, errorMessage = 'Operation failed') {
    try {
        return await operation();
    } catch (error) {
        handleError(errorMessage, error);
        throw error;
    }
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
        case 'progress':
            loadProgressPage(mainContent);
            break;
        default:
            loadExercisesPage(mainContent);
    }
}



// Exercises page
function loadExercisesPage(container) {
    container.innerHTML = `
            <div class="page-header">
            <h1>Exercises</h1>
            <div>
                <button class="btn btn-primary" onclick="showCreateExerciseModal()">Add New Exercise</button>
                <p>Browse and search exercises by muscle group</p>
                <button id="delete-all-exercises" class="btn btn-danger">Delete All Exercises</button>
            </div>
            </div>
            
        <div class="content-layout">
            <div class="sidebar">
                <div class="search-section">
                    <input type="text" id="exerciseSearch" class="search-input" placeholder="Search exercises...">
            </div>
            
                <div class="filter-section">
                    <div class="filter-group">
                        <div class="filter-header" onclick="toggleFilter('muscleGroup')">
                            <span>MUSCLE GROUP</span>
                            <span class="filter-arrow">▼</span>
                        </div>
                        <div class="filter-options" id="muscleGroupFilter">
                            <label class="filter-option">
                                <input type="checkbox" value=""> All Groups
                                <span class="count">(0)</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="filter-group">
                        <div class="filter-header" onclick="toggleFilter('difficulty')">
                            <span>DIFFICULTY</span>
                            <span class="filter-arrow">▼</span>
                        </div>
                        <div class="filter-options" id="difficultyFilter">
                            <label class="filter-option">
                                <input type="checkbox" value="Beginner"> Beginner
                                <span class="count">(0)</span>
                            </label>
                            <label class="filter-option">
                                <input type="checkbox" value="Intermediate"> Intermediate
                                <span class="count">(0)</span>
                            </label>
                            <label class="filter-option">
                                <input type="checkbox" value="Advanced"> Advanced
                                <span class="count">(0)</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="filter-group">
                        <div class="filter-header" onclick="toggleFilter('equipment')">
                            <span>EQUIPMENT</span>
                            <span class="filter-arrow">▼</span>
                        </div>
                        <div class="filter-options" id="equipmentFilter">
                            <label class="filter-option">
                                <input type="checkbox" value="None"> No Equipment
                                <span class="count">(0)</span>
                            </label>
                            <label class="filter-option">
                                <input type="checkbox" value="Dumbbells"> Dumbbells
                                <span class="count">(0)</span>
                            </label>
                            <label class="filter-option">
                                <input type="checkbox" value="Barbell"> Barbell
                                <span class="count">(0)</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="main-content">
                <div id="exercisesList" class="exercises-grid">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading exercises...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    setupExerciseFilters();
    loadExercises();
}

// Muscle Groups page
function loadMuscleGroupsPage(container) {
    container.innerHTML = `
            <div class="page-header">
            <h1>Muscle Groups</h1>
            <p>Browse exercises by muscle group</p>
            </div>
            
        <div class="content-layout">
            <div class="sidebar">
                <div class="search-section">
                    <input type="text" id="muscleGroupSearch" class="search-input" placeholder="Search muscle groups...">
                </div>
                
                <div class="filter-section">
                    <div class="filter-group">
                        <div class="filter-header" onclick="toggleFilter('exerciseCount')">
                            <span>EXERCISE COUNT</span>
                            <span class="filter-arrow">▼</span>
                        </div>
                        <div class="filter-options" id="exerciseCountFilter">
                            <label class="filter-option">
                                <input type="checkbox" value="1-10"> 1-10 exercises
                                <span class="count">(0)</span>
                            </label>
                            <label class="filter-option">
                                <input type="checkbox" value="11-20"> 11-20 exercises
                                <span class="count">(0)</span>
                            </label>
                            <label class="filter-option">
                                <input type="checkbox" value="21+"> 21+ exercises
                                <span class="count">(0)</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="main-content">
                <div id="muscleGroupsList" class="muscle-groups-grid">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading muscle groups...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    setupMuscleGroupFilters();
    loadMuscleGroups();
}

// Workout Programs page
function loadWorkoutProgramsPage(container) {
    container.innerHTML = `
            <div class="page-header">
            <h1>Workout Programs</h1>
            <div>
                <button class="btn btn-primary" onclick="showCreateProgramModal()">
                    <span>+ Create New Program</span>
                </button>
                <button id="delete-all-programs" class="btn btn-danger">Delete All Programs</button>
            </div>
            </div>
            
        <div class="content-layout">
            <div class="sidebar">
                <div class="search-section">
                    <input type="text" id="programSearch" class="search-input" placeholder="Search programs...">
                </div>
                
                <div class="filter-section">
                    <div class="filter-group">
                        <div class="filter-header" onclick="toggleFilter('difficulty')">
                            <span>DIFFICULTY</span>
                            <span class="filter-arrow">▼</span>
                        </div>
                        <div class="filter-options" id="difficultyFilter">
                            <label class="filter-option">
                                <input type="checkbox" value="Beginner"> Beginner
                                <span class="count">(0)</span>
                            </label>
                            <label class="filter-option">
                                <input type="checkbox" value="Intermediate"> Intermediate
                                <span class="count">(0)</span>
                            </label>
                            <label class="filter-option">
                                <input type="checkbox" value="Advanced"> Advanced
                                <span class="count">(0)</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="filter-group">
                        <div class="filter-header" onclick="toggleFilter('duration')">
                            <span>DURATION</span>
                            <span class="filter-arrow">▼</span>
                        </div>
                        <div class="filter-options" id="durationFilter">
                            <label class="filter-option">
                                <input type="checkbox" value="1-4"> 1-4 weeks
                                <span class="count">(0)</span>
                            </label>
                            <label class="filter-option">
                                <input type="checkbox" value="5-8"> 5-8 weeks
                                <span class="count">(0)</span>
                            </label>
                            <label class="filter-option">
                                <input type="checkbox" value="9-12"> 9-12 weeks
                                <span class="count">(0)</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="main-content">
                <div id="workoutProgramsList" class="programs-grid">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading workout programs...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Setup search and filters
    setupProgramFilters();
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
        <div class="calendar-page">
            <div class="calendar-header-main">
                <div class="calendar-title">
                    <h1>Schedule</h1>
            </div>
            
                <div class="calendar-controls">
                    <div class="calendar-nav">
                        <button class="btn btn-outline" onclick="previousPeriod()">
                            <span>&lt;</span>
                        </button>
                        <button class="btn btn-outline" onclick="goToToday()">
                            Today
                        </button>
                        <button class="btn btn-outline" onclick="nextPeriod()">
                            <span>&gt;</span>
                        </button>
                </div>
                
                    <div class="calendar-view-toggle">
                        <button class="view-toggle-btn" onclick="switchCalendarView('day')">Day</button>
                        <button class="view-toggle-btn" onclick="switchCalendarView('week')">Week</button>
                        <button class="view-toggle-btn active" onclick="switchCalendarView('month')">Month</button>
                    </div>
                </div>
            </div>
            
            <div id="calendarContent" class="calendar-content">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading calendar...</p>
                </div>
            </div>
        </div>
    `;
    
    generateCalendar();
}

// Progress page
    function loadProgressPage(container) {
        container.innerHTML = `
            <div class="progress-page">
                <div class="page-header">
                    <h1>WORKOUT PLANNER</h1>
                    <p>Track your progress for any date</p>
                </div>
                
                <div class="progress-content">
                    <div class="date-selector">
                        <label for="progressDate">Select Date:</label>
                        <input type="date" id="progressDate" onchange="loadProgressForDate(this.value)">
                    </div>
                    
                    <div id="progressWorkout" class="progress-workout" style="display: none;">
                        <div class="progress-table">
                            <div class="table-header">
                                <div class="exercise-header">EXERCISE</div>
                                <div class="set-headers">
                                    <div class="set-header set-1">SET 1</div>
                                    <div class="set-header set-2">SET 2</div>
                                    <div class="set-header set-3">SET 3</div>
                                    <div class="set-header set-4">SET 4</div>
                                    <div class="set-header set-5">SET 5</div>
                                </div>
                            </div>
                            <div class="table-subheader">
                                <div class="exercise-subheader"></div>
                                <div class="set-subheaders">
                                    <div class="set-subheader">WEIGHT</div>
                                    <div class="set-subheader">REPS</div>
                                    <div class="set-subheader">WEIGHT</div>
                                    <div class="set-subheader">REPS</div>
                                    <div class="set-subheader">WEIGHT</div>
                                    <div class="set-subheader">REPS</div>
                                    <div class="set-subheader">WEIGHT</div>
                                    <div class="set-subheader">REPS</div>
                                    <div class="set-subheader">WEIGHT</div>
                                    <div class="set-subheader">REPS</div>
                                </div>
                            </div>
                            <div id="progressTableBody" class="table-body">
                                <!-- Exercise rows will be populated here -->
                            </div>
                        </div>
                    </div>
                    
                    <div id="noProgressMessage" class="no-progress-message" style="display: none;">
                        <p>No workout data found for the selected date.</p>
                    </div>
                </div>
            </div>
        `;
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('progressDate').value = today;
    loadProgressForDate(today);
}

// Load progress data for a specific date
async function loadProgressForDate(dateString) {
    try {
        const progressWorkout = document.getElementById('progressWorkout');
        const noProgressMessage = document.getElementById('noProgressMessage');
        const tableBody = document.getElementById('progressTableBody');
        
        // Get workout data for the selected date
        const workoutData = await getWorkoutDataForDate(dateString);
        
        if (workoutData && workoutData.exercises && workoutData.exercises.length > 0) {
            console.log('Found workout data:', workoutData);
            // Show workout data
            progressWorkout.style.display = 'block';
            noProgressMessage.style.display = 'none';
            
            // Generate table rows
            tableBody.innerHTML = workoutData.exercises.map(exercise => {
                console.log('Rendering exercise:', exercise);
                return `
                    <div class="exercise-row">
                        <div class="exercise-name">${exercise.name}</div>
                        <div class="exercise-sets">
                            ${Array.from({length: 5}, (_, i) => {
                                const set = exercise.sets[i] || {};
                                console.log(`Set ${i + 1}:`, set);
                                return `
                                    <div class="set-data">
                                        <div class="weight-data">${set.weight || ''}</div>
                                        <div class="reps-data">${set.reps || ''}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            // Show no data message
            progressWorkout.style.display = 'none';
            noProgressMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading progress:', error);
        document.getElementById('noProgressMessage').style.display = 'block';
        document.getElementById('progressWorkout').style.display = 'none';
    }
}

// Get workout data for a specific date
async function getWorkoutDataForDate(dateString) {
    try {
        console.log('Loading progress for date:', dateString);
        
        // Check for scheduled workout first
        const scheduledWorkout = scheduledWorkouts[dateString];
        let programName = 'General Workout';
        let exercises = [];
        
        if (scheduledWorkout) {
            programName = scheduledWorkout.name;
            // Get exercises for this program
            exercises = getProgramExercises(scheduledWorkout.id);
        }
        
        // Check for saved exercise tracking data
        const trackingKey = `exercise_tracking_${dateString}`;
        const savedTracking = localStorage.getItem(trackingKey);
        
        if (savedTracking) {
            console.log('Found saved tracking data:', savedTracking);
            const trackingData = JSON.parse(savedTracking);
            
            // Convert tracking data to progress format
            const progressExercises = [];
            
            for (const [exerciseId, data] of Object.entries(trackingData)) {
                console.log('Processing exercise:', exerciseId, data);
                
                // Find exercise name from the exercises list
                const exercise = exercises.find(e => e.id == exerciseId) || 
                               exercises.find(e => e.name === data.exerciseName);
                
                if (exercise) {
                    progressExercises.push({
                        id: exerciseId,
                        name: exercise.name,
                        sets: data.sets || []
                    });
                } else {
                    // Fallback if exercise not found in program
                    progressExercises.push({
                        id: exerciseId,
                        name: data.exerciseName || 'Unknown Exercise',
                        sets: data.sets || []
                    });
                }
            }
            
            return {
                date: dateString,
                programName: programName,
                duration: 'Not specified',
                exercises: progressExercises
            };
        }
        
        // If no tracking data but we have a scheduled workout, show the program exercises
        if (scheduledWorkout && exercises.length > 0) {
            return {
                date: dateString,
                programName: programName,
                duration: 'Not specified',
                exercises: exercises.map(exercise => ({
                    id: exercise.id,
                    name: exercise.name,
                    sets: Array.from({length: exercise.sets}, (_, i) => ({
                        setNumber: i + 1,
                        weight: '',
                        reps: ''
                    }))
                }))
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error getting workout data:', error);
        return null;
    }
}

// Generate workout display for selected date in Week/Month views
function generateSelectedDateWorkout() {
    const dateString = selectedDate.toISOString().split('T')[0];
    const workout = scheduledWorkouts[dateString];
    
    if (!workout) {
        return `
            <div class="selected-date-workout">
                <h3>${selectedDate.toLocaleDateString()}</h3>
                <p>No workout scheduled for this date.</p>
                <button class="btn btn-primary" onclick="showProgramSelectionModal()">
                    Add Workout
                </button>
            </div>
        `;
    }
    
    // Get exercises for this workout
    const programExercises = getProgramExercises(workout.id);
    
    return `
        <div class="selected-date-workout">
            <h3>${selectedDate.toLocaleDateString()} - ${workout.name}</h3>
            <div class="selected-workout-exercises">
                ${programExercises.map(exercise => `
                    <div class="selected-exercise">
                        <h4>${exercise.name}</h4>
                        <p>${exercise.sets} sets × ${exercise.reps} reps</p>
                    </div>
                `).join('')}
            </div>
            <button class="btn btn-primary" onclick="showWorkoutDetails('${dateString}')">
                View Details
            </button>
        </div>
    `;
}

// Data loading functions
async function loadInitialData() {
    try {
        showLoading('Loading app data...');
        
        await Promise.all([
            safeAsync(() => loadExercises(), 'Failed to load exercises'),
            safeAsync(() => loadMuscleGroups(), 'Failed to load muscle groups'),
            safeAsync(() => loadWorkoutPrograms(), 'Failed to load workout programs'),
            safeAsync(() => loadUserWorkouts(), 'Failed to load user workouts')
        ]);
        
        // Load scheduled workouts from localStorage
        loadScheduledWorkouts();
        
    } catch (error) {
        handleError('Failed to load initial data', error);
    }
}

async function loadExercises() {
    try {
        // Check cache first
        const cached = getCachedData('exercises');
        if (cached) {
            exercises = cached;
            if (currentPage === 'exercises') {
                displayExercises(exercises);
            }
            return;
        }
        
        const { data, error } = await supabase
            .from('exercises')
            .select('*, muscle_groups(name)')
            .order('name');
        
        if (error) throw error;
        
        exercises = data.map(e => ({
            ...e,
            muscle_group_name: e.muscle_groups?.name || ''
        }));
        
        // Cache the data
        setCachedData('exercises', exercises);
        
        if (currentPage === 'exercises') {
            displayExercises(exercises);
        }
    } catch (error) {
        handleError('Failed to load exercises', error);
        exercises = [];
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
        
        // Load database programs
        const databasePrograms = data || [];
        
        // Load user-created programs from localStorage
        const userPrograms = localStorage.getItem('workoutPrograms');
        let localStoragePrograms = [];
        
        if (userPrograms) {
            try {
                localStoragePrograms = JSON.parse(userPrograms);
            } catch (e) {
                console.error('Error parsing user programs:', e);
                localStorage.removeItem('workoutPrograms'); // Clear corrupted data
            }
        }
        
        // Load deleted programs list from localStorage
        const deletedPrograms = localStorage.getItem('deletedPrograms');
        let deletedProgramIds = [];
        
        if (deletedPrograms) {
            try {
                deletedProgramIds = JSON.parse(deletedPrograms);
            } catch (e) {
                console.error('Error parsing deleted programs:', e);
                localStorage.removeItem('deletedPrograms');
            }
        }
        
        // Filter out deleted programs from database
        const activeDatabasePrograms = databasePrograms.filter(program => 
            !deletedProgramIds.includes(program.id)
        );
        
        // Combine active database programs with localStorage programs
        workoutPrograms = [...activeDatabasePrograms, ...localStoragePrograms];
        
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
    
    // Update filter counts after displaying
    updateFilterCounts();
}

function displayMuscleGroups(groups) {
    const container = document.getElementById('muscleGroupsList');
    
    if (!groups || groups.length === 0) {
        container.innerHTML = '<p class="loading">No muscle groups found.</p>';
        return;
    }
    
    container.innerHTML = groups.map(group => {
        const exerciseCount = exercises.filter(e => e.muscle_group_id === group.id).length;
        return `
        <div class="card">
            <h3>${group.name}</h3>
            <p>${group.description || 'No description available.'}</p>
                <p><strong>Exercises:</strong> ${exerciseCount} exercises</p>
            <button class="btn btn-secondary" onclick="navigateToPage('muscle-group-exercises', { muscleGroupId: ${group.id} })">View Exercises</button>
        </div>
        `;
    }).join('');
    
    // Update filter counts after displaying
    updateMuscleGroupFilterCounts();
}

function displayWorkoutPrograms(programs) {
    const container = document.getElementById('workoutProgramsList');
    
    if (!programs || programs.length === 0) {
        container.innerHTML = '<p class="loading">No workout programs found.</p>';
        return;
    }
    
    container.innerHTML = programs.map(program => {
        // Get exercises for this program
        const programExercises = getProgramExercises(program.id);
        
        return `
            <div class="card workout-program-card">
                <div class="program-header">
            <h3>${program.name}</h3>
                    <button class="delete-btn" onclick="deleteWorkoutProgram(${program.id}, '${program.name}')" title="Delete Program">
                        <span>&times;</span>
                    </button>
                </div>
            <p><strong>Difficulty:</strong> ${program.difficulty_level || 'Not specified'}</p>
            <p><strong>Duration:</strong> ${program.duration_weeks || 'Not specified'} weeks</p>
            <p>${program.description || 'No description available.'}</p>
                <p><strong>Exercises:</strong> ${programExercises.length} exercises</p>
                
                <div class="program-actions">
            <button class="btn btn-secondary" onclick="showWorkoutProgramDetails(${program.id})">View Details</button>
                    <button class="btn btn-outline" onclick="editWorkoutProgram(${program.id})">Edit</button>
                    <button class="btn btn-primary" onclick="showAddExerciseModal(${program.id})">Add Exercise</button>
        </div>
            </div>
        `;
    }).join('');
    
    // Update filter counts after displaying
    updateProgramFilterCounts();
}

// Filter functions
function setupExerciseFilters() {
    const searchInput = document.getElementById('exerciseSearch');
    if (searchInput) {
    searchInput.addEventListener('input', filterExercises);
    }
    
    // Setup checkbox filters
    const checkboxes = document.querySelectorAll('#muscleGroupFilter input, #difficultyFilter input, #equipmentFilter input');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', filterExercises);
    });
    
    updateFilterCounts();
}

function setupProgramFilters() {
    const searchInput = document.getElementById('programSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterPrograms);
    }
    
    // Setup checkbox filters
    const checkboxes = document.querySelectorAll('#difficultyFilter input, #durationFilter input');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', filterPrograms);
    });
    
    updateProgramFilterCounts();
}

function setupMuscleGroupFilters() {
    const searchInput = document.getElementById('muscleGroupSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterMuscleGroups);
    }
    
    // Setup checkbox filters
    const checkboxes = document.querySelectorAll('#exerciseCountFilter input');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', filterMuscleGroups);
    });
    
    updateMuscleGroupFilterCounts();
}

function toggleFilter(filterType) {
    const filterOptions = document.getElementById(filterType + 'Filter');
    const arrow = event.target.querySelector('.filter-arrow') || event.target.parentElement.querySelector('.filter-arrow');
    
    if (filterOptions) {
        const isVisible = filterOptions.style.display !== 'none';
        filterOptions.style.display = isVisible ? 'none' : 'block';
        if (arrow) {
            arrow.textContent = isVisible ? '▼' : '▲';
        }
    }
}

function filterExercises() {
    const searchTerm = document.getElementById('exerciseSearch')?.value.toLowerCase() || '';
    const selectedMuscleGroups = Array.from(document.querySelectorAll('#muscleGroupFilter input:checked')).map(cb => cb.value);
    const selectedDifficulties = Array.from(document.querySelectorAll('#difficultyFilter input:checked')).map(cb => cb.value);
    const selectedEquipment = Array.from(document.querySelectorAll('#equipmentFilter input:checked')).map(cb => cb.value);
    
    let filtered = exercises.filter(exercise => {
        const matchesSearch = exercise.name.toLowerCase().includes(searchTerm) ||
                            exercise.description?.toLowerCase().includes(searchTerm) ||
                            exercise.muscle_group_name.toLowerCase().includes(searchTerm);
        
        const matchesMuscleGroup = selectedMuscleGroups.length === 0 || selectedMuscleGroups.includes('') || 
                                 selectedMuscleGroups.includes(exercise.muscle_group_name);
        const matchesDifficulty = selectedDifficulties.length === 0 || 
                                selectedDifficulties.includes(exercise.difficulty_level);
        const matchesEquipment = selectedEquipment.length === 0 || 
                               selectedEquipment.includes(exercise.equipment || 'None');
        
        return matchesSearch && matchesMuscleGroup && matchesDifficulty && matchesEquipment;
    });
    
    displayExercises(filtered);
}

function filterPrograms() {
    const searchTerm = document.getElementById('programSearch')?.value.toLowerCase() || '';
    const selectedDifficulties = Array.from(document.querySelectorAll('#difficultyFilter input:checked')).map(cb => cb.value);
    const selectedDurations = Array.from(document.querySelectorAll('#durationFilter input:checked')).map(cb => cb.value);
    
    let filtered = workoutPrograms.filter(program => {
        const matchesSearch = program.name.toLowerCase().includes(searchTerm) ||
                            program.description?.toLowerCase().includes(searchTerm);
        
        const matchesDifficulty = selectedDifficulties.length === 0 || 
                                selectedDifficulties.includes(program.difficulty_level);
        
        let matchesDuration = selectedDurations.length === 0;
        if (selectedDurations.length > 0) {
            const duration = program.duration_weeks || 0;
            selectedDurations.forEach(range => {
                if (range === '1-4' && duration >= 1 && duration <= 4) matchesDuration = true;
                if (range === '5-8' && duration >= 5 && duration <= 8) matchesDuration = true;
                if (range === '9-12' && duration >= 9 && duration <= 12) matchesDuration = true;
            });
        }
        
        return matchesSearch && matchesDifficulty && matchesDuration;
    });
    
    displayWorkoutPrograms(filtered);
}

function filterMuscleGroups() {
    const searchTerm = document.getElementById('muscleGroupSearch')?.value.toLowerCase() || '';
    const selectedCounts = Array.from(document.querySelectorAll('#exerciseCountFilter input:checked')).map(cb => cb.value);
    
    let filtered = muscleGroups.filter(group => {
        const matchesSearch = group.name.toLowerCase().includes(searchTerm);
        
        let matchesCount = selectedCounts.length === 0;
        if (selectedCounts.length > 0) {
            const exerciseCount = exercises.filter(e => e.muscle_group_id === group.id).length;
            selectedCounts.forEach(range => {
                if (range === '1-10' && exerciseCount >= 1 && exerciseCount <= 10) matchesCount = true;
                if (range === '11-20' && exerciseCount >= 11 && exerciseCount <= 20) matchesCount = true;
                if (range === '21+' && exerciseCount >= 21) matchesCount = true;
            });
        }
        
        return matchesSearch && matchesCount;
    });
    
    displayMuscleGroups(filtered);
}

function updateFilterCounts() {
    // Update muscle group counts
    muscleGroups.forEach(group => {
        const count = exercises.filter(e => e.muscle_group_name === group.name).length;
        const option = document.querySelector(`#muscleGroupFilter input[value="${group.name}"]`);
        if (option) {
            const countSpan = option.parentElement.querySelector('.count');
            if (countSpan) countSpan.textContent = `(${count})`;
        }
    });
    
    // Update difficulty counts
    const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
    difficulties.forEach(difficulty => {
        const count = exercises.filter(e => e.difficulty_level === difficulty).length;
        const option = document.querySelector(`#difficultyFilter input[value="${difficulty}"]`);
        if (option) {
            const countSpan = option.parentElement.querySelector('.count');
            if (countSpan) countSpan.textContent = `(${count})`;
        }
    });
    
    // Update equipment counts
    const equipments = ['None', 'Dumbbells', 'Barbell'];
    equipments.forEach(equipment => {
        const count = exercises.filter(e => (e.equipment || 'None') === equipment).length;
        const option = document.querySelector(`#equipmentFilter input[value="${equipment}"]`);
        if (option) {
            const countSpan = option.parentElement.querySelector('.count');
            if (countSpan) countSpan.textContent = `(${count})`;
        }
    });
}

function updateProgramFilterCounts() {
    // Update difficulty counts
    const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
    difficulties.forEach(difficulty => {
        const count = workoutPrograms.filter(p => p.difficulty_level === difficulty).length;
        const option = document.querySelector(`#difficultyFilter input[value="${difficulty}"]`);
        if (option) {
            const countSpan = option.parentElement.querySelector('.count');
            if (countSpan) countSpan.textContent = `(${count})`;
        }
    });
    
    // Update duration counts
    const durations = ['1-4', '5-8', '9-12'];
    durations.forEach(duration => {
        let count = 0;
        workoutPrograms.forEach(program => {
            const weeks = program.duration_weeks || 0;
            if (duration === '1-4' && weeks >= 1 && weeks <= 4) count++;
            if (duration === '5-8' && weeks >= 5 && weeks <= 8) count++;
            if (duration === '9-12' && weeks >= 9 && weeks <= 12) count++;
        });
        const option = document.querySelector(`#durationFilter input[value="${duration}"]`);
        if (option) {
            const countSpan = option.parentElement.querySelector('.count');
            if (countSpan) countSpan.textContent = `(${count})`;
        }
    });
}

function updateMuscleGroupFilterCounts() {
    // Update exercise count ranges
    const ranges = ['1-10', '11-20', '21+'];
    ranges.forEach(range => {
        let count = 0;
        muscleGroups.forEach(group => {
            const exerciseCount = exercises.filter(e => e.muscle_group_id === group.id).length;
            if (range === '1-10' && exerciseCount >= 1 && exerciseCount <= 10) count++;
            if (range === '11-20' && exerciseCount >= 11 && exerciseCount <= 20) count++;
            if (range === '21+' && exerciseCount >= 21) count++;
        });
        const option = document.querySelector(`#exerciseCountFilter input[value="${range}"]`);
        if (option) {
            const countSpan = option.parentElement.querySelector('.count');
            if (countSpan) countSpan.textContent = `(${count})`;
        }
    });
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
        const program = workoutPrograms.find(p => p.id == programId);
        if (!program) {
            console.error('Program not found:', programId);
            return;
        }
        
        // Get exercises for this program
        const programExercises = getProgramExercises(programId);
        console.log('Program exercises:', programExercises);
        
        const container = document.getElementById('programExercisesList');
        if (container) {
            if (programExercises.length === 0) {
                container.innerHTML = `
                    <div class="no-exercises">
                        <h3>No exercises in this program yet</h3>
                        <p>Add some exercises to get started!</p>
                        <button class="btn btn-primary" onclick="showAddExerciseModal('${programId}')">
                            Add Exercises
                        </button>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="exercises-header">
                        <h3>Exercises in this program (${programExercises.length})</h3>
                        <button class="btn btn-primary" onclick="showAddExerciseModal('${programId}')">
                            Add More Exercises
                        </button>
                    </div>
                    <div class="exercises-list">
                        ${programExercises.map(exercise => `
                            <div class="exercise-item">
                                <div class="exercise-info">
                                    <h4>${exercise.name}</h4>
                    <p><strong>Sets:</strong> ${exercise.sets} | <strong>Reps:</strong> ${exercise.reps}</p>
                                    ${exercise.muscleGroup ? `<p><strong>Muscle Group:</strong> ${exercise.muscleGroup}</p>` : ''}
                    </div>
                                <div class="exercise-actions">
                                    <button class="btn btn-secondary" onclick="navigateToPage('exercise-details', { exerciseId: ${exercise.id} })">
                                        View Details
                                    </button>
                                    <button class="btn btn-danger" onclick="removeExerciseFromProgram('${programId}', ${exercise.id})">
                                        Remove
                                    </button>
                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
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

function showCreateExerciseModal() {
    const muscleGroupOptions = muscleGroups.map(group => `<option value="${group.id}">${group.name}</option>`).join('');

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content program-modal">
            <span class="close" onclick="closeModal(this)">&times;</span>
            <h2>Add New Exercise</h2>
            <form id="addExerciseForm" onsubmit="addExercise(event)">
                <div class="form-group">
                    <label for="exerciseName">Exercise Name</label>
                    <input type="text" id="exerciseName" required>
                </div>
                <div class="form-group">
                    <label for="exerciseDescription">Description</label>
                    <textarea id="exerciseDescription"></textarea>
                </div>
                <div class="form-group">
                    <label for="videoUrl">Video URL</label>
                    <input type="url" id="videoUrl">
                </div>
                <div class="form-group">
                    <label for="muscleGroup">Muscle Group</label>
                    <select id="muscleGroup" required>
                        ${muscleGroupOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="difficulty">Difficulty</label>
                    <select id="difficulty">
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal(this.closest('.modal'))">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Exercise</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';
}

async function addExercise(event) {
    event.preventDefault();

    const name = document.getElementById('exerciseName').value;
    const description = document.getElementById('exerciseDescription').value;
    const video_url = document.getElementById('videoUrl').value;
    const muscle_group_id = document.getElementById('muscleGroup').value;
    const difficulty_level = document.getElementById('difficulty').value;

    const { data, error } = await supabase
        .from('exercises')
        .insert([{ name, description, video_url, muscle_group_id, difficulty_level }]);

    if (error) {
        console.error('Error adding exercise:', error);
        showError('Failed to add exercise.');
    } else {
        showSuccess('Exercise added successfully!');
        closeModal(document.getElementById('addExerciseForm').closest('.modal'));
        loadExercises();
    }
}

function closeModal(element) {
    const modal = element.closest('.modal');
    modal.remove();
}

// Calendar functions

function generateCalendar() {
    const container = document.getElementById('calendarContent');
    if (!container) return;
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    let calendarHTML = '';
    
    switch(calendarView) {
        case 'day':
            calendarHTML = generateDayView();
            break;
        case 'week':
            calendarHTML = generateWeekView();
            break;
        case 'month':
            calendarHTML = generateMonthView();
            break;
    }
    
    container.innerHTML = calendarHTML;
}

function generateDayView() {
    const dateString = selectedDate.toISOString().split('T')[0];
    const hasWorkout = scheduledWorkouts[dateString];
    const isToday = selectedDate.toDateString() === new Date().toDateString();
    
    return `
        <div class="calendar">
            <div class="calendar-header">
                <h2>${selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                })}</h2>
            </div>
            
            <div class="day-view">
                <div class="day-schedule">
                    ${isToday ? `
                        <div class="workout-today-section">
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
                    ` : `
                        <div class="selected-date-section">
                            <h3>Workout for ${selectedDate.toLocaleDateString()}</h3>
                            <div class="selected-date-content">
                                <button class="btn btn-primary" onclick="showProgramSelectionModal()">
                                    Add Workout
                                </button>
                            </div>
                        </div>
                    `}
                    
                    ${hasWorkout ? `
                        <div class="scheduled-workout">
                            <h4>${hasWorkout.name}</h4>
                            <p>Duration: ${hasWorkout.duration || 'Not specified'}</p>
                            <button class="btn btn-primary" onclick="showWorkoutDetails('${dateString}')">View Details</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function generateWeekView() {
    const weekStart = getWeekStart(selectedDate);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    return `
        <div class="calendar">
            <div class="calendar-header">
                <h2>${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</h2>
            </div>
            
            <div class="week-view">
                <div class="week-header">
                    ${dayNames.map(day => `<div class="week-day-header">${day}</div>`).join('')}
                </div>
                
                <div class="week-grid">
                    ${Array.from({length: 7}, (_, i) => {
                        const date = new Date(weekStart);
                        date.setDate(date.getDate() + i);
                        const dateString = date.toISOString().split('T')[0];
                        const hasWorkout = scheduledWorkouts[dateString];
                        const isSelected = date.toDateString() === selectedDate.toDateString();
                        const isToday = date.toDateString() === new Date().toDateString();
                        
                        return `
                            <div class="week-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" onclick="selectDateFromWeek('${dateString}')">
                                <div class="week-day-number">${date.getDate()}</div>
                                ${hasWorkout ? '<div class="workout-indicator"></div>' : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            ${selectedDate ? generateSelectedDateWorkout() : ''}
        </div>
    `;
}

function generateMonthView() {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    return `
        <div class="calendar">
            <div class="calendar-header">
                <h2>${monthNames[month]} ${year}</h2>
            </div>
            
            <div class="calendar-grid">
                ${dayNames.map(day => `<div class="calendar-day-header">${day}</div>`).join('')}
                
                ${Array.from({length: startingDay}, () => '<div class="calendar-day empty"></div>').join('')}
                
                ${Array.from({length: daysInMonth}, (_, i) => {
                    const day = i + 1;
                    const date = new Date(year, month, day);
                    const dateString = date.toISOString().split('T')[0];
                    const hasWorkout = scheduledWorkouts[dateString];
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    return `
                        <div class="calendar-day ${hasWorkout ? 'has-workout' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" onclick="selectDateFromMonth(${year}, ${month + 1}, ${day})">
                            <div class="calendar-day-number">${day}</div>
                            ${hasWorkout ? '<div class="workout-indicator"></div>' : ''}
                        </div>
                    `;
                }).join('')}
            </div>
            
            ${selectedDate ? generateSelectedDateWorkout() : ''}
        </div>
    `;
}

function checkForWorkout(year, month, day) {
    const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return scheduledWorkouts.has(dateString) || userWorkouts.some(workout => 
        workout.workout_days && Array.isArray(workout.workout_days) && workout.workout_days.includes(dateString)
    );
}

// Optimized workout scheduling
function scheduleWorkout(dateString, programId) {
    if (!validators.isValidDate(dateString)) {
        throw new Error('Invalid date format');
    }
    scheduledWorkouts.set(dateString, programId);
    saveScheduledWorkouts();
}

function removeScheduledWorkout(dateString) {
    scheduledWorkouts.delete(dateString);
    saveScheduledWorkouts();
}

function getScheduledWorkout(dateString) {
    return scheduledWorkouts.get(dateString);
}

function saveScheduledWorkouts() {
    try {
        const data = Object.fromEntries(scheduledWorkouts);
        localStorage.setItem('scheduledWorkouts', JSON.stringify(data));
    } catch (error) {
        handleError('Failed to save scheduled workouts', error);
    }
}

function loadScheduledWorkouts() {
    try {
        const data = localStorage.getItem('scheduledWorkouts');
        if (data) {
            const parsed = JSON.parse(data);
            scheduledWorkouts.clear();
            Object.entries(parsed).forEach(([date, programId]) => {
                scheduledWorkouts.set(date, programId);
            });
        }
    } catch (error) {
        handleError('Failed to load scheduled workouts', error);
    }
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

function goToToday() {
    const today = new Date();
    selectedDate = new Date(today);
    generateCalendar();
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
    const programExercises = getProgramExercises(programId);
    
    // Create direct exercise tracking section
    const exerciseSection = document.createElement('div');
    exerciseSection.id = 'exerciseSelectionSection';
    exerciseSection.className = 'exercise-selection-section';
    exerciseSection.setAttribute('data-program-id', programId);
    exerciseSection.innerHTML = `
        <h3>Track Your Workout - ${program.name}</h3>
        <p><strong>Date:</strong> ${formatDate(dateString)}</p>
        
        <div class="exercises-tracking-list">
            ${programExercises.map(exercise => `
                <div class="exercise-tracking-card" data-exercise-id="${exercise.id}">
                    <div class="exercise-header">
                        <h4>${exercise.name}</h4>
                        <p><strong>Target:</strong> ${exercise.sets} sets × ${exercise.reps} reps</p>
                    </div>
                    
                    <div class="sets-container">
                        ${generateSetInputs(exercise.sets, exercise.reps)}
                    </div>
                    
                    <div class="tracking-actions">
                        <button class="btn btn-primary" onclick="saveExerciseTracking(${exercise.id}, '${dateString}', '${programId}')">
                            Save Progress
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="workout-actions">
            <button class="btn btn-secondary" onclick="saveAllProgress()">
                Save All Progress
            </button>
            <button class="btn btn-secondary" onclick="closeModal(document.querySelector('.modal'))">
                Close
            </button>
        </div>
    `;
    
    // Append to main content area or modal
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.appendChild(exerciseSection);
    }
}

function getProgramExercises(programNameOrId) {
    const programId = typeof programNameOrId === 'string' ? 
                      workoutPrograms.find(p => p.name === programNameOrId)?.id :
                      programNameOrId;

    if (!programId) {
        console.warn(`Program not found: ${programNameOrId}`);
        return [];
    }
    
    const storedExercises = localStorage.getItem(`program_${programId}_exercises`);
    
    if (storedExercises) {
        try {
            const parsedExercises = JSON.parse(storedExercises);
            
            // Validate that exercises is an array
            if (Array.isArray(parsedExercises)) {
                return parsedExercises;
            } else {
                console.warn('Stored exercises is not an array, returning empty array');
                return [];
            }
        } catch (e) {
            console.error('Error parsing stored exercises:', e);
            return [];
        }
    }
    
    return [];
}

// Function to setup autofill for weight inputs
function setupWeightAutoFill() {
    const weightInputs = document.querySelectorAll('.weight-input');
    
    weightInputs.forEach(input => {
        input.addEventListener('blur', (event) => {
            const currentInput = event.target;
            const exerciseId = currentInput.getAttribute('data-exercise-id');
            const currentSet = parseInt(currentInput.getAttribute('data-set'));
            const weight = currentInput.value;
            
            if (weight) {
                // Find all subsequent weight inputs for the same exercise
                const subsequentInputs = document.querySelectorAll(
                    `.weight-input[data-exercise-id="${exerciseId}"]`
                );
                
                subsequentInputs.forEach(nextInput => {
                    const nextSet = parseInt(nextInput.getAttribute('data-set'));
                    if (nextSet > currentSet && !nextInput.value) {
                        nextInput.value = weight;
                    }
                });
            }
        });
    });
}

// Generate set input fields
function generateSetInputs(sets, targetReps) {
    let inputs = '';
    for (let i = 1; i <= sets; i++) {
        inputs += `
            <div class="set-input-row">
                <span class="set-number">Set ${i}:</span>
                <input type="number" class="weight-input" placeholder="Weight (kg/lbs)">
                <input type="number" class="reps-input" placeholder="Reps (${targetReps})">
            </div>
        `;
    }
    return inputs;
}

// Function to save exercise progress
async function saveExerciseProgress(exerciseId, programId, dateString) {
    try {
        const trackingCard = document.querySelector(`.exercise-tracking-card[data-exercise-id="${exerciseId}"]`);
        
        if (!trackingCard) {
            console.error(`Tracking card not found for exercise ${exerciseId}`);
            return;
        }
        
        const setInputs = trackingCard.querySelectorAll('.set-input-row');
        const setsData = [];
        
        setInputs.forEach((setRow, index) => {
            const weightInput = setRow.querySelector('.weight-input');
            const repsInput = setRow.querySelector('.reps-input');
            
            if (weightInput && repsInput) {
                const weight = weightInput.value;
                const reps = repsInput.value;
                
                if (weight || reps) {
                    setsData.push({
                        set: index + 1,
                        weight: weight ? parseFloat(weight) : null,
                        reps: reps ? parseInt(reps) : null,
                    });
                }
            }
        });
        
        // Find the exercise name
        const exerciseName = trackingCard.querySelector('h4').textContent;
        
        // Get existing tracking data for the date
        const trackingKey = `exercise_tracking_${dateString}`;
        let existingTracking = localStorage.getItem(trackingKey);
        let trackingData = existingTracking ? JSON.parse(existingTracking) : {};
        
        // Update the tracking data for this exercise
        trackingData[exerciseId] = {
            exerciseName: exerciseName,
            sets: setsData,
        };
        
        // Save back to localStorage
        localStorage.setItem(trackingKey, JSON.stringify(trackingData));
        
        // Show success message
        showSuccess(`Progress for ${exerciseName} saved successfully!`);
        
    } catch (error) {
        console.error('Error saving exercise progress:', error);
        showError('Failed to save exercise progress.');
    }
}

// Test function to check if the save function is called
function testSaveFunction(exerciseId, programId, dateString) {
    console.log(`testSaveFunction called with:
        Exercise ID: ${exerciseId}
        Program ID: ${programId}
        Date String: ${dateString}`);
    
    // Get the tracking card
    const trackingCard = document.querySelector(`.exercise-tracking-card[data-exercise-id="${exerciseId}"]`);
    if (!trackingCard) {
        console.error('Tracking card not found!');
        return;
    }
    
    // Get the set inputs
    const setInputs = trackingCard.querySelectorAll('.set-input-row');
    if (setInputs.length === 0) {
        console.error('No set inputs found!');
        return;
    }
    
    // Log the data from the inputs
    setInputs.forEach((setRow, index) => {
        const weightInput = setRow.querySelector('.weight-input');
        const repsInput = setRow.querySelector('.reps-input');
        console.log(`Set ${index + 1}: Weight = ${weightInput.value}, Reps = ${repsInput.value}`);
    });
}

// Clear all deleted programs from localStorage
function clearDeletedPrograms() {
    localStorage.removeItem('deletedPrograms');
    showSuccess('Deleted programs list has been cleared. All programs will now be visible.');
    loadWorkoutPrograms(); // Reload programs to reflect changes
}

// Manual save function to test saving data structure
function manualSave() {
    const testData = {
        '123': {
            exerciseName: 'Test Exercise',
            sets: [
                { set: 1, weight: 50, reps: 10 },
                { set: 2, weight: 50, reps: 9 },
            ]
        }
    };
    
    const dateString = new Date().toISOString().split('T')[0];
    const trackingKey = `exercise_tracking_${dateString}`;
    
    try {
        localStorage.setItem(trackingKey, JSON.stringify(testData));
        console.log('Manual save successful. Data saved:', testData);
        showSuccess('Test data saved successfully!');
    } catch (error) {
        console.error('Error during manual save:', error);
        showError('Failed to save test data.');
    }
}

// Function to check localStorage for saved data
function checkLocalStorage() {
    const keys = Object.keys(localStorage);
    console.log('localStorage keys:', keys);
    
    keys.forEach(key => {
        if (key.startsWith('exercise_tracking_')) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                console.log(`Data for ${key}:`, data);
            } catch (error) {
                console.error(`Error parsing data for ${key}:`, error);
            }
        }
    });
}

// Function to check modal structure
function checkModalStructure() {
    const modal = document.querySelector('.modal');
    if (!modal) {
        console.error('Modal not found!');
        return;
    }
    
    const saveButton = modal.querySelector('button.btn-primary[onclick^="saveExerciseTracking"]');
    
    if (!saveButton) {
        console.error('Save button not found in modal!');
    } else {
        const onclickAttr = saveButton.getAttribute('onclick');
        console.log('Save button onclick attribute:', onclickAttr);
        
        const params = onclickAttr.match(/\((.*?)\)/);
        if (params && params[1]) {
            const [exerciseId, dateString, programId] = params[1].split(',').map(p => p.trim().replace(/'/g, ''));
            console.log(`Parsed parameters:
                Exercise ID: ${exerciseId}
                Date String: ${dateString}
                Program ID: ${programId}`);
        } else {
            console.error('Could not parse parameters from onclick attribute.');
        }
    }
}

// Function to test the save process step-by-step
function testModalSave() {
    // 1. Get the modal
    const modal = document.querySelector('.modal');
    if (!modal) {
        console.error('No modal found.');
        return;
    }

    // 2. Get the save button
    const saveButton = modal.querySelector('button[onclick^="saveExerciseTracking"]');
    if (!saveButton) {
        console.error('Save button not found.');
        return;
    }

    // 3. Simulate a click
    saveButton.click();
}

function testSaveStep(step) {
    const modal = document.querySelector('.modal');
    if (!modal) {
        console.error('No modal is open.');
        return;
    }
    
    const saveButton = modal.querySelector('button[onclick^="saveExerciseTracking"]');
    if (!saveButton) {
        console.error('Save button not found.');
        return;
    }

    const onclickAttr = saveButton.getAttribute('onclick');
    const params = onclickAttr.match(/\((.*?)\)/)[1].split(',').map(p => p.trim().replace(/'/g, ''));
    const [exerciseId, dateString, programId] = params;

    if (step === 1) {
        console.log('Step 1: Parameters from button:', { exerciseId, dateString, programId });
    }
    
    if (step === 2) {
        const trackingCard = document.querySelector(`.exercise-tracking-card[data-exercise-id="${exerciseId}"]`);
        if (!trackingCard) {
            console.error('Step 2: Tracking card not found.');
            return;
        }
        console.log('Step 2: Tracking card found:', trackingCard);
    }
    
    if (step === 3) {
        const trackingCard = document.querySelector(`.exercise-tracking-card[data-exercise-id="${exerciseId}"]`);
        const setInputs = trackingCard.querySelectorAll('.set-input-row');
        const setsData = [];
        setInputs.forEach((row, index) => {
            setsData.push({
                set: index + 1,
                weight: row.querySelector('.weight-input').value,
                reps: row.querySelector('.reps-input').value,
            });
        });
        console.log('Step 3: Collected sets data:', setsData);
    }
}

// Run all test steps
function runAllSaveTests() {
    for (let i = 1; i <= 3; i++) {
        testSaveStep(i);
    }
}

function simpleTest() {
    console.log('Simple test running');
    
    const modal = document.querySelector('.modal');
    if (!modal) {
        console.error('No modal!');
        return;
    }
    
    console.log('Modal found:', modal);
    
    const saveBtn = modal.querySelector('button[onclick*="saveExerciseTracking"]');
    if (!saveBtn) {
        console.error('No save button!');
        return;
    }
    
    console.log('Save button found:', saveBtn);
    
    const onclickVal = saveBtn.getAttribute('onclick');
    console.log('Onclick value:', onclickVal);
    
    try {
        const result = onclickVal.match(/saveExerciseTracking\((.*?)\)/);
        if (result && result[1]) {
            const args = result[1].split(',').map(arg => arg.trim().replace(/'/g, ''));
            console.log('Parsed args:', args);
            
            const [exerciseId, dateString, programId] = args;
            
            const card = document.querySelector(`.exercise-tracking-card[data-exercise-id="${exerciseId}"]`);
            if (!card) {
                console.error('Card not found for exercise:', exerciseId);
                return;
            }
            
            const sets = card.querySelectorAll('.set-input-row');
            const data = [];
            sets.forEach(set => {
                data.push({
                    weight: set.querySelector('.weight-input').value,
                    reps: set.querySelector('.reps-input').value,
                });
            });
            
            console.log('Collected data:', data);
            
        } else {
            console.error('Could not parse onclick attribute');
        }
    } catch (e) {
        console.error('Error parsing onclick:', e);
    }
}

// Force save progress for the first exercise in the modal
function forceSave() {
    const modal = document.querySelector('.modal');
    if (!modal) {
        console.error('No modal found.');
        return;
    }

    const saveButton = modal.querySelector('button[onclick^="saveExerciseTracking"]');
    if (!saveButton) {
        console.error('Save button not found.');
        return;
    }

    const onclickAttr = saveButton.getAttribute('onclick');
    const params = onclickAttr.match(/\((.*?)\)/);
    
    if (params && params[1]) {
        const args = params[1].split(',').map(p => p.trim().replace(/'/g, ''));
        saveExerciseTracking(...args);
    } else {
        console.error('Could not parse params from save button.');
    }
}

// Function to reset all exercise tracking data
function resetExerciseTracking() {
    const confirmation = confirm('Are you sure you want to reset all exercise tracking data? This cannot be undone.');
    if (confirmation) {
        for (const key of Object.keys(localStorage)) {
            if (key.startsWith('exercise_tracking_')) {
                localStorage.removeItem(key);
            }
        }
        showSuccess('All exercise tracking data has been reset.');
    }
}

// Show user feedback messages
function showError(message) {
    const errorBanner = document.getElementById('error-banner');
    if (errorBanner) {
        errorBanner.textContent = message;
        errorBanner.style.display = 'block';
        setTimeout(() => {
            errorBanner.style.display = 'none';
        }, 5000);
    } else {
        const banner = document.createElement('div');
        banner.id = 'error-banner';
        banner.className = 'error-banner';
        banner.textContent = message;
        document.body.appendChild(banner);
        banner.style.display = 'block';
        setTimeout(() => {
            banner.style.display = 'none';
        }, 5000);
    }
}

function toggleEditMode(exerciseId) {
    const card = document.querySelector(`.card[data-exercise-id='${exerciseId}']`);
    const fields = card.querySelectorAll('.editable-field');
    const isEditing = card.classList.contains('editing');

    if (isEditing) {
        // Switch back to view mode
        fields.forEach(field => {
            const originalValue = field.getAttribute('data-original-value');
            field.textContent = originalValue;
        });
        card.classList.remove('editing');
        card.querySelector('.edit-btn').textContent = 'Edit';
        card.querySelector('.save-btn').style.display = 'none';
        card.querySelector('.cancel-btn').style.display = 'none';
    } else {
        // Switch to edit mode
        fields.forEach(field => {
            const currentValue = field.textContent;
            field.setAttribute('data-original-value', currentValue);
            const fieldName = field.getAttribute('data-field');
            if (fieldName === 'muscle_group_name') {
                const select = document.createElement('select');
                select.innerHTML = muscleGroups.map(g => `<option value="${g.name}" ${g.name === currentValue ? 'selected' : ''}>${g.name}</option>`).join('');
                field.innerHTML = '';
                field.appendChild(select);
            } else if (fieldName === 'difficulty_level') {
                const select = document.createElement('select');
                select.innerHTML = ['beginner', 'intermediate', 'advanced'].map(d => `<option value="${d}" ${d === currentValue ? 'selected' : ''}>${d}</option>`).join('');
                field.innerHTML = '';
                field.appendChild(select);
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentValue;
                field.innerHTML = '';
                field.appendChild(input);
            }
        });
        card.classList.add('editing');
        card.querySelector('.edit-btn').textContent = 'Cancel';
        card.querySelector('.save-btn').style.display = 'inline-block';
        card.querySelector('.cancel-btn').style.display = 'inline-block';
    }
}

function cancelEditMode(exerciseId) {
    const card = document.querySelector(`.card[data-exercise-id='${exerciseId}']`);
    const fields = card.querySelectorAll('.editable-field');
    fields.forEach(field => {
        const originalValue = field.getAttribute('data-original-value');
        field.innerHTML = originalValue;
    });
    card.classList.remove('editing');
    card.querySelector('.edit-btn').textContent = 'Edit';
    card.querySelector('.save-btn').style.display = 'none';
    card.querySelector('.cancel-btn').style.display = 'none';
}

async function getMuscleGroupIdByName(name) {
    const group = muscleGroups.find(g => g.name === name);
    return group ? group.id : null;
}

async function saveExerciseChanges(exerciseId) {
    const card = document.querySelector(`.card[data-exercise-id='${exerciseId}']`);
    const fields = card.querySelectorAll('.editable-field');
    const updatedData = {};

    for (const field of fields) {
        const fieldName = field.getAttribute('data-field');
        const input = field.querySelector('input, select');
        if (input) {
            let value = input.value;
            if (fieldName === 'muscle_group_name') {
                const muscleGroupId = await getMuscleGroupIdByName(value);
                if (muscleGroupId) {
                    updatedData['muscle_group_id'] = muscleGroupId;
                } else {
                    showError(`Invalid muscle group: ${value}`);
                    return;
                }
            } else {
                updatedData[fieldName] = value;
            }
        }
    }

    if (Object.keys(updatedData).length > 0) {
        const { error } = await supabase
            .from('exercises')
            .update(updatedData)
            .eq('id', exerciseId);

        if (error) {
            console.error('Error updating exercise:', error);
            showError('Failed to update exercise.');
        } else {
            showSuccess('Exercise updated successfully!');
            loadExercises(); // Refresh the list
        }
    }
}

function showSuccess(message) {
    const successBanner = document.getElementById('success-banner');
    if (successBanner) {
        successBanner.textContent = message;
        successBanner.style.display = 'block';
        setTimeout(() => {
            successBanner.style.display = 'none';
        }, 3000);
    } else {
        const banner = document.createElement('div');
        banner.id = 'success-banner';
        banner.className = 'success-banner';
        banner.textContent = message;
        document.body.appendChild(banner);
        banner.style.display = 'block';
        setTimeout(() => {
            banner.style.display = 'none';
        }, 3000);
    }
}

// Function to show the exercise tracking modal
function showExerciseTracking(exerciseId, sets, reps, dateString, programId) {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) {
        showError('Exercise not found.');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content exercise-tracking-modal">
            <span class="close" onclick="closeModal(this)">&times;</span>
            <h2>Track: ${exercise.name}</h2>
            <p><strong>Date:</strong> ${formatDate(dateString)}</p>
            <p><strong>Target:</strong> ${sets} sets of ${reps} reps</p>
            
            <div id="tracking-sets-container">
                <!-- Set inputs will be generated here -->
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal(this)">Cancel</button>
                <button class="btn btn-primary" onclick="saveExerciseTracking(${exerciseId}, '${dateString}', '${programId}')">Save Progress</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Load existing data and generate set inputs
    loadExerciseTrackingData(exerciseId, dateString).then(trackingData => {
        const setsContainer = document.getElementById('tracking-sets-container');
        setsContainer.innerHTML = generateSetInputs(sets, trackingData);
    });
}

// Generate set inputs with existing data
function generateSetInputs(sets, trackingData) {
    let inputsHTML = '';
    for (let i = 0; i < sets; i++) {
        const setData = trackingData?.sets?.[i] || {};
        inputsHTML += `
            <div class="set-input-group">
                <label>Set ${i + 1}</label>
                <input type="number" class="weight-input" placeholder="Weight" value="${setData.weight || ''}">
                <input type="number" class="reps-input" placeholder="Reps" value="${setData.reps || ''}">
            </div>
        `;
    }
    return inputsHTML;
}

// Add event listeners to tracking inputs
function setupTrackingInputs() {
    document.body.addEventListener('input', event => {
        if (event.target.matches('.weight-input, .reps-input')) {
            const modal = event.target.closest('.modal');
            const exerciseId = modal.dataset.exerciseId;
            const dateString = modal.dataset.dateString;
            // You can add auto-saving logic here if desired
        }
    });
}

// Load tracking data for a specific exercise on a specific date
async function loadExerciseTrackingData(exerciseId, dateString) {
    const trackingKey = `exercise_tracking_${dateString}`;
    const allTrackingData = JSON.parse(localStorage.getItem(trackingKey) || '{}');
    return allTrackingData[exerciseId] || null;
}

// Save exercise tracking data
async function saveExerciseTracking(exerciseId, dateString, programId) {
    try {
        const modal = document.querySelector('.exercise-tracking-modal');
        const setInputs = modal.querySelectorAll('.set-input-group');
        const setsData = [];

        setInputs.forEach((setGroup, index) => {
            const weight = setGroup.querySelector('.weight-input').value;
            const reps = setGroup.querySelector('.reps-input').value;
            if (weight || reps) {
                setsData.push({
                    setNumber: index + 1,
                    weight: parseFloat(weight) || null,
                    reps: parseInt(reps) || null,
                });
            }
        });

        // Get all tracking data for the date
        const trackingKey = `exercise_tracking_${dateString}`;
        let allTrackingData = JSON.parse(localStorage.getItem(trackingKey) || '{}');

        // Update data for the specific exercise
        allTrackingData[exerciseId] = {
            sets: setsData,
        };

        // Save back to localStorage
        localStorage.setItem(trackingKey, JSON.stringify(allTrackingData));

        showSuccess('Progress saved successfully!');
        closeModal(modal);

    } catch (error) {
        console.error('Failed to save exercise tracking:', error);
        showError('Could not save progress. Please try again.');
    }
}

// Save all progress for the current workout
async function saveAllProgress() {
    try {
        const trackingContainer = document.getElementById('exerciseTrackingList');
        if (!trackingContainer) {
            showError('No workout to save.');
            return;
        }

        const exerciseItems = trackingContainer.querySelectorAll('.exercise-tracking-item');
        if (exerciseItems.length === 0) {
            showError('No exercises to save.');
            return;
        }
        
        const dateString = new Date(document.querySelector('.workout-info p:last-child').textContent.split(': ')[1]).toISOString().split('T')[0];
        let allTrackingData = JSON.parse(localStorage.getItem(`exercise_tracking_${dateString}`) || '{}');

        exerciseItems.forEach(item => {
            const exerciseId = item.dataset.exerciseId;
            const setsContainer = item.querySelector('.sets-container');
            const setInputs = setsContainer.querySelectorAll('.set-input-group');
            const setsData = [];

            setInputs.forEach((setGroup, index) => {
                const weight = setGroup.querySelector('.weight-input').value;
                const reps = setGroup.querySelector('.reps-input').value;
                if (weight || reps) {
                    setsData.push({
                        setNumber: index + 1,
                        weight: parseFloat(weight) || null,
                        reps: parseInt(reps) || null,
                    });
                }
            });

            if (setsData.length > 0) {
                allTrackingData[exerciseId] = { sets: setsData };
            }
        });

        // Save updated data to localStorage
        localStorage.setItem(`exercise_tracking_${dateString}`, JSON.stringify(allTrackingData));

        showSuccess('All progress saved successfully!');
        goBack(); // Navigate back to the calendar or previous page
        
    } catch (error) {
        console.error('Error saving all progress:', error);
        showError('Failed to save all progress.');
    }
}

// Modal to create a new workout program
function showCreateProgramModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content program-modal">
            <span class="close" onclick="closeModal(this)">&times;</span>
            <h2>Create New Workout Program</h2>
            <form id="createProgramForm" onsubmit="createWorkoutProgram(event)">
                <div class="form-group">
                    <label for="programName">Program Name</label>
                    <input type="text" id="programName" required>
                </div>
                <div class="form-group">
                    <label for="programDescription">Description</label>
                    <textarea id="programDescription"></textarea>
                </div>
                <div class="form-group">
                    <label for="programDifficulty">Difficulty</label>
                    <select id="programDifficulty">
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="programDuration">Duration (weeks)</label>
                    <input type="number" id="programDuration" min="1">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal(this.closest('.modal'))">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Program</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

// Create a new workout program and save to localStorage
function createWorkoutProgram(event) {
    event.preventDefault();
    
    const newProgram = {
        id: `user_${Date.now()}`,
        name: document.getElementById('programName').value,
        description: document.getElementById('programDescription').value,
        difficulty_level: document.getElementById('programDifficulty').value,
        duration_weeks: document.getElementById('programDuration').value,
        is_user_created: true,
    };
    
    // Validate the program data
    const validation = validateData(newProgram, schemas.workoutProgram);
    if (!validation.isValid) {
        showError(`Invalid program data: ${validation.errors.join(', ')}`);
        return;
    }
    
    // Add to workout programs array and save to localStorage
    workoutPrograms.push(newProgram);
    const userPrograms = workoutPrograms.filter(p => p.is_user_created);
    localStorage.setItem('workoutPrograms', JSON.stringify(userPrograms));
    
    showSuccess('Workout program created successfully!');
    closeModal(document.getElementById('createProgramForm').closest('.modal'));
    loadWorkoutPrograms(); // Refresh the list
}

// Show modal to edit an existing workout program
function editWorkoutProgram(programId) {
    const program = workoutPrograms.find(p => p.id === programId);
    if (!program) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content program-modal">
            <span class="close" onclick="closeModal(this)">&times;</span>
            <h2>Edit Workout Program</h2>
            <form id="editProgramForm" onsubmit="updateWorkoutProgram(event, '${programId}')">
                <div class="form-group">
                    <label for="editProgramName">Program Name</label>
                    <input type="text" id="editProgramName" value="${program.name}" required>
                </div>
                <div class="form-group">
                    <label for="editProgramDescription">Description</label>
                    <textarea id="editProgramDescription">${program.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="editProgramDifficulty">Difficulty</label>
                    <select id="editProgramDifficulty">
                        <option value="beginner" ${program.difficulty_level === 'beginner' ? 'selected' : ''}>Beginner</option>
                        <option value="intermediate" ${program.difficulty_level === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                        <option value="advanced" ${program.difficulty_level === 'advanced' ? 'selected' : ''}>Advanced</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editProgramDuration">Duration (weeks)</label>
                    <input type="number" id="editProgramDuration" value="${program.duration_weeks || ''}" min="1">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal(this.closest('.modal'))">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

// Update an existing workout program
function updateWorkoutProgram(event, programId) {
    event.preventDefault();

    const programIndex = workoutPrograms.findIndex(p => p.id === programId);
    if (programIndex === -1) return;

    const updatedProgram = {
        ...workoutPrograms[programIndex],
        name: document.getElementById('editProgramName').value,
        description: document.getElementById('editProgramDescription').value,
        difficulty_level: document.getElementById('editProgramDifficulty').value,
        duration_weeks: document.getElementById('editProgramDuration').value,
    };
    
    // Replace the old program with the updated one
    workoutPrograms[programIndex] = updatedProgram;
    
    // Save only user-created programs back to localStorage
    const userPrograms = workoutPrograms.filter(p => p.is_user_created);
    localStorage.setItem('workoutPrograms', JSON.stringify(userPrograms));

    showSuccess('Workout program updated successfully!');
    closeModal(document.getElementById('editProgramForm').closest('.modal'));
    loadWorkoutPrograms(); // Refresh the list
}

// Delete a workout program
function deleteWorkoutProgram(programId, programName) {
    // Show a confirmation dialog before deleting
    const confirmation = confirm(`Are you sure you want to delete the program "${programName}"? This action cannot be undone.`);
    
    if (confirmation) {
        confirmDeleteProgram(programId, programName);
    }
}

// Confirmed deletion of workout program
function confirmDeleteProgram(programId, programName) {
    const programIndex = workoutPrograms.findIndex(p => p.id == programId);
    
    if (programIndex > -1) {
        const program = workoutPrograms[programIndex];
        
        // If it's a user-created program, remove it from localStorage
        if (program.is_user_created) {
            workoutPrograms.splice(programIndex, 1);
            const userPrograms = workoutPrograms.filter(p => p.is_user_created);
            localStorage.setItem('workoutPrograms', JSON.stringify(userPrograms));
        } else {
            // If it's a database program, add its ID to the deleted list
            let deletedPrograms = localStorage.getItem('deletedPrograms');
            let deletedProgramIds = deletedPrograms ? JSON.parse(deletedPrograms) : [];
            
            if (!deletedProgramIds.includes(programId)) {
                deletedProgramIds.push(programId);
                localStorage.setItem('deletedPrograms', JSON.stringify(deletedProgramIds));
            }
        }
        
        // Remove scheduled instances of this program
        const updatedScheduledWorkouts = {};
        for (const [date, scheduledProgram] of Object.entries(scheduledWorkouts)) {
            if (scheduledProgram.id !== programId) {
                updatedScheduledWorkouts[date] = scheduledProgram;
            }
        }
        
        // Update the scheduled workouts in memory and localStorage
        scheduledWorkouts = updatedScheduledWorkouts;
        localStorage.setItem('scheduledWorkouts', JSON.stringify(scheduledWorkouts));
        
        showSuccess(`Program "${programName}" has been deleted.`);
        loadWorkoutPrograms(); // Refresh the list of programs
        
    } else {
        showError('Could not find the program to delete.');
    }
}

// Show modal to add an exercise to a workout program
function showAddExerciseModal(programId) {
    const program = workoutPrograms.find(p => p.id == programId);
    if (!program) {
        showError('Program not found.');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content program-modal">
            <span class="close" onclick="closeModal(this)">&times;</span>
            <h2>Add Exercise to "${program.name}"</h2>
            
            <div class="add-exercise-content">
                <div class="exercise-search-container">
                    <input type="text" id="exerciseSearchInput" class="search-input" placeholder="Search exercises..." onkeyup="filterExerciseList()">
                </div>
                
                <div id="exerciseSelectionList" class="exercise-selection-list">
                    <!-- Exercises will be loaded here -->
                </div>
            </div>
            
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal(this.closest('.modal'))">Done</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Load all exercises into the selection list
    const selectionList = document.getElementById('exerciseSelectionList');
    selectionList.innerHTML = exercises.map(exercise => `
        <div class="exercise-selection-item" data-exercise-id="${exercise.id}">
            <div class="exercise-info">
                <h4>${exercise.name}</h4>
                <p>${exercise.muscle_group_name} | ${exercise.difficulty_level}</p>
            </div>
            <button class="btn btn-primary add-exercise-btn" onclick="addExerciseToProgram('${programId}', ${exercise.id}, this)">Add</button>
        </div>
    `).join('');
}

// Filter the exercise list in the "Add Exercise" modal
function filterExerciseList() {
    const searchTerm = document.getElementById('exerciseSearchInput').value.toLowerCase();
    const items = document.querySelectorAll('.exercise-selection-item');
    
    items.forEach(item => {
        const name = item.querySelector('h4').textContent.toLowerCase();
        const info = item.querySelector('p').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || info.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Add a selected exercise to a workout program
function addExerciseToProgram(programId, exerciseId, button) {
    const program = workoutPrograms.find(p => p.id == programId);
    const exercise = exercises.find(e => e.id == exerciseId);

    if (!program || !exercise) {
        showError('Program or exercise not found.');
        return;
    }

    // Prompt for sets and reps
    const sets = prompt(`How many sets of ${exercise.name}?`, 3);
    const reps = prompt(`How many reps per set?`, 10);

    if (sets && reps) {
        const programExercise = {
            id: exerciseId,
            name: exercise.name,
            sets: parseInt(sets),
            reps: parseInt(reps),
            muscleGroup: exercise.muscle_group_name
        };

        // Get existing exercises for the program
        let programExercises = getProgramExercises(programId);
        
        // Add new exercise
        programExercises.push(programExercise);

        // Save updated exercises to localStorage
        localStorage.setItem(`program_${programId}_exercises`, JSON.stringify(programExercises));
        
        // Update button text and disable it
        button.textContent = 'Added';
        button.disabled = true;
        button.style.backgroundColor = '#2a2a2a';
        
        showSuccess(`${exercise.name} added to ${program.name}.`);
    }
}

// Remove an exercise from a workout program
function removeExerciseFromProgram(programId, exerciseId) {
    const confirmation = confirm('Are you sure you want to remove this exercise from the program?');
    if (!confirmation) return;

    let programExercises = getProgramExercises(programId);
    
    // Filter out the exercise to be removed
    const updatedExercises = programExercises.filter(ex => ex.id !== exerciseId);

    // Save the updated list back to localStorage
    localStorage.setItem(`program_${programId}_exercises`, JSON.stringify(updatedExercises));
    
    showSuccess('Exercise removed from the program.');
    
    // Refresh the details page to show the change
    loadWorkoutProgramDetailsPage(document.querySelector('.main-content'), { programId });
}

// Function to get exercises for a given program
function getProgramExercises(programNameOrId) {
    const programId = typeof programNameOrId === 'string' ? 
                      workoutPrograms.find(p => p.name === programNameOrId)?.id :
                      programNameOrId;

    if (!programId) {
        console.warn(`Program not found: ${programNameOrId}`);
        return [];
    }
    
    // Retrieve from localStorage
    const storedExercises = localStorage.getItem(`program_${programId}_exercises`);
    
    if (storedExercises) {
        try {
            return JSON.parse(storedExercises);
        } catch (e) {
            console.error('Error parsing stored exercises:', e);
            return [];
        }
    }
    
    return [];
}
