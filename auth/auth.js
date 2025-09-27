// In auth/auth.js
const jwt = require('jsonwebtoken');
const User = require('../model/User'); // It's good practice to include the User model

// Define the main authentication middleware function
const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        console.error('No Authorization header found.');
        return res.status(401).json({ message: 'No token, authorization denied.' });
    }

    // Expect "Bearer <token>"
    const token = authHeader.split(' ')[1];

    if (!token) {
        console.log('Empty token provided');
        return res.status(401).json({
            message: 'Token format is invalid, authorization denied.',
            code: 'EMPTY_TOKEN'
        });
    }
    if (!process.env.JWT_SECRET) {
        console.error('FATAL ERROR: JWT_SECRET is not set in environment variables.');
        return res.status(500).json({ message: 'Server configuration error.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`Decoded user ID: ${decoded.user.id}`);
        // Attach the full user payload from the token to the request object
        req.user = decoded.user;
        next();
    } catch (err) {
        console.error('Token verification failed:', err.message);
        res.status(401).json({ message: 'Token is not valid.' });
    }
};

// Define the admin-checking middleware function
const isAdmin = (req, res, next) => {
    // This runs AFTER authMiddleware, so req.user should be available
    try {
        // This runs AFTER authMiddleware, so req.user should be available
        if (req.user && req.user.isAdmin) {
            console.log(`Admin access granted to user: ${req.user.id}`);
            next();
        } else {
            console.log(`Admin access denied for user: ${req.user ? req.user.id : 'unknown'}`);
            res.status(403).json({
                message: 'Forbidden: Admin access required.',
                code: 'NOT_ADMIN'
            });
        }
    } catch (err) {
        console.error('Error in isAdmin middleware:', err);
        res.status(500).json({
            message: 'Internal server error.',
            code: 'SERVER_ERROR'
        });
    }
};

// Export both functions in a single object
module.exports = {
    authMiddleware,
    isAdmin
};