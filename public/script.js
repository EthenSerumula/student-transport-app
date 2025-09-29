document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
});

async function checkLoginStatus() {
    try {
        const response = await fetch('/api/user');
        const data = await response.json();
        
        if (data.loggedIn) {
            showMapSection(data.user);
        } else {
            showAuthSection();
        }
    } catch (error) {
        console.error('Error checking login status:', error);
        showAuthSection();
    }
}

function showAuthSection() {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('mapSection').style.display = 'none';
}

function showMapSection(user) {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mapSection').style.display = 'block';
    document.getElementById('username').textContent = user.username;
    initMap();
}

// FIXED: Added event parameter to fix the error
function showTab(tabName, event) {
    // Hide all forms
    document.querySelectorAll('.form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected form and activate button
    document.getElementById(tabName + 'Form').classList.add('active');
    event.target.classList.add('active');
}

function showMessage(message, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = message;
    messageEl.className = 'message ' + type;
    messageEl.style.display = 'block';
    
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            checkLoginStatus();
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
});

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const language = document.getElementById('language').value;
    
    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, language })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(result.message, 'success');
            setTimeout(() => {
                // Switch to login tab after successful registration
                document.querySelectorAll('.form').forEach(form => form.classList.remove('active'));
                document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
                document.getElementById('loginForm').classList.add('active');
                document.querySelector('.tab-button').classList.add('active');
            }, 2000);
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
});

async function logout() {
    try {
        const response = await fetch('/logout', { method: 'POST' });
        const result = await response.json();
        
        if (result.success) {
            showAuthSection();
        }
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

let map;
let markers = [];

function initMap() {
    map = L.map('map').setView([-26.2041, 28.0473], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    loadRoutes();
}

async function loadRoutes() {
    try {
        const response = await fetch('/api/routes');
        const routes = await response.json();
        
        displayRoutes(routes);
        addMarkersToMap(routes);
        setupFilters();
    } catch (error) {
        console.error('Error loading routes:', error);
    }
}

function displayRoutes(routes) {
    const routesList = document.getElementById('routesList');
    
    if (routes.length === 0) {
        routesList.innerHTML = '<p>No transportation routes available.</p>';
        return;
    }
    
    routesList.innerHTML = routes.map(route => `
        <div class="route-card" data-type="${route.type}">
            <h3>${route.name} <span class="route-type ${route.type}">${route.type.toUpperCase()}</span></h3>
            <p><strong>From:</strong> ${route.from} → <strong>To:</strong> ${route.to}</p>
            <p><strong>Fee:</strong> R${route.fee} | <strong>Time:</strong> ${route.time} min</p>
            <p><strong>Schedule:</strong> ${route.schedule}</p>
        </div>
    `).join('');
}

function addMarkersToMap(routes) {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    routes.forEach(route => {
        let color;
        if (route.type === 'taxi') color = 'blue';
        else if (route.type === 'bus') color = 'green';
        else color = 'orange';
        
        const icon = L.divIcon({
            html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
            className: 'custom-marker',
            iconSize: [20, 20]
        });
        
        const marker = L.marker([route.lat, route.lng], { icon })
            .addTo(map)
            .bindPopup(`
                <strong>${route.name}</strong><br>
                Type: ${route.type}<br>
                From: ${route.from}<br>
                To: ${route.to}<br>
                Fee: R${route.fee}<br>
                Time: ${route.time} min
            `);
        
        markers.push(marker);
    });
}

function setupFilters() {
    const checkboxes = document.querySelectorAll('.filters input');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            filterRoutes();
        });
    });
}

function filterRoutes() {
    const showTaxis = document.getElementById('showTaxis').checked;
    const showBuses = document.getElementById('showBuses').checked;
    const showTrains = document.getElementById('showTrains').checked;
    
    document.querySelectorAll('.route-card').forEach(card => {
        const type = card.getAttribute('data-type');
        
        if ((type === 'taxi' && showTaxis) || 
            (type === 'bus' && showBuses) || 
            (type === 'train' && showTrains)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}