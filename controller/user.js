// In controller/user.controller.js
const User = require('../model/User');
const jwt = require('jsonwebtoken');
const { userRegisterSchema, userLoginSchema } = require('../validation/validationSchemas');

exports.register = async (req, res) => {
    const { error } = userRegisterSchema.validate(req.body);

    if (error) {
        const message = error.details.map(detail => detail.message).join(', ');
        console.log("User registered error message:", message);
        return res.status(400).json({ message: message });
    }

    try {
        const { name, email, password } = req.body;
        console.log(`name = ${name} , email = ${email} ,password = ${password} `);

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        const newUser = await User.create({ name, email, password });
        console.log("User registered successfully:", newUser.name);

        return res.status(201).json({
            message: 'User registered successfully!',
            userId: newUser.user_id
        });

    } catch (error) {
        // This will log the specific error to your backend terminal
        console.error("REGISTER FAILED:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.login = async (req, res) => {
    const { error } = userLoginSchema.validate(req.body);

    if (error) {
        const message = error.details.map(detail => detail.message).join(', ');
        console.log("User login error message:", message);
        return res.status(400).json({ message: message });
    }

    try {
        const { email, password } = req.body;
        console.log('Login attempt with email:', email, ' and password:', password);

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'User Not Found.' });
        }
        console.log('User found:', user);

        // The validPassword method now exists on the user instance
        const isMatch = await user.validPassword(password);
        if (!isMatch) {
            return res.status(402).json({ message: 'Invalid credentials.' });
        }

        const userData = {
            id: user.user_id,
            user_id: user.user_id,
            name: user.name,
            isAdmin: user.isAdmin
        }

        const payload = {
            user: userData
        };

        if (!process.env.JWT_SECRET) {
            console.error('FATAL: JWT_SECRET not found in environment');
            return res.status(500).json({ message: 'Server configuration error.' });
        }

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' },
            (err, token) => {
                if (err) {
                    return res.status(500).json({ message: 'Token creation failed.' });
                }
                return res.json({
                    token,
                    userData,
                    message: 'Logged in successfully!'
                });
            }
        );

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};