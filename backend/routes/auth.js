// routes/auth.js — phone + OTP login flow.
//
// HONEST NOTE: there is no SMS provider wired up here (that needs a paid
// account with Twilio / MSG91 / etc., which only you can set up with your own
// credentials). So instead of silently faking success, this route actually
// generates a real random OTP, stores it in the database with a real 5-minute
// expiry, and prints it to the server console — exactly like a real OTP flow,
// minus the SMS delivery step. Swap the "send" step for a real SMS API call
// (see the README) and the rest of the flow needs no changes.

const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
}

router.post('/otp/send', (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^\+?[0-9]{10,15}$/.test(phone)) {
    return res.status(400).json({ error: 'Valid phone number chahiye, jaise +919990000001' });
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  db.prepare(`INSERT INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?)`).run(phone, code, expiresAt);

  console.log(`\n[ShilpMitra OTP] Phone: ${phone}  Code: ${code}  (valid 5 min)\n`);

  res.json({
    message: 'OTP generate ho gaya hai. Abhi SMS provider connected nahi hai, isliye OTP server console mein print hua hai.',
    dev_hint: process.env.NODE_ENV === 'production' ? undefined : code
  });
});

router.post('/otp/verify', (req, res) => {
  const { phone, code, name, role } = req.body;
  if (!phone || !code) return res.status(400).json({ error: 'phone aur code dono chahiye.' });

  const row = db.prepare(
    `SELECT * FROM otp_codes WHERE phone = ? AND code = ? AND used = 0 ORDER BY id DESC LIMIT 1`
  ).get(phone, code);

  if (!row) return res.status(401).json({ error: 'Galat OTP.' });
  if (new Date(row.expires_at) < new Date()) return res.status(401).json({ error: 'OTP expire ho gaya, dobara bhejein.' });

  db.prepare(`UPDATE otp_codes SET used = 1 WHERE id = ?`).run(row.id);

  let user = db.prepare(`SELECT * FROM users WHERE phone = ?`).get(phone);
  if (!user) {
    const result = db.prepare(
      `INSERT INTO users (phone, name, role) VALUES (?, ?, ?)`
    ).run(phone, name || null, role === 'artisan' ? 'artisan' : 'buyer');
    user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(result.lastInsertRowid);
  }

  const token = jwt.sign(
    { id: user.id, phone: user.phone, role: user.role },
    process.env.JWT_SECRET || 'dev-secret-change-me',
    { expiresIn: '7d' }
  );

  res.json({ token, user });
});

module.exports = router;
