const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
    secret: 'richfield-enhanced-secret-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Email configuration - Replace with your actual Gmail credentials
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'serumulaethan14@gmail.com',
        pass: 'ljlfdjxmmgoktqkq'
    }
});

// For demo mode (comment out the above and uncomment below):
/*
const emailTransporter = {
    sendMail: async function(mailOptions) {
        console.log(' DEMO MODE - Email would be sent to:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('Language:', mailOptions.language || 'en');
        return { messageId: 'demo-mode' };
    }
};
*/

// Database file paths
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const ROUTES_FILE = path.join(__dirname, 'data', 'routes.json');

// Load language translations
const translations = {
    en: {
        verification_subject: 'Richfield Transport - Email Verification Code',
        verification_title: 'Email Verification Required',
        verification_message: 'Your verification code is:',
        verification_instructions: 'This code will expire in 10 minutes. Enter this code on the verification page to complete your registration.',
        reset_subject: 'Richfield Transport - Password Reset Code',
        reset_title: 'Password Reset Request',
        reset_message: 'Your password reset code is:',
        reset_instructions: 'This code will expire in 15 minutes. Enter this code to reset your password.',
        delete_subject: 'Richfield Transport - Account Deletion Verification',
        delete_title: 'Account Deletion Request',
        delete_warning: 'WARNING: This action cannot be undone!',
        delete_message: 'Your account deletion verification code is:',
        delete_instructions: 'This code will expire in 10 minutes. Enter this code to permanently delete your account.',
        footer_note: 'If you didn\'t request this, please ignore this email.',
        slogan: 'Richfield Student Transport Guide - You will never travel alone.'
    },
    zu: {
        verification_subject: 'Richfield Transport - Ikhodi Yokuqinisekisa I-imeyili',
        verification_title: 'Ukuqinisekiswa Kwe-imeyili Kuyadingeka',
        verification_message: 'Ikhodi yakho yokuqinisekisa iyi:',
        verification_instructions: 'Le khodi izophelelwa isikhathi emizuzwini eyi-10. Faka le khodi ekhasini lokuqinisekisa ukuze uqedze ukubhalisa kwakho.',
        reset_subject: 'Richfield Transport - Ikhodi Yokusetha Kabusha Iphasiwedi',
        reset_title: 'Isicelo Sokusetha Kabusha Iphasiwedi',
        reset_message: 'Ikhodi yakho yokusetha kabusha iphasiwedi iyi:',
        reset_instructions: 'Le khodi izophelelwa isikhathi emizuzwini eyi-15. Faka le khodi ukuze usethe kabusha iphasiwedi yakho.',
        delete_subject: 'Richfield Transport - Ukuqinisekiswa Kokucisha I-akhawunti',
        delete_title: 'Isicelo Sokucisha I-akhawunti',
        delete_warning: 'ISEXWAYISO: Lesi senzo asikwazi ukuhlehliswa!',
        delete_message: 'Ikhodi yakho yokuqinisekisa ukucisha i-akhawunti iyi:',
        delete_instructions: 'Le khodi izophelelwa isikhathi emizuzwini eyi-10. Faka le khodi ukuze ucishe i-akhawunti yakho unomphela.',
        footer_note: 'Uma ungazange ucele lokhu, nceble ungayinaki le imeyili.',
        slogan: 'Umhlahlandlela Wezokuthutha Wabafundi Base-Richfield - Ngeke uhambe wedwa.'
    },
    st: {
        verification_subject: 'Richfield Transport - Khoutu ya Tiiisetso ya Email',
        verification_title: 'Tiiisetso ya Email e a Nyakega',
        verification_message: 'Khoutu ya gago ya tiiisetso ke:',
        verification_instructions: 'Khoutu e e tla felela ka morago ga metsotso e le 10. Kenya khoutu e letlobapeding la tiiisetso go fedisa ngwadisiso ya gago.',
        reset_subject: 'Richfield Transport - Khoutu ya Go seta Patswote gape',
        reset_title: 'Kopo ya Go seta Patswote gape',
        reset_message: 'Khoutu ya gago ya go seta patswote gape ke:',
        reset_instructions: 'Khoutu e e tla felela ka morago ga metsotso e le 15. Kenya khoutu e go seta patswote ya gago gape.',
        delete_subject: 'Richfield Transport - Tiiisetso ya Go phimola Akhaonte',
        delete_title: 'Kopo ya Go phimola Akhaonte',
        delete_warning: 'TLHOKOMELISO: Ketso e ga e ka boe e retolosiwa!',
        delete_message: 'Khoutu ya gago ya tiiisetso ya go phimola akhaonte ke:',
        delete_instructions: 'Khoutu e e tla felela ka morago ga metsotso e le 10. Kenya khoutu e go phimola akhaonte ya gago ka botlalo.',
        footer_note: 'Fa o sa kopang seno, akga o se ineele email e.',
        slogan: 'Tataiso ya Dithuthi ya Baithuti ba Richfield - Ngeke o ise o le nosi.'
    }
};

