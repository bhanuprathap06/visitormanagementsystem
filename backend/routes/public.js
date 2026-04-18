const router = require('express').Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_EXPIRES_IN = '7d';
const TOKEN_STORAGE_KEY = 'vms_visitor_token';

function getJwtSecret() {
  return process.env.JWT_SECRET || process.env.VISITOR_JWT_SECRET || 'dev_only_change_me';
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function sanitizeVisitorFromDb(row) {
  if (!row) return null;
  const { password_hash, ...safe } = row;
  return safe;
}

async function getActivePricingMap(conn, locationId, visitDate) {
  const [rows] = await conn.query(
    `
    SELECT pc.ticket_category, pc.base_price, pc.discount_pct
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
      AND pc.is_active=1
    `,
    [locationId, visitDate, visitDate, locationId]
  );
  const map = {};
  for (const r of rows) {
    map[r.ticket_category] = {
      base_price: Number(r.base_price),
      discount_pct: Number(r.discount_pct || 0),
    };
  }
  return map;
}

async function getCapacitySnapshot(conn, locationId, visitDate, { forUpdate } = {}) {
  const [[loc]] = await conn.query(
    `SELECT location_id, location_name, capacity FROM LOCATION WHERE location_id=? AND is_active=1`,
    [locationId]
  );
  if (!loc) throw { status: 404, message: 'Location not found' };

  const lock = forUpdate ? ' FOR UPDATE' : '';
  const [[cap]] = await conn.query(
    `SELECT capacity_id, max_tickets, tickets_sold
     FROM DAILY_CAPACITY
     WHERE location_id=? AND visit_date=?${lock}`,
    [locationId, visitDate]
  );

  if (cap) {
    const maxTickets = Number(cap.max_tickets);
    const ticketsSold = Number(cap.tickets_sold || 0);
    return {
      source: 'DAILY_CAPACITY',
      capacity_id: cap.capacity_id,
      max_tickets: maxTickets,
      tickets_sold: ticketsSold,
      remaining: Math.max(0, maxTickets - ticketsSold),
      location: { ...loc, capacity: Number(loc.capacity) },
    };
  }

  const [[sold]] = await conn.query(
    `SELECT COUNT(*) AS tickets_sold
     FROM TICKET
     WHERE location_id=?
       AND valid_from=?
       AND ticket_status != 'cancelled'`,
    [locationId, visitDate]
  );
  const ticketsSold = Number(sold?.tickets_sold || 0);
  const maxTickets = Number(loc.capacity); // fallback if DAILY_CAPACITY not set
  return {
    source: 'LOCATION.capacity',
    capacity_id: null,
    max_tickets: maxTickets,
    tickets_sold: ticketsSold,
    remaining: Math.max(0, maxTickets - ticketsSold),
    location: { ...loc, capacity: Number(loc.capacity) },
  };
}

function requireVisitorAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token =
      (header.startsWith('Bearer ') ? header.slice(7) : null) ||
      req.headers[TOKEN_STORAGE_KEY] ||
      null;
    if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });

    const payload = jwt.verify(token, getJwtSecret());
    req.visitorAccount = payload;
    next();
  } catch (_e) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// POST /api/public/register
