const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/storage');

const FILE = 'contacts.json';

// POST /api/contact — Submit a contact message
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Message must be at least 10 characters.' });
    }

    const contacts = await readData(FILE);

    const newContact = {
      id: uuidv4(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject ? subject.trim() : 'General Inquiry',
      message: message.trim(),
      read: false,
      sentAt: new Date().toISOString(),
    };

    contacts.push(newContact);
    await writeData(FILE, contacts);

    console.log(`[Contact] Message from ${name} <${email}> — "${newContact.subject}"`);

    return res.status(201).json({
      success: true,
      message: "Message received! We'll reply within 24 hours.",
      id: newContact.id,
    });
  } catch (err) {
    console.error('[Contact Error]', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// GET /api/contact/all — Admin: list all contact messages
router.get('/all', async (req, res) => {
  try {
    const contacts = await readData(FILE);
    return res.json({ success: true, count: contacts.length, contacts });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
