const router = require('express').Router();
const db     = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const { staff_type, location_id, active } = req.query;
    let sql = `SELECT s.*, d.department_name, l.location_name, l.location_id
               FROM STAFF s
               LEFT JOIN DEPARTMENT d ON s.department_id = d.department_id
               LEFT JOIN LOCATION l   ON d.location_id   = l.location_id
               WHERE 1=1`;
    const p = [];
    if (staff_type)  { sql += ' AND s.staff_type=?';   p.push(staff_type); }
    if (location_id) { sql += ' AND l.location_id=?';  p.push(location_id); }
    if (active !== undefined) { sql += ' AND s.is_active=?'; p.push(active === 'true' ? 1 : 0); }
    sql += ' ORDER BY s.staff_name';
    const [rows] = await db.query(sql, p);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [[row]] = await db.query(
      `SELECT s.*, d.department_name, l.location_name FROM STAFF s
       LEFT JOIN DEPARTMENT d ON s.department_id=d.department_id
       LEFT JOIN LOCATION l   ON d.location_id=l.location_id
       WHERE s.staff_id=?`, [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: 'Staff not found' });

    const [visits] = await db.query(
      `SELECT COUNT(*) AS entries FROM VISIT WHERE entry_recorded_by_staff_id=?`, [req.params.id]);
    res.json({ success: true, data: { ...row, entries_recorded: visits[0].entries } });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { staff_name,staff_type,department_id,phone_no,email,shift,hire_date } = req.body;
    const [r] = await db.query(
      `INSERT INTO STAFF (staff_name,staff_type,department_id,phone_no,email,shift,hire_date)
       VALUES (?,?,?,?,?,?,?)`,
      [staff_name,staff_type,department_id,phone_no,email,shift,hire_date]);
    const [[row]] = await db.query(
      `SELECT s.*,d.department_name,l.location_name FROM STAFF s
       LEFT JOIN DEPARTMENT d ON s.department_id=d.department_id
       LEFT JOIN LOCATION l ON d.location_id=l.location_id WHERE s.staff_id=?`, [r.insertId]);
    res.status(201).json({ success: true, data: row, message: 'Staff member created' });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { staff_name,staff_type,department_id,phone_no,email,shift,hire_date,is_active } = req.body;
    await db.query(
      `UPDATE STAFF SET staff_name=?,staff_type=?,department_id=?,phone_no=?,
       email=?,shift=?,hire_date=?,is_active=? WHERE staff_id=?`,
      [staff_name,staff_type,department_id,phone_no,email,shift,hire_date,is_active,req.params.id]);
    const [[row]] = await db.query(
      `SELECT s.*,d.department_name,l.location_name FROM STAFF s
       LEFT JOIN DEPARTMENT d ON s.department_id=d.department_id
       LEFT JOIN LOCATION l ON d.location_id=l.location_id WHERE s.staff_id=?`, [req.params.id]);
    res.json({ success: true, data: row, message: 'Staff updated' });
  } catch (err) { next(err); }
});

router.patch('/:id/toggle', async (req, res, next) => {
  try {
    await db.query('UPDATE STAFF SET is_active = NOT is_active WHERE staff_id=?', [req.params.id]);
    const [[row]] = await db.query('SELECT * FROM STAFF WHERE staff_id=?', [req.params.id]);
    res.json({ success: true, data: row, message: `Staff ${row.is_active ? 'activated' : 'deactivated'}` });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM STAFF WHERE staff_id=?', [req.params.id]);
    res.json({ success: true, message: 'Staff deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
