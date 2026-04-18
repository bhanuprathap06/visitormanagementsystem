const router = require('express').Router();
const db     = require('../config/database');

// GET all tickets
router.get('/', async (req, res, next) => {
  try {
    const { status, location_id, visitor_id, checked } = req.query;
    let sql = `
      SELECT t.*, v.name AS visitor_name, v.phone_no,
             l.location_name, p.payment_mode, p.transaction_id
      FROM TICKET t
      JOIN VISITOR v  ON t.visitor_id  = v.visitor_id
      JOIN LOCATION l ON t.location_id = l.location_id
      JOIN PAYMENT p  ON t.payment_id  = p.payment_id
      WHERE 1=1`;
    const params = [];
    if (status)      { sql += ' AND t.ticket_status=?';  params.push(status); }
    if (location_id) { sql += ' AND t.location_id=?';    params.push(location_id); }
    if (visitor_id)  { sql += ' AND t.visitor_id=?';     params.push(visitor_id); }
    if (checked !== undefined) { sql += ' AND t.checked=?'; params.push(checked === 'true' ? 1 : 0); }
    sql += ' ORDER BY t.created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET pending check-in (active, not checked, valid today)
router.get('/pending-checkin', async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT t.*, v.name AS visitor_name, v.phone_no, l.location_name
      FROM TICKET t
      JOIN VISITOR v  ON t.visitor_id  = v.visitor_id
      JOIN LOCATION l ON t.location_id = l.location_id
      WHERE t.checked = FALSE
        AND t.ticket_status = 'active'
        AND CURDATE() BETWEEN t.valid_from AND t.valid_till
      ORDER BY t.valid_from ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET single ticket (also by QR)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const isQr = isNaN(id);
    const col  = isQr ? 'ticket_qr' : 'ticket_id';
    const [[row]] = await db.query(
      `SELECT t.*, v.name AS visitor_name, v.phone_no, v.email,
              l.location_name, p.payment_mode, p.payment_status
       FROM TICKET t
       JOIN VISITOR v  ON t.visitor_id  = v.visitor_id
       JOIN LOCATION l ON t.location_id = l.location_id
       JOIN PAYMENT p  ON t.payment_id  = p.payment_id
       WHERE t.${col}=?`, [id]);
    if (!row) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

// POST create ticket (with payment in one call)
router.post('/', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const {
      visitor_id, location_id, ticket_category,
      base_price, discount_amount = 0,
      valid_from, valid_till,
      payment_mode, transaction_id, remarks
    } = req.body;

    if (!visitor_id || !location_id || !ticket_category || !base_price || !valid_from || !valid_till || !payment_mode)
      return res.status(400).json({ success: false, message: 'visitor_id, location_id, ticket_category, base_price, valid_from, valid_till and payment_mode are required' });
    if (String(valid_from).slice(0, 10) > String(valid_till).slice(0, 10))
      return res.status(400).json({ success: false, message: 'valid_till must be on or after valid_from' });

    const final_price  = parseFloat(base_price) - parseFloat(discount_amount);
    if (final_price < 0)
      return res.status(400).json({ success: false, message: 'Discount cannot exceed base price' });

    const ticket_qr    = `TKT_${location_id}_${Date.now()}`;
    const txnId        = transaction_id || `TXN-${Date.now()}`;

    const [pRes] = await conn.query(
      `INSERT INTO PAYMENT (amount,payment_mode,payment_status,transaction_id,remarks)
       VALUES (?,?,'completed',?,?)`,
      [final_price, payment_mode, txnId, remarks || null]);

    const [tRes] = await conn.query(
      `INSERT INTO TICKET (visitor_id,location_id,ticket_category,base_price,discount_amount,
       final_price,valid_from,valid_till,ticket_qr,payment_id)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [visitor_id,location_id,ticket_category,base_price,discount_amount,
       final_price,valid_from,valid_till,ticket_qr,pRes.insertId]);

    await conn.commit();

    const [[newTicket]] = await conn.query(
      `SELECT t.*,v.name AS visitor_name,l.location_name,p.payment_mode,p.transaction_id
       FROM TICKET t JOIN VISITOR v ON t.visitor_id=v.visitor_id
       JOIN LOCATION l ON t.location_id=l.location_id
       JOIN PAYMENT p  ON t.payment_id=p.payment_id
       WHERE t.ticket_id=?`, [tRes.insertId]);

    res.status(201).json({ success: true, data: newTicket, message: 'Ticket issued successfully' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally { conn.release(); }
});

// POST check-in (gate scan)
router.post('/checkin', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { ticket_qr, ticket_id, staff_id, entry_gate = 'Main Gate', purpose = 'Tourism' } = req.body;
    const col = ticket_qr ? 'ticket_qr' : 'ticket_id';
    const val = ticket_qr || ticket_id;

    const [[ticket]] = await conn.query(`SELECT * FROM TICKET WHERE ${col}=?`, [val]);
    if (!ticket)         throw { status: 404, message: 'Ticket not found' };
    if (ticket.checked)  throw { status: 400, message: 'Ticket already used' };
    if (ticket.ticket_status !== 'active') throw { status: 400, message: `Ticket is ${ticket.ticket_status}` };

    const today = new Date().toISOString().slice(0,10);
    if (today < String(ticket.valid_from).slice(0,10) ||
        today > String(ticket.valid_till).slice(0,10)) {
      throw { status: 400, message: 'Ticket not valid today' };
    }

    await conn.query(
      `UPDATE TICKET SET checked=TRUE, checked_by_staff_id=?, checked_time=NOW(), ticket_status='used'
       WHERE ticket_id=?`, [staff_id, ticket.ticket_id]);

    const [vRes] = await conn.query(
      `INSERT INTO VISIT (visitor_id,ticket_id,location_id,visit_date,entry_time,entry_gate,
       purpose,visit_status,approved_by_staff_id,entry_recorded_by_staff_id)
       VALUES (?,?,?,CURDATE(),NOW(),?,?,'in_progress',?,?)`,
      [ticket.visitor_id,ticket.ticket_id,ticket.location_id,
       entry_gate,purpose,staff_id,staff_id]);

    await conn.commit();

    const [[visit]] = await conn.query(
      `SELECT vi.*, v.name AS visitor_name, l.location_name, t2.ticket_category
       FROM VISIT vi
       JOIN VISITOR v  ON vi.visitor_id  = v.visitor_id
       JOIN LOCATION l ON vi.location_id = l.location_id
       JOIN TICKET t2  ON vi.ticket_id   = t2.ticket_id
       WHERE vi.visit_id=?`, [vRes.insertId]);

    res.json({ success: true, data: visit, message: 'Check-in successful!' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally { conn.release(); }
});

// PATCH cancel ticket
router.patch('/:id/cancel', async (req, res, next) => {
  try {
    const [[t]] = await db.query('SELECT * FROM TICKET WHERE ticket_id=?', [req.params.id]);
    if (!t) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (t.checked) return res.status(400).json({ success: false, message: 'Cannot cancel a used ticket' });
    await db.query(`UPDATE TICKET SET ticket_status='cancelled' WHERE ticket_id=?`, [req.params.id]);
    res.json({ success: true, message: 'Ticket cancelled' });
  } catch (err) { next(err); }
});

module.exports = router;