// Load data from JSON files
function loadUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = fs.readFileSync(USERS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
    return [];
}

function loadRoutes() {
    try {
        if (fs.existsSync(ROUTES_FILE)) {
            const data = fs.readFileSync(ROUTES_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading routes:', error);
    }
    return getDefaultRoutes();
}

// Save data to JSON files
function saveUsers(users) {
    try {
        const dataDir = path.dirname(USERS_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        return false;
    }
}

function saveRoutes(routes) {
    try {
        const dataDir = path.dirname(ROUTES_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(ROUTES_FILE, JSON.stringify(routes, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving routes:', error);
        return false;
    }
}

// Initialize data
let users = loadUsers();
let routes = loadRoutes();
let verificationCodes = {};
let passwordResetTokens = {};

// Default routes data
function getDefaultRoutes() {
    return [
        {
            "id": 1, "type": "taxi", "name": "Faraday Taxi Rank", "from": "Richfield Campus", "to": "Johannesburg CBD",
            "fee": 25, "time": 30, "schedule": "5:00 AM - 10:00 PM", "lat": -26.2041, "lng": 28.0473, "popular": true,
            "description": "Direct taxi service to Johannesburg CBD"
        },
        {
            "id": 2, "type": "taxi", "name": "Bree Taxi Rank", "from": "Richfield Campus", "to": "Soweto",
            "fee": 35, "time": 45, "schedule": "4:30 AM - 11:00 PM", "lat": -26.2044, "lng": 28.0416, "popular": true,
            "description": "Taxi service to Soweto area"
        },
        {
            "id": 3, "type": "bus", "name": "Park Station Bus Hub", "from": "Park Station", "to": "Soweto",
            "fee": 15, "time": 50, "schedule": "5:00 AM - 9:00 PM", "lat": -26.1975, "lng": 28.0344, "popular": false,
            "description": "Bus service from Park Station to Soweto"
        },
        {
            "id": 4, "type": "bus", "name": "Park Station to Pretoria", "from": "Park Station", "to": "Pretoria",
            "fee": 40, "time": 90, "schedule": "5:30 AM - 8:00 PM", "lat": -26.1975, "lng": 28.0344, "popular": true,
            "description": "Express bus service to Pretoria"
        },
        {
            "id": 5, "type": "train", "name": "PRASA: Johannesburg to Pretoria", "from": "Park Station", "to": "Pretoria Station",
            "fee": 25, "time": 60, "schedule": "5:00 AM - 8:00 PM", "lat": -26.1975, "lng": 28.0344, "popular": true,
            "description": "Commuter train via Marlboro, Midrand, Centurion",
            "safety_note": "Travel during daylight hours. Be aware of surroundings."
        }
    ];
}

// Generate verification code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification email with language support
async function sendVerificationEmail(email, code, language = 'en') {
    try {
        const lang = translations[language] || translations.en;
        
        const mailOptions = {
            from: 'richfield.transport@example.com',
            to: email,
            subject: lang.verification_subject,
            html: `
                <div style="font-family: Arial, sans-serif; background: linear-gradient(135deg, #0033A0, #DA291C); padding: 20px; color: white;">
                    <h2 style="text-align: center;"> Richfield Student Transport Guide</h2>
                    <div style="background: white; color: #333; padding: 25px; border-radius: 10px; margin-top: 15px;">
                        <h3 style="color: #0033A0; text-align: center;">${lang.verification_title}</h3>
                        <p style="font-size: 16px; text-align: center;">${lang.verification_message}</p>
                        <div style="background: #0033A0; color: white; padding: 15px; border-radius: 8px; font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 8px; margin: 20px 0;">
                            ${code}
                        </div>
                        <p style="font-size: 14px; text-align: center; color: #666;">
                            ${lang.verification_instructions}
                        </p>
                        <hr style="margin: 20px 0;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                            <h4 style="color: #0033A0; margin-bottom: 10px;">🚨 Emergency Contacts</h4>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Transport Emergency Hotline:</strong> 0800 123 456</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Richfield Newtown Campus:</strong> (011) 123 4567</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Campus Security:</strong> (011) 765 4321</p>
                        </div>
                        <p style="font-size: 12px; color: #999; text-align: center;">
                            ${lang.footer_note}<br>
                            ${lang.slogan}
                        </p>
                    </div>
                </div>
            `
        };
        
        console.log(` SENDING VERIFICATION EMAIL TO: ${email}`);
        console.log(` LANGUAGE: ${language}`);
        
        const result = await emailTransporter.sendMail(mailOptions);
        console.log(` Email sent successfully to ${email}`);
        return true;
        
    } catch (error) {
        console.error(' ERROR SENDING EMAIL:', error);
        return false;
    }
}

// Send password reset email with language support
async function sendPasswordResetEmail(email, code, language = 'en') {
    try {
        const lang = translations[language] || translations.en;
        
        const mailOptions = {
            from: 'richfield.transport@example.com',
            to: email,
            subject: lang.reset_subject,
            html: `
                <div style="font-family: Arial, sans-serif; background: linear-gradient(135deg, #0033A0, #DA291C); padding: 20px; color: white;">
                    <h2 style="text-align: center;"> Richfield Student Transport Guide</h2>
                    <div style="background: white; color: #333; padding: 25px; border-radius: 10px; margin-top: 15px;">
                        <h3 style="color: #0033A0; text-align: center;">${lang.reset_title}</h3>
                        <p style="font-size: 16px; text-align: center;">${lang.reset_message}</p>
                        <div style="background: #DA291C; color: white; padding: 15px; border-radius: 8px; font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 8px; margin: 20px 0;">
                            ${code}
                        </div>
                        <p style="font-size: 14px; text-align: center; color: #666;">
                            ${lang.reset_instructions}
                        </p>
                        <hr style="margin: 20px 0;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                            <h4 style="color: #0033A0; margin-bottom: 10px;">🚨 Emergency Contacts</h4>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Transport Emergency Hotline:</strong> 0800 123 456</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Richfield Newtown Campus:</strong> (011) 123 4567</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Campus Security:</strong> (011) 765 4321</p>
                        </div>
                        <p style="font-size: 12px; color: #999; text-align: center;">
                            ${lang.footer_note}<br>
                            ${lang.slogan}
                        </p>
                    </div>
                </div>
            `
        };
        
        console.log(` SENDING PASSWORD RESET EMAIL TO: ${email}`);
        console.log(` LANGUAGE: ${language}`);
        
        const result = await emailTransporter.sendMail(mailOptions);
        console.log(` Password reset email sent successfully to ${email}`);
        return true;
        
    } catch (error) {
        console.error(' ERROR SENDING PASSWORD RESET EMAIL:', error);
        return false;
    }
}

// Send delete verification email with language support
async function sendDeleteVerificationEmail(email, code, language = 'en') {
    try {
        const lang = translations[language] || translations.en;
        
        const mailOptions = {
            from: 'richfield.transport@example.com',
            to: email,
            subject: lang.delete_subject,
            html: `
                <div style="font-family: Arial, sans-serif; background: linear-gradient(135deg, #0033A0, #DA291C); padding: 20px; color: white;">
                    <h2 style="text-align: center;"> Richfield Student Transport Guide</h2>
                    <div style="background: white; color: #333; padding: 25px; border-radius: 10px; margin-top: 15px;">
                        <h3 style="color: #DA291C; text-align: center;">${lang.delete_title}</h3>
                        <p style="font-size: 16px; text-align: center; color: #DA291C; font-weight: bold;">
                            ${lang.delete_warning}
                        </p>
                        <p style="font-size: 16px; text-align: center;">${lang.delete_message}</p>
                        <div style="background: #DA291C; color: white; padding: 15px; border-radius: 8px; font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 8px; margin: 20px 0;">
                            ${code}
                        </div>
                        <p style="font-size: 14px; text-align: center; color: #666;">
                            ${lang.delete_instructions}
                        </p>
                        <hr style="margin: 20px 0;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                            <h4 style="color: #0033A0; margin-bottom: 10px;">🚨 Emergency Contacts</h4>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Transport Emergency Hotline:</strong> 0800 123 456</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Richfield Newtown Campus:</strong> (011) 123 4567</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Campus Security:</strong> (011) 765 4321</p>
                        </div>
                        <p style="font-size: 12px; color: #999; text-align: center;">
                            ${lang.footer_note}<br>
                            ${lang.slogan}
                        </p>
                    </div>
                </div>
            `
        };
        
        console.log(` SENDING DELETE VERIFICATION EMAIL TO: ${email}`);
        console.log(` LANGUAGE: ${language}`);
        
        const result = await emailTransporter.sendMail(mailOptions);
        console.log(` Delete verification email sent successfully to ${email}`);
        return true;
        
    } catch (error) {
        console.error(' ERROR SENDING DELETE VERIFICATION EMAIL:', error);
        return false;
    }
}

// ========== AUTHENTICATION ROUTES ==========

// Send verification code
app.post('/api/send-verification', async (req, res) => {
    const { email, language = 'en' } = req.body;
    
    if (!email || !email.includes('@')) {
        return res.json({ success: false, message: 'Valid email address required' });
    }
    
    // Check if email already registered
    if (users.find(user => user.email === email)) {
        return res.json({ success: false, message: 'Email already registered' });
    }
    
    const verificationCode = generateVerificationCode();
    verificationCodes[email] = {
        code: verificationCode,
        expires: Date.now() + 10 * 60 * 1000,
        language: language
    };
    
    console.log(`\n REGISTRATION ATTEMPT FOR: ${email}`);
    console.log(` LANGUAGE PREFERENCE: ${language}`);
    
    // Send the actual email
    const emailSent = await sendVerificationEmail(email, verificationCode, language);
    
    if (emailSent) {
        res.json({ 
            success: true, 
            message: 'Verification code sent to your email! Check your inbox and spam folder.'
        });
    } else {
        res.json({ 
            success: false, 
            message: 'Failed to send verification email. Please try again.'
        });
    }
});

// Verify email and register user
app.post('/api/verify-register', async (req, res) => {
    const { email, code, username, password, language = 'en' } = req.body;
    
    if (!email || !code || !username || !password) {
        return res.json({ success: false, message: 'All fields are required' });
    }
    
    // Verify code
    const storedCode = verificationCodes[email];
    if (!storedCode || storedCode.code !== code) {
        return res.json({ success: false, message: 'Invalid verification code' });
    }
    
    if (Date.now() > storedCode.expires) {
        delete verificationCodes[email];
        return res.json({ success: false, message: 'Verification code has expired' });
    }
    
    // Check if username already exists
    if (users.find(user => user.username === username)) {
        return res.json({ success: false, message: 'Username already exists' });
    }
    
    // Create user
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
        id: users.length + 1,
        username,
        email,
        password: hashedPassword,
        language,
        verified: true,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    
    // Save to persistent storage
    if (saveUsers(users)) {
        delete verificationCodes[email];
        
        console.log(` NEW USER REGISTERED: ${username} (${email})`);
        
        req.session.user = { 
            id: newUser.id, 
            username: newUser.username, 
            email: newUser.email,
            language: newUser.language 
        };
        
        res.json({ success: true, message: 'Registration successful! You can now login.' });
    } else {
        res.json({ success: false, message: 'Error saving user data' });
    }
});

// Login with email verification check
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.json({ success: false, message: 'Username and password required' });
    }
    
    const user = users.find(u => u.username === username);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.json({ success: false, message: 'Invalid credentials' });
    }
    
    if (!user.verified) {
        return res.json({ success: false, message: 'Please verify your email before logging in' });
    }
    
    req.session.user = { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        language: user.language 
    };
    
    res.json({ success: true, message: 'Login successful!' });
});

// Password reset request
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.json({ success: false, message: 'Email is required' });
    }
    
    const user = users.find(u => u.email === email);
    if (!user) {
        // Don't reveal if email exists for security
        return res.json({ 
            success: true, 
            message: 'If this email exists in our system, a password reset code has been sent.' 
        });
    }
    
    const resetCode = generateVerificationCode();
    passwordResetTokens[email] = {
        code: resetCode,
        expires: Date.now() + 15 * 60 * 1000,
        language: user.language || 'en'
    };
    
    console.log(`\n PASSWORD RESET REQUEST FOR: ${email}`);
    console.log(` USER LANGUAGE: ${user.language}`);
    
    // Send reset email in user's preferred language
    const emailSent = await sendPasswordResetEmail(email, resetCode, user.language);
    
    if (emailSent) {
        res.json({ 
            success: true, 
            message: 'If this email exists in our system, a password reset code has been sent to your email! Check your inbox and spam folder.'
        });
    } else {
        res.json({ 
            success: false, 
            message: 'Failed to send reset email. Please try again.'
        });
    }
});

