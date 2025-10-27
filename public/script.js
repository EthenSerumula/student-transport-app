document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
});

// Enhanced authentication functions
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

function showTab(tabName, event) {
    document.querySelectorAll('.form').forEach(form => {
        form.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
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

// Enhanced registration with email verification
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const language = document.getElementById('language').value;

    try {
        const response = await fetch('/api/send-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const result = await response.json();
        
        if (result.success) {
            // Redirect to verification page with parameters
            const params = new URLSearchParams({
                email: email,
                username: username,
                password: password,
                language: language,
                demo: 'true',
                code: result.demoCode
            });
            window.location.href = '/verify?' + params.toString();
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
});

// Login function
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

// Forgot password function
document.getElementById('forgotForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    
    try {
        const response = await fetch('/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const result = await response.json();
        
        if (result.success) {
            document.getElementById('forgotMessage').textContent = result.message + ' Code: ' + result.demoCode;
            document.getElementById('forgotMessage').className = 'message success';
            document.getElementById('forgotMessage').style.display = 'block';
        } else {
            document.getElementById('forgotMessage').textContent = result.message;
            document.getElementById('forgotMessage').className = 'message error';
            document.getElementById('forgotMessage').style.display = 'block';
        }
    } catch (error) {
        document.getElementById('forgotMessage').textContent = 'Network error. Please try again.';
        document.getElementById('forgotMessage').className = 'message error';
        document.getElementById('forgotMessage').style.display = 'block';
    }
});

function showPage(page) {
    if (page === 'about') {
        window.location.href = '/about';
    } else if (page === 'account') {
        window.location.href = '/account';
    }
}

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

// Enhanced map functionality with realistic routes
let map;
let markers = [];
let routeLines = [];

function initMap() {
    map = L.map('map').setView([-26.2041, 28.0473], 11);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add Richfield campus marker
    L.marker([-26.2041, 28.0473])
        .addTo(map)
        .bindPopup('<strong>Richfield Campus</strong><br>Starting point for all routes')
        .openPopup();
    
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
        <div class="route-card ${route.popular ? 'popular' : ''}" data-type="${route.type}" data-id="${route.id}">
            <div class="route-header">
                <h3>${route.name} 
                    <span class="route-type ${route.type}">${route.type.toUpperCase()}</span>
                    ${route.popular ? '<span class="popular-badge">POPULAR</span>' : ''}
                </h3>
            </div>
            <p><strong>From:</strong> ${route.from} → <strong>To:</strong> ${route.to}</p>
            <p><strong>Fee:</strong> R${route.fee} | <strong>Time:</strong> ${route.time} min</p>
            <p><strong>Schedule:</strong> ${route.schedule}</p>
            ${route.description ? `<p><strong>Description:</strong> ${route.description}</p>` : ''}
            ${route.safety_note ? `<p style="color: #DA291C; font-weight: bold;"> ${route.safety_note}</p>` : ''}
            <button onclick="showDirections(${route.id})" class="secondary" style="margin-top: 10px;">
                View Directions
            </button>
        </div>
    `).join('');
}

function addMarkersToMap(routes) {
    markers.forEach(marker => map.removeLayer(marker));
    routeLines.forEach(line => map.removeLayer(line));
    markers = [];
    routeLines = [];
    
    routes.forEach(route => {
        let color;
        if (route.type === 'taxi') color = '#0033A0';
        else if (route.type === 'bus') color = '#48bb78';
        else color = '#ed8936';
        
        const icon = L.divIcon({
            html: `<div style="background-color: ${color}; width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
            className: 'custom-marker',
            iconSize: [25, 25]
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
                <br><button onclick="showDirections(${route.id})" style="margin-top: 5px; background: #DA291C; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">View Directions</button>
            `);
        
        markers.push(marker);
        
        // Create realistic route paths based on route type
        const routePath = generateRealisticRoute(route);
        const routeLine = L.polyline(routePath, {
            color: color,
            weight: 4,
            opacity: 0.7,
            dashArray: route.popular ? null : '10, 10'
        }).addTo(map);
        
        routeLines.push(routeLine);
    });
}

// Generate realistic route paths
function generateRealisticRoute(route) {
    const baseLat = -26.2041;
    const baseLng = 28.0473;
    const destLat = route.lat;
    const destLng = route.lng;
    
    // Create curved paths that follow roads
    const midLat = (baseLat + destLat) / 2 + (Math.random() - 0.5) * 0.02;
    const midLng = (baseLng + destLng) / 2 + (Math.random() - 0.5) * 0.02;
    
    return [
        [baseLat, baseLng],
        [midLat, midLng],
        [destLat, destLng]
    ];
}

async function showDirections(routeId) {
    try {
        const response = await fetch(`/api/directions/${routeId}`);
        const directions = await response.json();
        
        const directionsPanel = document.getElementById('directionsPanel');
        const directionsSteps = document.getElementById('directionsSteps');
        
        directionsSteps.innerHTML = directions.steps.map((step, index) => `
            <div class="directions-step">
                <strong>Step ${index + 1}:</strong> ${step}
            </div>
        `).join('');
        
        directionsSteps.innerHTML += `
            <div style="margin-top: 15px; padding: 10px; background: #0033A0; color: white; border-radius: 5px;">
                <strong>Summary:</strong> Total time: ${directions.totalTime} min | Distance: ${directions.totalDistance} | Cost: ${directions.cost}
            </div>
        `;
        
        if (directions.safetyNote) {
            directionsSteps.innerHTML += `
                <div style="margin-top: 10px; padding: 10px; background: #ffeb3b; color: #333; border-radius: 5px; border-left: 4px solid #DA291C;">
                    <strong>Safety Notice:</strong> ${directions.safetyNote}
                </div>
            `;
        }
        
        directionsPanel.style.display = 'block';
        directionsPanel.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error loading directions:', error);
        showMessage('Error loading directions. Please try again.', 'error');
    }
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
    const showPopular = document.getElementById('showPopular').checked;
    
    document.querySelectorAll('.route-card').forEach(card => {
        const type = card.getAttribute('data-type');
        const isPopular = card.classList.contains('popular');
        
        const typeVisible = (type === 'taxi' && showTaxis) || 
                           (type === 'bus' && showBuses) || 
                           (type === 'train' && showTrains);
        
        const popularVisible = !showPopular || isPopular;
        
        if (typeVisible && popularVisible) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
    
    markers.forEach((marker, index) => {
        const routeType = routes[index].type;
        const isPopular = routes[index].popular;
        
        const typeVisible = (routeType === 'taxi' && showTaxis) || 
                           (routeType === 'bus' && showBuses) || 
                           (routeType === 'train' && showTrains);
        
        const popularVisible = !showPopular || isPopular;
        
        if (typeVisible && popularVisible) {
            map.addLayer(marker);
            map.addLayer(routeLines[index]);
        } else {
            map.removeLayer(marker);
            map.removeLayer(routeLines[index]);
        }
    });
}