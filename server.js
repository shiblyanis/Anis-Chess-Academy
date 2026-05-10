const express = require('express');
const cors = require('cors');
const path = require('path');

const bookingRouter    = require('./routes/booking');
const contactRouter    = require('./routes/contact');
const newsletterRouter = require('./routes/newsletter');
const { readData }     = require('./utils/storage');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve index.html and all static files from project root
app.use(express.static(path.join(__dirname)));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/booking',    bookingRouter);
app.use('/api/contact',    contactRouter);
app.use('/api/newsletter', newsletterRouter);

// GET /api/stats — Live stats for the homepage counters
app.get('/api/stats', async (req, res) => {
  try {
    const [bookings, contacts, subscribers] = await Promise.all([
      readData('bookings.json'),
      readData('contacts.json'),
      readData('subscribers.json'),
    ]);

    return res.json({
      success: true,
      stats: {
        totalStudents:     500 + bookings.length,
        totalSubscribers:  subscribers.length,
        totalMessages:     contacts.length,
        totalBookings:     bookings.length,
        pendingBookings:   bookings.filter(b => b.status === 'pending').length,
      },
    });
  } catch (err) {
    console.error('[Stats Error]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Admin dashboard — simple read-only overview
app.get('/admin', async (req, res) => {
  try {
    const [bookings, contacts, subscribers] = await Promise.all([
      readData('bookings.json'),
      readData('contacts.json'),
      readData('subscribers.json'),
    ]);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin Dashboard — Anis Chess Academy</title>
<link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0a;color:#f5f0e8;font-family:'Josefin Sans',sans-serif;padding:2rem}
h1{color:#c9a84c;font-size:1.8rem;margin-bottom:0.5rem}
.subtitle{color:#888;font-size:0.75rem;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:2rem}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:3rem}
.stat-box{background:#111;border:1px solid rgba(201,168,76,0.2);padding:1.5rem;border-radius:2px}
.stat-box .num{font-size:2.5rem;color:#c9a84c;font-weight:700;display:block}
.stat-box .label{font-size:0.65rem;color:#888;letter-spacing:0.2em;text-transform:uppercase;margin-top:0.3rem}
h2{color:#c9a84c;font-size:1rem;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:1rem;padding-top:1rem;border-top:1px solid rgba(201,168,76,0.1)}
table{width:100%;border-collapse:collapse;font-size:0.8rem;margin-bottom:3rem}
th{background:#1a1a1a;color:#c9a84c;padding:0.75rem 1rem;text-align:left;font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase}
td{padding:0.75rem 1rem;border-bottom:1px solid rgba(255,255,255,0.05);color:#ede8df;vertical-align:top}
tr:hover td{background:rgba(201,168,76,0.03)}
.badge{display:inline-block;padding:0.2rem 0.6rem;font-size:0.6rem;letter-spacing:0.1em;text-transform:uppercase;font-weight:700;border-radius:1px}
.badge.pending{background:rgba(201,168,76,0.15);color:#c9a84c;border:1px solid rgba(201,168,76,0.3)}
.badge.confirmed{background:rgba(100,200,100,0.15);color:#6cc;border:1px solid rgba(100,200,100,0.3)}
.empty{color:#555;font-style:italic;font-size:0.8rem;padding:1rem 0}
</style>
</head>
<body>
<h1>♚ Admin Dashboard</h1>
<div class="subtitle">Anis Chess Academy — Live Data</div>

<div class="stats">
  <div class="stat-box"><span class="num">${bookings.length}</span><span class="label">Total Bookings</span></div>
  <div class="stat-box"><span class="num">${bookings.filter(b=>b.status==='pending').length}</span><span class="label">Pending</span></div>
  <div class="stat-box"><span class="num">${contacts.length}</span><span class="label">Messages</span></div>
  <div class="stat-box"><span class="num">${subscribers.length}</span><span class="label">Subscribers</span></div>
</div>

<h2>📅 Demo Bookings (${bookings.length})</h2>
${bookings.length === 0 ? '<p class="empty">No bookings yet.</p>' : `
<table>
  <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Country</th><th>Level</th><th>Goals</th><th>Status</th><th>Booked At</th></tr></thead>
  <tbody>
    ${[...bookings].reverse().map((b,i)=>`
    <tr>
      <td>${bookings.length - i}</td>
      <td>${b.fname} ${b.lname}</td>
      <td>${b.email}</td>
      <td>${b.country}</td>
      <td>${b.level}</td>
      <td style="max-width:200px;word-break:break-word">${b.goals || '—'}</td>
      <td><span class="badge ${b.status}">${b.status}</span></td>
      <td>${new Date(b.bookedAt).toLocaleString()}</td>
    </tr>`).join('')}
  </tbody>
</table>`}

<h2>✉️ Contact Messages (${contacts.length})</h2>
${contacts.length === 0 ? '<p class="empty">No messages yet.</p>' : `
<table>
  <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Subject</th><th>Message</th><th>Sent At</th></tr></thead>
  <tbody>
    ${[...contacts].reverse().map((c,i)=>`
    <tr>
      <td>${contacts.length - i}</td>
      <td>${c.name}</td>
      <td>${c.email}</td>
      <td>${c.subject}</td>
      <td style="max-width:280px;word-break:break-word">${c.message}</td>
      <td>${new Date(c.sentAt).toLocaleString()}</td>
    </tr>`).join('')}
  </tbody>
</table>`}

<h2>📧 Newsletter Subscribers (${subscribers.length})</h2>
${subscribers.length === 0 ? '<p class="empty">No subscribers yet.</p>' : `
<table>
  <thead><tr><th>#</th><th>Email</th><th>Subscribed At</th></tr></thead>
  <tbody>
    ${[...subscribers].reverse().map((s,i)=>`
    <tr>
      <td>${subscribers.length - i}</td>
      <td>${s.email}</td>
      <td>${new Date(s.subscribedAt).toLocaleString()}</td>
    </tr>`).join('')}
  </tbody>
</table>`}

</body>
</html>`;
    res.send(html);
  } catch (err) {
    console.error('[Admin Error]', err);
    res.status(500).send('Server error');
  }
});

// ── Catch-all: serve index.html for any unknown GET ───────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n♚  Anis Chess Academy server running!`);
  console.log(`   Frontend : http://localhost:${PORT}`);
  console.log(`   Admin    : http://localhost:${PORT}/admin`);
  console.log(`   API      : http://localhost:${PORT}/api/*\n`);
});

module.exports = app;
