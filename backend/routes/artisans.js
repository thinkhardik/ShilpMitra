// routes/artisans.js
const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/:id', (req, res) => {
  const artisan = db.prepare(`SELECT id, name, region, trust_score, role FROM users WHERE id = ? AND role = 'artisan'`).get(req.params.id);
  if (!artisan) return res.status(404).json({ error: 'Artisan nahi mila.' });

  const stats = db.prepare(
    `SELECT COUNT(*) AS totalProducts FROM products WHERE artisan_id = ?`
  ).get(req.params.id);

  const orderStats = db.prepare(
    `SELECT COUNT(*) AS totalOrders, COALESCE(SUM(total_price),0) AS totalEarnings
     FROM orders JOIN products ON products.id = orders.product_id
     WHERE products.artisan_id = ?`
  ).get(req.params.id);

  res.json({ ...artisan, ...stats, ...orderStats });
});

module.exports = router;