// Verify reset code and update password
app.post('/api/reset-password', (req, res) => {
    const { email, code, newPassword } = req.body;
    
    if (!email || !code || !newPassword) {
        return res.json({ success: false, message: 'All fields are required' });
    }
    
    if (newPassword.length < 6) {
        return res.json({ success: false, message: 'Password must be at least 6 characters long' });
    }
    
    const tokenData = passwordResetTokens[email];
    if (!tokenData || tokenData.code !== code) {
        return res.json({ success: false, message: 'Invalid or expired reset code' });
    }
    
    if (Date.now() > tokenData.expires) {
        delete passwordResetTokens[email];
        return res.json({ success: false, message: 'Reset code has expired' });
    }
    
    const user = users.find(u => u.email === email);
    if (user) {
        user.password = bcrypt.hashSync(newPassword, 10);
        delete passwordResetTokens[email];
        
        if (saveUsers(users)) {
            console.log(` PASSWORD UPDATED FOR: ${email}`);
            res.json({ success: true, message: 'Password updated successfully! You can now login with your new password.' });
        } else {
            res.json({ success: false, message: 'Error saving password' });
        }
    } else {
        res.json({ success: false, message: 'User not found' });
    }
});

// Delete account with email verification
app.post('/api/verify-delete', async (req, res) => {
    const { email, code } = req.body;
    
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    if (!email || !code) {
        return res.json({ success: false, message: 'Email and verification code required' });
    }
    
    // Verify it's the user's email
    if (req.session.user.email !== email) {
        return res.json({ success: false, message: 'Email does not match your account' });
    }
    
    const tokenData = passwordResetTokens[email];
    if (!tokenData || tokenData.code !== code) {
        return res.json({ success: false, message: 'Invalid verification code' });
    }
    
    const userId = req.session.user.id;
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
        const deletedUser = users[userIndex];
        users.splice(userIndex, 1);
        delete passwordResetTokens[email];
        
        if (saveUsers(users)) {
            console.log(` ACCOUNT DELETED: ${deletedUser.username} (${deletedUser.email})`);
            req.session.destroy();
            res.json({ success: true, message: 'Account deleted successfully' });
        } else {
            res.json({ success: false, message: 'Error deleting account' });
        }
    } else {
        res.json({ success: false, message: 'User not found' });
    }
});

