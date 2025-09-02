// API base URL - adjust this to match your Flask backend
const API_BASE_URL = 'http://127.0.0.1:5000/api';

// DOM elements
const addForm = document.getElementById('add-assignment-form');

// Check if we're in edit mode
const urlParams = new URLSearchParams(window.location.search);
const editId = urlParams.get('edit');

// Load assignment data if in edit mode
if (editId) {
    document.querySelector('h1').textContent = 'Edit Assignment';
    document.querySelector('button[type="submit"]').textContent = 'Update Assignment';
    loadAssignmentForEdit(editId);
}

// Form submission handler
addForm.addEventListener('submit', handleFormSubmit);

// Function to handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(addForm);
    
    // Get the due date from the input element to ensure proper format
    const dueDateInput = document.getElementById('due-date');
    const dueDateValue = dueDateInput.value; // This gives us the proper YYYY-MM-DDTHH:MM format
    
    // Use the exact date/time entered by the user (no timezone conversion)
    let dueDateToSend = dueDateValue;
    if (dueDateValue) {
        // Convert to the format expected by the server (YYYY-MM-DD HH:MM:SS)
        dueDateToSend = dueDateValue.replace('T', ' ');
    }
    
    const assignmentData = {
        title: formData.get('title'),
        description: formData.get('description'),
        due_date: dueDateToSend, // Send EAT date to server
        priority: formData.get('priority'),
        status: formData.get('status')
    };
    

    
    // Clear all previous error messages
    clearAllErrors();
    
    // Enhanced validation with inline error messages
    let hasErrors = false;
    
    if (!assignmentData.title.trim()) {
        showFieldError('title', 'Please enter a title for your assignment.');
        document.getElementById('title').focus();
        hasErrors = true;
    }
    
    if (!assignmentData.description.trim()) {
        showFieldError('description', 'Please enter a description for your assignment.');
        if (!hasErrors) document.getElementById('description').focus();
        hasErrors = true;
    }
    
    if (!assignmentData.due_date) {
        showFieldError('due-date', 'Please select a due date and time for your assignment.');
        if (!hasErrors) document.getElementById('due-date').focus();
        hasErrors = true;
    } else {
        // Check if due date is at least 5 minutes in the future
        const selectedDate = new Date(assignmentData.due_date);
        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + (5 * 60 * 1000));
        if (selectedDate < fiveMinutesFromNow) {
            showFieldError('due-date', 'The due date must be at least 5 minutes in the future. Please select a later date and time.');
            if (!hasErrors) document.getElementById('due-date').focus();
            hasErrors = true;
        }
    }
    
    if (!assignmentData.priority) {
        showFieldError('priority', 'Please select a priority level for your assignment.');
        if (!hasErrors) document.getElementById('priority').focus();
        hasErrors = true;
    }
    
    if (!assignmentData.status) {
        showFieldError('status', 'Please select a status for your assignment.');
        if (!hasErrors) document.getElementById('status').focus();
        hasErrors = true;
    }
    
    if (hasErrors) {
        return;
    }
    
    try {
        const url = editId 
            ? `${API_BASE_URL}/assignments/${editId}`
            : `${API_BASE_URL}/assignments`;
        
        const method = editId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(assignmentData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        showNotification('success', 
            editId ? 'Assignment Updated' : 'Assignment Created', 
            editId ? 'Your assignment has been updated successfully!' : 'Your new assignment has been added successfully!'
        );
        
        // Redirect back to the main page after a short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error saving assignment:', error);
        showNotification('error', 'Save Failed', 'Unable to save your assignment. Please check your connection and try again.');
    }
}

// Function to load assignment data for editing
async function loadAssignmentForEdit(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to fetch assignment');
        }
        
        const assignment = await response.json();
        
        // Populate form fields
        document.getElementById('title').value = assignment.title;
        document.getElementById('description').value = assignment.description || '';
        
        // Format date for datetime-local input
        // The server now sends dates in EAT format: "YYYY-MM-DD HH:MM:SS"
        if (assignment.due_date) {
            try {
                const date = new Date(assignment.due_date);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                
                // Format for datetime-local input (YYYY-MM-DDTHH:MM)
                const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
                document.getElementById('due-date').value = formattedDate;
            } catch (error) {
                console.error('Error formatting date:', error);
            }
        }
        
        document.getElementById('priority').value = assignment.priority;
        document.getElementById('status').value = assignment.status;
        
    } catch (error) {
        console.error('Error loading assignment:', error);
        showNotification('error', 'Load Failed', 'Unable to load assignment data. Please try again or go back to the main page.');
    }
}

