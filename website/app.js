// Configuration
const API_BASE_URL = 'http://127.0.0.1:5000';

// Global state
let currentUser = null;
let authToken = null;
let currentAlertFilter = 'all';

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Load stored session
    const stored_token = localStorage.getItem('authToken');
    const stored_user = localStorage.getItem('currentUser');
    
    if (stored_token && stored_user) {
        authToken = stored_token;
        currentUser = JSON.parse(stored_user);
        showApp();
    } else {
        showHomePage();
    }

    // Setup form listeners
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);
    document.getElementById('report-form')?.addEventListener('submit', handleReportSubmit);
});

// ==================== HOME PAGE FUNCTIONS ====================

function showHomePage() {
    document.getElementById('home-page').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('register-container').style.display = 'none';
}

function startPublicSession() {
    currentUser = { role: 'public', name: 'Guest' };
    authToken = null;
    showApp();
}

function showLoginForm(e) {
    e?.preventDefault();
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('register-container').style.display = 'none';
}

function hideLoginForm() {
    document.getElementById('login-container').style.display = 'none';
    showHomePage();
}

function showRegisterForm(e) {
    e?.preventDefault();
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('register-container').style.display = 'flex';
}

function hideRegisterForm() {
    document.getElementById('register-container').style.display = 'none';
    showHomePage();
}

function showApp() {
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    
    // Update user info
    const userWithRole = currentUser?.role === 'official' 
        ? `${currentUser.name} (Official)` 
        : `Guest (Public)`;
    document.getElementById('user-info').textContent = userWithRole;
    
    // Show logout button only for logged-in officials
    if (currentUser?.role === 'official') {
        document.getElementById('logout-btn').style.display = 'inline-block';
        document.getElementById('status-tabs').style.display = 'flex';
    } else {
        document.getElementById('logout-btn').style.display = 'none';
        document.getElementById('status-tabs').style.display = 'none';
    }
    
    loadAlerts();
    loadResources();
    loadReports();

    // Refresh every 30 seconds
    setInterval(() => {
        loadAlerts();
        loadResources();
        loadReports();
    }, 30000);
}

// ==================== AUTHENTICATION ====================

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            errorDiv.textContent = data.error || 'Login failed';
            return;
        }

        // Store session
        authToken = data.token;
        currentUser = { ...data.official, role: 'official' };
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Hide forms and show app
        document.getElementById('login-form').reset();
        errorDiv.textContent = '';
        showApp();
    } catch (error) {
        errorDiv.textContent = 'Connection error. Please try again.';
        console.error('Login error:', error);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-password-confirm').value;
    const errorDiv = document.getElementById('register-error');

    if (password !== confirm) {
        errorDiv.textContent = 'Passwords do not match';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            errorDiv.textContent = data.error || 'Registration failed';
            return;
        }

        errorDiv.textContent = '';
        alert('Registration successful! Please login.');
        showLoginForm();
    } catch (error) {
        errorDiv.textContent = 'Connection error. Please try again.';
        console.error('Register error:', error);
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showHomePage();
}

// ==================== NAVIGATION ====================

function loadAlerts() {
    document.getElementById('alerts-section').style.display = 'block';
    document.getElementById('resources-section').style.display = 'none';
    document.getElementById('reports-section').style.display = 'none';
    fetchAlerts();
}

function loadResources() {
    document.getElementById('alerts-section').style.display = 'none';
    document.getElementById('resources-section').style.display = 'block';
    document.getElementById('reports-section').style.display = 'none';
    fetchResources();
}

function loadReports() {
    document.getElementById('alerts-section').style.display = 'none';
    document.getElementById('resources-section').style.display = 'none';
    document.getElementById('reports-section').style.display = 'block';
}

// ==================== ALERTS ====================

async function fetchAlerts() {
    try {
        const query = currentAlertFilter !== 'all' ? `?status=${currentAlertFilter}` : '';
        const response = await fetch(`${API_BASE_URL}/api/alerts${query}`);
        if (!response.ok) throw new Error('Failed to load alerts');

        const alerts = await response.json();
        displayAlerts(alerts);
    } catch (error) {
        console.error('Error loading alerts:', error);
        document.getElementById('alerts-list').innerHTML = 
            '<p style="color: red;">Failed to load alerts</p>';
    }
}

