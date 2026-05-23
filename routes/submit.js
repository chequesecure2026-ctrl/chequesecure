const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { pool } = require('../db');
const { verifyCheque } = require('../services/verify');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `cheque_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /submit/:token — firm's submission page
router.get('/:token', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM firms WHERE unique_token = $1', [req.params.token]
    );
    if (!rows.length) return res.status(404).send('Invalid link. Please contact the distributor.');
    res.sendFile(path.join(__dirname, '../public/submit.html'));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET /submit/:token/info — firm details for the form
router.get('/:token/info', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, contact_name FROM firms WHERE unique_token = $1', [req.params.token]
    );
    if (!rows.length) return res.status(404).json({ error: 'Invalid link' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /submit/:token — cheque submission
router.post('/:token', upload.single('cheque_image'), async (req, res) => {
  try {
    const { rows: firmRows } = await pool.query(
      'SELECT * FROM firms WHERE unique_token = $1', [req.params.token]
    );
    if (!firmRows.length) return res.status(404).json({ error: 'Invalid link' });
    const firm = firmRows[0];

    const { cheque_number, amount_figures, cheque_date, bank_name, branch } = req.body;
    if (!cheque_number || !amount_figures || !cheque_date || !bank_name || !req.file) {
      return res.status(400).json({ error: 'All fields and cheque image are required' });
    }

    const imagePath = `uploads/${req.file.filename}`;

    const { rows } = await pool.query(
      `INSERT INTO cheques 
        (firm_id, firm_name, cheque_number, amount_figures, cheque_date, bank_name, branch, image_path)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [firm.id, firm.name, cheque_number, amount_figures, cheque_date, bank_name, branch || '', imagePath]
    );
    const cheque = rows[0];

    // Run AI verification in background
    verifyCheque(cheque).then(async (result) => {
      await pool.query(
        `UPDATE cheques SET 
          verification_status = 'done',
          verification_overall = $1,
          verification_reason = $2,
          verification_data = $3,
          verified_at = NOW()
         WHERE id = $4`,
        [result.overall, result.overall_reason, JSON.stringify(result), cheque.id]
      );
    }).catch(async (err) => {
      console.error('Verification failed:', err);
      await pool.query(
        `UPDATE cheques SET verification_status = 'error' WHERE id = $1`, [cheque.id]
      );
    });

    res.json({ success: true, cheque_id: cheque.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Submission failed. Please try again.' });
  }
});

module.exports = router;
