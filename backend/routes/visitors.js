const router = require('express').Router();
const db     = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const { search, gender } = req.query;
    let sql = 'SELECT * FROM VISITOR WHERE 1=1';
    const p = [];
    if (search) {
      sql += ' AND (name LIKE ? OR phone_no LIKE ? OR email LIKE ?)';
      const s = `%${search}%`;
      p.push(s, s, s);
    }
    if (gender) { sql += ' AND gender=?'; p.push(gender); }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, p);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [[visitor]] = await db.query('SELECT * FROM VISITOR WHERE visitor_id=?', [req.params.id]);
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });

    const [visits] = await db.query(
      `SELECT vi.*, l.location_name, t.ticket_category, t.final_price
       FROM VISIT vi
       JOIN LOCATION l ON vi.location_id=l.location_id
       JOIN TICKET t   ON vi.ticket_id=t.ticket_id
       WHERE vi.visitor_id=? ORDER BY vi.visit_date DESC`, [req.params.id]);

    res.json({ success: true, data: { ...visitor, visit_history: visits } });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name,phone_no,email,address,id_proof_type,id_proof_no,date_of_birth,gender } = req.body;
    const visitor_qr = `VIS_QR_${Date.now()}`;
    const [r] = await db.query(
      `INSERT INTO VISITOR (name,phone_no,email,address,id_proof_type,id_proof_no,visitor_qr,date_of_birth,gender)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [name,phone_no,email,address,id_proof_type,id_proof_no,visitor_qr,date_of_birth||null,gender]);
    const [[row]] = await db.query('SELECT * FROM VISITOR WHERE visitor_id=?', [r.insertId]);
    res.status(201).json({ success: true, data: row, message: 'Visitor registered' });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name,phone_no,email,address,id_proof_type,id_proof_no,date_of_birth,gender } = req.body;
    await db.query(
      `UPDATE VISITOR SET name=?,phone_no=?,email=?,address=?,
       id_proof_type=?,id_proof_no=?,date_of_birth=?,gender=? WHERE visitor_id=?`,
      [name,phone_no,email,address,id_proof_type,id_proof_no,date_of_birth||null,gender,req.params.id]);
    const [[row]] = await db.query('SELECT * FROM VISITOR WHERE visitor_id=?', [req.params.id]);
    res.json({ success: true, data: row, message: 'Visitor updated' });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM VISITOR WHERE visitor_id=?', [req.params.id]);
    res.json({ success: true, message: 'Visitor deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