// Send delete verification code
app.post('/api/send-delete-verification', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    const userEmail = req.session.user.email;
    const userLanguage = req.session.user.language || 'en';
    const deleteCode = generateVerificationCode();
    
    passwordResetTokens[userEmail] = {
        code: deleteCode,
        expires: Date.now() + 10 * 60 * 1000,
        language: userLanguage
    };
    
    console.log(`\n ACCOUNT DELETE VERIFICATION FOR: ${userEmail}`);
    console.log(` USER LANGUAGE: ${userLanguage}`);
    
    // Send delete verification email in user's preferred language
    const emailSent = await sendDeleteVerificationEmail(userEmail, deleteCode, userLanguage);
    
    if (emailSent) {
        res.json({ 
            success: true, 
            message: 'Verification code sent to your email! Check your inbox and spam folder.'
        });
    } else {
        res.json({ 
            success: false, 
            message: 'Failed to send verification email. Please try again.'
        });
    }
});

// ========== API ROUTES ==========

app.get('/api/user', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/api/routes', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Please login first' });
    }
    res.json(routes);
});

app.get('/api/directions/:routeId', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Please login first' });
    }
    
    const routeId = parseInt(req.params.routeId);
    const route = routes.find(r => r.id === routeId);
    
    if (!route) {
        return res.status(404).json({ error: 'Route not found' });
    }
    
    const directions = {
        steps: generateRouteSteps(route),
        totalTime: route.time,
        totalDistance: getRouteDistance(route.type),
        cost: `R${route.fee}`,
        safetyNote: route.safety_note || 'Travel safely and be aware of your surroundings'
    };
    
    res.json(directions);
});

