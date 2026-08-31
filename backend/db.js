// db.js — real, persistent SQLite database using the well-established
// better-sqlite3 package (works reliably across all Node versions and
// hosting platforms — unlike the newer node:sqlite built-in, which isn't
// available on every Node version, e.g. Render's default runtime).

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'shilpmitra.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'buyer',
    region TEXT,
    trust_score REAL DEFAULT 4.0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS otp_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artisan_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price REAL NOT NULL,
    ai_suggested_price REAL,
    status TEXT DEFAULT 'live',
    verified_badge INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (artisan_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyer_id INTEGER,
    product_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    total_price REAL NOT NULL,
    status TEXT DEFAULT 'new',
    payment_status TEXT DEFAULT 'pending',
    payment_ref TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

const productCount = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
if (productCount === 0) {
  const insertUser = db.prepare(
    `INSERT INTO users (phone, name, role, region, trust_score) VALUES (?, ?, ?, ?, ?)`
  );
  const artisanId = insertUser.run('+919990000001', 'Radha Devi', 'artisan', 'Khurja, UP', 4.7).lastInsertRowid;

  const insertProduct = db.prepare(
    `INSERT INTO products (artisan_id, title, description, category, price, ai_suggested_price, status, verified_badge)
     VALUES (?, ?, ?, ?, ?, ?, 'live', 1)`
  );
  insertProduct.run(artisanId, 'Terracotta Diya Set', 'Hand-painted terracotta diyas, natural clay, traditional glazing.', 'Pottery', 340, 340);
  insertProduct.run(artisanId, 'Hand-painted Clay Vase', 'A vase blending modern and traditional motifs.', 'Pottery', 720, 700);
  insertProduct.run(artisanId, 'Clay Wind Chime', 'Handmade wind chime with a soft natural sound.', 'Pottery', 410, 400);

  console.log('Seeded database with a demo artisan and 3 products.');
}

module.exports = db;
