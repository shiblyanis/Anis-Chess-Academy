const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/storage');

const FILE = 'subscribers.json';

// POST /api/newsletter — Subscribe to newsletter
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const subscribers = await readData(FILE);

    // Deduplicate
    const existing = subscribers.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({
        success: false,
        alreadySubscribed: true,
        message: "You're already subscribed! Check your inbox for our weekly chess tips.",
      });
    }

    const newSub = {
      id: uuidv4(),
      email: email.trim().toLowerCase(),
      subscribedAt: new Date().toISOString(),
    };

    subscribers.push(newSub);
    await writeData(FILE, subscribers);

    console.log(`[Newsletter] New subscriber: ${email}`);

    return res.status(201).json({
      success: true,
      message: "You're subscribed! Expect your first chess tip this week.",
    });
  } catch (err) {
    console.error('[Newsletter Error]', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// GET /api/newsletter/all — Admin: list all subscribers
router.get('/all', async (req, res) => {
  try {
    const subscribers = await readData(FILE);
    return res.json({ success: true, count: subscribers.length, subscribers });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