function displayAlerts(alerts) {
    const container = document.getElementById('alerts-list');
    
    if (!alerts || alerts.length === 0) {
        container.innerHTML = '<p>No alerts at this time.</p>';
        return;
    }

    container.innerHTML = alerts.map(alert => {
        const statusColor = alert.status === 'solved' ? '#27ae60' : '#e74c3c';
        const statusText = alert.status === 'solved' ? '✓ Solved' : '🔴 Active';
        
        return `
            <div class="alert-card" style="border-left: 4px solid ${statusColor};">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h3>${alert.type}</h3>
                        <p><strong>📍 ${alert.location}</strong></p>
                        <p><strong>Status:</strong> ${statusText}</p>
                        <p><strong>Severity:</strong> 
                            <span style="color: ${getSeverityColor(alert.severity)}">${alert.severity}</span>
                        </p>
                        <p>${alert.message}</p>
                        ${alert.photos && alert.photos.length > 0 ? `
                            <p><small>📷 ${alert.photos.length} photo(s)</small></p>
                        ` : ''}
                    </div>
                    <div style="text-align: right;">
                        <button onclick="viewAlertDetail(${alert.id})" class="btn-secondary" style="padding: 5px 10px; font-size: 0.9em;">
                            View Details
                        </button>
                    </div>
                </div>
                <small style="color: #666;">${formatTime(alert.timestamp)}</small>
            </div>
        `;
    }).join('');
}

async function viewAlertDetail(alertId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/alerts/${alertId}`);
        if (!response.ok) throw new Error('Alert not found');

        const alert = await response.json();
        const commentsResponse = await fetch(`${API_BASE_URL}/api/alerts/${alertId}/comments`);
        const comments = commentsResponse.ok ? await commentsResponse.json() : [];

        const modal = document.getElementById('alert-detail-modal');
        const body = document.getElementById('alert-detail-body');

        let detailHTML = `
            <h2>${alert.type} - ${alert.location}</h2>
            <p><strong>Message:</strong> ${alert.message}</p>
            <p><strong>Severity:</strong> <span style="color: ${getSeverityColor(alert.severity)}">${alert.severity}</span></p>
            <p><strong>Status:</strong> 
                <span style="color: ${alert.status === 'solved' ? '#27ae60' : '#e74c3c'}">
                    ${alert.status === 'solved' ? '✓ Solved' : '🔴 Active'}
                </span>
            </p>
            <p><small>${formatTime(alert.timestamp)}</small></p>
        `;

        // Photos section
        if (alert.photos && alert.photos.length > 0) {
            detailHTML += `
                <h3>Photos (${alert.photos.length})</h3>
                <div style="margin: 10px 0;">
                    ${alert.photos.map(photo => `
                        <div style="margin-bottom: 10px; padding: 10px; background: #f0f0f0; border-radius: 5px;">
                            <p><em>${photo.caption || 'No description'}</em></p>
                            <small>${formatTime(photo.uploaded_at)}</small>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Comments section
        detailHTML += `
            <h3>Comments (${comments.length})</h3>
            <div style="border-top: 1px solid #ddd; padding-top: 10px;">
                ${comments.length === 0 ? '<p>No comments yet.</p>' : ''}
                ${comments.map(comment => `
                    <div style="margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 5px;">
                        <p><strong>${comment.text}</strong></p>
                        <small>By Official • ${formatTime(comment.created_at)}</small>
                        ${currentUser?.role === 'official' ? `
                            <button onclick="deleteComment('${comment._id}')" class="btn-danger" style="margin-left: 10px; padding: 3px 8px; font-size: 0.8em;">
                                Delete
                            </button>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;

        // Actions for officials
        if (currentUser?.role === 'official') {
            detailHTML += `
                <div style="margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px;">
                    <h3>Official Actions</h3>
                    ${alert.status === 'active' ? `
                        <button onclick="updateAlertStatus(${alertId}, 'solved')" class="btn-success" style="margin-right: 10px;">
                            ✓ Mark as Solved
                        </button>
                    ` : `
                        <button onclick="updateAlertStatus(${alertId}, 'active')" class="btn-secondary" style="margin-right: 10px;">
                            🔄 Mark as Active
                        </button>
                    `}
                    <button onclick="deleteAlert(${alertId})" class="btn-danger">
                        🗑️ Delete Alert
                    </button>
                </div>
                
                <div style="margin-top: 15px;">
                    <h4>Add Comment</h4>
                    <textarea id="comment-text" placeholder="Write your comment..." rows="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
                    <button onclick="addComment(${alertId})" class="btn-primary" style="margin-top: 10px;">
                        Post Comment
                    </button>
                </div>
                
                <div style="margin-top: 15px;">
                    <h4>Upload Photo</h4>
                    <input type="file" id="photo-input" accept="image/*" style="margin: 10px 0;"/>
                    <input type="text" id="photo-caption" placeholder="Photo description (optional)" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin: 10px 0;"/>
                    <button onclick="uploadPhoto(${alertId})" class="btn-primary">
                        📷 Upload Photo
                    </button>
                </div>
            `;
        }

        body.innerHTML = detailHTML;
        modal.style.display = 'flex';
    } catch (error) {
        console.error('Error loading alert details:', error);
        alert('Failed to load alert details');
    }
}

function closeAlertDetail() {
    document.getElementById('alert-detail-modal').style.display = 'none';
}

function filterAlerts(status) {
    currentAlertFilter = status;
    
    // Update button styles
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    fetchAlerts();
}

async function updateAlertStatus(alertId, newStatus) {
    if (!confirm(`Mark alert as ${newStatus === 'solved' ? 'Solved' : 'Active'}?`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/alerts/${alertId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('Failed to update status');

        alert('Alert status updated');
        closeAlertDetail();
        fetchAlerts();
    } catch (error) {
        alert('Failed to update alert status');
        console.error(error);
    }
}

async function deleteAlert(alertId) {
    if (!confirm('Are you sure you want to delete this alert?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/alerts/${alertId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete alert');

        alert('Alert deleted');
        closeAlertDetail();
        fetchAlerts();
    } catch (error) {
        alert('Failed to delete alert');
        console.error(error);
    }
}

async function addComment(alertId) {
    const text = document.getElementById('comment-text').value.trim();
    if (!text) {
        alert('Please enter a comment');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/alerts/${alertId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ text })
        });

        if (!response.ok) throw new Error('Failed to add comment');

        document.getElementById('comment-text').value = '';
        viewAlertDetail(alertId); // Refresh detail view
    } catch (error) {
        alert('Failed to add comment');
        console.error(error);
    }
}

async function deleteComment(commentId) {
    if (!confirm('Delete this comment?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete comment');

        alert('Comment deleted');
        // Refresh current alert details
        const alertId = new URLSearchParams(window.location.search).get('alertId');
        if (alertId) viewAlertDetail(alertId);
    } catch (error) {
        alert('Failed to delete comment');
        console.error(error);
    }
}

async function uploadPhoto(alertId) {
    const input = document.getElementById('photo-input');
    const caption = document.getElementById('photo-caption').value.trim();

    if (!input.files || input.files.length === 0) {
        alert('Please select a photo');
        return;
    }

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/alerts/${alertId}/photos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    photo: e.target.result,
                    caption: caption || 'Problem photo'
                })
            });

            if (!response.ok) throw new Error('Failed to upload photo');

            alert('Photo uploaded successfully');
            document.getElementById('photo-input').value = '';
            document.getElementById('photo-caption').value = '';
            viewAlertDetail(alertId); // Refresh detail view
        } catch (error) {
            alert('Failed to upload photo');
            console.error(error);
        }
    };

    reader.readAsDataURL(file);
}

