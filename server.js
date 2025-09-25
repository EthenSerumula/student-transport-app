// Import required modules
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs'); // File system module to read/write JSON files
const path = require('path');

// Create Express app
const app = express();
const PORT = 3000; // Port number our server will run on

// Middleware setup
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.static('public')); // Serve static files from 'public' folder

// Session configuration (for keeping users logged in)
app.use(session({
    secret: 'student-transport-secret', // Secret key for encryption
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // Session lasts 24 hours
}));

// Helper function to read data from JSON files
function readData(filename) {
    try {
        // Read file synchronously (blocks until file is read)
        const data = fs.readFileSync(path.join(__dirname, 'data', filename), 'utf8');
        return JSON.parse(data); // Convert JSON string to JavaScript object
    } catch (error) {
        // If file doesn't exist or has errors, return empty array
        return [];
    }
}

// Helper function to write data to JSON files
function writeData(filename, data) {
    // Write data to file, converting object to JSON string with nice formatting
    fs.writeFileSync(path.join(__dirname, 'data', filename), JSON.stringify(data, null, 2));
}

// Route for user registration
app.post('/register', (req, res) => {
    // Get user data from request body
    const { username, password, language = 'en' } = req.body;
    
    // Basic validation
    if (!username || !password) {
        return res.json({ success: false, message: 'Username and password required' });
    }
    
    // Read existing users
    const users = readData('users.json');
    
    // Check if username already exists
    if (users.find(user => user.username === username)) {
        return res.json({ success: false, message: 'Username already exists' });
    }
    
    // Hash password for security (never store plain text passwords!)
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // Create new user object
    const newUser = {
        id: users.length + 1, // Simple ID generation
        username,
        password: hashedPassword,
        language,
        createdAt: new Date().toISOString()
    };
    
    // Add new user to array and save
    users.push(newUser);
    writeData('users.json', users);
    
    // Store user in session (log them in)
    req.session.user = { id: newUser.id, username, language };
    
    // Send success response
    res.json({ success: true, message: 'Registration successful!' });
});

// Route for user login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.json({ success: false, message: 'Username and password required' });
    }
    
    const users = readData('users.json');
    const user = users.find(u => u.username === username);
    
    // Check if user exists and password matches
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.json({ success: false, message: 'Invalid credentials' });
    }
    
    // Store user in session
    req.session.user = { id: user.id, username: user.username, language: user.language };
    
    res.json({ success: true, message: 'Login successful!' });
});

// Route for logout
app.post('/logout', (req, res) => {
    // Destroy session to log user out
    req.session.destroy();
    res.json({ success: true, message: 'Logged out successfully' });
});

// Route to get transportation data
app.get('/api/routes', (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
        return res.status(401).json({ error: 'Please login first' });
    }
    
    // Read and return route data
    const routes = readData('routes.json');
    res.json(routes);
});

// Route to serve the main page
app.get('/', (req, res) => {
    // If user is logged in, show map, otherwise show login
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'public', 'map.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
});

// Route to serve login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Student Transport App running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});