router.post('/register', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [r] = await db.query(
      `INSERT INTO VISITOR_ACCOUNT (email, password_hash) VALUES (?,?)`,
      [email, password_hash]
    );

    const token = jwt.sign({ account_id: r.insertId, email }, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
    res.status(201).json({
      success: true,
      data: { account_id: r.insertId, email, token, token_expires_in: JWT_EXPIRES_IN },
      message: 'Account created',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/public/login
router.post('/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    const [[acct]] = await db.query(`SELECT * FROM VISITOR_ACCOUNT WHERE email=?`, [email]);
    if (!acct) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, acct.password_hash);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = jwt.sign(
      { account_id: acct.account_id, email: acct.email, visitor_id: acct.visitor_id || null },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    );
    res.json({
      success: true,
      data: { ...sanitizeVisitorFromDb(acct), token, token_expires_in: JWT_EXPIRES_IN },
      message: 'Login successful',
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/locations
router.get('/locations', async (_req, res, next) => {
  try {
    const visitDate = new Date().toISOString().slice(0, 10);

    const [locations] = await db.query(
      `
      SELECT l.location_id, l.location_name, l.location_type, l.address, l.city, l.state, l.pincode,
             l.capacity, l.opening_time, l.closing_time, l.is_active
      FROM LOCATION l
      WHERE l.is_active=1
      ORDER BY l.location_id ASC
      `
    );

    const [activeCounts] = await db.query(
      `
      SELECT location_id, COUNT(*) AS current_inside
      FROM VISIT
      WHERE visit_status='in_progress' AND visit_date = CURDATE()
      GROUP BY location_id
      `
    );
    const insideByLoc = Object.fromEntries(activeCounts.map((r) => [r.location_id, Number(r.current_inside)]));

    const [capRows] = await db.query(
      `SELECT location_id, max_tickets, tickets_sold FROM DAILY_CAPACITY WHERE visit_date=?`,
      [visitDate]
    );
    const capByLoc = Object.fromEntries(
      capRows.map((r) => [
        r.location_id,
        { max_tickets: Number(r.max_tickets), tickets_sold: Number(r.tickets_sold || 0) },
      ])
    );

    const [fallbackSoldRows] = await db.query(
      `
      SELECT location_id, COUNT(*) AS tickets_sold
      FROM TICKET
      WHERE valid_from=? AND ticket_status != 'cancelled'
      GROUP BY location_id
      `,
      [visitDate]
    );
    const soldByLoc = Object.fromEntries(fallbackSoldRows.map((r) => [r.location_id, Number(r.tickets_sold)]));

    // Fetch all active pricing in one query (avoids N+1)
    const locationIds = locations.map((l) => l.location_id);
    const pricingByLoc = {};
    if (locationIds.length > 0) {
      const [pricingRows] = await db.query(
        `SELECT pc.location_id, pc.ticket_category, pc.base_price, pc.discount_pct
         FROM PRICING_CONFIG pc
         JOIN (
           SELECT location_id, ticket_category, MAX(effective_from) AS max_from
           FROM PRICING_CONFIG
           WHERE location_id IN (?)
             AND is_active=1
             AND effective_from <= ?
             AND (effective_till IS NULL OR effective_till >= ?)
           GROUP BY location_id, ticket_category
         ) pick
           ON pick.location_id = pc.location_id
          AND pick.ticket_category = pc.ticket_category
          AND pick.max_from = pc.effective_from
         WHERE pc.is_active=1`,
        [locationIds, visitDate, visitDate]
      );
      for (const r of pricingRows) {
        if (!pricingByLoc[r.location_id]) pricingByLoc[r.location_id] = {};
        pricingByLoc[r.location_id][r.ticket_category] = {
          base_price: Number(r.base_price),
          discount_pct: Number(r.discount_pct || 0),
        };
      }
    }

    const payload = [];
    for (const l of locations) {
      const currentInside = insideByLoc[l.location_id] || 0;
      const occupancyPct = l.capacity ? Math.round((currentInside / Number(l.capacity)) * 100) : 0;

      const cap = capByLoc[l.location_id];
      const maxTickets = cap?.max_tickets ?? Number(l.capacity);
      const ticketsSold = cap?.tickets_sold ?? (soldByLoc[l.location_id] || 0);
      const remainingTickets = Math.max(0, maxTickets - ticketsSold);

      const pricing = pricingByLoc[l.location_id] || {};

      payload.push({
        ...l,
        capacity: Number(l.capacity),
        live: {
          visit_date: visitDate,
          current_inside: currentInside,
          occupancy_pct: occupancyPct,
          max_tickets: maxTickets,
          tickets_sold: ticketsSold,
          remaining_tickets: remainingTickets,
        },
        pricing,
      });
    }

    res.json({ success: true, data: payload });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/tickets/available?location_id=1&visit_date=YYYY-MM-DD
router.get('/tickets/available', async (req, res, next) => {
  try {
    const locationId = Number(req.query.location_id);
    const visitDate = String(req.query.visit_date || '').slice(0, 10);
    if (!locationId) return res.status(400).json({ success: false, message: 'location_id is required' });
    if (!visitDate) return res.status(400).json({ success: false, message: 'visit_date is required' });

    const snapshot = await getCapacitySnapshot(db, locationId, visitDate);
    const pricing = await getActivePricingMap(db, locationId, visitDate);
    res.json({
      success: true,
      data: {
        location_id: locationId,
        visit_date: visitDate,
        max_tickets: snapshot.max_tickets,
        tickets_sold: snapshot.tickets_sold,
        remaining: snapshot.remaining,
        pricing,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/public/book
router.post('/book', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const locationId = Number(req.body.location_id);
    const visitDate = String(req.body.visit_date || '').slice(0, 10);
    const paymentMode = String(req.body.payment_mode || 'upi');
    const tickets = Array.isArray(req.body.tickets) ? req.body.tickets : [];
    const visitor = req.body.visitor || {};

    if (!locationId) return res.status(400).json({ success: false, message: 'location_id is required' });
    if (!visitDate) return res.status(400).json({ success: false, message: 'visit_date is required' });
    if (!tickets.length) return res.status(400).json({ success: false, message: 'At least one ticket item is required' });

    const totalRequested = tickets.reduce((sum, t) => sum + Number(t.quantity || 0), 0);
    if (totalRequested <= 0) return res.status(400).json({ success: false, message: 'Ticket quantity must be at least 1' });

    const email = normalizeEmail(visitor.email);
    const name = String(visitor.name || '').trim();
    const phone_no = String(visitor.phone_no || visitor.phone || '').trim();
    const id_proof_type = visitor.id_proof_type;
    const id_proof_no = String(visitor.id_proof_no || '').trim();
    const date_of_birth = visitor.date_of_birth || null;
    const gender = visitor.gender || null;

    if (!name) return res.status(400).json({ success: false, message: 'Visitor name is required' });
    if (!phone_no) return res.status(400).json({ success: false, message: 'Visitor phone is required' });
    if (!email || !email.includes('@')) return res.status(400).json({ success: false, message: 'Valid visitor email is required' });
    if (!id_proof_type) return res.status(400).json({ success: false, message: 'ID proof type is required' });
    if (!id_proof_no) return res.status(400).json({ success: false, message: 'ID proof number is required' });

    await conn.beginTransaction();

    // If authenticated, try to use the account's visitor_id (or link it after creating visitor)
    let account = null;
    let accountId = null;
    let linkedVisitorId = null;
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (token) {
        const payload = jwt.verify(token, getJwtSecret());
        accountId = payload.account_id;
        const [[acct]] = await conn.query(`SELECT * FROM VISITOR_ACCOUNT WHERE account_id=? FOR UPDATE`, [accountId]);
        account = acct || null;
        linkedVisitorId = acct?.visitor_id || null;
      }
    } catch (_e) {
      // ignore token errors for booking (guest checkout allowed)
    }

    // Capacity (lock the row if present)
    const cap = await getCapacitySnapshot(conn, locationId, visitDate, { forUpdate: true });
    if (cap.remaining < totalRequested) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: `Only ${cap.remaining} tickets remaining for the selected date.`,
      });
    }

    // Ensure visitor exists
    let visitorId = linkedVisitorId;
    if (!visitorId) {
      const [[existing]] = await conn.query(
        `SELECT visitor_id FROM VISITOR WHERE email=? OR id_proof_no=? LIMIT 1`,
        [email, id_proof_no]
      );
      visitorId = existing?.visitor_id || null;
    }

    if (!visitorId) {
      const visitor_qr = `VIS_${uuidv4()}`;
      const [vRes] = await conn.query(
        `INSERT INTO VISITOR (name, phone_no, email, id_proof_type, id_proof_no, visitor_qr, date_of_birth, gender)
         VALUES (?,?,?,?,?,?,?,?)`,
        [name, phone_no, email, id_proof_type, id_proof_no, visitor_qr, date_of_birth, gender]
      );
      visitorId = vRes.insertId;
    }

    // If logged in and account has no link yet, link it (only if email matches)
    if (accountId && account && !account.visitor_id && normalizeEmail(account.email) === email) {
      await conn.query(`UPDATE VISITOR_ACCOUNT SET visitor_id=? WHERE account_id=?`, [visitorId, accountId]);
    }

    // Pricing map for totals
    const pricingMap = await getActivePricingMap(conn, locationId, visitDate);

    let totalAmount = 0;
    const computedTicketLines = [];
    for (const item of tickets) {
      const category = String(item.category || item.ticket_category || '').trim();
      const quantity = Number(item.quantity || 0);
      if (!category) throw { status: 400, message: 'ticket category is required' };
      if (quantity <= 0) throw { status: 400, message: 'ticket quantity must be at least 1' };

      const cfg = pricingMap[category];
      if (!cfg) throw { status: 400, message: `Pricing not configured for category: ${category}` };

      const base = Number(cfg.base_price);
      const discountPct = Number(cfg.discount_pct || 0);
      const discountAmount = Math.round((base * (discountPct / 100)) * 100) / 100;
      const final = Math.max(0, Math.round((base - discountAmount) * 100) / 100);

      totalAmount += final * quantity;
      computedTicketLines.push({ category, quantity, base, discountAmount, final });
    }

    const transactionId = `PUB-${uuidv4()}`;
    const [pRes] = await conn.query(
      `INSERT INTO PAYMENT (amount, payment_mode, payment_status, transaction_id, remarks)
       VALUES (?,?, 'completed', ?, ?)`,
      [Number(totalAmount.toFixed(2)), paymentMode, transactionId, 'Public site booking']
    );

    const createdTickets = [];
    for (const line of computedTicketLines) {
      for (let i = 0; i < line.quantity; i++) {
        const ticketQr = `TKT_${locationId}_${uuidv4()}`;
        const [tRes] = await conn.query(
          `INSERT INTO TICKET (visitor_id, location_id, ticket_category, base_price, discount_amount, final_price,
                               valid_from, valid_till, ticket_qr, payment_id)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [
            visitorId,
            locationId,
            line.category,
            line.base,
            line.discountAmount,
            line.final,
            visitDate,
            visitDate,
            ticketQr,
            pRes.insertId,
          ]
        );
        createdTickets.push({ ticket_id: tRes.insertId, ticket_qr: ticketQr, ticket_category: line.category, final_price: line.final });
      }
    }

    // Persist capacity row if missing (so admin can edit max_tickets later)
    if (!cap.capacity_id) {
      const [[sold]] = await conn.query(
        `SELECT COUNT(*) AS tickets_sold
         FROM TICKET
         WHERE location_id=? AND valid_from=? AND ticket_status != 'cancelled'`,
        [locationId, visitDate]
      );
      const soldNow = Number(sold?.tickets_sold || 0);
      await conn.query(
        `INSERT INTO DAILY_CAPACITY (location_id, visit_date, max_tickets, tickets_sold)
         VALUES (?,?,?,?)
         ON DUPLICATE KEY UPDATE tickets_sold=VALUES(tickets_sold)`,
        [locationId, visitDate, cap.max_tickets, soldNow]
      );
    } else {
      await conn.query(
        `UPDATE DAILY_CAPACITY
         SET tickets_sold = tickets_sold + ?
         WHERE capacity_id=?`,
        [totalRequested, cap.capacity_id]
      );
    }

    await conn.commit();

    const [ticketRows] = await db.query(
      `
      SELECT t.ticket_id, t.ticket_qr, t.ticket_category, t.final_price, t.valid_from, t.valid_till,
             t.ticket_status, t.checked,
             l.location_name, l.location_type,
             p.payment_id, p.amount AS payment_amount, p.payment_mode, p.payment_status, p.transaction_id,
             v.name AS visitor_name, v.phone_no, v.email
      FROM TICKET t
      JOIN LOCATION l ON t.location_id = l.location_id
      JOIN PAYMENT p  ON t.payment_id  = p.payment_id
      JOIN VISITOR v  ON t.visitor_id  = v.visitor_id
      WHERE t.payment_id=?
      ORDER BY t.ticket_id ASC
      `,
      [pRes.insertId]
    );

    res.status(201).json({
      success: true,
      data: {
        payment_id: pRes.insertId,
        transaction_id: transactionId,
        amount: Number(totalAmount.toFixed(2)),
        tickets: ticketRows,
      },
      message: 'Booking successful',
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch (_e) {}
    next(err);
  } finally {
    conn.release();
  }
});

// GET /api/public/my-tickets  (auth required)
router.get('/my-tickets', requireVisitorAuth, async (req, res, next) => {
  try {
    const accountId = req.visitorAccount.account_id;
    const [[acct]] = await db.query(`SELECT * FROM VISITOR_ACCOUNT WHERE account_id=?`, [accountId]);
    if (!acct) return res.status(401).json({ success: false, message: 'Account not found' });
    if (!acct.visitor_id) return res.json({ success: true, data: [] });

    const [rows] = await db.query(
      `
      SELECT t.ticket_id, t.ticket_qr, t.ticket_category, t.final_price, t.issue_date,
             t.valid_from, t.valid_till, t.checked, t.ticket_status,
             l.location_name, l.location_type,
             p.payment_mode, p.payment_status, p.transaction_id
      FROM TICKET t
      JOIN LOCATION l ON t.location_id = l.location_id
      JOIN PAYMENT p  ON t.payment_id  = p.payment_id
      WHERE t.visitor_id=?
      ORDER BY t.created_at DESC
      `,
      [acct.visitor_id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/events
router.get('/events', async (req, res, next) => {
  try {
    const { location_id, active_only } = req.query;
    let query = `
      SELECT a.announcement_id, a.location_id, a.title, a.message, a.priority, a.valid_from, a.valid_till,
             l.location_name
      FROM ANNOUNCEMENT a
      LEFT JOIN LOCATION l ON a.location_id=l.location_id
      WHERE a.is_active=1 AND (a.valid_till IS NULL OR a.valid_till >= NOW())
    `;
    const params = [];
    if (location_id) {
      query += ' AND a.location_id = ?';
      params.push(location_id);
    }
    if (active_only === 'true') {
      query += ' AND a.valid_from <= NOW()';
    }
    query += ' ORDER BY FIELD(a.priority, \'urgent\', \'high\', \'normal\', \'low\'), a.valid_from DESC';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/exhibits
router.get('/exhibits', async (req, res, next) => {
  try {
    const { location_id, category, zone } = req.query;
    let query = `
      SELECT e.exhibit_id, e.location_id, e.name, e.category, e.description, e.fun_fact, e.zone, e.image_url, e.is_active,
             l.location_name
      FROM EXHIBIT e
      JOIN LOCATION l ON e.location_id = l.location_id
      WHERE e.is_active = TRUE
    `;
    const params = [];
    if (location_id) { query += ' AND e.location_id = ?'; params.push(location_id); }
    if (category) { query += ' AND e.category = ?'; params.push(category); }
    if (zone) { query += ' AND e.zone = ?'; params.push(zone); }
    query += ' ORDER BY e.zone, e.name';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/announcements
router.get('/announcements', async (req, res, next) => {
  try {
    const { location_id } = req.query;
    let query = `
      SELECT a.announcement_id, a.location_id, a.title, a.message, a.priority,
             a.valid_from, a.valid_till, a.is_active, l.location_name
      FROM ANNOUNCEMENT a
      LEFT JOIN LOCATION l ON a.location_id = l.location_id
      WHERE a.is_active = TRUE AND (a.valid_till IS NULL OR a.valid_till > NOW())
    `;
    const params = [];
    if (location_id) {
      query += ' AND (a.location_id = ? OR a.location_id IS NULL)';
      params.push(location_id);
    }
    query += ' ORDER BY FIELD(a.priority, \'urgent\', \'high\', \'normal\', \'low\'), a.valid_from DESC';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/profile (auth required)
router.get('/profile', requireVisitorAuth, async (req, res, next) => {
  try {
    const [[acct]] = await db.query(`SELECT * FROM VISITOR_ACCOUNT WHERE account_id=?`, [req.visitorAccount.account_id]);
    if (!acct) return res.status(401).json({ success: false, message: 'Account not found' });

    let visitor = null;
    if (acct.visitor_id) {
      const [[v]] = await db.query(`SELECT visitor_id, name, phone_no, email, gender, date_of_birth, address, city, state, pincode FROM VISITOR WHERE visitor_id=?`, [acct.visitor_id]);
      visitor = v || null;
    }
    res.json({ success: true, data: { account_id: acct.account_id, email: acct.email, visitor } });
  } catch (err) { next(err); }
});

// PUT /api/public/profile (auth required)
router.put('/profile', requireVisitorAuth, async (req, res, next) => {
  try {
    const [[acct]] = await db.query(`SELECT * FROM VISITOR_ACCOUNT WHERE account_id=?`, [req.visitorAccount.account_id]);
    if (!acct) return res.status(401).json({ success: false, message: 'Account not found' });

    const { name, phone_no, gender, date_of_birth, address, city, state, pincode } = req.body;

    if (acct.visitor_id) {
      await db.query(
        `UPDATE VISITOR SET name=COALESCE(NULLIF(?,  ''), name),
                            phone_no=COALESCE(NULLIF(?, ''), phone_no),
                            gender=COALESCE(NULLIF(?, ''), gender),
                            date_of_birth=COALESCE(NULLIF(?, ''), date_of_birth),
                            address=COALESCE(NULLIF(?, ''), address),
                            city=COALESCE(NULLIF(?, ''), city),
                            state=COALESCE(NULLIF(?, ''), state),
                            pincode=COALESCE(NULLIF(?, ''), pincode)
         WHERE visitor_id=?`,
        [name, phone_no, gender, date_of_birth, address, city, state, pincode, acct.visitor_id]
      );
      const [[updated]] = await db.query(`SELECT visitor_id, name, phone_no, email, gender, date_of_birth, address, city, state, pincode FROM VISITOR WHERE visitor_id=?`, [acct.visitor_id]);
      return res.json({ success: true, data: updated, message: 'Profile updated' });
    }
    res.json({ success: true, data: null, message: 'No visitor profile linked yet (book a ticket first)' });
  } catch (err) { next(err); }
});

// GET /api/public/my-queries (auth required)
router.get('/my-queries', requireVisitorAuth, async (req, res, next) => {
  try {
    const [[acct]] = await db.query(`SELECT account_id, visitor_id FROM VISITOR_ACCOUNT WHERE account_id=?`, [req.visitorAccount.account_id]);
    if (!acct) return res.status(401).json({ success: false, message: 'Account not found' });

    const [rows] = await db.query(
      `SELECT q.query_id, q.query_type, q.issue, q.status, q.remarks, q.created_at, q.updated_at,
              t.ticket_qr, t.ticket_category, t.valid_from
       FROM VISITOR_QUERY q
       LEFT JOIN TICKET t ON q.ticket_id = t.ticket_id
       WHERE q.account_id=?
       ORDER BY q.created_at DESC`,
      [acct.account_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// POST /api/public/my-queries (auth required)
router.post('/my-queries', requireVisitorAuth, async (req, res, next) => {
  try {
    const [[acct]] = await db.query(`SELECT account_id, visitor_id FROM VISITOR_ACCOUNT WHERE account_id=?`, [req.visitorAccount.account_id]);
    if (!acct) return res.status(401).json({ success: false, message: 'Account not found' });

    const { query_type, issue, ticket_id } = req.body;
    if (!issue || !issue.trim()) return res.status(400).json({ success: false, message: 'Issue description is required' });

    const validTypes = ['refund','reschedule','lost_ticket','general','other'];
    const qType = validTypes.includes(query_type) ? query_type : 'general';

    const [r] = await db.query(
      `INSERT INTO VISITOR_QUERY (account_id, visitor_id, ticket_id, query_type, issue) VALUES (?,?,?,?,?)`,
      [acct.account_id, acct.visitor_id || null, ticket_id || null, qType, issue.trim()]
    );
    const [[newQ]] = await db.query(`SELECT * FROM VISITOR_QUERY WHERE query_id=?`, [r.insertId]);
    res.status(201).json({ success: true, data: newQ, message: 'Query submitted successfully' });
  } catch (err) { next(err); }
});

// GET /api/dashboard/live-count
router.get('/dashboard/live-count', async (req, res, next) => {
  try {
    const [counts] = await db.query(`
      SELECT l.location_id, l.location_name,
             COUNT(DISTINCT v.visit_id) AS current_visitors
      FROM LOCATION l
      LEFT JOIN VISIT v ON l.location_id = v.location_id AND v.visit_status = 'in_progress'
      GROUP BY l.location_id, l.location_name
    `);
    const total = counts.reduce((sum, r) => sum + r.current_visitors, 0);
    res.json({ success: true, data: { total, by_location: counts } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

