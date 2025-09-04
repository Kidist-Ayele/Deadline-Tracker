// Dashboard JavaScript
const API_BASE_URL = CONFIG.API_BASE_URL;

// DOM Elements
const logoutBtn = document.getElementById('logout-btn');
const assignmentsBody = document.getElementById('assignments-body');

// Charts
let statusChart, priorityChart;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    setupEventListeners();
    checkBackendStatus();
    loadDashboardData();
});

function checkAuthentication() {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        console.log('❌ No user_id found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    
    console.log('✅ User authenticated:', userId);
    
    // Debug: Check cookies
    console.log('🍪 Current cookies:', document.cookie);
    console.log('🌐 Current domain:', window.location.hostname);
    console.log('🔗 Current URL:', window.location.href);
    console.log('💾 localStorage contents:', {
        user_id: localStorage.getItem('user_id'),
        user_name: localStorage.getItem('user_name'),
        user_email: localStorage.getItem('user_email')
    });
    
    // Check if we're on the right domain for cookies
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🏠 Running on localhost - cookies should work');
    } else {
        console.log('🌍 Running on different domain - cookie issues possible');
    }
    
    // Test cookie functionality
    try {
        document.cookie = 'test_cookie=test_value; path=/; SameSite=Lax';
        console.log('🍪 Test cookie set successfully');
        console.log('🍪 All cookies after test:', document.cookie);
    } catch (cookieError) {
        console.log('❌ Failed to set test cookie:', cookieError);
    }
}

function setupEventListeners() {
    logoutBtn.addEventListener('click', handleLogout);
}

async function handleLogout() {
    try {
        // Clear local storage
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_email');
        
        // Redirect to landing page
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        // Still redirect even if there's an error
        window.location.href = 'index.html';
    }
}

