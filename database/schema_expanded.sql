-- ============================================================================
-- VISITOR MANAGEMENT SYSTEM - EXPANDED DATABASE SCHEMA
-- ============================================================================
-- Additional tables beyond original:
--   USER_AUTH      - Staff login credentials
--   PRICING_CONFIG - Dynamic ticket pricing rules
--   FEEDBACK       - Visitor ratings & feedback
--   INCIDENT_REPORT- Security incident logging
--   ANNOUNCEMENT   - Location announcements
--   TOUR_ASSIGNMENT- Guide-to-visit assignment
--   AUDIT_LOG      - System-wide change tracking
-- ============================================================================

DROP DATABASE IF EXISTS visitor_management_system;
CREATE DATABASE visitor_management_system;
USE visitor_management_system;

-- ============================================================================
-- TABLE 1: LOCATION
-- ============================================================================
CREATE TABLE LOCATION (
    location_id    INT PRIMARY KEY AUTO_INCREMENT,
    location_name  VARCHAR(100) NOT NULL,
    location_type  ENUM('zoo','museum','park','aquarium','botanical_garden') NOT NULL,
    address        VARCHAR(200) NOT NULL,
    city           VARCHAR(50)  NOT NULL,
    state          VARCHAR(50)  NOT NULL,
    pincode        VARCHAR(10),
    capacity       INT          NOT NULL,
    contact_no     VARCHAR(15),
    email          VARCHAR(100),
    opening_time   TIME,
    closing_time   TIME,
    is_active      BOOLEAN DEFAULT TRUE,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 2: DEPARTMENT
-- ============================================================================
CREATE TABLE DEPARTMENT (
    department_id   INT PRIMARY KEY AUTO_INCREMENT,
    department_name VARCHAR(100) NOT NULL,
    location_id     INT NOT NULL,
    description     TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES LOCATION(location_id) ON DELETE CASCADE
);

-- ============================================================================
-- TABLE 3: STAFF
-- ============================================================================
CREATE TABLE STAFF (
    staff_id      INT PRIMARY KEY AUTO_INCREMENT,
    staff_name    VARCHAR(100) NOT NULL,
    staff_type    ENUM('guide','security','ticketing','maintenance','manager') NOT NULL,
    department_id INT NOT NULL,
    phone_no      VARCHAR(15) NOT NULL,
    email         VARCHAR(100) UNIQUE,
    shift         ENUM('morning','afternoon','evening','night','rotational') DEFAULT 'morning',
    hire_date     DATE NOT NULL,
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES DEPARTMENT(department_id) ON DELETE RESTRICT
);

-- ============================================================================
-- TABLE 4: USER_AUTH  (NEW)
-- Login credentials for staff members
-- ============================================================================
CREATE TABLE USER_AUTH (
    auth_id       INT PRIMARY KEY AUTO_INCREMENT,
    staff_id      INT NOT NULL UNIQUE,
    username      VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('admin','manager','staff') NOT NULL DEFAULT 'staff',
    last_login    DATETIME,
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES STAFF(staff_id) ON DELETE CASCADE
);

-- ============================================================================
-- TABLE 5: VISITOR
-- ============================================================================
CREATE TABLE VISITOR (
    visitor_id    INT PRIMARY KEY AUTO_INCREMENT,
    name          VARCHAR(100) NOT NULL,
    phone_no      VARCHAR(15)  NOT NULL,
    email         VARCHAR(100) UNIQUE,
    address       VARCHAR(200),
    id_proof_type ENUM('aadhaar','passport','driving_license','voter_id','pan_card') NOT NULL,
    id_proof_no   VARCHAR(50)  NOT NULL UNIQUE,
    visitor_qr    VARCHAR(100) UNIQUE,
    date_of_birth DATE,
    gender        ENUM('male','female','other'),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone (phone_no),
    INDEX idx_email (email)
);

-- ============================================================================
-- TABLE 6: PAYMENT
-- ============================================================================
CREATE TABLE PAYMENT (
    payment_id     INT PRIMARY KEY AUTO_INCREMENT,
    amount         DECIMAL(10,2) NOT NULL,
    payment_date   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_mode   ENUM('cash','upi','card','net_banking','wallet') NOT NULL,
    payment_status ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
    transaction_id VARCHAR(100) UNIQUE,
    remarks        TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 7: PRICING_CONFIG  (NEW)
-- Dynamic ticket pricing by location and category
-- ============================================================================
CREATE TABLE PRICING_CONFIG (
    config_id       INT PRIMARY KEY AUTO_INCREMENT,
    location_id     INT NOT NULL,
    ticket_category ENUM('adult','child','student','senior_citizen','vip','couple','family','group') NOT NULL,
    base_price      DECIMAL(10,2) NOT NULL,
    discount_pct    DECIMAL(5,2)  DEFAULT 0.00,
    is_active       BOOLEAN DEFAULT TRUE,
    effective_from  DATE NOT NULL,
    effective_till  DATE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES LOCATION(location_id) ON DELETE CASCADE,
    UNIQUE KEY uq_loc_cat (location_id, ticket_category, effective_from)
);

-- ============================================================================
-- TABLE 8: TICKET
-- ============================================================================
CREATE TABLE TICKET (
    ticket_id        INT PRIMARY KEY AUTO_INCREMENT,
    visitor_id       INT NOT NULL,
    location_id      INT NOT NULL,
    ticket_category  ENUM('adult','child','student','senior_citizen','vip','couple','family','group') NOT NULL,
    base_price       DECIMAL(10,2) NOT NULL,
    discount_amount  DECIMAL(10,2) DEFAULT 0.00,
    final_price      DECIMAL(10,2) NOT NULL,
    issue_date       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_from       DATE NOT NULL,
    valid_till       DATE NOT NULL,
    ticket_qr        VARCHAR(100) NOT NULL UNIQUE,
    payment_id       INT NOT NULL,
    checked          BOOLEAN DEFAULT FALSE,
    checked_by_staff_id INT,
    checked_time     DATETIME,
    ticket_status    ENUM('active','used','expired','cancelled') DEFAULT 'active',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visitor_id)           REFERENCES VISITOR(visitor_id) ON DELETE CASCADE,
    FOREIGN KEY (location_id)          REFERENCES LOCATION(location_id) ON DELETE RESTRICT,
    FOREIGN KEY (payment_id)           REFERENCES PAYMENT(payment_id) ON DELETE RESTRICT,
    FOREIGN KEY (checked_by_staff_id)  REFERENCES STAFF(staff_id) ON DELETE SET NULL,
    INDEX idx_ticket_qr    (ticket_qr),
    INDEX idx_valid_dates  (valid_from, valid_till),
    INDEX idx_ticket_status(ticket_status)
);

-- ============================================================================
-- TABLE 9: VISIT
-- ============================================================================
CREATE TABLE VISIT (
    visit_id                    INT PRIMARY KEY AUTO_INCREMENT,
    visitor_id                  INT NOT NULL,
    ticket_id                   INT NOT NULL UNIQUE,
    location_id                 INT NOT NULL,
    visit_date                  DATE NOT NULL,
    entry_time                  DATETIME NOT NULL,
    exit_time                   DATETIME,
    total_duration_minutes      INT,
    entry_gate                  VARCHAR(50),
    exit_gate                   VARCHAR(50),
    purpose                     VARCHAR(100) DEFAULT 'Tourism',
    visit_status                ENUM('approved','in_progress','completed','cancelled') DEFAULT 'approved',
    approved_by_staff_id        INT,
    entry_recorded_by_staff_id  INT,
    exit_recorded_by_staff_id   INT,
    notes                       TEXT,
    created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (visitor_id)                  REFERENCES VISITOR(visitor_id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_id)                   REFERENCES TICKET(ticket_id)  ON DELETE RESTRICT,
    FOREIGN KEY (location_id)                 REFERENCES LOCATION(location_id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by_staff_id)        REFERENCES STAFF(staff_id) ON DELETE SET NULL,
    FOREIGN KEY (entry_recorded_by_staff_id)  REFERENCES STAFF(staff_id) ON DELETE SET NULL,
    FOREIGN KEY (exit_recorded_by_staff_id)   REFERENCES STAFF(staff_id) ON DELETE SET NULL,
    INDEX idx_visit_date   (visit_date),
    INDEX idx_visit_status (visit_status),
    INDEX idx_entry_time   (entry_time)
);

-- ============================================================================
-- TABLE 10: TOUR_ASSIGNMENT  (NEW)
-- Assign guides to active visits
-- ============================================================================
CREATE TABLE TOUR_ASSIGNMENT (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    visit_id      INT NOT NULL,
    staff_id      INT NOT NULL,
    assigned_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes         TEXT,
    FOREIGN KEY (visit_id)  REFERENCES VISIT(visit_id)  ON DELETE CASCADE,
    FOREIGN KEY (staff_id)  REFERENCES STAFF(staff_id)  ON DELETE RESTRICT,
    UNIQUE KEY uq_visit_staff (visit_id, staff_id)
);

-- ============================================================================
-- TABLE 11: FEEDBACK  (NEW)
-- Visitor ratings and comments after visit
-- ============================================================================
CREATE TABLE FEEDBACK (
    feedback_id   INT PRIMARY KEY AUTO_INCREMENT,
    visit_id      INT NOT NULL UNIQUE,
    visitor_id    INT NOT NULL,
    location_id   INT NOT NULL,
    overall_rating TINYINT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    cleanliness   TINYINT CHECK (cleanliness BETWEEN 1 AND 5),
    staff_rating  TINYINT CHECK (staff_rating BETWEEN 1 AND 5),
    facilities    TINYINT CHECK (facilities BETWEEN 1 AND 5),
    value_rating  TINYINT CHECK (value_rating BETWEEN 1 AND 5),
    comments      TEXT,
    submitted_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visit_id)    REFERENCES VISIT(visit_id)      ON DELETE CASCADE,
    FOREIGN KEY (visitor_id)  REFERENCES VISITOR(visitor_id)  ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES LOCATION(location_id) ON DELETE CASCADE
);

