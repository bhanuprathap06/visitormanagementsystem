const router = require('express').Router();
const db     = require('../config/database');

// NOTE: head_staff_id migration is handled by migrate.js (runs on server start)

const SELECT_ALL = `
  SELECT d.*,
         l.location_name,
         s.staff_name  AS head_name,
         s.staff_type  AS head_type,
         (SELECT COUNT(*) FROM STAFF m
          WHERE m.department_id = d.department_id AND m.is_active = 1) AS member_count
  FROM DEPARTMENT d
  JOIN LOCATION l ON d.location_id = l.location_id
  LEFT JOIN STAFF s ON s.staff_id = d.head_staff_id`;

// GET all departments
router.get('/', async (req, res, next) => {
  try {
    const { location_id } = req.query;
    let sql = SELECT_ALL + ' WHERE 1=1';
    const p = [];
    if (location_id) { sql += ' AND d.location_id=?'; p.push(location_id); }
    sql += ' ORDER BY d.department_name';
    const [rows] = await db.query(sql, p);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET single department
router.get('/:id', async (req, res, next) => {
  try {
    const [[row]] = await db.query(SELECT_ALL + ' WHERE d.department_id=?', [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

// GET members of a department
router.get('/:id/members', async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT staff_id, staff_name, staff_type, email, phone_no, shift, is_active
      FROM STAFF
      WHERE department_id = ? AND is_active = 1
      ORDER BY staff_type, staff_name`, [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// POST create
router.post('/', async (req, res, next) => {
  try {
    const { department_name, location_id, description, head_staff_id } = req.body;
    if (!department_name || !location_id)
      return res.status(400).json({ success: false, message: 'department_name and location_id are required' });
    const [r] = await db.query(
      'INSERT INTO DEPARTMENT (department_name, location_id, description, head_staff_id) VALUES (?,?,?,?)',
      [department_name, location_id, description || null, head_staff_id || null]);
    const [[row]] = await db.query(SELECT_ALL + ' WHERE d.department_id=?', [r.insertId]);
    res.status(201).json({ success: true, data: row, message: 'Department created' });
  } catch (err) { next(err); }
});

// PUT update
router.put('/:id', async (req, res, next) => {
  try {
    const { department_name, location_id, description, head_staff_id } = req.body;
    if (!department_name || !location_id)
      return res.status(400).json({ success: false, message: 'department_name and location_id are required' });
    await db.query(
      'UPDATE DEPARTMENT SET department_name=?, location_id=?, description=?, head_staff_id=? WHERE department_id=?',
      [department_name, location_id, description || null, head_staff_id || null, req.params.id]);
    const [[row]] = await db.query(SELECT_ALL + ' WHERE d.department_id=?', [req.params.id]);
    res.json({ success: true, data: row, message: 'Department updated' });
  } catch (err) { next(err); }
});

// DELETE
router.delete('/:id', async (req, res, next) => {
  try {
    const [[chk]] = await db.query(
      'SELECT COUNT(*) AS c FROM STAFF WHERE department_id=?', [req.params.id]);
    if (chk.c > 0)
      return res.status(400).json({ success: false, message: `Cannot delete — ${chk.c} staff member(s) still in this department` });
    await db.query('DELETE FROM DEPARTMENT WHERE department_id=?', [req.params.id]);
    res.json({ success: true, message: 'Department deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
