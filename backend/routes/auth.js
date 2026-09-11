const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, normalizeRole } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey12345';

// Unified Login Route (Username + Password only)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const cleanUsername = (username || '').toLowerCase().trim();

    if (!cleanUsername || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username: cleanUsername });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    if (user.active === false) {
      return res.status(403).json({ message: 'Account has been deactivated. Please contact your manager.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const normalizedRole = normalizeRole(user.role);

    const payload = {
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        position: user.position,
        role: normalizedRole,
        active: user.active
      }
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: payload.user,
        role: normalizedRole,
        redirectTo: `/${normalizedRole}`
      });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Quick Role Login for convenient role-testing
router.post('/quick-login', async (req, res) => {
  try {
    let { role } = req.body;
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    role = normalizeRole(role);
    const validRoles = ['admin', 'waiter', 'kitchen', 'reception'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: `Invalid role: ${role}` });
    }

    // Find first active user with this role or legacy equivalent
    const searchRoles = [role];
    if (role === 'kitchen') searchRoles.push('chef');
    if (role === 'reception') searchRoles.push('receptionist');
    if (role === 'admin') searchRoles.push('owner');

    const user = await User.findOne({ role: { $in: searchRoles }, active: true });
    if (!user) {
      return res.status(404).json({ message: `No active staff found for role: ${role}` });
    }

    const normalizedRole = normalizeRole(user.role);

    const payload = {
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        position: user.position,
        role: normalizedRole,
        active: user.active
      }
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: payload.user,
        role: normalizedRole,
        redirectTo: `/${normalizedRole}`
      });
    });
  } catch (err) {
    console.error('Quick login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current authenticated user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userObj = user.toObject();
    userObj.role = normalizeRole(userObj.role);
    res.json(userObj);
  } catch (err) {
    console.error('Fetch me error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