-- ============================================================================
-- TABLE 12: INCIDENT_REPORT  (NEW)
-- Security and operational incidents
-- ============================================================================
CREATE TABLE INCIDENT_REPORT (
    incident_id       INT PRIMARY KEY AUTO_INCREMENT,
    location_id       INT NOT NULL,
    reported_by_staff INT NOT NULL,
    incident_type     ENUM('security','medical','lost_item','lost_child','damage','other') NOT NULL,
    severity          ENUM('low','medium','high','critical') NOT NULL DEFAULT 'low',
    description       TEXT NOT NULL,
    incident_time     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved          BOOLEAN DEFAULT FALSE,
    resolved_at       DATETIME,
    resolution_notes  TEXT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id)       REFERENCES LOCATION(location_id) ON DELETE RESTRICT,
    FOREIGN KEY (reported_by_staff) REFERENCES STAFF(staff_id)       ON DELETE RESTRICT
);

-- ============================================================================
-- TABLE 13: ANNOUNCEMENT  (NEW)
-- Notices and alerts per location
-- ============================================================================
CREATE TABLE ANNOUNCEMENT (
    announcement_id INT PRIMARY KEY AUTO_INCREMENT,
    location_id     INT,  -- NULL = global announcement
    title           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    priority        ENUM('low','normal','high','urgent') DEFAULT 'normal',
    created_by      INT NOT NULL,
    valid_from      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_till      DATETIME,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES LOCATION(location_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by)  REFERENCES STAFF(staff_id)       ON DELETE RESTRICT
);

