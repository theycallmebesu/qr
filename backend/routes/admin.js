const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { adminAuth, auth } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// Get all staff users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Fetch staff error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Create new staff account (using username & position, no email)
router.post('/users', adminAuth, async (req, res) => {
  try {
    const { name, username, position, password, role, phone } = req.body;

    if (!name || !username || !position || !password || !role) {
      return res.status(400).json({ message: 'Name, username, position, password, and role are required' });
    }

    const cleanUsername = username.toLowerCase().trim();
    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(400).json({ message: `Staff username "${cleanUsername}" is already taken` });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name: name.trim(),
      username: cleanUsername,
      position: position.trim(),
      passwordHash,
      plainPassword: password,
      role,
      phone: phone || '',
      active: true
    });

    await newUser.save();

    await logActivity({
      req,
      actionType: 'STAFF_CREATED',
      targetType: 'User',
      targetId: newUser._id,
      details: `Created new staff "${newUser.name}" with Position "${newUser.position}" (Role: ${role}, Username: @${cleanUsername})`
    });

    const userObj = newUser.toObject();
    delete userObj.passwordHash;
    res.status(201).json(userObj);
  } catch (err) {
    console.error('Create staff error:', err);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Update staff account
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { name, username, position, role, phone, active } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (position) user.position = position.trim();
    if (username) {
      const cleanUsername = username.toLowerCase().trim();
      if (cleanUsername !== user.username) {
        const dup = await User.findOne({ username: cleanUsername });
        if (dup) {
          return res.status(400).json({ message: `Username "${cleanUsername}" is already taken` });
        }
        user.username = cleanUsername;
      }
    }
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (active !== undefined) user.active = active;

    await user.save();

    await logActivity({
      req,
      actionType: 'STAFF_UPDATED',
      targetType: 'User',
      targetId: user._id,
      details: `Updated details for ${user.name} (Position: ${user.position}, Role: ${user.role}, Active: ${user.active})`
    });

    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.json(userObj);
  } catch (err) {
    console.error('Update staff error:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Reset staff password
router.patch('/users/:id/reset-password', adminAuth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.plainPassword = newPassword;
    await user.save();

    await logActivity({
      req,
      actionType: 'STAFF_PASSWORD_RESET',
      targetType: 'User',
      targetId: user._id,
      details: `Reset password for staff member ${user.name} (${user.position})`
    });

    res.json({ message: `Password reset successfully for ${user.name}` });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// Toggle staff active status
router.patch('/users/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.active = !user.active;
    await user.save();

    await logActivity({
      req,
      actionType: 'STAFF_STATUS_TOGGLED',
      targetType: 'User',
      targetId: user._id,
      details: `Changed status of ${user.name} (${user.position}) to ${user.active ? 'ACTIVE' : 'DEACTIVATED'}`
    });

    res.json({ message: `User status changed to ${user.active ? 'Active' : 'Deactivated'}`, active: user.active });
  } catch (err) {
    console.error('Toggle status error:', err);
    res.status(500).json({ message: 'Failed to toggle status' });
  }
});

// Delete staff user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'Cannot delete your own admin account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: `User ${user.name} removed successfully` });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Get activity logs (Accessible by Admin and Owner)
router.get('/logs', auth, async (req, res) => {
  try {
    if (!['admin', 'owner'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Admin or Owner only' });
    }

    const { actionType, limit = 100 } = req.query;
    const filter = {};
    if (actionType) {
      filter.actionType = actionType;
    }

    const logs = await ActivityLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.json(logs);
  } catch (err) {
    console.error('Fetch logs error:', err);
    res.status(500).json({ message: 'Failed to fetch logs' });
  }
});

module.exports = router;
