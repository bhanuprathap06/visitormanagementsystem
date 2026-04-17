const router = require('express').Router();
const db     = require('../config/database');

// ── Revenue report ──────────────────────────────────────────────────────────
router.get('/revenue', async (req, res, next) => {
  try {
    const { from = '2020-01-01', to = '2099-12-31' } = req.query;

    const [byLocation] = await db.query(`
      SELECT l.location_name,
             COUNT(t.ticket_id)     AS tickets,
             COALESCE(SUM(t.final_price),0) AS revenue,
             AVG(t.final_price)     AS avg_ticket
      FROM TICKET t
      JOIN LOCATION l ON t.location_id = l.location_id
      WHERE DATE(t.issue_date) BETWEEN ? AND ? AND t.ticket_status != 'cancelled'
      GROUP BY l.location_id, l.location_name
      ORDER BY revenue DESC`, [from, to]);

    const [byCategory] = await db.query(`
      SELECT ticket_category,
             COUNT(*) AS tickets,
             COALESCE(SUM(final_price),0) AS revenue
      FROM TICKET
      WHERE DATE(issue_date) BETWEEN ? AND ? AND ticket_status != 'cancelled'
      GROUP BY ticket_category
      ORDER BY revenue DESC`, [from, to]);

    const [byPayment] = await db.query(`
      SELECT payment_mode,
             COUNT(*)        AS transactions,
             COALESCE(SUM(amount),0) AS total
      FROM PAYMENT
      WHERE DATE(payment_date) BETWEEN ? AND ? AND payment_status = 'completed'
      GROUP BY payment_mode
      ORDER BY total DESC`, [from, to]);

    const [daily] = await db.query(`
      SELECT DATE(issue_date) AS date,
             COALESCE(SUM(final_price),0) AS revenue,
             COUNT(*) AS tickets
      FROM TICKET
      WHERE DATE(issue_date) BETWEEN ? AND ? AND ticket_status != 'cancelled'
      GROUP BY DATE(issue_date)
      ORDER BY date ASC`, [from, to]);

    res.json({ success: true, data: { by_location: byLocation, by_category: byCategory, by_payment: byPayment, daily } });
  } catch (err) { next(err); }
});

// ── Visitor report ──────────────────────────────────────────────────────────
router.get('/visitors', async (req, res, next) => {
  try {
    const { from = '2020-01-01', to = '2099-12-31' } = req.query;

    const [byLocation] = await db.query(`
      SELECT l.location_name,
             COUNT(DISTINCT vi.visitor_id)           AS unique_visitors,
             COUNT(vi.visit_id)                      AS total_visits,
             COALESCE(AVG(vi.total_duration_minutes),0) AS avg_duration
      FROM VISIT vi
      JOIN LOCATION l ON vi.location_id = l.location_id
      WHERE vi.visit_date BETWEEN ? AND ?
      GROUP BY l.location_id, l.location_name
      ORDER BY unique_visitors DESC`, [from, to]);

    // ← key is now "count" to match frontend
    const [byGender] = await db.query(`
      SELECT v.gender,
             COUNT(DISTINCT vi.visitor_id) AS count
      FROM VISIT vi
      JOIN VISITOR v ON vi.visitor_id = v.visitor_id
      WHERE vi.visit_date BETWEEN ? AND ?
      GROUP BY v.gender
      ORDER BY count DESC`, [from, to]);

    // ← new: visit purpose breakdown
    const [byPurpose] = await db.query(`
      SELECT COALESCE(vi.purpose, 'Tourism') AS purpose,
             COUNT(*) AS visits
      FROM VISIT vi
      WHERE vi.visit_date BETWEEN ? AND ?
      GROUP BY vi.purpose
      ORDER BY visits DESC`, [from, to]);

    // Top repeat visitors
    const [repeatVisitors] = await db.query(`
      SELECT v.name, v.phone_no,
             COUNT(vi.visit_id) AS visit_count
      FROM VISIT vi
      JOIN VISITOR v ON vi.visitor_id = v.visitor_id
      WHERE vi.visit_date BETWEEN ? AND ?
      GROUP BY vi.visitor_id, v.name, v.phone_no
      HAVING COUNT(vi.visit_id) > 1
      ORDER BY visit_count DESC
      LIMIT 10`, [from, to]);

    const [daily] = await db.query(`
      SELECT visit_date AS date,
             COUNT(DISTINCT visitor_id) AS visitors
      FROM VISIT
      WHERE visit_date BETWEEN ? AND ?
      GROUP BY visit_date
      ORDER BY visit_date ASC`, [from, to]);

    res.json({
      success: true,
      data: {
        by_location:     byLocation,
        by_gender:       byGender,       // each row: { gender, count }
        by_purpose:      byPurpose,      // each row: { purpose, visits }
        repeat_visitors: repeatVisitors,
        daily,
      }
    });
  } catch (err) { next(err); }
});

// ── Staff performance ───────────────────────────────────────────────────────
router.get('/staff-performance', async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT s.staff_id, s.staff_name, s.staff_type,
             d.department_name, l.location_name,
             COUNT(DISTINCT CASE WHEN vi.entry_recorded_by_staff_id = s.staff_id THEN vi.visit_id END) AS entries,
             COUNT(DISTINCT CASE WHEN vi.exit_recorded_by_staff_id  = s.staff_id THEN vi.visit_id END) AS exits,
             COUNT(DISTINCT t.ticket_id) AS tickets_sold
      FROM STAFF s
      JOIN DEPARTMENT d ON s.department_id = d.department_id
      JOIN LOCATION l   ON d.location_id   = l.location_id
      LEFT JOIN VISIT vi ON (vi.entry_recorded_by_staff_id = s.staff_id
                          OR vi.exit_recorded_by_staff_id  = s.staff_id)
      LEFT JOIN TICKET t ON t.checked_by_staff_id = s.staff_id
      WHERE s.is_active = 1
      GROUP BY s.staff_id, s.staff_name, s.staff_type, d.department_name, l.location_name
      ORDER BY entries DESC`);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ── Location summary ────────────────────────────────────────────────────────
router.get('/location-summary', async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT l.*,
             COUNT(DISTINCT t.ticket_id)            AS total_tickets,
             COALESCE(SUM(t.final_price), 0)        AS total_revenue,
             COUNT(DISTINCT vi.visit_id)            AS total_visits,
             COALESCE(AVG(vi.total_duration_minutes),0) AS avg_duration,
             (SELECT COUNT(*) FROM STAFF s
              JOIN DEPARTMENT d ON s.department_id = d.department_id
              WHERE d.location_id = l.location_id AND s.is_active = 1) AS active_staff
      FROM LOCATION l
      LEFT JOIN TICKET t  ON t.location_id  = l.location_id AND t.ticket_status != 'cancelled'
      LEFT JOIN VISIT vi  ON vi.location_id = l.location_id
      GROUP BY l.location_id
      ORDER BY total_revenue DESC`);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

module.exports = router;
