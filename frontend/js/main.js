// API base URL - adjust this to match your Flask backend
const API_BASE_URL = 'https://deadline-tracker-1-ijdo.onrender.com/api';

// DOM elements
const assignmentsBody = document.getElementById('assignments-body');

// Chart instances
let statusChart, priorityChart;



// Load assignments when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Add a small delay to ensure session cookies are set
    setTimeout(() => {
        checkAuthentication();
    }, 500);
    
    // Add logout button event listener
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    

});



// Check if user is authenticated
async function checkAuthentication() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            credentials: 'include',
            method: 'GET'
        });
        
        if (response.ok) {
            const userData = await response.json();
            // User is authenticated, load assignments and analytics
            loadAssignments();
            loadAnalytics();
        } else {
            // User is not authenticated, redirect to landing page
            window.location.href = 'landing.html';
        }
    } catch (error) {
        console.error('Error checking authentication:', error);
        // If there's an error, redirect to login
        window.location.href = 'login.html';
    }
}









// Global error handler
window.addEventListener('error', function(e) {
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
        
        const response = await fetch(`${API_BASE_URL}/assignments`, {
            credentials: 'include'
        });
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
        
        // Check if assignment is due soon or overdue
        const now = new Date();
        const dueDate = new Date(assignment.due_date);
        const timeDiff = dueDate.getTime() - now.getTime();
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));
        
        let dueClass = '';
        let dueIcon = '';
        
        if (assignment.status === 'completed') {
            dueClass = 'due-completed';
            dueIcon = '✅';
        } else if (minutesDiff < 0) {
            dueClass = 'due-overdue';
            dueIcon = '⚠️';
        } else if (minutesDiff <= 30) {
            dueClass = 'due-urgent';
            dueIcon = '🚨';
        } else if (minutesDiff <= 60) {
            dueClass = 'due-soon';
            dueIcon = '⏰';
        }
        
        row.className = dueClass;
        row.innerHTML = `
            <td>${escapeHtml(assignment.title)}</td>
            <td>${escapeHtml(assignment.description || '')}</td>
            <td>${dueIcon} ${formatDate(assignment.due_date)}</td>
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
            credentials: 'include',
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
            method: 'DELETE',
            credentials: 'include'
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
    // The server now sends dates in EAT format: "YYYY-MM-DD HH:MM:SS"
    try {
        // Parse the EAT datetime string
        const date = new Date(dateString);
        
        // Format as MM/DD/YYYY HH:MM AM/PM (EAT format)
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, '0');
        
        return `${month}/${day}/${year} ${displayHours}:${displayMinutes} ${ampm}`;
    } catch (error) {
        // Fallback to original format if parsing fails
        return dateString;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Notification system
function showNotification(type, title, message, duration = 5000) {
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

// Handle logout
async function handleLogout() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            showNotification('success', 'Logged out successfully');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        } else {
            showNotification('error', 'Logout failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('error', 'Logout failed');
    }
}

// Analytics Functions
async function loadAnalytics() {
    try {
        const response = await fetch(`${API_BASE_URL}/assignments/statistics`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        updateAnalytics(data);
        
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function updateAnalytics(data) {
    // Update summary cards
    document.getElementById('total-count').textContent = data.total;
    document.getElementById('completed-count').textContent = data.completed;
    document.getElementById('overdue-count').textContent = data.overdue;
    document.getElementById('pending-count').textContent = data.pending + data.in_progress;
    
    // Update percentages
    document.getElementById('completed-percentage').textContent = `${data.completion_rate}%`;
    document.getElementById('overdue-percentage').textContent = `${Math.round((data.overdue / data.total * 100) || 0)}%`;
    document.getElementById('pending-percentage').textContent = `${Math.round(((data.pending + data.in_progress) / data.total * 100) || 0)}%`;
    
    // Update detailed analysis
    document.getElementById('due-today').textContent = data.due_today;
    document.getElementById('due-week').textContent = data.due_week;
    document.getElementById('due-next-week').textContent = data.due_next_week;
    document.getElementById('no-due-date').textContent = data.no_due_date;
    
    // Update progress metrics
    document.getElementById('completion-rate').textContent = `${data.completion_rate}%`;
    document.getElementById('ontime-rate').textContent = `${data.ontime_rate}%`;
    
    // Animate progress bars
    setTimeout(() => {
        document.getElementById('completion-bar').style.width = `${data.completion_rate}%`;
        document.getElementById('ontime-bar').style.width = `${data.ontime_rate}%`;
    }, 300);
    
    // Update charts
    updateCharts(data);
}

function updateCharts(data) {
    // Status Distribution Chart
    updateStatusChart(data);
    
    // Priority Breakdown Chart
    updatePriorityChart(data);
}

function updateStatusChart(data) {
    const ctx = document.getElementById('statusChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (statusChart) {
        statusChart.destroy();
    }
    
    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending', 'In Progress', 'Overdue'],
            datasets: [{
                data: [data.completed, data.pending, data.in_progress, data.overdue],
                backgroundColor: [
                    '#10b981', // Green for completed
                    '#f59e0b', // Yellow for pending
                    '#3b82f6', // Blue for in progress
                    '#ef4444'  // Red for overdue
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

function updatePriorityChart(data) {
    const ctx = document.getElementById('priorityChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (priorityChart) {
        priorityChart.destroy();
    }
    
    priorityChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['High Priority', 'Medium Priority', 'Low Priority'],
            datasets: [{
                data: [data.high_priority, data.medium_priority, data.low_priority],
                backgroundColor: [
                    '#ef4444', // Red for high priority
                    '#f59e0b', // Yellow for medium priority
                    '#10b981'  // Green for low priority
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

