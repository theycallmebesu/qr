const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey12345';

// Unified Login Route (Login using Username or Name)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const identifier = (username || req.body.identifier || req.body.email || '').toLowerCase().trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Match by username or name
    const user = await User.findOne({
      $or: [
        { username: identifier },
        { name: new RegExp('^' + identifier + '$', 'i') }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    if (user.active === false) {
      return res.status(403).json({ message: 'Account is deactivated. Contact Administrator.' });
    }

    let isMatch = false;
    if (user.passwordHash) {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    }
    // Fallback for plainPassword in testing/dev
    if (!isMatch && user.plainPassword && user.plainPassword === password) {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const payload = {
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        position: user.position,
        role: user.role,
        active: user.active
      }
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: payload.user
      });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Quick Demo Login for instant testing of all 4 roles
router.post('/quick-login', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'owner', 'waiter', 'chef'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const user = await User.findOne({ role, active: true });
    if (!user) {
      return res.status(404).json({ message: `No active demo user found for role: ${role}` });
    }

    const payload = {
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        position: user.position,
        role: user.role,
        active: user.active
      }
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: payload.user
      });
    });
  } catch (err) {
    console.error('Quick login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current logged-in user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash -plainPassword');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Fetch me error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
