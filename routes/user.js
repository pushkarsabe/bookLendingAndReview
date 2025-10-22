const express = require('express');
const router = express.Router();
const userController = require('../controller/user');
const authLimiter = require('../auth/authLimiter');

// POST /api/users/register
router.post('/register', authLimiter, userController.register);

// POST /api/users/login
router.post('/login', authLimiter, userController.login);

module.exports = router;