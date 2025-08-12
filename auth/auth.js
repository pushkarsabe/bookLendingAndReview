// In auth/auth.js
const jwt = require('jsonwebtoken');
const User = require('../model/User'); // It's good practice to include the User model

// Define the main authentication middleware function
const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'No token, authorization denied.' });
    }

    // Expect "Bearer <token>"
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token format is invalid, authorization denied.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`Decoded user ID: ${decoded.user.id}`);
        // Attach the full user payload from the token to the request object
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid.' });
    }
};

// Define the admin-checking middleware function
const isAdmin = (req, res, next) => {
    // This runs AFTER authMiddleware, so req.user should be available
    if (req.user && req.user.isAdmin) {
        next(); // User is an admin, continue to the controller
    } else {
        res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
};

// Export both functions in a single object
module.exports = {
    authMiddleware,
    isAdmin
};