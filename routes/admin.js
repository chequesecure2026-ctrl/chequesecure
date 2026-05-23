const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

function requireAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ error: 'Unauthorised' });
}

// GET /admin — dashboard page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// POST /admin/login
router.post('/login', async (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.admin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Wrong password' });
  }
});

// POST /admin/logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// GET /admin/session — check login state
router.get('/session', (req, res) => {
  res.json({ loggedIn: !!(req.session && req.session.admin) });
});

// GET /admin/cheques — all cheques
router.get('/cheques', requireAuth, async (req, res) => {
  try {
    const { status, verification } = req.query;
    let query = `SELECT c.*, f.email, f.whatsapp FROM cheques c 
                 LEFT JOIN firms f ON c.firm_id = f.id`;
    const conditions = [];
    const params = [];

    if (status) { conditions.push(`c.status = $${params.length + 1}`); params.push(status); }
    if (verification) { conditions.push(`c.verification_overall = $${params.length + 1}`); params.push(verification); }

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY c.submitted_at DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cheques' });
  }
});

// GET /admin/cheques/:id — single cheque detail
router.get('/cheques/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, f.email, f.whatsapp FROM cheques c 
       LEFT JOIN firms f ON c.firm_id = f.id WHERE c.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cheque' });
  }
});

// GET /admin/firms — list firms
router.get('/firms', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT f.*, COUNT(c.id) as cheque_count 
       FROM firms f LEFT JOIN cheques c ON c.firm_id = f.id
       GROUP BY f.id ORDER BY f.name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch firms' });
  }
});

// POST /admin/firms — add a new firm
router.post('/firms', requireAuth, async (req, res) => {
  try {
    const { name, contact_name, email, whatsapp } = req.body;
    if (!name) return res.status(400).json({ error: 'Firm name is required' });
    const token = uuidv4();
    const { rows } = await pool.query(
      `INSERT INTO firms (name, contact_name, email, whatsapp, unique_token)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, contact_name || '', email || '', whatsapp || '', token]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add firm' });
  }
});

// GET /admin/stats — dashboard summary counts
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'held') AS held,
        COUNT(*) FILTER (WHERE acknowledged = false AND status = 'held') AS pending_ack,
        COUNT(*) FILTER (WHERE verification_overall = 'FAIL') AS failed,
        COUNT(*) FILTER (WHERE verification_overall = 'WARN') AS warned,
        COUNT(*) FILTER (WHERE verification_status = 'pending') AS verifying
      FROM cheques
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
module.exports.requireAuth = requireAuth;
