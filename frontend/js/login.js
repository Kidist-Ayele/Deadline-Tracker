// Login JavaScript
const API_BASE_URL = CONFIG.API_BASE_URL;

// DOM Elements
const loginForm = document.getElementById('login-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');

// Form toggle elements
const forgotPasswordLink = document.getElementById('forgot-password-link');
const backToLoginLink = document.getElementById('back-to-login-link');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkForEmailVerification();
});

function setupEventListeners() {
    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    
    // Form toggles
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

function showForgotPasswordForm(e) {
    e.preventDefault();
    hideAllForms();
    forgotPasswordForm.style.display = 'block';
    clearAllErrors();
}

function hideAllForms() {
    loginForm.style.display = 'none';
    forgotPasswordForm.style.display = 'none';
}

function setupRealTimeValidation() {
    // Login form validation
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    
    email.addEventListener('blur', () => validateEmail(email));
    password.addEventListener('blur', () => validatePassword(password));
    
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
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Validate inputs
    const isEmailValid = validateEmail(document.getElementById('email'));
    const isPasswordValid = validatePassword(document.getElementById('password'));
    
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
            console.log('✅ Login successful!');
            console.log('👤 User data:', data.user);
            console.log('🍪 Response headers:', [...response.headers.entries()]);
            
            // Check for Set-Cookie header
            const setCookieHeader = response.headers.get('Set-Cookie');
            if (setCookieHeader) {
                console.log('🍪 Set-Cookie header found:', setCookieHeader);
            } else {
                console.log('⚠️ No Set-Cookie header found - session might not be set');
            }
            
            // Store user data in localStorage
            localStorage.setItem('user_id', data.user.id);
            localStorage.setItem('user_name', data.user.first_name + ' ' + data.user.last_name);
            localStorage.setItem('user_email', data.user.email);
            
            console.log('💾 Stored in localStorage:', {
                user_id: localStorage.getItem('user_id'),
                user_name: localStorage.getItem('user_name'),
                user_email: localStorage.getItem('user_email')
            });
            
            showNotification('Login successful! Redirecting...', 'success');
            
            setTimeout(() => {
                console.log('🚀 Redirecting to dashboard...');
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            console.log('❌ Login failed:', data);
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
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
