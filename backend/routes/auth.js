const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// User Login (Password Verification & Person Selection)
router.post('/login-user', async (req, res) => {
  const { password, personId } = req.body;

  if (!password || !password.trim()) {
    return res.status(400).json({ message: 'Invalid user password' });
  }

  const cleanPassword = password.trim();

  try {
    const allUsers = await User.find({ role: { $ne: 'admin' } });
    
    // Find all users whose password matches the entered password
    const matchingUsers = [];
    for (const u of allUsers) {
      const isMatch = await bcrypt.compare(cleanPassword, u.passwordHash) || u.plainPassword === cleanPassword;
      if (isMatch) {
        matchingUsers.push(u);
      }
    }

    if (matchingUsers.length === 0) {
      return res.status(400).json({ message: 'Invalid user password' });
    }

    // If personId is provided, log in as that specific user
    let targetUser = null;
    if (personId) {
      targetUser = matchingUsers.find(u => u._id.toString() === personId.toString()) || await User.findById(personId);
    } else if (matchingUsers.length === 1) {
      // Single match -> log in directly
      targetUser = matchingUsers[0];
    }

    if (targetUser && targetUser.role !== 'admin') {
      const payload = { user: { id: targetUser.id, role: targetUser.role || 'user' } };
      return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '8h' },
        (err, token) => {
          if (err) throw err;
          res.json({
            token,
            user: {
              id: targetUser.id,
              name: targetUser.name,
              email: targetUser.email,
              role: targetUser.role || 'user',
              profileImage: targetUser.profileImage
            }
          });
        }
      );
    }

    // Multiple users share the same password -> prompt user selection
    const availablePersons = matchingUsers.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      profileImage: u.profileImage
    }));

    res.json({
      requirePersonSelection: true,
      persons: availablePersons
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Admin Login (Gmail + Password)
router.post('/login-admin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Gmail and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  try {
    let admin = await User.findOne({ email: cleanEmail });
    
    if (!admin) {
      // Create admin on the fly if bishu1maharjan@gmail.com is logging in for first time
      if (cleanEmail === 'bishu1maharjan@gmail.com') {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(cleanPassword || 'admin123', salt);
        admin = new User({
          name: 'Bishu Maharjan (Admin)',
          email: 'bishu1maharjan@gmail.com',
          passwordHash,
          role: 'admin'
        });
        await admin.save();
      } else {
        return res.status(400).json({ message: 'Invalid admin Gmail' });
      }
    }

    let isMatch = await bcrypt.compare(cleanPassword, admin.passwordHash);

    // Fallback if password matches admin123
    if (!isMatch && cleanPassword === 'admin123') {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid admin password (try: admin123)' });
    }

    // Ensure role is admin
    if (admin.role !== 'admin') {
      admin.role = 'admin';
      await admin.save();
    }

    const payload = { user: { id: admin.id, role: 'admin' } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: admin.id, name: admin.name, email: admin.email, role: 'admin', profileImage: admin.profileImage } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Legacy / General login endpoint for compatibility
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const cleanPassword = password ? password.trim() : '';

  try {
    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { user: { id: user.id, role: user.role || 'user' } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user', profileImage: user.profileImage } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Forgot Password - Send 6-digit verification code to Gmail
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Gmail address is required' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      // Auto-create user for password reset if target email is bishu1maharjan@gmail.com
      if (cleanEmail === 'bishu1maharjan@gmail.com') {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);
        user = new User({
          name: 'Bishu Maharjan (Admin)',
          email: 'bishu1maharjan@gmail.com',
          passwordHash,
          role: 'admin'
        });
      } else {
        return res.status(404).json({ message: 'No account found with this Gmail address' });
      }
    }

    // Generate 6-digit random code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set code and expiration (15 minutes)
    user.resetCode = verificationCode;
    user.resetCodeExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    console.log(`\n========================================`);
    console.log(`[VERIFICATION CODE SENT TO ${cleanEmail}]`);
    console.log(`CODE: ${verificationCode}`);
    console.log(`========================================\n`);

    res.json({ 
      message: `Verification code generated and sent to ${cleanEmail}`,
      devCode: verificationCode 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Reset Password after Code Verification
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: 'Email, verification code, and new password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();
  const cleanNewPassword = newPassword.trim();

  try {
    const user = await User.findOne({ 
      email: cleanEmail,
      resetCode: cleanCode,
      resetCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(cleanNewPassword, salt);
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully! You can now log in with your new password.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
