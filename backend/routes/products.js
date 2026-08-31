// routes/products.js
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { generateCatalogEntry } = require('../services/aiCatalog');

const router = express.Router();

// GET /api/products?category=&maxPrice=&sort=low|high
router.get('/', (req, res) => {
  const { category, maxPrice, sort } = req.query;
  let sql = `
    SELECT products.*, users.name AS artisan_name, users.region AS artisan_region
    FROM products JOIN users ON users.id = products.artisan_id
    WHERE products.status = 'live'`;
  const params = [];

  if (category) {
    sql += ` AND products.category = ?`;
    params.push(category);
  }
  if (maxPrice) {
    sql += ` AND products.price <= ?`;
    params.push(Number(maxPrice));
  }
  if (sort === 'low') sql += ` ORDER BY products.price ASC`;
  else if (sort === 'high') sql += ` ORDER BY products.price DESC`;
  else sql += ` ORDER BY products.created_at DESC`;

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare(
    `SELECT products.*, users.name AS artisan_name, users.region AS artisan_region
     FROM products JOIN users ON users.id = products.artisan_id
     WHERE products.id = ?`
  ).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Product nahi mila.' });
  res.json(row);
});

// POST /api/products/ai-catalog  { rawNotes }  -> real Anthropic API call
router.post('/ai-catalog', requireAuth, async (req, res) => {
  const { rawNotes } = req.body;
  if (!rawNotes || rawNotes.trim().length < 4) {
    return res.status(400).json({ error: 'rawNotes mein product ke baare mein kuch likhein ya bolein.' });
  }
  try {
    const catalogEntry = await generateCatalogEntry({ rawNotes });
    res.json(catalogEntry);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/products  (artisan creates a listing)
router.post('/', requireAuth, (req, res) => {
  if (req.user.role !== 'artisan') return res.status(403).json({ error: 'Sirf artisans product list kar sakte hain.' });
  const { title, description, category, price, ai_suggested_price } = req.body;
  if (!title || !price) return res.status(400).json({ error: 'title aur price zaroori hain.' });

  const result = db.prepare(
    `INSERT INTO products (artisan_id, title, description, category, price, ai_suggested_price, status)
     VALUES (?, ?, ?, ?, ?, ?, 'live')`
  ).run(req.user.id, title, description || '', category || '', price, ai_suggested_price || null);

  const created = db.prepare(`SELECT * FROM products WHERE id = ?`).get(result.lastInsertRowid);
  res.status(201).json(created);
});

// GET /api/products/mine/list -> artisan's own listings (for the dashboard)
router.get('/mine/list', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT * FROM products WHERE artisan_id = ? ORDER BY created_at DESC`).all(req.user.id);
  res.json(rows);
});

module.exports = router;