// Helper functions for route generation
function generateRouteSteps(route) {
    const baseSteps = [
        `Start from ${route.from}`,
        `Proceed to ${route.name}`,
        `Board ${route.type} heading to ${route.to}`,
        `Arrive at destination`
    ];
    
    if (route.type === 'train') {
        baseSteps.splice(2, 0, 'Purchase ticket at station counter or online');
        baseSteps.splice(3, 0, 'Check electronic display for platform information');
    }
    
    if (route.safety_note) {
        baseSteps.push(`Safety Note: ${route.safety_note}`);
    }
    
    return baseSteps;
}

function getRouteDistance(type) {
    const distances = {
        'taxi': '3-8 km',
        'bus': '5-15 km', 
        'train': '20-60 km'
    };
    return distances[type] || 'Varies';
}

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out successfully' });
});

// ========== PAGE ROUTES ==========

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/account', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    res.sendFile(path.join(__dirname, 'public', 'account.html'));
});

app.get('/verify', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'verify.html'));
});

// Initialize routes data on first run
if (routes.length === 0) {
    routes = getDefaultRoutes();
    saveRoutes(routes);
    console.log('Initialized default routes data');
}

// Create data directory if it doesn't exist
const dataDir = path.dirname(USERS_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

app.listen(PORT, () => {
    console.log(`\n Richfield Enhanced Transport Guide v3.0`);
    console.log(` Running on http://localhost:${PORT}`);
    console.log(` Email System: ${emailTransporter.createTransport ? 'ACTIVE' : 'DEMO MODE'}`);
    console.log(` Database: Persistent JSON storage`);
    console.log(`  Routes: Enhanced transportation system`);
    console.log(` Languages: English, Zulu, Sotho`);
    console.log(` Emergency Features: Integrated hotline support`);
    console.log(`\n Emergency Contacts:`);
    console.log(`   Transport Hotline: 0800 123 456`);
    console.log(`   Richfield Campus: (011) 123 4567`);
    console.log(`   Campus Security: (011) 765 4321`);
    console.log(`\nPress Ctrl+C to stop the server\n`);
});