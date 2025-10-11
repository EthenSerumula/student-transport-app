// Import required modules
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs'); // Added for file system operations

// Create Express app
const app = express();
const PORT = 3000;

// Middleware setup
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.static('public')); // Serve static files

// Session configuration for user authentication
app.use(session({
    secret: 'richfield-transport-secret', // Secret key for session encryption
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // Session lasts 24 hours
}));

// Load routes from JSON file
let routes = [];
try {
    const routesData = fs.readFileSync(path.join(__dirname, 'data', 'routes.json'), 'utf8');
    routes = JSON.parse(routesData);
    console.log('Loaded routes from JSON file');
} catch (error) {
    console.log('Error loading routes, using empty array');
}

// Load users from JSON file  
let users = [];
try {
    const usersData = fs.readFileSync(path.join(__dirname, 'data', 'users.json'), 'utf8');
    users = JSON.parse(usersData);
    console.log('Loaded users from JSON file');
} catch (error) {
    console.log('Error loading users, using empty array');
}

// Add function to save users to JSON file
function saveUsers() {
    fs.writeFileSync(
        path.join(__dirname, 'data', 'users.json'), 
        JSON.stringify(users, null, 2)
    );
}

// Richfield campus location (central point for route calculations)
const RICHFIELD_CAMPUS = {
    lat: -26.2041,
    lng: 28.0473,
    name: "Richfield Campus"
};

// ========== API ROUTES ==========

// Check user login status
app.get('/api/user', (req, res) => {
    console.log('Checking user status');
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// Get all transportation routes
app.get('/api/routes', (req, res) => {
    console.log('Fetching routes');
    if (!req.session.user) {
        return res.status(401).json({ error: 'Please login first' });
    }
    res.json(routes);
});

// Get route directions from Richfield to a specific location
app.get('/api/directions/:routeId', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Please login first' });
    }
    
    const routeId = parseInt(req.params.routeId);
    const route = routes.find(r => r.id === routeId);
    
    if (!route) {
        return res.status(404).json({ error: 'Route not found' });
    }
    
    // Simulate route directions (in real app, use Google Maps API)
    const directions = {
        steps: [
            `Start from Richfield Campus`,
            `Walk to ${route.name}`,
            `Take ${route.type} to ${route.to}`,
            `Arrive at destination`
        ],
        totalTime: route.time + 10, // Add walking time
        totalDistance: 'Approx 5km'
    };
    
    res.json(directions);
});

// ========== AUTH ROUTES ==========

// User registration
app.post('/register', (req, res) => {
    console.log('Register attempt:', req.body);
    const { username, password, language = 'en' } = req.body;
    
    // Input validation
    if (!username || !password) {
        return res.json({ success: false, message: 'Username and password required' });
    }
    
    // Check if username already exists
    if (users.find(user => user.username === username)) {
        return res.json({ success: false, message: 'Username already exists' });
    }
    
    // Hash password for security
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
        id: users.length + 1,
        username,
        password: hashedPassword,
        language,
        createdAt: new Date().toISOString()
    };
    
    // Save user and create session
    users.push(newUser);
    saveUsers(); // Save to JSON file
    req.session.user = { id: newUser.id, username, language };
    console.log('User registered:', username);
    res.json({ success: true, message: 'Registration successful!' });
});

// User login
app.post('/login', (req, res) => {
    console.log('Login attempt:', req.body);
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.json({ success: false, message: 'Username and password required' });
    }
    
    // Find user and verify password
    const user = users.find(u => u.username === username);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.json({ success: false, message: 'Invalid credentials' });
    }
    
    // Create session
    req.session.user = { id: user.id, username: user.username, language: user.language };
    console.log('User logged in:', username);
    res.json({ success: true, message: 'Login successful!' });
});

// User logout
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out successfully' });
});

// ========== PAGE ROUTES ==========

// Serve main application page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve about page (new page transition)
app.get('/about', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚌 Richfield Student Transport Guide running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});