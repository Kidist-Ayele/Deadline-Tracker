// API base URL - adjust this to match your Flask backend
const API_BASE_URL = 'http://localhost:5000/api';

// DOM elements
const assignmentsBody = document.getElementById('assignments-body');

// Load assignments when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, notification system ready');
    loadAssignments();
});

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showNotification('error', 'JavaScript Error', 'An error occurred. Please check the console for details.');
});

// Function to load all assignments
async function loadAssignments() {
    try {
        // Show loading state
        assignmentsBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="table-error">
                        <div class="loading-spinner"></div>
                        <div class="table-error-title">Loading Assignments...</div>
                        <div class="table-error-message">Please wait while we fetch your assignments.</div>
                    </div>
                </td>
            </tr>
        `;
        
        const response = await fetch(`${API_BASE_URL}/assignments`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const assignments = await response.json();
        displayAssignments(assignments);
    } catch (error) {
        console.error('Error loading assignments:', error);
        assignmentsBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="table-error">
                        <div class="table-error-icon">⚠️</div>
                        <div class="table-error-title">Unable to Load Assignments</div>
                        <div class="table-error-message">We couldn't connect to the server. Please check your internet connection and try again.</div>
                        <button onclick="loadAssignments()" class="table-error-action">Try Again</button>
                    </div>
                </td>
            </tr>
        `;
        showNotification('error', 'Connection Error', 'Unable to load assignments. Please check your connection and try again.');
    }
}

// Function to display assignments in the table
function displayAssignments(assignments) {
    assignmentsBody.innerHTML = '';
    
    if (assignments.length === 0) {
        assignmentsBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="table-error">
                        <div class="table-error-icon">📋</div>
                        <div class="table-error-title">No Assignments Found</div>
                        <div class="table-error-message">You haven't created any assignments yet. Start by adding your first assignment to track your deadlines.</div>
                        <a href="add.html" class="table-error-action">Add Your First Assignment</a>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    assignments.forEach(assignment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(assignment.title)}</td>
            <td>${escapeHtml(assignment.description || '')}</td>
            <td>${formatDate(assignment.due_date)}</td>
            <td><span class="priority-${assignment.priority}">${assignment.priority}</span></td>
            <td><span class="status-${assignment.status.replace(' ', '-')}">${assignment.status}</span></td>
            <td>
                <button class="btn btn-success" onclick="updateStatus(${assignment.id}, 'completed')" 
                        ${assignment.status === 'completed' ? 'disabled' : ''}>
                    Complete
                </button>
                <button class="btn btn-secondary" onclick="editAssignment(${assignment.id})">
                    Edit
                </button>
                <button class="btn btn-danger" onclick="deleteAssignment(${assignment.id})">
                    Delete
                </button>
            </td>
        `;
        assignmentsBody.appendChild(row);
    });
}

// Function to update assignment status
async function updateStatus(id, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Reload the assignments to show updated status
        loadAssignments();
        showNotification('success', 'Status Updated', 'Assignment status has been updated successfully!');
    } catch (error) {
        console.error('Error updating assignment:', error);
        showNotification('error', 'Update Failed', 'Unable to update assignment status. Please try again.');
    }
}

// Function to edit assignment (redirect to edit page)
function editAssignment(id) {
    // For now, redirect to add page with edit mode
    // You can implement a separate edit page or modify add.html to handle editing
    window.location.href = `add.html?edit=${id}`;
}

// Function to delete assignment
async function deleteAssignment(id) {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Reload the assignments to show updated list
        loadAssignments();
        showNotification('success', 'Assignment Deleted', 'The assignment has been successfully removed from your list.');
    } catch (error) {
        console.error('Error deleting assignment:', error);
        showNotification('error', 'Delete Failed', 'Unable to delete the assignment. Please try again.');
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Notification system
function showNotification(type, title, message, duration = 5000) {
    console.log('Showing notification:', type, title, message);
    const container = document.getElementById('notification-container');
    
    if (!container) {
        console.error('Notification container not found!');
        return;
    }
    
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

// Legacy functions for backward compatibility
function showSuccess(message) {
    showNotification('success', 'Success', message);
}

function showError(message) {
    showNotification('error', 'Error', message);
}


