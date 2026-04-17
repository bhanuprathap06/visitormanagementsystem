const router = require('express').Router();
const db     = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const { status, mode } = req.query;
    let sql = 'SELECT * FROM PAYMENT WHERE 1=1';
    const p = [];
    if (status) { sql += ' AND payment_status=?'; p.push(status); }
    if (mode)   { sql += ' AND payment_mode=?';   p.push(mode); }
    sql += ' ORDER BY payment_date DESC';
    const [rows] = await db.query(sql, p);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [[row]] = await db.query('SELECT * FROM PAYMENT WHERE payment_id=?', [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { amount, payment_mode, payment_status = 'completed', transaction_id, remarks } = req.body;
    const txnId = transaction_id || `TXN-${Date.now()}`;
    const [r] = await db.query(
      `INSERT INTO PAYMENT (amount,payment_mode,payment_status,transaction_id,remarks)
       VALUES (?,?,?,?,?)`,
      [amount, payment_mode, payment_status, txnId, remarks]);
    const [[row]] = await db.query('SELECT * FROM PAYMENT WHERE payment_id=?', [r.insertId]);
    res.status(201).json({ success: true, data: row, message: 'Payment recorded' });
  } catch (err) { next(err); }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { payment_status, remarks } = req.body;
    await db.query('UPDATE PAYMENT SET payment_status=?, remarks=? WHERE payment_id=?',
      [payment_status, remarks, req.params.id]);
    const [[row]] = await db.query('SELECT * FROM PAYMENT WHERE payment_id=?', [req.params.id]);
    res.json({ success: true, data: row, message: 'Payment status updated' });
  } catch (err) { next(err); }
});

module.exports = router;
