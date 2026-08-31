// routes/payments.js — real Razorpay integration (Orders API + signature verification).
//
// HONEST NOTE ON WHAT'S REAL HERE:
// - The code below follows Razorpay's documented REST API exactly (Basic Auth
//   with key_id:key_secret, POST /v1/orders, then HMAC-SHA256 signature
//   verification on the client's callback data). This is the real, standard
//   pattern used in production.
// - I could NOT make a live test call to api.razorpay.com from the sandbox
//   this was built in (that domain isn't reachable from there). What I DID
//   test directly is the signature-verification function itself (pure crypto,
//   no network needed) — see the README for that test.
// - Once you add your own Razorpay key_id/key_secret (test mode is free,
//   no KYC needed to start) and run this on your own server/domain, the
//   create-order call will genuinely hit Razorpay's live API.

const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/payments/create-order   { amountInInr }
// Creates a real Razorpay order (amount is in the smallest currency unit — paise).
router.post('/create-order', requireAuth, async (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return res.status(501).json({
      error: 'RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET .env mein set nahi hain. https://dashboard.razorpay.com se test-mode keys free mein milti hain.'
    });
  }

  const { amountInInr } = req.body;
  if (!amountInInr || amountInInr <= 0) {
    return res.status(400).json({ error: 'amountInInr ek positive number hona chahiye.' });
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  try {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`
      },
      body: JSON.stringify({
        amount: Math.round(amountInInr * 100), // paise
        currency: 'INR',
        receipt: `shilpmitra_${Date.now()}`
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(502).json({ error: 'Razorpay order create nahi hua.', details: data });
    }

    res.json({ razorpayOrderId: data.id, amount: data.amount, currency: data.currency, keyId });
  } catch (err) {
    res.status(502).json({ error: 'Razorpay API tak pahunch nahi paaye: ' + err.message });
  }
});

// Exported separately so it can be unit-tested without going through Express/HTTP.
function isSignatureValid({ razorpay_order_id, razorpay_payment_id, razorpay_signature }, keySecret) {
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  return expected === razorpay_signature;
}

// POST /api/payments/verify
// { razorpay_order_id, razorpay_payment_id, razorpay_signature, cartItems: [{productId, quantity}] }
router.post('/verify', requireAuth, (req, res) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return res.status(501).json({ error: 'RAZORPAY_KEY_SECRET set nahi hai.' });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, cartItems } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Razorpay ke teeno fields chahiye: order_id, payment_id, signature.' });
  }

  const valid = isSignatureValid({ razorpay_order_id, razorpay_payment_id, razorpay_signature }, keySecret);
  if (!valid) return res.status(400).json({ error: 'Payment signature match nahi hui — ye payment genuine nahi hai.' });

  const createdOrders = [];
  const insert = db.prepare(
    `INSERT INTO orders (buyer_id, product_id, quantity, total_price, status, payment_status, payment_ref)
     VALUES (?, ?, ?, ?, 'new', 'paid', ?)`
  );

  (cartItems || []).forEach((item) => {
    const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(item.productId);
    if (!product) return;
    const totalPrice = product.price * (item.quantity || 1);
    const result = insert.run(req.user.id, item.productId, item.quantity || 1, totalPrice, razorpay_payment_id);
    createdOrders.push(db.prepare(`SELECT * FROM orders WHERE id = ?`).get(result.lastInsertRowid));
  });

  res.json({ message: 'Payment verified aur orders create ho gaye.', orders: createdOrders });
});

module.exports = { router, isSignatureValid };
