require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const db           = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── CORS — allow any origin in production, localhost in dev ──────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://localhost:4174',
  /\.vercel\.app$/,         // any Vercel preview/production URL
  /\.railway\.app$/,        // Railway frontends
];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, mobile apps, same-origin)
    if (!origin) return cb(null, true);
    const ok = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    cb(ok ? null : new Error('CORS'), ok);
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => { console.log(`${req.method} ${req.path}`); next(); });
}

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/dashboard',    require('./routes/dashboard'));
app.use('/api/locations',    require('./routes/locations'));
app.use('/api/departments',  require('./routes/departments'));
app.use('/api/staff',        require('./routes/staff'));
app.use('/api/visitors',     require('./routes/visitors'));
app.use('/api/payments',     require('./routes/payments'));
app.use('/api/tickets',      require('./routes/tickets'));
app.use('/api/visits',       require('./routes/visits'));
app.use('/api/reports',      require('./routes/reports'));
app.use('/api/announcements',require('./routes/announcements'));
app.use('/api/incidents',    require('./routes/incidents'));
app.use('/api/feedback',     require('./routes/feedback'));
app.use('/api/public',       require('./routes/public'));

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

// ── Start: run migrations THEN listen ────────────────────────────────────
const PORT = process.env.PORT || 3001;

(async () => {
  try {
    await require('./migrate')(db);
  } catch (e) {
    console.warn('Migration error (non-fatal):', e.message);
  }
  app.listen(PORT, () => console.log(`🚀  VMS Backend on http://localhost:${PORT}`));
})();
