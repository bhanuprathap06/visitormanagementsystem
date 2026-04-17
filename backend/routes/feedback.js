const router = require('express').Router();
const db     = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const { location_id } = req.query;
    let sql = `SELECT f.*, v.name AS visitor_name, l.location_name, vi.visit_date
               FROM FEEDBACK f
               JOIN VISITOR v  ON f.visitor_id  = v.visitor_id
               JOIN LOCATION l ON f.location_id  = l.location_id
               JOIN VISIT vi   ON f.visit_id     = vi.visit_id
               WHERE 1=1`;
    const p = [];
    if (location_id) { sql += ' AND f.location_id=?'; p.push(location_id); }
    sql += ' ORDER BY f.submitted_at DESC';
    const [rows] = await db.query(sql, p);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { visit_id, visitor_id, location_id, overall_rating,
            cleanliness, staff_rating, facilities, value_rating, comments } = req.body;
    const [r] = await db.query(
      `INSERT INTO FEEDBACK (visit_id,visitor_id,location_id,overall_rating,
       cleanliness,staff_rating,facilities,value_rating,comments)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [visit_id,visitor_id,location_id,overall_rating,
       cleanliness||null,staff_rating||null,facilities||null,value_rating||null,comments||null]);
    const [[row]] = await db.query(
      `SELECT f.*,v.name AS visitor_name,l.location_name FROM FEEDBACK f
       JOIN VISITOR v ON f.visitor_id=v.visitor_id JOIN LOCATION l ON f.location_id=l.location_id
       WHERE f.feedback_id=?`, [r.insertId]);
    res.status(201).json({ success: true, data: row, message: 'Feedback submitted' });
  } catch (err) { next(err); }
});

router.get('/summary', async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT l.location_name,
             COUNT(*) AS total_reviews,
             ROUND(AVG(f.overall_rating),1) AS avg_overall,
             ROUND(AVG(f.cleanliness),1)    AS avg_cleanliness,
             ROUND(AVG(f.staff_rating),1)   AS avg_staff,
             ROUND(AVG(f.facilities),1)     AS avg_facilities,
             ROUND(AVG(f.value_rating),1)   AS avg_value
      FROM FEEDBACK f JOIN LOCATION l ON f.location_id=l.location_id
      GROUP BY l.location_id ORDER BY avg_overall DESC`);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

module.exports = router;