-- ============================================================================
-- TABLE 14: AUDIT_LOG  (NEW)
-- Track all significant data changes
-- ============================================================================
CREATE TABLE AUDIT_LOG (
    log_id      INT PRIMARY KEY AUTO_INCREMENT,
    table_name  VARCHAR(50)  NOT NULL,
    record_id   INT          NOT NULL,
    action      ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    changed_by  INT,
    old_values  JSON,
    new_values  JSON,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_created_at   (created_at)
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX idx_staff_type    ON STAFF(staff_type);
CREATE INDEX idx_staff_active  ON STAFF(is_active);
CREATE INDEX idx_payment_status ON PAYMENT(payment_status);
CREATE INDEX idx_location_active ON LOCATION(is_active);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER //

-- Auto-calculate duration when exit_time is set
CREATE TRIGGER trg_calc_duration
BEFORE UPDATE ON VISIT
FOR EACH ROW
BEGIN
    IF NEW.exit_time IS NOT NULL AND OLD.exit_time IS NULL THEN
        SET NEW.total_duration_minutes = TIMESTAMPDIFF(MINUTE, NEW.entry_time, NEW.exit_time);
        SET NEW.visit_status = 'completed';
    END IF;
END//

-- Mark ticket as used when checked
CREATE TRIGGER trg_ticket_checked
BEFORE UPDATE ON TICKET
FOR EACH ROW
BEGIN
    IF NEW.checked = TRUE AND OLD.checked = FALSE THEN
        SET NEW.ticket_status = 'used';
    END IF;
END//

-- Validate ticket date range before creating visit
CREATE TRIGGER trg_validate_visit_date
BEFORE INSERT ON VISIT
FOR EACH ROW
BEGIN
    DECLARE vf DATE;
    DECLARE vt DATE;
    SELECT valid_from, valid_till INTO vf, vt FROM TICKET WHERE ticket_id = NEW.ticket_id;
    IF NEW.visit_date < vf OR NEW.visit_date > vt THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Visit date must be within ticket validity period';
    END IF;
END//

DELIMITER ;

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE VIEW v_current_visitors AS
SELECT v.name AS visitor_name, v.phone_no,
       l.location_name, vi.entry_time, vi.entry_gate,
       TIMESTAMPDIFF(MINUTE, vi.entry_time, NOW()) AS minutes_inside,
       t.ticket_category, s.staff_name AS approved_by
FROM VISIT vi
JOIN VISITOR v  ON vi.visitor_id = v.visitor_id
JOIN LOCATION l ON vi.location_id = l.location_id
JOIN TICKET t   ON vi.ticket_id   = t.ticket_id
LEFT JOIN STAFF s ON vi.approved_by_staff_id = s.staff_id
WHERE vi.visit_status = 'in_progress';

CREATE VIEW v_todays_summary AS
SELECT l.location_name,
       COUNT(DISTINCT vi.visitor_id)                               AS total_visitors,
       COUNT(CASE WHEN vi.visit_status = 'in_progress'  THEN 1 END) AS currently_inside,
       COUNT(CASE WHEN vi.visit_status = 'completed'    THEN 1 END) AS completed,
       COALESCE(SUM(t.final_price), 0)                             AS revenue,
       AVG(vi.total_duration_minutes)                              AS avg_duration_min
FROM VISIT vi
JOIN LOCATION l ON vi.location_id = l.location_id
JOIN TICKET t   ON vi.ticket_id   = t.ticket_id
WHERE vi.visit_date = CURDATE()
GROUP BY l.location_id, l.location_name;

CREATE VIEW v_location_feedback AS
SELECT l.location_name,
       COUNT(*)                       AS total_reviews,
       ROUND(AVG(f.overall_rating),1) AS avg_overall,
       ROUND(AVG(f.cleanliness),1)    AS avg_cleanliness,
       ROUND(AVG(f.staff_rating),1)   AS avg_staff,
       ROUND(AVG(f.facilities),1)     AS avg_facilities
FROM FEEDBACK f
JOIN LOCATION l ON f.location_id = l.location_id
GROUP BY l.location_id, l.location_name;

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

INSERT INTO LOCATION (location_name, location_type, address, city, state, pincode, capacity, contact_no, email, opening_time, closing_time) VALUES
('Chennai Wildlife Park',  'zoo',              'Vandalur, Chennai',        'Chennai', 'Tamil Nadu', '600048', 5000, '044-22472277', 'chennai.zoo@wildlife.in',    '08:30:00', '17:30:00'),
('National Museum Chennai','museum',           'Pantheon Road, Egmore',    'Chennai', 'Tamil Nadu', '600008', 2000, '044-28193238', 'chennai.museum@gov.in',       '09:00:00', '18:00:00'),
('Botanical Garden Ooty',  'botanical_garden', 'Ooty Lake Road',           'Ooty',    'Tamil Nadu', '643001', 3000, '0423-2443625', 'ooty.garden@tn.gov.in',       '07:00:00', '19:00:00');

INSERT INTO DEPARTMENT (department_name, location_id, description) VALUES
('Security',     1, 'Entry/exit security and visitor safety'),
('Ticketing',    1, 'Ticket sales and verification'),
('Animal Care',  1, 'Animal welfare and exhibits'),
('Security',     2, 'Museum security'),
('Ticketing',    2, 'Museum ticket operations'),
('Exhibitions',  2, 'Museum exhibitions management'),
('Horticulture', 3, 'Plants and garden maintenance'),
('Ticketing',    3, 'Garden ticket sales');

INSERT INTO STAFF (staff_name, staff_type, department_id, phone_no, email, shift, hire_date) VALUES
('Rajesh Kumar',   'security',  1, '9876543210', 'rajesh.security@zoo.in',      'morning',    '2023-01-15'),
('Priya Sharma',   'ticketing', 2, '9876543211', 'priya.ticket@zoo.in',         'morning',    '2023-03-20'),
('Arun Venkat',    'security',  1, '9876543212', 'arun.security@zoo.in',        'afternoon',  '2023-02-10'),
('Divya Lakshmi',  'guide',     3, '9876543213', 'divya.guide@zoo.in',          'rotational', '2023-04-05'),
('Karthik Rajan',  'security',  4, '9876543214', 'karthik.security@museum.in',  'morning',    '2022-11-20'),
('Meera Patel',    'ticketing', 5, '9876543215', 'meera.ticket@museum.in',      'morning',    '2022-12-15'),
('Suresh Babu',    'manager',   6, '9876543216', 'suresh.manager@museum.in',    'morning',    '2022-08-10'),
('Lakshman Reddy', 'ticketing', 8, '9876543217', 'lakshman.ticket@garden.in',   'morning',    '2023-05-12'),
('Anita Singh',    'security',  8, '9876543218', 'anita.security@garden.in',    'afternoon',  '2023-06-01');

-- Pricing configurations
INSERT INTO PRICING_CONFIG (location_id, ticket_category, base_price, discount_pct, effective_from) VALUES
(1,'adult',150.00,0,   '2025-01-01'),(1,'child',75.00,0,    '2025-01-01'),
(1,'student',100.00,10,'2025-01-01'),(1,'senior_citizen',80.00,20,'2025-01-01'),
(1,'vip',500.00,0,     '2025-01-01'),(1,'couple',270.00,10, '2025-01-01'),
(1,'family',500.00,20, '2025-01-01'),(1,'group',120.00,20,  '2025-01-01'),
(2,'adult',100.00,0,   '2025-01-01'),(2,'child',50.00,0,    '2025-01-01'),
(2,'student',120.00,17,'2025-01-01'),(2,'senior_citizen',60.00,40,'2025-01-01'),
(2,'vip',350.00,0,     '2025-01-01'),(2,'family',350.00,13, '2025-01-01'),
(3,'adult',80.00,0,    '2025-01-01'),(3,'child',40.00,0,    '2025-01-01'),
(3,'student',60.00,0,  '2025-01-01'),(3,'family',250.00,0,  '2025-01-01');

INSERT INTO VISITOR (name, phone_no, email, address, id_proof_type, id_proof_no, visitor_qr, date_of_birth, gender) VALUES
('Arjun Krishnan','9988776655','arjun.k@gmail.com',   '12, Anna Nagar, Chennai','aadhaar',         '123456789012',      'VIS_QR_001','1990-05-15','male'),
('Sneha Reddy',   '9988776656','sneha.r@gmail.com',   '45, T Nagar, Chennai',   'passport',        'P9876543',          'VIS_QR_002','1995-08-20','female'),
('Rahul Sharma',  '9988776657','rahul.s@gmail.com',   '78, Adyar, Chennai',     'driving_license', 'DL-TN-2019-123456', 'VIS_QR_003','1988-12-10','male'),
('Kavya Iyer',    '9988776658','kavya.i@gmail.com',   '23, Mylapore, Chennai',  'aadhaar',         '987654321098',      'VIS_QR_004','2000-03-25','female'),
('Vikram Patel',  '9988776659','vikram.p@gmail.com',  '56, Velachery, Chennai', 'voter_id',        'VID-TN-7890',       'VIS_QR_005','1985-11-05','male');

-- Payments
INSERT INTO PAYMENT (amount, payment_date, payment_mode, payment_status, transaction_id) VALUES
(150.00,'2025-02-08 10:30:00','upi', 'completed','UPI-TXN-20250208103045'),
(100.00,'2025-02-08 11:15:00','card','completed','CARD-TXN-20250208111530'),
(400.00,'2025-02-08 12:00:00','cash','completed','CASH-TXN-20250208120015'),
(80.00, '2025-02-10 09:00:00','upi', 'completed','UPI-TXN-20250210090012'),
(500.00,'2025-02-10 10:00:00','card','completed','CARD-TXN-20250210100055');

-- Tickets
INSERT INTO TICKET (visitor_id,location_id,ticket_category,base_price,discount_amount,final_price,issue_date,valid_from,valid_till,ticket_qr,payment_id,checked,ticket_status) VALUES
(1,1,'adult',  150.00,  0.00,150.00,'2025-02-08 10:30:00','2025-02-09','2025-02-09','TKT_ZOO_001',1,TRUE,'used'),
(2,2,'student',120.00, 20.00,100.00,'2025-02-08 11:15:00','2025-02-09','2025-02-09','TKT_MUS_002',2,TRUE,'used'),
(3,1,'family', 500.00,100.00,400.00,'2025-02-08 12:00:00','2025-02-09','2025-02-09','TKT_ZOO_003',3,FALSE,'active'),
(4,3,'adult',   80.00,  0.00, 80.00,'2025-02-10 09:00:00','2025-02-11','2025-02-11','TKT_GAR_004',4,TRUE,'used'),
(5,1,'vip',    500.00,  0.00,500.00,'2025-02-10 10:00:00','2025-02-11','2025-02-11','TKT_ZOO_005',5,TRUE,'used');

-- Check-in records
UPDATE TICKET SET checked=TRUE,checked_by_staff_id=2,checked_time='2025-02-09 09:00:00',ticket_status='used' WHERE ticket_id=1;
UPDATE TICKET SET checked=TRUE,checked_by_staff_id=6,checked_time='2025-02-09 10:30:00',ticket_status='used' WHERE ticket_id=2;
UPDATE TICKET SET checked=TRUE,checked_by_staff_id=8,checked_time='2025-02-11 08:45:00',ticket_status='used' WHERE ticket_id=4;
UPDATE TICKET SET checked=TRUE,checked_by_staff_id=2,checked_time='2025-02-11 10:10:00',ticket_status='used' WHERE ticket_id=5;

-- Visits
INSERT INTO VISIT (visitor_id,ticket_id,location_id,visit_date,entry_time,exit_time,total_duration_minutes,entry_gate,exit_gate,visit_status,approved_by_staff_id,entry_recorded_by_staff_id,exit_recorded_by_staff_id) VALUES
(1,1,1,'2025-02-09','2025-02-09 09:00:00','2025-02-09 12:30:00',210,'Main Gate','Main Gate','completed',2,2,1),
(2,2,2,'2025-02-09','2025-02-09 10:30:00','2025-02-09 13:00:00',150,'North Entrance','North Entrance','completed',6,6,5),
(4,4,3,'2025-02-11','2025-02-11 08:45:00','2025-02-11 12:00:00',195,'East Gate','East Gate','completed',8,8,9),
(5,5,1,'2025-02-11','2025-02-11 10:10:00',NULL,NULL,'VIP Entrance',NULL,'in_progress',2,2,NULL);

-- Feedback
INSERT INTO FEEDBACK (visit_id,visitor_id,location_id,overall_rating,cleanliness,staff_rating,facilities,value_rating,comments) VALUES
(1,1,1,5,5,4,4,5,'Absolutely loved the wildlife park! Very well maintained.'),
(2,2,2,4,4,5,4,4,'Great museum with helpful staff. Would visit again.'),
(3,4,3,5,5,5,5,5,'Stunning botanical garden, perfect for a morning walk.');

-- Incidents
INSERT INTO INCIDENT_REPORT (location_id,reported_by_staff,incident_type,severity,description) VALUES
(1,1,'lost_child','high','Child separated from parents near lion enclosure. Resolved in 10 minutes.'),
(2,5,'security','low','Visitor attempted to photograph restricted display. Warned and resolved.');

-- Announcements
INSERT INTO ANNOUNCEMENT (location_id,title,message,priority,created_by,valid_from,valid_till) VALUES
(1,'Weekend Special Discount','Enjoy 20% off on Family tickets every Saturday and Sunday!','normal',2,'2025-02-01 00:00:00','2025-12-31 23:59:59'),
(NULL,'System Maintenance Notice','Ticket booking system will be down on Feb 15 from 2 AM to 4 AM.','high',7,'2025-02-14 00:00:00','2025-02-15 04:00:00');

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
