const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // 5 requests per 10 minutes
    message: 'Too many login or registration attempts from this IP, please try again in 10 minutes.',
    standardHeaders: true,
});

module.exports = authLimiter;