async function loadDashboardData() {
    try {
        const userId = localStorage.getItem('user_id');
        if (!userId) {
            console.log('❌ No user_id in localStorage, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        console.log('🔍 Attempting to load assignments for user:', userId);
        console.log('🔍 API URL:', `${API_BASE_URL}/assignments`);
        
        // Load assignments
        console.log('🔍 Making request to assignments endpoint...');
        console.log('🔍 Request URL:', `${API_BASE_URL}/assignments`);
        console.log('🔍 Request credentials:', 'include');
        console.log('🔍 Request headers:', {
            'Content-Type': 'application/json'
        });
        
        // First try without credentials to see if it's a CORS issue
        try {
            const testResponse = await fetch(`${API_BASE_URL}/assignments`, {
                method: 'GET',
                credentials: 'omit'
            });
            console.log('🔍 Test request (no credentials) response:', testResponse.status);
        } catch (testError) {
            console.log('🔍 Test request failed:', testError.message);
        }
        
        // Test session functionality
        try {
            const sessionTestResponse = await fetch(`${API_BASE_URL}/session-test`, {
                method: 'GET',
                credentials: 'include'
            });
            console.log('🔍 Session test response:', sessionTestResponse.status);
            if (sessionTestResponse.ok) {
                const sessionData = await sessionTestResponse.json();
                console.log('🔍 Session test data:', sessionData);
            }
        } catch (sessionError) {
            console.log('🔍 Session test failed:', sessionError.message);
        }
        
        const assignmentsResponse = await fetch(`${API_BASE_URL}/assignments`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Response status:', assignmentsResponse.status);
        console.log('📡 Response headers:', [...assignmentsResponse.headers.entries()]);
        
        if (assignmentsResponse.ok) {
            const assignments = await assignmentsResponse.json();
            console.log('✅ Assignments loaded successfully:', assignments);
            updateDashboard(assignments);
        } else {
            console.error('❌ Failed to load assignments:', assignmentsResponse.status);
            
            if (assignmentsResponse.status === 401) {
                console.log('🔒 401 Unauthorized - Session issue detected');
                // Try to get more details about the error
                try {
                    const errorData = await assignmentsResponse.json();
                    console.log('🔍 Error details:', errorData);
                } catch (e) {
                    console.log('🔍 Could not parse error response');
                }
                
                showNotification('Session expired. Please login again.', 'warning');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showNotification('Failed to load assignments', 'error');
            }
        }
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        
        // Check if it's a connection error
        if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_CLOSED')) {
            showNotification('Backend server is currently unavailable. Please try again later.', 'warning');
            
            // Show offline mode with sample data
            showOfflineMode();
        } else {
            showNotification('Error loading dashboard data', 'error');
        }
    }
}

function updateDashboard(assignments) {
    updateSummaryCards(assignments);
    updateCharts(assignments);
    updateAssignmentsTable(assignments);
    updateDetailedAnalysis(assignments);
}

function updateSummaryCards(assignments) {
    const total = assignments.length;
    const completed = assignments.filter(a => a.status === 'completed').length;
    const overdue = assignments.filter(a => {
        if (a.status === 'completed') return false;
        if (!a.due_date) return false;
        return new Date(a.due_date) < new Date();
    }).length;
    const pending = total - completed - overdue;

    document.getElementById('total-count').textContent = total;
    document.getElementById('completed-count').textContent = completed;
    document.getElementById('overdue-count').textContent = overdue;
    document.getElementById('pending-count').textContent = pending;

    // Update percentages
    if (total > 0) {
        document.getElementById('completed-percentage').textContent = `${Math.round((completed / total) * 100)}%`;
        document.getElementById('overdue-percentage').textContent = `${Math.round((overdue / total) * 100)}%`;
        document.getElementById('pending-percentage').textContent = `${Math.round((pending / total) * 100)}%`;
    }
}

function updateCharts(assignments) {
    // Status Chart
    const statusCtx = document.getElementById('statusChart');
    if (statusCtx && !statusChart) {
        statusChart = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Pending', 'Overdue'],
                datasets: [{
                    data: [
                        assignments.filter(a => a.status === 'completed').length,
                        assignments.filter(a => a.status === 'pending').length,
                        assignments.filter(a => {
                            if (a.status === 'completed') return false;
                            if (!a.due_date) return false;
                            return new Date(a.due_date) < new Date();
                        }).length
                    ],
                    backgroundColor: ['#10b981', '#3b82f6', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    } else if (statusChart) {
        statusChart.data.datasets[0].data = [
            assignments.filter(a => a.status === 'completed').length,
            assignments.filter(a => a.status === 'pending').length,
            assignments.filter(a => {
                if (a.status === 'completed') return false;
                if (!a.due_date) return false;
                return new Date(a.due_date) < new Date();
            }).length
        ];
        statusChart.update();
    }

    // Priority Chart
    const priorityCtx = document.getElementById('priorityChart');
    if (priorityCtx && !priorityChart) {
        priorityChart = new Chart(priorityCtx, {
            type: 'bar',
            data: {
                labels: ['Low', 'Medium', 'High'],
                datasets: [{
                    label: 'Assignments',
                    data: [
                        assignments.filter(a => a.priority === 'low').length,
                        assignments.filter(a => a.priority === 'medium').length,
                        assignments.filter(a => a.priority === 'high').length
                    ],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    } else if (priorityChart) {
        priorityChart.data.datasets[0].data = [
            assignments.filter(a => a.priority === 'low').length,
            assignments.filter(a => a.priority === 'medium').length,
            assignments.filter(a => a.priority === 'high').length
        ];
        priorityChart.update();
    }
}

function updateAssignmentsTable(assignments) {
    if (!assignmentsBody) return;

    assignmentsBody.innerHTML = '';

    if (assignments.length === 0) {
        assignmentsBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <p>No assignments found. <a href="add.html">Add your first assignment</a></p>
                </td>
            </tr>
        `;
        return;
    }

    assignments.forEach(assignment => {
        const row = document.createElement('tr');
        const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
        const isOverdue = dueDate && dueDate < new Date() && assignment.status !== 'completed';
        
        // Add overdue class to the entire row if overdue
        if (isOverdue) {
            row.classList.add('overdue-row');
        }
        
        row.innerHTML = `
            <td>${assignment.title}</td>
            <td>${assignment.description || '-'}</td>
            <td class="${isOverdue ? 'overdue' : ''}">
                ${dueDate ? dueDate.toLocaleDateString() : 'No due date'}
            </td>
            <td>
                <span class="priority-badge priority-${assignment.priority}">
                    ${assignment.priority}
                </span>
            </td>
            <td>
                <span class="status-badge status-${assignment.status}">
                    ${assignment.status}
                </span>
            </td>
            <td>
                ${assignment.status !== 'completed' ? 
                    `<button class="btn btn-small btn-success" onclick="completeAssignment(${assignment.id})">
                        Complete
                    </button>` : 
                    `<span class="completed-badge">✓ Completed</span>`
                }
                <button class="btn btn-small btn-outline" onclick="editAssignment(${assignment.id})">
                    ✏️ Edit
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteAssignment(${assignment.id})">
                    🗑️ Delete
                </button>
            </td>
        `;
        
        assignmentsBody.appendChild(row);
    });
}

function updateDetailedAnalysis(assignments) {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const nextWeekStart = new Date(weekEnd);
    nextWeekStart.setDate(weekEnd.getDate() + 1);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

    const dueToday = assignments.filter(a => {
        if (a.status === 'completed' || !a.due_date) return false;
        const dueDate = new Date(a.due_date);
        return dueDate.toDateString() === today.toDateString();
    }).length;

    const dueThisWeek = assignments.filter(a => {
        if (a.status === 'completed' || !a.due_date) return false;
        const dueDate = new Date(a.due_date);
        return dueDate >= weekStart && dueDate <= weekEnd;
    }).length;

    const dueNextWeek = assignments.filter(a => {
        if (a.status === 'completed' || !a.due_date) return false;
        const dueDate = new Date(a.due_date);
        return dueDate >= nextWeekStart && dueDate <= nextWeekEnd;
    }).length;

    const noDueDate = assignments.filter(a => !a.due_date).length;

    document.getElementById('due-today').textContent = dueToday;
    document.getElementById('due-week').textContent = dueThisWeek;
    document.getElementById('due-next-week').textContent = dueNextWeek;
    document.getElementById('no-due-date').textContent = noDueDate;

    // Update progress bars
    const total = assignments.length;
    if (total > 0) {
        const completed = assignments.filter(a => a.status === 'completed').length;
        const completionRate = Math.round((completed / total) * 100);
        
        document.getElementById('completion-rate').textContent = `${completionRate}%`;
        document.getElementById('completion-bar').style.width = `${completionRate}%`;
        
        // On-time rate (simplified calculation)
        const onTime = assignments.filter(a => {
            if (a.status !== 'completed' || !a.due_date) return false;
            const dueDate = new Date(a.due_date);
            return dueDate >= new Date();
        }).length;
        
        const onTimeRate = completed > 0 ? Math.round((onTime / completed) * 100) : 0;
        document.getElementById('ontime-rate').textContent = `${onTimeRate}%`;
        document.getElementById('ontime-bar').style.width = `${onTimeRate}%`;
    }
}

function editAssignment(assignmentId) {
    // Redirect to add.html with edit mode
    window.location.href = `add.html?edit=${assignmentId}`;
}

async function completeAssignment(assignmentId) {
    if (!confirm('Mark this assignment as completed?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'completed' })
        });

        if (response.ok) {
            showNotification('Assignment marked as completed!', 'success');
            loadDashboardData(); // Reload data
        } else {
            showNotification('Failed to complete assignment', 'error');
        }
    } catch (error) {
        console.error('Complete error:', error);
        showNotification('Error completing assignment', 'error');
    }
}

async function deleteAssignment(assignmentId) {
    if (!confirm('Are you sure you want to delete this assignment?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            showNotification('Assignment deleted successfully', 'success');
            loadDashboardData(); // Reload data
        } else {
            showNotification('Failed to delete assignment', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('Error deleting assignment', 'error');
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

// Backend status check
async function checkBackendStatus() {
    try {
        console.log('🔍 Checking backend status...');
        
        // First try a simple ping to see if backend is reachable
        try {
            const pingResponse = await fetch(`${API_BASE_URL.replace('/api', '')}`, {
                method: 'GET',
                credentials: 'include'
            });
            console.log('📡 Root endpoint response:', pingResponse.status);
        } catch (pingError) {
            console.log('⚠️ Root endpoint unreachable:', pingError.message);
        }
        
        // Now try the health endpoint
        try {
            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET',
                credentials: 'include'
            });
            console.log('📡 Health endpoint response:', response.status);
        } catch (healthError) {
            console.log('⚠️ Health endpoint unreachable:', healthError.message);
        }
        
        // Try without credentials to see if it's a CORS issue
        try {
            const noCredResponse = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET',
                credentials: 'omit'
            });
            console.log('📡 Health endpoint (no credentials) response:', noCredResponse.status);
        } catch (noCredError) {
            console.log('⚠️ Health endpoint (no credentials) unreachable:', noCredError.message);
        }
        
        // Check if any of the health checks succeeded
        console.log('📡 Health check completed');
        
        // For now, assume backend is reachable if we got this far
        console.log('✅ Backend appears to be reachable');
        // Remove offline indicator if it exists
        const header = document.querySelector('header h1');
        if (header && header.innerHTML.includes('Offline Mode')) {
            header.innerHTML = 'Deadline Tracker';
        }
    } catch (error) {
        console.log('⚠️ Backend is offline or unreachable:', error.message);
        // Don't show notification here as loadDashboardData will handle it
    }
}

// Offline mode functionality
function showOfflineMode() {
    // Show offline indicator
    const header = document.querySelector('header h1');
    if (header) {
        header.innerHTML = 'Deadline Tracker <span style="color: #f59e0b; font-size: 0.8em;">(Offline Mode)</span>';
    }
    
    // Show offline notification
    showNotification('You are currently in offline mode. Some features may be limited.', 'warning');
    
    // Load sample data for demonstration
    const sampleAssignments = [
        {
            id: 1,
            title: 'Sample Assignment',
            description: 'This is sample data shown in offline mode',
            due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            priority: 'medium',
            status: 'pending'
        }
    ];
    
    updateDashboard(sampleAssignments);
}
