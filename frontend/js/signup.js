// Signup JavaScript
const API_BASE_URL = CONFIG.API_BASE_URL;

// DOM Elements
const signupForm = document.getElementById('signup-form');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

function setupEventListeners() {
    // Form submission
    signupForm.addEventListener('submit', handleSignup);
    
    // Real-time validation
    setupRealTimeValidation();
}

function setupRealTimeValidation() {
    // Register form validation
    const firstName = document.getElementById('first-name');
    const lastName = document.getElementById('last-name');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm-password');
    
    firstName.addEventListener('blur', () => validateName(firstName));
    lastName.addEventListener('blur', () => validateName(lastName));
    email.addEventListener('blur', () => validateEmail(email));
    password.addEventListener('blur', () => validatePassword(password));
    confirmPassword.addEventListener('blur', () => validateConfirmPassword(confirmPassword, password));
}

// Validation functions
function validateEmail(input) {
    const email = input.value.trim();
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!email) {
        showFieldError(input, 'Email is required');
        return false;
    } else if (!emailPattern.test(email)) {
        showFieldError(input, 'Please enter a valid email address');
        return false;
    } else {
        clearFieldError(input);
        return true;
    }
}

function validatePassword(input) {
    const password = input.value;
    
    if (!password) {
        showFieldError(input, 'Password is required');
        return false;
    } else if (password.length < 8) {
        showFieldError(input, 'Password must be at least 8 characters long');
        return false;
    } else {
        clearFieldError(input);
        return true;
    }
}

function validateName(input) {
    const name = input.value.trim();
    
    if (!name) {
        showFieldError(input, 'Name is required');
        return false;
    } else if (name.length < 2) {
        showFieldError(input, 'Name must be at least 2 characters long');
        return false;
    } else {
        clearFieldError(input);
        return true;
    }
}

function validateConfirmPassword(confirmInput, passwordInput) {
    const confirmPassword = confirmInput.value;
    const password = passwordInput.value;
    
    if (!confirmPassword) {
        showFieldError(confirmInput, 'Please confirm your password');
        return false;
    } else if (confirmPassword !== password) {
        showFieldError(confirmInput, 'Passwords do not match');
        return false;
    } else {
        clearFieldError(confirmInput);
        return true;
    }
}

function showFieldError(input, message) {
    const errorElement = document.getElementById(input.id + '-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        input.classList.add('error');
        input.classList.remove('success');
    }
}

function clearFieldError(input) {
    const errorElement = document.getElementById(input.id + '-error');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
        input.classList.remove('error');
        input.classList.add('success');
    }
}

function clearAllErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    const inputs = document.querySelectorAll('input');
    
    errorElements.forEach(element => {
        element.textContent = '';
        element.classList.remove('show');
    });
    
    inputs.forEach(input => {
        input.classList.remove('error', 'success');
    });
}

// Form handlers
async function handleSignup(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validate all inputs
    const isFirstNameValid = validateName(document.getElementById('first-name'));
    const isLastNameValid = validateName(document.getElementById('last-name'));
    const isEmailValid = validateEmail(document.getElementById('email'));
    const isPasswordValid = validatePassword(document.getElementById('password'));
    const isConfirmPasswordValid = validateConfirmPassword(
        document.getElementById('confirm-password'),
        document.getElementById('password')
    );
    
    if (!isFirstNameValid || !isLastNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
        return;
    }
    
    const submitButton = signupForm.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                email,
                password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(data.message || 'Registration successful! You can now log in.', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showNotification(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Network error. Please try again.', 'error');
    } finally {
        setButtonLoading(submitButton, false);
    }
}

function setButtonLoading(button, loading) {
    if (loading) {
        button.disabled = true;
        button.classList.add('loading');
        button.textContent = '';
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        button.textContent = 'Create Account';
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = getNotificationIcon(type);
    const title = getNotificationTitle(type);
    
    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    return icons[type] || icons.info;
}

function getNotificationTitle(type) {
    const titles = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Info'
    };
    return titles[type] || titles.info;
}
