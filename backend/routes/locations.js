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

// GET /api/locations/daily-capacity?visit_date=YYYY-MM-DD
router.get('/daily-capacity', async (req, res, next) => {
  try {
    const visit_date = String(req.query.visit_date || '').slice(0, 10);
    if (!visit_date) return res.status(400).json({ success: false, message: 'visit_date is required' });

    const [rows] = await db.query(
      `
      SELECT
        l.location_id,
        l.location_name,
        l.capacity AS fallback_max_tickets,
        dc.capacity_id,
        dc.max_tickets,
        dc.tickets_sold,
        (
          SELECT COUNT(*)
          FROM TICKET t
          WHERE t.location_id=l.location_id
            AND t.valid_from=?
            AND t.ticket_status != 'cancelled'
        ) AS tickets_sold_fallback
      FROM LOCATION l
      LEFT JOIN DAILY_CAPACITY dc
        ON dc.location_id=l.location_id
       AND dc.visit_date=?
      WHERE l.is_active=1
      ORDER BY l.location_id ASC
      `,
      [visit_date, visit_date]
    );

    const data = rows.map((r) => {
      const max = Number(r.max_tickets ?? r.fallback_max_tickets);
      const sold = Number(r.capacity_id ? r.tickets_sold : r.tickets_sold_fallback) || 0;
      return {
        location_id: r.location_id,
        location_name: r.location_name,
        visit_date,
        capacity_id: r.capacity_id || null,
        max_tickets: max,
        tickets_sold: sold,
        remaining: Math.max(0, max - sold),
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/locations/daily-capacity
// body: { location_id, visit_date, max_tickets }
router.put('/daily-capacity', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const location_id = Number(req.body.location_id);
    const visit_date = String(req.body.visit_date || '').slice(0, 10);
    const max_tickets = Number(req.body.max_tickets);
    if (!location_id) return res.status(400).json({ success: false, message: 'location_id is required' });
    if (!visit_date) return res.status(400).json({ success: false, message: 'visit_date is required' });
    if (!Number.isFinite(max_tickets) || max_tickets <= 0)
      return res.status(400).json({ success: false, message: 'max_tickets must be > 0' });

    await conn.beginTransaction();

    const [[sold]] = await conn.query(
      `SELECT COUNT(*) AS tickets_sold
       FROM TICKET
       WHERE location_id=? AND valid_from=? AND ticket_status != 'cancelled'`,
      [location_id, visit_date]
    );
    const tickets_sold = Number(sold?.tickets_sold || 0);

    await conn.query(
      `
      INSERT INTO DAILY_CAPACITY (location_id, visit_date, max_tickets, tickets_sold)
      VALUES (?,?,?,?)
      ON DUPLICATE KEY UPDATE
        max_tickets=VALUES(max_tickets),
        tickets_sold=VALUES(tickets_sold)
      `,
      [location_id, visit_date, max_tickets, tickets_sold]
    );

    const [[row]] = await conn.query(
      `SELECT capacity_id, location_id, visit_date, max_tickets, tickets_sold
       FROM DAILY_CAPACITY WHERE location_id=? AND visit_date=?`,
      [location_id, visit_date]
    );

    await conn.commit();
    res.json({
      success: true,
      data: { ...row, remaining: Math.max(0, Number(row.max_tickets) - Number(row.tickets_sold || 0)) },
      message: 'Daily capacity updated',
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// GET /api/locations/pricing-config?location_id=1&visit_date=YYYY-MM-DD
router.get('/pricing-config', async (req, res, next) => {
  try {
    const location_id = Number(req.query.location_id);
    const visit_date = String(req.query.visit_date || new Date().toISOString().slice(0, 10)).slice(0, 10);
    if (!location_id) return res.status(400).json({ success: false, message: 'location_id is required' });

    const [rows] = await db.query(
      `
      SELECT pc.ticket_category, pc.base_price, pc.discount_pct, pc.effective_from, pc.effective_till, pc.is_active
      FROM PRICING_CONFIG pc
      JOIN (
        SELECT ticket_category, MAX(effective_from) AS max_from
        FROM PRICING_CONFIG
        WHERE location_id=?
          AND is_active=1
          AND effective_from <= ?
          AND (effective_till IS NULL OR effective_till >= ?)
        GROUP BY ticket_category
      ) pick
        ON pick.ticket_category = pc.ticket_category
       AND pick.max_from = pc.effective_from
      WHERE pc.location_id=?
      ORDER BY pc.ticket_category ASC
      `,
      [location_id, visit_date, visit_date, location_id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// PUT /api/locations/pricing-config
// body: { location_id, ticket_category, base_price, discount_pct }
router.put('/pricing-config', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const location_id = Number(req.body.location_id);
    const ticket_category = String(req.body.ticket_category || '').trim();
    const base_price = Number(req.body.base_price);
    const discount_pct = Number(req.body.discount_pct || 0);
    const effective_from = String(req.body.effective_from || new Date().toISOString().slice(0, 10)).slice(0, 10);

    if (!location_id) return res.status(400).json({ success: false, message: 'location_id is required' });
    if (!ticket_category) return res.status(400).json({ success: false, message: 'ticket_category is required' });
    if (!Number.isFinite(base_price) || base_price < 0) return res.status(400).json({ success: false, message: 'base_price must be >= 0' });
    if (!Number.isFinite(discount_pct) || discount_pct < 0 || discount_pct > 100)
      return res.status(400).json({ success: false, message: 'discount_pct must be between 0 and 100' });

    await conn.beginTransaction();

    // Close any currently-open config for this category so the newest takes effect cleanly
    await conn.query(
      `
      UPDATE PRICING_CONFIG
      SET effective_till = DATE_SUB(?, INTERVAL 1 DAY)
      WHERE location_id=?
        AND ticket_category=?
        AND is_active=1
        AND (effective_till IS NULL OR effective_till >= ?)
        AND effective_from <= ?
      `,
      [effective_from, location_id, ticket_category, effective_from, effective_from]
    );

    const [ins] = await conn.query(
      `
      INSERT INTO PRICING_CONFIG (location_id, ticket_category, base_price, discount_pct, is_active, effective_from, effective_till)
      VALUES (?,?,?,?,1,?,NULL)
      `,
      [location_id, ticket_category, base_price, discount_pct, effective_from]
    );

    const [[row]] = await conn.query(`SELECT * FROM PRICING_CONFIG WHERE config_id=?`, [ins.insertId]);
    await conn.commit();
    res.json({ success: true, data: row, message: 'Pricing updated' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
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
