// Configuration file for Deadline Tracker Frontend
const CONFIG = {
    // API Configuration
                 // For local development - change to your local backend URL
             // For production - change to your deployed backend URL
             API_BASE_URL: 'https://deadline-tracker-1-ijdo.onrender.com/api',
    
    // App Configuration
    APP_NAME: 'Deadline Tracker',
    APP_VERSION: '1.0.0',
    
    // Session Configuration
    SESSION_TIMEOUT: 3600000, // 1 hour in milliseconds
    
    // Validation Rules
    VALIDATION: {
        PASSWORD_MIN_LENGTH: 8,
        NAME_MIN_LENGTH: 2
    },
    
    // Notification Configuration
    NOTIFICATION: {
        AUTO_HIDE_DELAY: 5000, // 5 seconds
        FADE_OUT_DURATION: 300 // 300ms
    }
};

// Make it available globally
window.CONFIG = CONFIG;
