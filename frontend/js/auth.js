// Authentication JavaScript
const API_BASE_URL = 'https://deadline-tracker-1-ijdo.onrender.com/api';

// DOM Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');

// Form toggle elements
const showRegisterLink = document.getElementById('show-register-link');
const showLoginLink = document.getElementById('show-login-link');
const forgotPasswordLink = document.getElementById('forgot-password-link');
const backToLoginLink = document.getElementById('back-to-login-link');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkForEmailVerification();
    
    // Check for anchor links
    if (window.location.hash === '#register') {
        showRegisterForm({ preventDefault: () => {} });
    }
    
    // Listen for hash changes
    window.addEventListener('hashchange', function() {
        if (window.location.hash === '#register') {
            showRegisterForm({ preventDefault: () => {} });
        } else if (window.location.hash === '#login') {
            showLoginForm({ preventDefault: () => {} });
        }
    });
});

function setupEventListeners() {
    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    
    // Form toggles
    showRegisterLink.addEventListener('click', showRegisterForm);
    showLoginLink.addEventListener('click', showLoginForm);
    forgotPasswordLink.addEventListener('click', showForgotPasswordForm);
    backToLoginLink.addEventListener('click', showLoginForm);
    
    // Real-time validation
    setupRealTimeValidation();
}

function showLoginForm(e) {
    e.preventDefault();
    hideAllForms();
    loginForm.style.display = 'block';
    clearAllErrors();
}

function showRegisterForm(e) {
    e.preventDefault();
    hideAllForms();
    registerForm.style.display = 'block';
    clearAllErrors();
}

function showForgotPasswordForm(e) {
    e.preventDefault();
    hideAllForms();
    forgotPasswordForm.style.display = 'block';
    clearAllErrors();
}

function hideAllForms() {
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    forgotPasswordForm.style.display = 'none';
}

function setupRealTimeValidation() {
    // Login form validation
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    
    loginEmail.addEventListener('blur', () => validateEmail(loginEmail));
    loginPassword.addEventListener('blur', () => validatePassword(loginPassword));
    
    // Register form validation
    const registerFirstName = document.getElementById('register-first-name');
    const registerLastName = document.getElementById('register-last-name');
    const registerEmail = document.getElementById('register-email');
    const registerPassword = document.getElementById('register-password');
    const registerConfirmPassword = document.getElementById('register-confirm-password');
    
    registerFirstName.addEventListener('blur', () => validateName(registerFirstName));
    registerLastName.addEventListener('blur', () => validateName(registerLastName));
    registerEmail.addEventListener('blur', () => validateEmail(registerEmail));
    registerPassword.addEventListener('blur', () => validatePassword(registerPassword));
    registerConfirmPassword.addEventListener('blur', () => validateConfirmPassword(registerConfirmPassword, registerPassword));
    
    // Forgot password form validation
    const resetEmail = document.getElementById('reset-email');
    resetEmail.addEventListener('blur', () => validateEmail(resetEmail));
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
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    // Validate inputs
    const isEmailValid = validateEmail(document.getElementById('login-email'));
    const isPasswordValid = validatePassword(document.getElementById('login-password'));
    
    if (!isEmailValid || !isPasswordValid) {
        return;
    }
    
    const submitButton = loginForm.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Network error. Please try again.', 'error');
    } finally {
        setButtonLoading(submitButton, false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('register-first-name').value.trim();
    const lastName = document.getElementById('register-last-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    // Validate all inputs
    const isFirstNameValid = validateName(document.getElementById('register-first-name'));
    const isLastNameValid = validateName(document.getElementById('register-last-name'));
    const isEmailValid = validateEmail(document.getElementById('register-email'));
    const isPasswordValid = validatePassword(document.getElementById('register-password'));
    const isConfirmPasswordValid = validateConfirmPassword(
        document.getElementById('register-confirm-password'),
        document.getElementById('register-password')
    );
    
    if (!isFirstNameValid || !isLastNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
        return;
    }
    
    const submitButton = registerForm.querySelector('button[type="submit"]');
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
                showLoginForm(e);
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

async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('reset-email').value.trim();
    
    // Validate email
    const isEmailValid = validateEmail(document.getElementById('reset-email'));
    if (!isEmailValid) {
        return;
    }
    
    const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(data.message || 'Password reset email sent! Please check your email.', 'success');
            setTimeout(() => {
                showLoginForm(e);
            }, 2000);
        } else {
            showNotification(data.error || 'Failed to send reset email', 'error');
        }
    } catch (error) {
        console.error('Forgot password error:', error);
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
        // Restore original text based on form
        if (button.closest('#login-form')) {
            button.textContent = 'Sign In';
        } else if (button.closest('#register-form')) {
            button.textContent = 'Create Account';
        } else if (button.closest('#forgot-password-form')) {
            button.textContent = 'Send Reset Link';
        }
    }
}

function checkForEmailVerification() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const action = urlParams.get('action');
    
    if (token && action === 'verify') {
        verifyEmail(token);
    } else if (token && action === 'reset') {
        showResetPasswordForm(token);
    }
}

async function verifyEmail(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-email/${token}`, {
            method: 'GET'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(data.message || 'Email verified successfully! You can now log in.', 'success');
        } else {
            showNotification(data.error || 'Email verification failed', 'error');
        }
    } catch (error) {
        console.error('Email verification error:', error);
        showNotification('Network error during email verification.', 'error');
    }
}

function showResetPasswordForm(token) {
    // This would show a reset password form with the token
    // For now, just show a message
    showNotification('Please use the reset password link from your email.', 'info');
}

// Notification system (reuse from main.js)
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
