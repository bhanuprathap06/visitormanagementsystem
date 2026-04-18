const mysql = require('mysql2/promise');
require('dotenv').config();

// Railway provides DATABASE_URL or individual MYSQL_* vars
// Fall back to local DB_* vars for development
const rawPassword = process.env.MYSQL_PASSWORD ?? process.env.DB_PASSWORD;
const passwordLooksLikePlaceholder =
  typeof rawPassword === 'string' &&
  rawPassword.trim().length > 0 &&
  /your_.*password/i.test(rawPassword);

if (passwordLooksLikePlaceholder) {
  console.warn(
    '⚠ DB_PASSWORD still looks like a placeholder. ' +
      'Edit backend/.env and set DB_PASSWORD to your real MySQL password (or leave it blank if your MySQL user has no password).'
  );
}

const pool = mysql.createPool(
  process.env.DATABASE_URL
    ? {
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host:     process.env.MYSQL_HOST     || process.env.DB_HOST || 'localhost',
        port:     process.env.MYSQL_PORT     || process.env.DB_PORT || 3306,
        user:     process.env.MYSQL_USER     || process.env.DB_USER || 'root',
        // If user copied .env.example and didn't edit it, treat the placeholder as "unset".
        password: passwordLooksLikePlaceholder ? '' : (rawPassword || ''),
        database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'visitor_management_system',
        waitForConnections: true,
        connectionLimit: 10,
        decimalNumbers: true,
      }
);

pool.getConnection()
  .then(c => { console.log('✅ Database connected'); c.release(); })
  .catch(e => console.error('❌ Database connection failed:', e.message));

module.exports = pool;
