const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAuth } = require('./admin');
const { sendAcknowledgmentEmail } = require('../services/mailer');
const { sendAcknowledgmentWhatsApp } = require('../services/whatsapp');

// POST /acknowledge/:id
router.post('/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE cheques SET acknowledged = true, acknowledged_at = NOW(), acknowledged_by = 'admin'
       WHERE id = $1 AND acknowledged = false RETURNING *`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Cheque not found or already acknowledged' });
    const cheque = rows[0];

    const { rows: firmRows } = await pool.query(
      'SELECT * FROM firms WHERE id = $1', [cheque.firm_id]
    );
    const firm = firmRows[0];

    // Send notifications in background
    const notifications = [];
    if (firm?.email) {
      notifications.push(
        sendAcknowledgmentEmail(firm.email, cheque)
          .catch(err => console.error('Email failed:', err))
      );
    }
    if (firm?.whatsapp) {
      notifications.push(
        sendAcknowledgmentWhatsApp(firm.whatsapp, cheque)
          .catch(err => console.error('WhatsApp failed:', err))
      );
    }
    await Promise.allSettled(notifications);

    res.json({ success: true, cheque });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Acknowledgment failed' });
  }
});

module.exports = router;