// ==================== RESOURCES ====================

async function fetchResources() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/resources`);
        if (!response.ok) throw new Error('Failed to load resources');

        const resources = await response.json();
        displayResources(resources);
    } catch (error) {
        console.error('Error loading resources:', error);
        document.getElementById('resources-list').innerHTML = 
            '<p style="color: red;">Failed to load resources</p>';
    }
}

function displayResources(resources) {
    const container = document.getElementById('resources-list');
    
    if (!resources || resources.length === 0) {
        container.innerHTML = '<p>No resources available.</p>';
        return;
    }

    container.innerHTML = resources.map(resource => `
        <div class="resource-card">
            <h3>${getResourceIcon(resource.type)} ${resource.name}</h3>
            <p><strong>Type:</strong> ${resource.type}</p>
            <p><strong>📍 ${resource.location}</strong></p>
            <p><strong>Distance:</strong> ${resource.distance_km ? `${resource.distance_km} km` : 'N/A'}</p>
            ${resource.capacity ? `<p><strong>Capacity:</strong> ${resource.capacity} people</p>` : ''}
        </div>
    `).join('');
}

// ==================== REPORTS ====================

async function handleReportSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('report-name').value;
    const email = document.getElementById('report-email').value;
    const location = document.getElementById('report-location').value;
    const phone = document.getElementById('report-phone').value;
    const description = document.getElementById('report-description').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/reports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name, email, location, phone, description
            })
        });

        if (!response.ok) throw new Error('Failed to submit report');

        const statusDiv = document.getElementById('report-status');
        statusDiv.innerHTML = '<p style="color: green;">✓ Report submitted successfully!</p>';
        document.getElementById('report-form').reset();

        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 3000);
    } catch (error) {
        alert('Failed to submit report. Please try again.');
        console.error(error);
    }
}

// ==================== UTILITIES ====================

function getSeverityColor(severity) {
    const normalized = (severity || '').toLowerCase();
    const colors = {
        'critical': '#e74c3c',
        'high': '#e67e22',
        'medium': '#f39c12',
        'low': '#3498db'
    };
    return colors[normalized] || '#95a5a6';
}

function getResourceIcon(type) {
    const icons = {
        'hospital': '🏥',
        'shelter': '🏠',
        'rescue': '🚨',
        'water': '💧',
        'food': '🍱',
        'medical': '⚕️'
    };
    return icons[(type || '').toLowerCase()] || '📍';
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
