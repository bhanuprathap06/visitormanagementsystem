const router = require('express').Router();
const db     = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const { status, location_id, date_from, date_to } = req.query;
    let sql = `
      SELECT vi.*, v.name AS visitor_name, v.phone_no,
             l.location_name, t.ticket_category, t.final_price,
             es.staff_name AS entry_staff, xs.staff_name AS exit_staff
      FROM VISIT vi
      JOIN VISITOR v  ON vi.visitor_id = v.visitor_id
      JOIN LOCATION l ON vi.location_id = l.location_id
      JOIN TICKET t   ON vi.ticket_id   = t.ticket_id
      LEFT JOIN STAFF es ON vi.entry_recorded_by_staff_id = es.staff_id
      LEFT JOIN STAFF xs ON vi.exit_recorded_by_staff_id  = xs.staff_id
      WHERE 1=1`;
    const p = [];
    if (status)      { sql += ' AND vi.visit_status=?';  p.push(status); }
    if (location_id) { sql += ' AND vi.location_id=?';   p.push(location_id); }
    if (date_from)   { sql += ' AND vi.visit_date>=?';   p.push(date_from); }
    if (date_to)     { sql += ' AND vi.visit_date<=?';   p.push(date_to); }
    sql += ' ORDER BY vi.entry_time DESC';
    const [rows] = await db.query(sql, p);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET active visits (currently inside)
router.get('/active', async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT vi.*, v.name AS visitor_name, v.phone_no,
             l.location_name, t.ticket_category,
             TIMESTAMPDIFF(MINUTE, vi.entry_time, NOW()) AS minutes_inside
      FROM VISIT vi
      JOIN VISITOR v  ON vi.visitor_id = v.visitor_id
      JOIN LOCATION l ON vi.location_id = l.location_id
      JOIN TICKET t   ON vi.ticket_id   = t.ticket_id
      WHERE vi.visit_status = 'in_progress'
      ORDER BY vi.entry_time ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [[row]] = await db.query(`
      SELECT vi.*, v.name AS visitor_name, v.phone_no, v.email,
             l.location_name, t.ticket_category, t.final_price, t.ticket_qr,
             es.staff_name AS entry_staff, xs.staff_name AS exit_staff,
             as2.staff_name AS approved_by_name
      FROM VISIT vi
      JOIN VISITOR v    ON vi.visitor_id  = v.visitor_id
      JOIN LOCATION l   ON vi.location_id = l.location_id
      JOIN TICKET t     ON vi.ticket_id   = t.ticket_id
      LEFT JOIN STAFF es   ON vi.entry_recorded_by_staff_id  = es.staff_id
      LEFT JOIN STAFF xs   ON vi.exit_recorded_by_staff_id   = xs.staff_id
      LEFT JOIN STAFF as2  ON vi.approved_by_staff_id        = as2.staff_id
      WHERE vi.visit_id=?`, [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: 'Visit not found' });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

// PUT checkout
router.put('/:id/checkout', async (req, res, next) => {
  try {
    const { exit_gate = 'Main Gate', staff_id, notes } = req.body;
    const [[visit]] = await db.query('SELECT * FROM VISIT WHERE visit_id=?', [req.params.id]);
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    if (visit.visit_status === 'completed')
      return res.status(400).json({ success: false, message: 'Visit already completed' });

    await db.query(
      `UPDATE VISIT
       SET exit_time=NOW(),
           exit_gate=?,
           exit_recorded_by_staff_id=?,
           notes=COALESCE(?, notes),
           visit_status='completed',
           total_duration_minutes=TIMESTAMPDIFF(MINUTE, entry_time, NOW())
       WHERE visit_id=?`,
      [exit_gate, staff_id || null, notes || null, req.params.id]);

    const [[updated]] = await db.query(
      `SELECT vi.*, v.name AS visitor_name, l.location_name
       FROM VISIT vi JOIN VISITOR v ON vi.visitor_id=v.visitor_id
       JOIN LOCATION l ON vi.location_id=l.location_id
       WHERE vi.visit_id=?`, [req.params.id]);

    res.json({ success: true, data: updated, message: 'Checkout successful!' });
  } catch (err) { next(err); }
});

// PATCH update status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { visit_status } = req.body;
    await db.query('UPDATE VISIT SET visit_status=? WHERE visit_id=?', [visit_status, req.params.id]);
    res.json({ success: true, message: 'Status updated' });
  } catch (err) { next(err); }
});

module.exports = router;
