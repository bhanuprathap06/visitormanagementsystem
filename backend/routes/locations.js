const router = require('express').Router();
const db     = require('../config/database');

// GET all
router.get('/', async (req, res, next) => {
  try {
    const { type, active } = req.query;
    let sql  = 'SELECT * FROM LOCATION WHERE 1=1';
    const p  = [];
    if (type)   { sql += ' AND location_type=?'; p.push(type); }
    if (active !== undefined) { sql += ' AND is_active=?'; p.push(active === 'true' ? 1 : 0); }
    sql += ' ORDER BY location_name';
    const [rows] = await db.query(sql, p);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET one
router.get('/:id', async (req, res, next) => {
  try {
    const [[row]] = await db.query('SELECT * FROM LOCATION WHERE location_id=?', [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: 'Location not found' });
    // also get dept count
    const [[{ depts }]] = await db.query(
      'SELECT COUNT(*) AS depts FROM DEPARTMENT WHERE location_id=?', [req.params.id]);
    res.json({ success: true, data: { ...row, department_count: depts } });
  } catch (err) { next(err); }
});

// POST create
router.post('/', async (req, res, next) => {
  try {
    const { location_name,location_type,address,city,state,pincode,
            capacity,contact_no,email,opening_time,closing_time } = req.body;
    const [result] = await db.query(
      `INSERT INTO LOCATION (location_name,location_type,address,city,state,pincode,
       capacity,contact_no,email,opening_time,closing_time)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [location_name,location_type,address,city,state,pincode,
       capacity,contact_no,email,opening_time,closing_time]
    );
    const [[newRow]] = await db.query('SELECT * FROM LOCATION WHERE location_id=?', [result.insertId]);
    res.status(201).json({ success: true, data: newRow, message: 'Location created' });
  } catch (err) { next(err); }
});

// PUT update
router.put('/:id', async (req, res, next) => {
  try {
    const { location_name,location_type,address,city,state,pincode,
            capacity,contact_no,email,opening_time,closing_time,is_active } = req.body;
    await db.query(
      `UPDATE LOCATION SET location_name=?,location_type=?,address=?,city=?,state=?,
       pincode=?,capacity=?,contact_no=?,email=?,opening_time=?,closing_time=?,is_active=?
       WHERE location_id=?`,
      [location_name,location_type,address,city,state,pincode,
       capacity,contact_no,email,opening_time,closing_time,is_active,req.params.id]
    );
    const [[row]] = await db.query('SELECT * FROM LOCATION WHERE location_id=?', [req.params.id]);
    res.json({ success: true, data: row, message: 'Location updated' });
  } catch (err) { next(err); }
});

// PATCH toggle active
router.patch('/:id/toggle', async (req, res, next) => {
  try {
    await db.query('UPDATE LOCATION SET is_active = NOT is_active WHERE location_id=?', [req.params.id]);
    const [[row]] = await db.query('SELECT * FROM LOCATION WHERE location_id=?', [req.params.id]);
    res.json({ success: true, data: row, message: `Location ${row.is_active ? 'activated' : 'deactivated'}` });
  } catch (err) { next(err); }
});

// DELETE
router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM LOCATION WHERE location_id=?', [req.params.id]);
    res.json({ success: true, message: 'Location deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
