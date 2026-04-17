const router = require('express').Router();
const db     = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const { active } = req.query;
    let sql = `SELECT a.*, l.location_name, s.staff_name AS created_by_name
               FROM ANNOUNCEMENT a
               LEFT JOIN LOCATION l ON a.location_id=l.location_id
               JOIN STAFF s ON a.created_by=s.staff_id
               WHERE 1=1`;
    const p = [];
    if (active === 'true') {
      sql += ' AND a.is_active=1 AND (a.valid_till IS NULL OR a.valid_till >= NOW())';
    }
    sql += ' ORDER BY a.created_at DESC';
    const [rows] = await db.query(sql, p);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { location_id, title, message, priority, created_by, valid_from, valid_till } = req.body;
    const [r] = await db.query(
      `INSERT INTO ANNOUNCEMENT (location_id,title,message,priority,created_by,valid_from,valid_till)
       VALUES (?,?,?,?,?,?,?)`,
      [location_id||null, title, message, priority||'normal', created_by, valid_from||new Date(), valid_till||null]);
    const [[row]] = await db.query(
      `SELECT a.*, l.location_name, s.staff_name AS created_by_name
       FROM ANNOUNCEMENT a LEFT JOIN LOCATION l ON a.location_id=l.location_id
       JOIN STAFF s ON a.created_by=s.staff_id WHERE a.announcement_id=?`, [r.insertId]);
    res.status(201).json({ success: true, data: row, message: 'Announcement created' });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { title, message, priority, is_active, valid_till } = req.body;
    await db.query(
      `UPDATE ANNOUNCEMENT SET title=?,message=?,priority=?,is_active=?,valid_till=? WHERE announcement_id=?`,
      [title, message, priority, is_active, valid_till||null, req.params.id]);
    res.json({ success: true, message: 'Announcement updated' });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM ANNOUNCEMENT WHERE announcement_id=?', [req.params.id]);
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
