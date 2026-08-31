// server.js — ShilpMitra real backend entry point.
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const artisanRoutes = require('./routes/artisans');
const { router: paymentRoutes } = require('./routes/payments');

const app = express();

// CORS: in production, set ALLOWED_ORIGIN in .env to your real domain
// (e.g. https://shilpmitra.com) so only your own frontend can call this API.
// If ALLOWED_ORIGIN is not set, all origins are allowed — fine for local dev,
// NOT recommended once you deploy to your domain.
const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ShilpMitra backend chal raha hai.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/artisans', artisanRoutes);
app.use('/api/payments', paymentRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route nahi mila.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\nShilpMitra backend http://localhost:${PORT} par chal raha hai`);
  console.log(`Health check: http://localhost:${PORT}/api/health\n`);
});
