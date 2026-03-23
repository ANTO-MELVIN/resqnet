// Configuration
const API_BASE_URL = 'http://127.0.0.1:5000';

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    checkSystemStatus();
    loadAlerts();
    loadResources();
    loadReports();
    
    // Refresh data every 30 seconds
    setInterval(() => {
        loadAlerts();
        loadResources();
        loadReports();
    }, 30000);
});

// Check system status
async function checkSystemStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        
        // Update backend status
        const backendStatus = document.getElementById('backend-status');
        if (response.ok) {
            backendStatus.textContent = '✓ Online';
            backendStatus.className = 'status-online';
        } else {
            backendStatus.textContent = '✗ Offline';
            backendStatus.className = 'status-offline';
        }
        
        // Update database status
        const dbStatus = document.getElementById('db-status');
        if (data.dbConnected) {
            dbStatus.textContent = '✓ Connected';
            dbStatus.className = 'status-online';
        } else {
            dbStatus.textContent = '✗ Disconnected';
            dbStatus.className = 'status-offline';
        }
        
        // Update footer status
        document.getElementById('footer-status').textContent = 
            `Running on ${API_BASE_URL}`;
            
    } catch (error) {
        console.error('Status check failed:', error);
        document.getElementById('backend-status').textContent = '✗ Offline';
        document.getElementById('backend-status').className = 'status-offline';
    }
}

// Load alerts from API
async function loadAlerts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/alerts`);
        if (!response.ok) throw new Error('Failed to load alerts');
        
        const data = await response.json();
        const alerts = Array.isArray(data) ? data : (data.alerts || []);
        const container = document.getElementById('alerts-container');
        
        if (alerts.length === 0) {
            container.innerHTML = '<p class="loading">No active alerts at this time.</p>';
            document.getElementById('alert-count').textContent = '0';
            return;
        }
        
        document.getElementById('alert-count').textContent = alerts.length;
        
        container.innerHTML = alerts.map(alert => `
            <div class="alert-card">
                <h3>${alert.type}</h3>
                <p><strong>Location:</strong> ${alert.location}</p>
                <p><strong>Severity:</strong> <span style="color: ${getSeverityColor(alert.severity)}">${alert.severity}</span></p>
                <p>${alert.message || alert.description || 'No additional details provided.'}</p>
                <div class="alert-time">
                    <small>Reported: ${formatTime(alert.timestamp)}</small>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading alerts:', error);
        document.getElementById('alerts-container').innerHTML = 
            '<p class="error-message">Failed to load alerts. Check backend connection.</p>';
    }
}

// Load resources from API
async function loadResources() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/resources`);
        if (!response.ok) throw new Error('Failed to load resources');
        
        const data = await response.json();
        const resources = Array.isArray(data) ? data : (data.resources || []);
        const container = document.getElementById('resources-container');
        
        if (resources.length === 0) {
            container.innerHTML = '<p class="loading">No resources available.</p>';
            return;
        }
        
        container.innerHTML = resources.map(resource => `
            <div class="resource-card">
                <h3>${getResourceIcon(resource.type)} ${resource.name}</h3>
                <p><strong>Type:</strong> <span class="resource-type">${resource.type}</span></p>
                <p><strong>Location:</strong> ${resource.location}</p>
                <p><strong>Distance:</strong> ${resource.distance_km ? `${resource.distance_km} km` : 'N/A'}</p>
                <p>${resource.description || 'Resource details available from command center.'}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading resources:', error);
        document.getElementById('resources-container').innerHTML = 
            '<p class="error-message">Failed to load resources. Check backend connection.</p>';
    }
}

// Load reports from API
async function loadReports() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/reports`);
        if (!response.ok) throw new Error('Failed to load reports');
        
        const data = await response.json();
        const reports = Array.isArray(data) ? data : (data.reports || []);
        const container = document.getElementById('reports-container');
        
        if (reports.length === 0) {
            container.innerHTML = '<p class="loading">No reports yet.</p>';
            return;
        }
        
        container.innerHTML = reports.map(report => `
            <div class="report-card">
                <h4>Emergency Report</h4>
                <p class="location">📍 ${report.location}</p>
                <p class="description">${report.description}</p>
                <p class="time"><small>${formatTime(report.timestamp)}</small></p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading reports:', error);
        document.getElementById('reports-container').innerHTML = 
            '<p class="error-message">Failed to load reports. Check backend connection.</p>';
    }
}

// Submit new report
async function submitReport(event) {
    event.preventDefault();
    
    const location = document.getElementById('location').value;
    const description = document.getElementById('description').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/reports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                location: location,
                description: description,
                timestamp: new Date().toISOString()
            })
        });
        
        if (!response.ok) throw new Error('Failed to submit report');
        
        // Show success message
        const form = event.target;
        const formContainer = form.parentElement;
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.textContent = '✓ Report submitted successfully!';
        formContainer.insertBefore(messageDiv, form);
        
        // Clear form
        form.reset();
        
        // Reload reports
        setTimeout(() => {
            loadReports();
            messageDiv.remove();
        }, 2000);
    } catch (error) {
        console.error('Error submitting report:', error);
        alert('Failed to submit report. Please try again.');
    }
}

// Utility Functions
function getSeverityColor(severity) {
    const normalizedSeverity = (severity || '').toString().toLowerCase();
    const severityColors = {
        'critical': '#e74c3c',
        'high': '#e67e22',
        'medium': '#f39c12',
        'low': '#3498db'
    };
    return severityColors[normalizedSeverity] || '#95a5a6';
}

function getResourceIcon(type) {
    const normalizedType = (type || '').toString().toLowerCase();
    const icons = {
        'hospital': '🏥',
        'shelter': '🏠',
        'rescue': '🚨',
        'medical': '⚕️',
        'food': '🍱',
        'water': '💧',
        'default': '📍'
    };
    return icons[normalizedType] || icons['default'];
}

function formatTime(timestamp) {
    try {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return timestamp;
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Handle navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        scrollToSection(href.substring(1));
    });
});
