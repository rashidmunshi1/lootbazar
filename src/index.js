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

// Enable Mongoose buffering (default) to handle minor network handshakes
mongoose.set('bufferCommands', true);

// Log detailed connection status events
mongoose.connection.on('connected', () => {
    console.log('MongoDB connection status: Connected successfully.');
});
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection status: Error encountered:', err);
});
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB connection status: Disconnected.');
});

// Database connection middleware for Serverless/Vercel environments
const connectDb = async (req, res, next) => {
    // If connection is already open, reuse it
    if (mongoose.connection.readyState === 1) {
        return next();
    }
    
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully.');
        next();
    } catch (err) {
        console.error('MongoDB connection middleware error:', err);
        return res.status(500).json({
            error: "Database Connection Error",
            message: "Failed to connect to the database: " + err.message
        });
    }
};

// Use database connection middleware for API routes
app.use('/api', connectDb);

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
