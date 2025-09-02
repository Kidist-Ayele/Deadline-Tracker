// API base URL
const API_BASE_URL = 'http://127.0.0.1:5000/api';

// Chart instances
let statusChart, priorityChart;

// DOM elements
const refreshBtn = document.getElementById('refresh-btn');

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    checkAuthentication();
    
    // Add refresh button event listener
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadAnalytics);
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
            // User is authenticated, load analytics
            loadAnalytics();
        } else {
            // User is not authenticated, redirect to login
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error checking authentication:', error);
        // If there's an error, redirect to login
        window.location.href = 'login.html';
    }
}

// Load analytics data
async function loadAnalytics() {
    try {
        showNotification('info', 'Loading Analytics', 'Fetching your assignment data...');
        
        const response = await fetch(`${API_BASE_URL}/assignments/statistics`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        updateAnalytics(data);
        showNotification('success', 'Analytics Updated', 'Your analytics data has been refreshed!');
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        showNotification('error', 'Load Failed', 'Unable to load analytics data. Please try again.');
    }
}

// Update analytics display
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

// Update charts
function updateCharts(data) {
    // Status Distribution Chart
    updateStatusChart(data);
    
    // Priority Breakdown Chart
    updatePriorityChart(data);
}

// Update Status Chart
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

// Update Priority Chart
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
