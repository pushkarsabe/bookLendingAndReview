const express = require('express');
const router = express.Router();
const userController = require('../controller/user');

// POST /api/users/register
router.post('/register', userController.register);

// POST /api/users/login
router.post('/login', userController.login);

module.exports = router;