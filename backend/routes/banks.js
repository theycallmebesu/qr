const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const Bank = require('../models/Bank');

const router = express.Router();

// Get all banks (Filtered for logged-in user, all banks for admin)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      // If user has banks specifically assigned, show those OR general unassigned banks
      query = { $or: [{ userId: req.user.id }, { userId: null }, { userId: { $exists: false } }] };
    }
    const banks = await Bank.find(query).populate('userId', 'name email profileImage').sort({ name: 1 });
    res.json(banks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get single bank (Protected for all logged in users)
router.get('/:id', auth, async (req, res) => {
  try {
    const bank = await Bank.findById(req.params.id);
    if (!bank) {
      return res.status(404).json({ message: 'Bank not found' });
    }
    res.json(bank);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Bank not found' });
    }
    res.status(500).send('Server error');
  }
});

// Add a new bank (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, logoUrl, qrCodeUrl, qrCodeImage, accountName, accountNumber, userId } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Bank name is required' });
    }
    const newBank = new Bank({ 
      name, 
      logoUrl, 
      qrCodeUrl, 
      qrCodeImage,
      accountName, 
      accountNumber,
      userId: userId || null
    });
    const bank = await newBank.save();
    res.json(bank);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update bank details (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, logoUrl, qrCodeUrl, qrCodeImage, accountName, accountNumber, userId } = req.body;
    let bank = await Bank.findById(req.params.id);
    
    if (!bank) {
      return res.status(404).json({ message: 'Bank not found' });
    }

    bank.name = name || bank.name;
    bank.logoUrl = logoUrl !== undefined ? logoUrl : bank.logoUrl;
    bank.qrCodeUrl = qrCodeUrl !== undefined ? qrCodeUrl : bank.qrCodeUrl;
    bank.qrCodeImage = qrCodeImage !== undefined ? qrCodeImage : bank.qrCodeImage;
    bank.accountName = accountName !== undefined ? accountName : bank.accountName;
    bank.accountNumber = accountNumber !== undefined ? accountNumber : bank.accountNumber;
    bank.userId = userId !== undefined ? (userId || null) : bank.userId;

    await bank.save();
    res.json(bank);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Bank not found' });
    }
    res.status(500).send('Server error');
  }
});

// Delete a bank (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const bank = await Bank.findById(req.params.id);
    if (!bank) {
      return res.status(404).json({ message: 'Bank not found' });
    }

    await bank.deleteOne();
    res.json({ message: 'Bank removed successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Bank not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
