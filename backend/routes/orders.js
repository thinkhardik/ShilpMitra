// routes/orders.js
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const COMMISSION_RATE = 0.08; // 8% — matches the business model in the pitch

// POST /api/orders  { productId, quantity }
router.post('/', requireAuth, (req, res) => {
  const { productId, quantity } = req.body;
  const qty = Number(quantity) || 1;

  const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(productId);
  if (!product) return res.status(404).json({ error: 'Product nahi mila.' });

  const totalPrice = product.price * qty;

  const result = db.prepare(
    `INSERT INTO orders (buyer_id, product_id, quantity, total_price, status, payment_status)
     VALUES (?, ?, ?, ?, 'new', 'pending')`
  ).run(req.user.id, productId, qty, totalPrice);

  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(result.lastInsertRowid);
  const commission = +(totalPrice * COMMISSION_RATE).toFixed(2);
  const artisanPayout = +(totalPrice - commission).toFixed(2);

  res.status(201).json({ order, commission, artisanPayout });
});

// GET /api/orders/mine -> buyer's own orders
router.get('/mine', requireAuth, (req, res) => {
  const rows = db.prepare(
    `SELECT orders.*, products.title AS product_title
     FROM orders JOIN products ON products.id = orders.product_id
     WHERE orders.buyer_id = ? ORDER BY orders.created_at DESC`
  ).all(req.user.id);
  res.json(rows);
});

// GET /api/orders/for-artisan -> orders on the logged-in artisan's products
router.get('/for-artisan', requireAuth, (req, res) => {
  if (req.user.role !== 'artisan') return res.status(403).json({ error: 'Sirf artisans ke liye.' });
  const rows = db.prepare(
    `SELECT orders.*, products.title AS product_title
     FROM orders JOIN products ON products.id = orders.product_id
     WHERE products.artisan_id = ? ORDER BY orders.created_at DESC`
  ).all(req.user.id);
  res.json(rows);
});

// PATCH /api/orders/:id/status  { status: 'shipped' | 'delivered' }
router.patch('/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  if (!['new', 'shipped', 'delivered'].includes(status)) {
    return res.status(400).json({ error: 'status new/shipped/delivered mein se ek hona chahiye.' });
  }
  db.prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(status, req.params.id);
  const updated = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(req.params.id);
  res.json(updated);
});

module.exports = router;
