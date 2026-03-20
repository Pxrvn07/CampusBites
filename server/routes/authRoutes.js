const express = require('express');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { name, roll_no, password } = req.body;

        if (!name || !roll_no || !password) {
            return res.status(400).json({ message: 'Name, Roll No, and Password are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        const existing = await User.findOne({ roll_no: roll_no.toUpperCase() });
        if (existing) {
            return res.status(409).json({ message: 'An account with this Roll No already exists.' });
        }

        const user = new User({
            name: name.trim(),
            roll_no: roll_no.trim(),
            password, // plain text for demo — in production, use bcrypt
            role: 'student',
            wallet_balance: 200,
        });

        const saved = await user.save();

        res.status(201).json({
            _id: saved._id,
            name: saved.name,
            roll_no: saved.roll_no,
            wallet_balance: saved.wallet_balance,
            role: saved.role,
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ message: 'Failed to create account.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { roll_no, password } = req.body;

        if (!roll_no || !password) {
            return res.status(400).json({ message: 'Roll No and Password are required.' });
        }

        const user = await User.findOne({ roll_no: roll_no.trim().toUpperCase() });

        if (!user) {
            return res.status(401).json({ message: 'Invalid Roll No or Password.' });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid Roll No or Password.' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            roll_no: user.roll_no,
            wallet_balance: user.wallet_balance,
            role: user.role,
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Login failed.' });
    }
});

module.exports = router;
