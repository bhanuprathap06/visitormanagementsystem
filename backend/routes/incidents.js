const router = require('express').Router();
const db     = require('../config/database');

const SELECT = `
  SELECT ir.*, l.location_name,
         s.staff_name AS reported_by_name, s.staff_type AS reported_by_type
  FROM INCIDENT_REPORT ir
  JOIN LOCATION l ON ir.location_id = l.location_id
  LEFT JOIN STAFF s ON ir.reported_by_staff = s.staff_id`;

// GET all
router.get('/', async (req, res, next) => {
  try {
    const { resolved, location_id, severity } = req.query;
    let sql = SELECT + ' WHERE 1=1';
    const p = [];
    if (resolved !== undefined) { sql += ' AND ir.resolved=?'; p.push(resolved === 'true' ? 1 : 0); }
    if (location_id) { sql += ' AND ir.location_id=?'; p.push(location_id); }
    if (severity)    { sql += ' AND ir.severity=?';    p.push(severity); }
    sql += ' ORDER BY ir.incident_time DESC';
    const [rows] = await db.query(sql, p);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET single
router.get('/:id', async (req, res, next) => {
  try {
    const [[row]] = await db.query(SELECT + ' WHERE ir.incident_id=?', [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: 'Incident not found' });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

// POST create
router.post('/', async (req, res, next) => {
  try {
    const { location_id, reported_by_staff, incident_type, severity, description } = req.body;
    if (!location_id || !reported_by_staff || !incident_type || !description)
      return res.status(400).json({ success: false, message: 'location_id, reported_by_staff, incident_type, and description are required' });

    const [r] = await db.query(
      `INSERT INTO INCIDENT_REPORT (location_id, reported_by_staff, incident_type, severity, description)
       VALUES (?,?,?,?,?)`,
      [location_id, reported_by_staff, incident_type, severity || 'low', description]);

    const [[row]] = await db.query(SELECT + ' WHERE ir.incident_id=?', [r.insertId]);
    res.status(201).json({ success: true, data: row, message: 'Incident reported' });
  } catch (err) { next(err); }
});

// PUT update (edit description, severity, type)
router.put('/:id', async (req, res, next) => {
  try {
    const { location_id, reported_by_staff, incident_type, severity, description, resolution_notes, resolved } = req.body;
    await db.query(
      `UPDATE INCIDENT_REPORT
       SET location_id=?, reported_by_staff=?, incident_type=?, severity=?, description=?,
           resolution_notes=?, resolved=?, resolved_at=IF(?,NOW(),NULL)
       WHERE incident_id=?`,
      [location_id, reported_by_staff, incident_type, severity, description,
       resolution_notes || null, resolved ? 1 : 0, resolved ? 1 : 0, req.params.id]);

    const [[row]] = await db.query(SELECT + ' WHERE ir.incident_id=?', [req.params.id]);
    res.json({ success: true, data: row, message: 'Incident updated' });
  } catch (err) { next(err); }
});

// PATCH resolve
router.patch('/:id/resolve', async (req, res, next) => {
  try {
    const { resolution_notes } = req.body;
    await db.query(
      `UPDATE INCIDENT_REPORT SET resolved=1, resolved_at=NOW(), resolution_notes=? WHERE incident_id=?`,
      [resolution_notes || null, req.params.id]);
    res.json({ success: true, message: 'Incident resolved' });
  } catch (err) { next(err); }
});

module.exports = router;
