const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
    secret: 'student-transport-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Simple in-memory storage
let users = [];
let routes = [
    {
        "id": 1,
        "type": "taxi",
        "name": "Faraday Taxi Rank",
        "from": "Faraday",
        "to": "Johannesburg CBD",
        "fee": 25,
        "time": 30,
        "schedule": "5:00 AM - 10:00 PM",
        "lat": -26.2041,
        "lng": 28.0473
    },
    {
        "id": 2,
        "type": "taxi",
        "name": "Bree Taxi Rank",
        "from": "Bree Street",
        "to": "Soweto",
        "fee": 35,
        "time": 45,
        "schedule": "4:30 AM - 11:00 PM",
        "lat": -26.2044,
        "lng": 28.0416
    },
    {
        "id": 3,
        "type": "bus",
        "name": "Gandhi Square Bus Hub",
        "from": "Gandhi Square",
        "to": "Soweto",
        "fee": 15,
        "time": 50,
        "schedule": "5:00 AM - 9:00 PM",
        "lat": -26.2050,
        "lng": 28.0400
    },
    {
        "id": 4,
        "type": "train",
        "name": "Park Station",
        "from": "Park Station",
        "to": "Soweto",
        "fee": 10,
        "time": 35,
        "schedule": "4:30 AM - 10:00 PM",
        "lat": -26.1975,
        "lng": 28.0344
    }
];

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

// Get transportation routes
app.get('/api/routes', (req, res) => {
    console.log('Fetching routes');
    if (!req.session.user) {
        return res.status(401).json({ error: 'Please login first' });
    }
    res.json(routes);
});

// ========== AUTH ROUTES ==========

// Registration route
app.post('/register', (req, res) => {
    console.log('Register attempt:', req.body);
    const { username, password, language = 'en' } = req.body;
    
    if (!username || !password) {
        return res.json({ success: false, message: 'Username and password required' });
    }
    
    if (users.find(user => user.username === username)) {
        return res.json({ success: false, message: 'Username already exists' });
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
        id: users.length + 1,
        username,
        password: hashedPassword,
        language,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    req.session.user = { id: newUser.id, username, language };
    console.log('User registered:', username);
    res.json({ success: true, message: 'Registration successful!' });
});

// Login route
app.post('/login', (req, res) => {
    console.log('Login attempt:', req.body);
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.json({ success: false, message: 'Username and password required' });
    }
    
    const user = users.find(u => u.username === username);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.json({ success: false, message: 'Invalid credentials' });
    }
    
    req.session.user = { id: user.id, username: user.username, language: user.language };
    console.log('User logged in:', username);
    res.json({ success: true, message: 'Login successful!' });
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out successfully' });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚌 Student Transport App running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});