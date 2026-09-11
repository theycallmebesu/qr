const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { adminAuth, auth, normalizeRole } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// Get all staff users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    const normalized = users.map(u => {
      const obj = u.toObject();
      obj.role = normalizeRole(obj.role);
      return obj;
    });
    res.json(normalized);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Add new user & assign role
router.post('/users', adminAuth, async (req, res) => {
  try {
    const { name, username, position, password, role, phone } = req.body;

    if (!name || !username || !password || !role) {
      return res.status(400).json({ message: 'Name, username, password, and role are required' });
    }

    const cleanUsername = username.toLowerCase().trim();
    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(400).json({ message: `Username "${cleanUsername}" is already taken` });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const validRole = normalizeRole(role);

    const newUser = new User({
      name: name.trim(),
      username: cleanUsername,
      position: position ? position.trim() : (validRole.charAt(0).toUpperCase() + validRole.slice(1)),
      passwordHash,
      role: validRole,
      phone: phone || '',
      active: true
    });

    await newUser.save();

    await logActivity({
      req,
      actionType: 'STAFF_CREATED',
      targetType: 'User',
      targetId: newUser._id,
      details: `Admin ${req.user.name} added user "${newUser.name}" (Role: ${validRole}, Username: @${cleanUsername})`
    });

    const userObj = newUser.toObject();
    delete userObj.passwordHash;
    res.status(201).json(userObj);
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Update user details & role
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
    if (role) user.role = normalizeRole(role);
    if (phone !== undefined) user.phone = phone;
    if (active !== undefined) user.active = active;

    await user.save();

    await logActivity({
      req,
      actionType: 'STAFF_UPDATED',
      targetType: 'User',
      targetId: user._id,
      details: `Admin ${req.user.name} updated user ${user.name}`
    });

    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.json(userObj);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Reset / Change user password (bcrypt hashed)
router.patch('/users/:id/reset-password', adminAuth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    await logActivity({
      req,
      actionType: 'STAFF_PASSWORD_RESET',
      targetType: 'User',
      targetId: user._id,
      details: `Admin ${req.user.name} reset password for ${user.name}`
    });

    res.json({ message: `Password reset successfully for ${user.name}` });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// Deactivate or activate user toggle
router.patch('/users/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'Cannot deactivate your own active session' });
    }

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
      details: `${user.name} changed status to ${user.active ? 'ACTIVE' : 'DEACTIVATED'}`
    });

    res.json({ message: `User is now ${user.active ? 'Active' : 'Deactivated'}`, active: user.active });
  } catch (err) {
    console.error('Toggle status error:', err);
    res.status(500).json({ message: 'Failed to toggle user status' });
  }
});

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'Cannot delete your own admin account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await logActivity({
      req,
      actionType: 'STAFF_DELETED',
      targetType: 'User',
      targetId: req.params.id,
      details: `Admin ${req.user.name} deleted user ${user.name}`
    });

    res.json({ message: `User ${user.name} deleted successfully` });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

module.exports = router;
