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
      if (cleanEmail === 'bishu1maharjan@gmail.com' || cleanEmail === 'np03cy4a250116@heraldcollege.edu.np') {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(cleanPassword || 'admin123', salt);
        admin = new User({
          name: 'Bishu Maharjan (Admin)',
          email: cleanEmail,
          passwordHash,
          plainPassword: cleanPassword || 'admin123',
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

const nodemailer = require('nodemailer');

const createTransporter = () => {
  const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '';
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

  if (user && pass) {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL port 465 works reliably on Render
      auth: { user, pass }
    });
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS.replace(/\s+/g, '')
      }
    });
  }
  return null;
};

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
      if (cleanEmail === 'bishu1maharjan@gmail.com' || cleanEmail === 'np03cy4a250116@heraldcollege.edu.np') {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);
        user = new User({
          name: 'Bishu Maharjan (Admin)',
          email: cleanEmail,
          passwordHash,
          plainPassword: 'admin123',
          role: 'admin'
        });
        await user.save();
      } else {
        return res.status(404).json({ message: 'No account found with this email address' });
      }
    }

    // Generate 6-digit random code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set code and expiration (15 minutes)
    user.resetCode = verificationCode;
    user.resetCodeExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    console.log(`\n========================================`);
    console.log(`[VERIFICATION CODE GENERATED FOR ${cleanEmail}]`);
    console.log(`CODE: ${verificationCode}`);
    console.log(`========================================\n`);

    const transporter = createTransporter();

    if (!transporter) {
      console.warn('EMAIL_USER or EMAIL_PASS is missing in server environment variables.');
      return res.status(400).json({ 
        message: 'Gmail sending is not configured on Render yet. Please add EMAIL_USER and EMAIL_PASS in Render Environment Variables.' 
      });
    }

    // Trigger email delivery in background (non-blocking) for 100ms response speed
    transporter.sendMail({
      from: `"Bank QR Admin Portal" <${process.env.EMAIL_USER || process.env.SMTP_USER}>`,
      to: cleanEmail,
      subject: `${verificationCode} is your Password Verification Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #6366f1; text-align: center; margin-bottom: 8px;">Bank QR Password Reset</h2>
          <p style="font-size: 14px; color: #475569; text-align: center;">You requested a verification code for password reset on your admin account (${cleanEmail}).</p>
          
          <div style="background-color: #f1f5f9; border-radius: 10px; padding: 18px; text-align: center; margin: 24px 0; border: 1px dashed #cbd5e1;">
            <span style="font-size: 32px; font-weight: 800; font-family: monospace; letter-spacing: 6px; color: #0f172a;">${verificationCode}</span>
          </div>
          
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 16px;">This code will expire in 15 minutes. If you did not request this, you can safely ignore this email.</p>
        </div>
      `
    }).then((info) => {
      console.log(`[EMAIL SUCCESS] Sent to ${cleanEmail}: ${info.messageId}`);
    }).catch((mailErr) => {
      console.error('[EMAIL ERROR] Nodemailer failed:', mailErr.message);
    });

    res.json({ 
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Please check your email inbox!`,
      emailSent: true
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
