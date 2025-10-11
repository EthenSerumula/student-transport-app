// Wait for DOM to load before executing
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus(); // Check if user is logged in
});

// Check user login status with server
async function checkLoginStatus() {
    try {
        const response = await fetch('/api/user'); // API call to check login
        const data = await response.json(); // Parse JSON response
        
        if (data.loggedIn) {
            showMapSection(data.user); // Show main app if logged in
        } else {
            showAuthSection(); // Show login if not logged in
        }
    } catch (error) {
        console.error('Error checking login status:', error);
        showAuthSection(); // Show login on error
    }
}

// Show authentication section (login/register)
function showAuthSection() {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('mapSection').style.display = 'none';
}

// Show main application section with map
function showMapSection(user) {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mapSection').style.display = 'block';
    document.getElementById('username').textContent = user.username; // Set username
    initMap(); // Initialize the map
}

// Switch between login and register tabs
function showTab(tabName, event) {
    // Hide all forms
    document.querySelectorAll('.form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected form and activate corresponding button
    document.getElementById(tabName + 'Form').classList.add('active');
    event.target.classList.add('active');
}

// Display message to user
function showMessage(message, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = message;
    messageEl.className = 'message ' + type;
    messageEl.style.display = 'block';
    
    // Hide message after 5 seconds
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // Prevent form refresh
    
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
            checkLoginStatus(); // Refresh page state
        } else {
            showMessage(result.message, 'error'); // Show error message
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
});

// Handle registration form submission
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

// Handle user logout
async function logout() {
    try {
        const response = await fetch('/logout', { method: 'POST' });
        const result = await response.json();
        
        if (result.success) {
            showAuthSection(); // Return to login screen
        }
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

// Global variables for map functionality
let map;
let markers = [];
let routeLines = [];

// Initialize the map
function initMap() {
    // Create map centered on Richfield campus
    map = L.map('map').setView([-26.2041, 28.0473], 13);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add Richfield campus marker
    L.marker([-26.2041, 28.0473])
        .addTo(map)
        .bindPopup('<strong>Richfield Campus</strong><br>Starting point for all routes')
        .openPopup();
    
    loadRoutes(); // Load transportation data
}

// Load transportation routes from server
async function loadRoutes() {
    try {
        const response = await fetch('/api/routes');
        const routes = await response.json();
        
        displayRoutes(routes); // Display route list
        addMarkersToMap(routes); // Add markers to map
        setupFilters(); // Setup filter controls
    } catch (error) {
        console.error('Error loading routes:', error);
    }
}

// Display routes in the list
function displayRoutes(routes) {
    const routesList = document.getElementById('routesList');
    
    if (routes.length === 0) {
        routesList.innerHTML = '<p>No transportation routes available.</p>';
        return;
    }
    
    // Create HTML for each route
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
            <button onclick="showDirections(${route.id})" class="secondary" style="margin-top: 10px;">
                🗺️ Get Directions
            </button>
        </div>
    `).join('');
}

// Add markers to the map for each route
function addMarkersToMap(routes) {
    // Clear existing markers and routes
    markers.forEach(marker => map.removeLayer(marker));
    routeLines.forEach(line => map.removeLayer(line));
    markers = [];
    routeLines = [];
    
    routes.forEach(route => {
        // Choose color based on route type
        let color;
        if (route.type === 'taxi') color = '#0033A0'; // Blue for taxis
        else if (route.type === 'bus') color = '#48bb78'; // Green for buses
        else color = '#ed8936'; // Orange for trains
        
        // Create custom icon
        const icon = L.divIcon({
            html: `<div style="background-color: ${color}; width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
            className: 'custom-marker',
            iconSize: [25, 25]
        });
        
        // Add marker to map
        const marker = L.marker([route.lat, route.lng], { icon })
            .addTo(map)
            .bindPopup(`
                <strong>${route.name}</strong><br>
                Type: ${route.type}<br>
                From: ${route.from}<br>
                To: ${route.to}<br>
                Fee: R${route.fee}<br>
                Time: ${route.time} min
                <br><button onclick="showDirections(${route.id})" style="margin-top: 5px; background: #DA291C; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Get Directions</button>
            `);
        
        markers.push(marker);
        
        // Draw route line from Richfield to destination
        const routeLine = L.polyline([
            [-26.2041, 28.0473], // Richfield campus
            [route.lat, route.lng] // Destination
        ], {
            color: color,
            weight: 4,
            opacity: 0.7,
            dashArray: route.popular ? null : '10, 10' // Solid line for popular routes
        }).addTo(map);
        
        routeLines.push(routeLine);
    });
}

// Show directions for a specific route
async function showDirections(routeId) {
    try {
        const response = await fetch(`/api/directions/${routeId}`);
        const directions = await response.json();
        
        const directionsPanel = document.getElementById('directionsPanel');
        const directionsSteps = document.getElementById('directionsSteps');
        
        // Display directions steps
        directionsSteps.innerHTML = directions.steps.map((step, index) => `
            <div class="directions-step">
                <strong>Step ${index + 1}:</strong> ${step}
            </div>
        `).join('');
        
        // Add summary
        directionsSteps.innerHTML += `
            <div style="margin-top: 15px; padding: 10px; background: #0033A0; color: white; border-radius: 5px;">
                <strong>Summary:</strong> Total time: ${directions.totalTime} min | Distance: ${directions.totalDistance}
            </div>
        `;
        
        // Show directions panel
        directionsPanel.style.display = 'block';
        
        // Scroll to directions
        directionsPanel.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error loading directions:', error);
        showMessage('Error loading directions. Please try again.', 'error');
    }
}

// Setup filter controls for route types
function setupFilters() {
    const checkboxes = document.querySelectorAll('.filters input');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            filterRoutes(); // Apply filters when checkboxes change
        });
    });
}

// Filter routes based on checkbox selection
function filterRoutes() {
    const showTaxis = document.getElementById('showTaxis').checked;
    const showBuses = document.getElementById('showBuses').checked;
    const showTrains = document.getElementById('showTrains').checked;
    const showPopular = document.getElementById('showPopular').checked;
    
    // Filter route cards
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
    
    // Filter map markers and routes
    markers.forEach((marker, index) => {
        const routeType = index < 2 ? 'taxi' : index === 2 ? 'bus' : 'train';
        const isPopular = index < 2; // First two routes are popular
        
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