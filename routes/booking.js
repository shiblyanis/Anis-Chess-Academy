const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/storage');

const FILE = 'bookings.json';

// POST /api/booking — Submit a free demo booking
router.post('/', async (req, res) => {
  try {
    const { fname, lname, email, country, level, goals } = req.body;

    // Basic validation
    if (!fname || !lname || !email || !country || !level) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const bookings = await readData(FILE);

    // Check for duplicate booking (same email)
    const existing = bookings.find(b => b.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A booking with this email already exists. Anis will contact you soon!',
      });
    }

    const newBooking = {
      id: uuidv4(),
      fname: fname.trim(),
      lname: lname.trim(),
      email: email.trim().toLowerCase(),
      country,
      level,
      goals: goals ? goals.trim() : '',
      status: 'pending',          // pending | confirmed | completed
      bookedAt: new Date().toISOString(),
    };

    bookings.push(newBooking);
    await writeData(FILE, bookings);

    console.log(`[Booking] New demo booked by ${fname} ${lname} <${email}> (${country})`);

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed! Anis will contact you within 24 hours.',
      id: newBooking.id,
    });
  } catch (err) {
    console.error('[Booking Error]', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// GET /api/bookings — Admin: list all bookings
router.get('/all', async (req, res) => {
  try {
    const bookings = await readData(FILE);
    return res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
