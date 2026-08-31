// middleware/auth.js — verifies the JWT issued after OTP login.
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Login required. Send Authorization: Bearer <token>.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me');
    req.user = payload; // { id, phone, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = { requireAuth };
