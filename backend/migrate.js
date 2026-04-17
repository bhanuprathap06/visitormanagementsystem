/**
 * migrate.js — runs all DB migrations before server starts
 * Called from server.js: await require('./migrate')(db)
 */
module.exports = async (db) => {
  // Check if head_staff_id already exists before trying to add it
  const [[col]] = await db.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = 'DEPARTMENT'
       AND COLUMN_NAME  = 'head_staff_id'`
  ).catch(() => [[null]]);

  if (col) {
    console.log('✅ Migrations complete — head_staff_id column already exists');
    return;
  }

  // Column doesn't exist — add it now
  try {
    await db.query(`ALTER TABLE DEPARTMENT ADD COLUMN head_staff_id INT NULL`);
    console.log('✅ Migrations complete — head_staff_id column added successfully');
  } catch (e) {
    console.warn('⚠️  Could not add head_staff_id:', e.message);
  }
};