// Notification system (same as main.js)
function showNotification(type, title, message, duration = 5000) {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    notification.innerHTML = `
        <div class="notification-icon">${icons[type] || 'ℹ️'}</div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove after duration
    if (duration > 0) {
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }
}

// Inline error message functions
function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const fieldElement = document.getElementById(fieldId);
    
    if (errorElement && fieldElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        fieldElement.classList.add('error');
    }
}

function clearFieldError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const fieldElement = document.getElementById(fieldId);
    
    if (errorElement && fieldElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
        fieldElement.classList.remove('error');
    }
}

function clearAllErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    const fieldElements = document.querySelectorAll('.form-group input, .form-group textarea, .form-group select');
    
    errorElements.forEach(element => {
        element.textContent = '';
        element.classList.remove('show');
    });
    
    fieldElements.forEach(element => {
        element.classList.remove('error');
    });
}

// Legacy functions for backward compatibility
function showSuccess(message) {
    showNotification('success', 'Success', message);
}

function showError(message) {
    showNotification('error', 'Error', message);
}

// Enhanced form validation and user experience
document.addEventListener('DOMContentLoaded', function() {
    // Disable browser's native validation
    const form = document.getElementById('add-assignment-form');
    form.setAttribute('novalidate', true);
    
    // Prevent form submission if there are validation errors
    form.addEventListener('submit', function(e) {
        if (!form.checkValidity()) {
            e.preventDefault();
            e.stopPropagation();
        }
    });
    const dueDateInput = document.getElementById('due-date');
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const prioritySelect = document.getElementById('priority');
    const statusSelect = document.getElementById('status');
    
    // Set minimum date to 5 minutes from now for due date input
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + (5 * 60 * 1000));
    const year = fiveMinutesFromNow.getFullYear();
    const month = String(fiveMinutesFromNow.getMonth() + 1).padStart(2, '0');
    const day = String(fiveMinutesFromNow.getDate()).padStart(2, '0');
    const hours = String(fiveMinutesFromNow.getHours()).padStart(2, '0');
    const minutes = String(fiveMinutesFromNow.getMinutes()).padStart(2, '0');
    const minDate = `${year}-${month}-${day}T${hours}:${minutes}`;
    dueDateInput.min = minDate;
    
    // Real-time validation feedback
    titleInput.addEventListener('blur', function() {
        if (!this.value.trim()) {
            showFieldError('title', 'Please enter a title for your assignment.');
        } else {
            clearFieldError('title');
        }
    });
    
    descriptionInput.addEventListener('blur', function() {
        if (!this.value.trim()) {
            showFieldError('description', 'Please enter a description for your assignment.');
        } else {
            clearFieldError('description');
        }
    });
    
    dueDateInput.addEventListener('blur', function() {
        if (!this.value) {
            showFieldError('due-date', 'Please select a due date for your assignment.');
        } else {
            const selectedDate = new Date(this.value);
            const now = new Date();
            // Allow editing assignments that are due soon (within 5 minutes) or in the future
            const fiveMinutesFromNow = new Date(now.getTime() + (5 * 60 * 1000));
            if (selectedDate < fiveMinutesFromNow) {
                showFieldError('due-date', 'Please select a date at least 5 minutes in the future.');
            } else {
                clearFieldError('due-date');
            }
        }
    });
    
    prioritySelect.addEventListener('change', function() {
        if (this.value) {
            clearFieldError('priority');
        } else {
            showFieldError('priority', 'Please select a priority level.');
        }
    });
    
    statusSelect.addEventListener('change', function() {
        if (this.value) {
            clearFieldError('status');
        } else {
            showFieldError('status', 'Please select a status.');
        }
    });
    
    // Clear validation when user starts typing/selecting
    titleInput.addEventListener('input', function() {
        if (this.value.trim()) {
            clearFieldError('title');
        }
    });
    
    descriptionInput.addEventListener('input', function() {
        if (this.value.trim()) {
            clearFieldError('description');
        }
    });
    
    dueDateInput.addEventListener('input', function() {
        clearFieldError('due-date');
    });
});
