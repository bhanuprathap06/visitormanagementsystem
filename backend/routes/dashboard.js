const router = require('express').Router();
const db     = require('../config/database');

// GET /api/dashboard/overview
router.get('/overview', async (_req, res, next) => {
  try {
    const [[todayStats]] = await db.query(`
      SELECT
        COUNT(DISTINCT vi.visitor_id)                                     AS today_visitors,
        COALESCE(SUM(t.final_price),0)                                    AS today_revenue,
        COUNT(CASE WHEN vi.visit_status='in_progress' THEN 1 END)        AS active_visits,
        COUNT(CASE WHEN vi.visit_status='completed'   THEN 1 END)        AS completed_today
      FROM VISIT vi
      JOIN TICKET t ON vi.ticket_id = t.ticket_id
      WHERE vi.visit_date = CURDATE()
    `);

    const [[totals]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM VISITOR)           AS total_visitors,
        (SELECT COUNT(*) FROM TICKET)            AS total_tickets,
        (SELECT COALESCE(SUM(amount),0) FROM PAYMENT WHERE payment_status='completed') AS total_revenue,
        (SELECT COUNT(*) FROM LOCATION WHERE is_active=1) AS active_locations
    `);

    const [[capacityCheck]] = await db.query(`
      SELECT
        l.location_name,
        l.capacity,
        COUNT(CASE WHEN vi.visit_status='in_progress' THEN 1 END) AS current_occupancy
      FROM LOCATION l
      LEFT JOIN VISIT vi ON vi.location_id = l.location_id AND vi.visit_date = CURDATE()
      WHERE l.is_active = 1
      GROUP BY l.location_id
      ORDER BY current_occupancy DESC
      LIMIT 1
    `);

    res.json({ success: true, data: { ...todayStats, ...totals, top_location: capacityCheck } });
  } catch (err) { next(err); }
});

// GET /api/dashboard/visitor-trends  (last 30 days)
router.get('/visitor-trends', async (_req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT
        DATE(vi.visit_date)           AS date,
        COUNT(DISTINCT vi.visitor_id) AS visitors,
        COALESCE(SUM(t.final_price),0)AS revenue
      FROM VISIT vi
      JOIN TICKET t ON vi.ticket_id = t.ticket_id
      WHERE vi.visit_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(vi.visit_date)
      ORDER BY date ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET /api/dashboard/revenue-by-location
router.get('/revenue-by-location', async (_req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT l.location_name,
             COALESCE(SUM(t.final_price),0) AS revenue,
             COUNT(t.ticket_id)             AS tickets_sold
      FROM LOCATION l
      LEFT JOIN TICKET t ON t.location_id = l.location_id AND t.ticket_status != 'cancelled'
      GROUP BY l.location_id
      ORDER BY revenue DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET /api/dashboard/ticket-categories
router.get('/ticket-categories', async (_req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT ticket_category, COUNT(*) AS count, SUM(final_price) AS revenue
      FROM TICKET
      WHERE ticket_status != 'cancelled'
      GROUP BY ticket_category
      ORDER BY count DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET /api/dashboard/recent-visits
router.get('/recent-visits', async (_req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT vi.visit_id, v.name AS visitor_name, l.location_name,
             vi.entry_time, vi.exit_time, vi.visit_status,
             t.ticket_category, t.final_price
      FROM VISIT vi
      JOIN VISITOR v  ON vi.visitor_id = v.visitor_id
      JOIN LOCATION l ON vi.location_id = l.location_id
      JOIN TICKET t   ON vi.ticket_id   = t.ticket_id
      ORDER BY vi.created_at DESC
      LIMIT 10
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET /api/dashboard/payment-modes
router.get('/payment-modes', async (_req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT payment_mode, COUNT(*) AS transactions, SUM(amount) AS total
      FROM PAYMENT WHERE payment_status='completed'
      GROUP BY payment_mode ORDER BY total DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

module.exports = router;
