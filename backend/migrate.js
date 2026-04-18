/**
 * migrate.js — runs all DB migrations before server starts.
 * Called from server.js: await require('./migrate')(db)
 *
 * Each step is idempotent: it checks whether the change is already in place
 * before applying, so running against an up-to-date DB is a no-op.
 */

async function tableExists(db, tableName) {
  const [rows] = await db.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return rows.length > 0;
}

async function columnExists(db, tableName, columnName) {
  const [rows] = await db.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = ?
       AND COLUMN_NAME  = ?`,
    [tableName, columnName]
  );
  return rows.length > 0;
}

// ---- individual migrations ---------------------------------------------------

async function ensureHeadStaffId(db) {
  if (await columnExists(db, 'DEPARTMENT', 'head_staff_id')) return;
  try {
    await db.query(`ALTER TABLE DEPARTMENT ADD COLUMN head_staff_id INT NULL`);
    console.log('  ↳ added DEPARTMENT.head_staff_id');
  } catch (e) {
    console.warn('  ⚠ could not add DEPARTMENT.head_staff_id:', e.message);
  }
}

async function ensureVisitorAccount(db) {
  if (await tableExists(db, 'VISITOR_ACCOUNT')) return;
  try {
    await db.query(`
      CREATE TABLE VISITOR_ACCOUNT (
        account_id     INT PRIMARY KEY AUTO_INCREMENT,
        visitor_id     INT,
        email          VARCHAR(100) UNIQUE NOT NULL,
        password_hash  VARCHAR(255) NOT NULL,
        is_verified    BOOLEAN DEFAULT FALSE,
        last_login     TIMESTAMP NULL,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (visitor_id) REFERENCES VISITOR(visitor_id) ON DELETE SET NULL
      )
    `);
    console.log('  ↳ created VISITOR_ACCOUNT');
  } catch (e) {
    console.warn('  ⚠ could not create VISITOR_ACCOUNT:', e.message);
  }
}

async function ensureDailyCapacity(db) {
  if (await tableExists(db, 'DAILY_CAPACITY')) return;
  try {
    await db.query(`
      CREATE TABLE DAILY_CAPACITY (
        capacity_id    INT PRIMARY KEY AUTO_INCREMENT,
        location_id    INT NOT NULL,
        visit_date     DATE NOT NULL,
        max_tickets    INT NOT NULL,
        tickets_sold   INT DEFAULT 0,
        updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_loc_date (location_id, visit_date),
        FOREIGN KEY (location_id) REFERENCES LOCATION(location_id) ON DELETE CASCADE
      )
    `);
    console.log('  ↳ created DAILY_CAPACITY');
  } catch (e) {
    console.warn('  ⚠ could not create DAILY_CAPACITY:', e.message);
  }
}

async function ensureVisitorQuery(db) {
  if (await tableExists(db, 'VISITOR_QUERY')) return;
  try {
    await db.query(`
      CREATE TABLE VISITOR_QUERY (
        query_id      INT PRIMARY KEY AUTO_INCREMENT,
        account_id    INT NOT NULL,
        visitor_id    INT,
        ticket_id     INT,
        query_type    ENUM('refund','reschedule','lost_ticket','general','other') NOT NULL DEFAULT 'general',
        issue         TEXT NOT NULL,
        status        ENUM('open','in_review','resolved','closed') NOT NULL DEFAULT 'open',
        remarks       TEXT,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id)  REFERENCES VISITOR_ACCOUNT(account_id) ON DELETE CASCADE,
        FOREIGN KEY (visitor_id)  REFERENCES VISITOR(visitor_id) ON DELETE SET NULL,
        FOREIGN KEY (ticket_id)   REFERENCES TICKET(ticket_id) ON DELETE SET NULL,
        INDEX idx_vq_account (account_id)
      )
    `);
    console.log('  ↳ created VISITOR_QUERY');
  } catch (e) {
    console.warn('  ⚠ could not create VISITOR_QUERY:', e.message);
  }
}

async function ensureVisitorAccountLastLogin(db) {
  if (await columnExists(db, 'VISITOR_ACCOUNT', 'last_login')) return;
  try {
    await db.query(`ALTER TABLE VISITOR_ACCOUNT ADD COLUMN last_login TIMESTAMP NULL`);
    console.log('  ↳ added VISITOR_ACCOUNT.last_login');
  } catch (e) {
    console.warn('  ⚠ could not add VISITOR_ACCOUNT.last_login:', e.message);
  }
}

async function ensureVisitorProfileColumns(db) {
  // Add city, state, pincode to VISITOR if missing
  for (const [col, def] of [
    ['city',    'VARCHAR(50)'],
    ['state',   'VARCHAR(50)'],
    ['pincode', 'VARCHAR(10)'],
  ]) {
    if (await columnExists(db, 'VISITOR', col)) continue;
    try {
      await db.query(`ALTER TABLE VISITOR ADD COLUMN ${col} ${def} NULL`);
      console.log(`  ↳ added VISITOR.${col}`);
    } catch (e) {
      console.warn(`  ⚠ could not add VISITOR.${col}:`, e.message);
    }
  }
}

async function ensureExhibit(db) {
  if (await tableExists(db, 'EXHIBIT')) return;
  try {
    await db.query(`
      CREATE TABLE EXHIBIT (
        exhibit_id    INT PRIMARY KEY AUTO_INCREMENT,
        location_id   INT NOT NULL,
        name          VARCHAR(120) NOT NULL,
        category      VARCHAR(60),
        zone          VARCHAR(60),
        description   TEXT,
        fun_fact      TEXT,
        image_url     VARCHAR(255),
        is_active     BOOLEAN DEFAULT TRUE,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (location_id) REFERENCES LOCATION(location_id) ON DELETE CASCADE,
        INDEX idx_exhibit_loc  (location_id),
        INDEX idx_exhibit_zone (zone)
      )
    `);
    console.log('  ↳ created EXHIBIT');

    // Seed a handful of rows only if LOCATION ids 1/2/3 exist so FK is satisfied.
    const [locs] = await db.query(
      `SELECT location_id FROM LOCATION WHERE location_id IN (1,2,3)`
    );
    const ids = new Set(locs.map((l) => l.location_id));
    const seed = [
      [1, 'Bengal Tiger', 'Big Cats', 'Asia', 'Flagship predator exhibit.', 'Tigers have striped skin, not just fur.'],
      [1, 'Asian Elephant', 'Herbivores', 'Asia', 'Family group with daily demos.', 'Elephants recognise themselves in mirrors.'],
      [1, 'Lion Savannah', 'Big Cats', 'Africa', 'Open savannah-style habitat.', "A lion's roar carries up to 8 km."],
      [1, 'Bird Aviary', 'Birds', 'Aviary', 'Walk-through aviary.', 'Some parrots live over 50 years.'],
      [1, 'Aquarium Reef', 'Aquatic', 'Aquarium', 'Tropical reef tank.', 'Clownfish are all born male.'],
      [2, 'Ancient Chola Sculptures', 'Artifacts', 'History Hall', 'Chola-era bronzes and stone.', 'Some pieces are 1000+ years old.'],
      [2, 'Natural History Gallery', 'Specimens', 'Science Wing', 'Fossils, minerals, taxidermy.', 'Trilobite fossils are ~500 My old.'],
      [2, 'Penguin Cove', 'Special Exhibit', 'Aquarium', 'Humboldt penguin colony.', 'Penguins have excellent underwater vision.'],
      [3, 'Orchid House', 'Plants', 'Greenhouse', 'Climate-controlled orchid display.', 'Orchids can live for decades.'],
      [3, 'Butterfly Walk', 'Insects', 'Meadow', 'Open-air butterfly meadow.', 'Butterflies taste with their feet.'],
      [3, 'Medicinal Plants Trail', 'Plants', 'Trail', 'Traditional Indian medicinal plants.', 'Neem has been used medicinally for 4000+ years.'],
    ].filter((row) => ids.has(row[0]));

    if (seed.length > 0) {
      await db.query(
        `INSERT INTO EXHIBIT (location_id, name, category, zone, description, fun_fact) VALUES ?`,
        [seed]
      );
      console.log(`  ↳ seeded ${seed.length} exhibit rows`);
    }
  } catch (e) {
    console.warn('  ⚠ could not create/seed EXHIBIT:', e.message);
  }
}

// ---- runner ------------------------------------------------------------------

module.exports = async (db) => {
  console.log('▸ running migrations...');
  await ensureHeadStaffId(db);
  await ensureVisitorAccount(db);
  await ensureVisitorAccountLastLogin(db);
  await ensureDailyCapacity(db);
  await ensureVisitorQuery(db);
  await ensureVisitorProfileColumns(db);
  await ensureExhibit(db);
  console.log('✅ migrations complete');
};
