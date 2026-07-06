const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(express.json());

// CORS Middleware
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    const requestHeaders = req.headers['access-control-request-headers'];
    if (requestHeaders) {
        res.setHeader('Access-Control-Allow-Headers', requestHeaders);
    } else {
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, apikey, Accept, Origin, X-Requested-With');
    }
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Disable Mongoose buffering globally so queries fail instantly if DB is down
mongoose.set('bufferCommands', false);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

// Database connection check middleware for API routes
app.use('/api', (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            error: "Service Unavailable",
            message: "Database connection is not established. Please check if your MongoDB server is running."
        });
    }
    next();
});

// Base Route
app.get('/', (req, res) => {
    res.send('Hello, Loot Bazar!');
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/frontend', userRoutes);

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
