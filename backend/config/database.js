const mysql = require('mysql2/promise');
require('dotenv').config();

// Railway provides DATABASE_URL or individual MYSQL_* vars
// Fall back to local DB_* vars for development
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
        password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || process.env.DB_PASS || '',
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
