-- ============================================================================
-- VISITOR MANAGEMENT SYSTEM - DATABASE IMPLEMENTATION
-- ============================================================================
-- Following the workflow:
-- 1. Online/Counter: PAYMENT → TICKET created (checked: FALSE)
-- 2. At gate: Staff scans ticket_qr → TICKET checked + VISIT created
-- 3. During visit: VISIT.status = 'in_progress'
-- 4. Exit gate: VISIT completed with duration calculated
-- ============================================================================

-- Drop database if exists and create fresh
DROP DATABASE IF EXISTS visitor_management_system;
CREATE DATABASE visitor_management_system;
USE visitor_management_system;

-- ============================================================================
-- TABLE 1: LOCATION
-- Represents physical locations (zoos, museums, parks, etc.)
-- ============================================================================
CREATE TABLE LOCATION (
    location_id INT PRIMARY KEY AUTO_INCREMENT,
    location_name VARCHAR(100) NOT NULL,
    location_type ENUM('zoo', 'museum', 'park', 'aquarium', 'botanical_garden') NOT NULL,
    address VARCHAR(200) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    pincode VARCHAR(10),
    capacity INT NOT NULL,
    contact_no VARCHAR(15),
    email VARCHAR(100),
    opening_time TIME,
    closing_time TIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 2: DEPARTMENT
-- Departments within locations (Animal Care, Security, Ticketing, etc.)
-- ============================================================================
CREATE TABLE DEPARTMENT (
    department_id INT PRIMARY KEY AUTO_INCREMENT,
    department_name VARCHAR(100) NOT NULL,
    location_id INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES LOCATION(location_id) ON DELETE CASCADE
);

-- ============================================================================
-- TABLE 3: STAFF
-- Unified staff table (guides, security, ticketing, maintenance, managers)
-- ============================================================================
CREATE TABLE STAFF (
    staff_id INT PRIMARY KEY AUTO_INCREMENT,
    staff_name VARCHAR(100) NOT NULL,
    staff_type ENUM('guide', 'security', 'ticketing', 'maintenance', 'manager') NOT NULL,
    department_id INT NOT NULL,
    phone_no VARCHAR(15) NOT NULL,
    email VARCHAR(100) UNIQUE,
    shift ENUM('morning', 'afternoon', 'evening', 'night', 'rotational') DEFAULT 'morning',
    hire_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES DEPARTMENT(department_id) ON DELETE RESTRICT
);

-- ============================================================================
-- TABLE 4: VISITOR
-- Stores visitor information
-- ============================================================================
CREATE TABLE VISITOR (
    visitor_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone_no VARCHAR(15) NOT NULL,
    email VARCHAR(100) UNIQUE,
    address VARCHAR(200),
    id_proof_type ENUM('aadhaar', 'passport', 'driving_license', 'voter_id', 'pan_card') NOT NULL,
    id_proof_no VARCHAR(50) NOT NULL UNIQUE,
    visitor_qr VARCHAR(100) UNIQUE,  -- Optional QR for registered visitors
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone (phone_no),
    INDEX idx_email (email)
);

-- ============================================================================
-- TABLE 5: PAYMENT
-- Payment records for ticket purchases
-- ============================================================================
CREATE TABLE PAYMENT (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_mode ENUM('cash', 'upi', 'card', 'net_banking', 'wallet') NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    transaction_id VARCHAR(100) UNIQUE,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 6: TICKET
-- Ticket records with QR code and check-in tracking
-- ============================================================================
CREATE TABLE TICKET (
    ticket_id INT PRIMARY KEY AUTO_INCREMENT,
    visitor_id INT NOT NULL,
    location_id INT NOT NULL,
    ticket_category ENUM('adult', 'child', 'student', 'senior_citizen', 'vip', 'couple', 'family', 'group') NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    final_price DECIMAL(10,2) NOT NULL,
    issue_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_from DATE NOT NULL,
    valid_till DATE NOT NULL,
    ticket_qr VARCHAR(100) NOT NULL UNIQUE,
    payment_id INT NOT NULL,
    
    -- Check-in tracking (Step 2 of workflow)
    checked BOOLEAN DEFAULT FALSE,
    checked_by_staff_id INT,
    checked_time DATETIME,
    
    -- Ticket status
    ticket_status ENUM('active', 'used', 'expired', 'cancelled') DEFAULT 'active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (visitor_id) REFERENCES VISITOR(visitor_id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES LOCATION(location_id) ON DELETE RESTRICT,
    FOREIGN KEY (payment_id) REFERENCES PAYMENT(payment_id) ON DELETE RESTRICT,
    FOREIGN KEY (checked_by_staff_id) REFERENCES STAFF(staff_id) ON DELETE SET NULL,
    
    INDEX idx_ticket_qr (ticket_qr),
    INDEX idx_valid_dates (valid_from, valid_till),
    INDEX idx_ticket_status (ticket_status)
);

-- ============================================================================
-- TABLE 7: VISIT
-- Visit records created when ticket is checked at gate
-- ============================================================================
CREATE TABLE VISIT (
    visit_id INT PRIMARY KEY AUTO_INCREMENT,
    visitor_id INT NOT NULL,  -- Denormalized for faster queries
    ticket_id INT NOT NULL UNIQUE,  -- 1:1 relationship (one ticket = one visit)
    location_id INT NOT NULL,
    
    -- Visit timing
    visit_date DATE NOT NULL,
    entry_time DATETIME NOT NULL,
    exit_time DATETIME,
    total_duration_minutes INT,
    
    -- Gate tracking
    entry_gate VARCHAR(50),
    exit_gate VARCHAR(50),
    
    -- Visit details
    purpose VARCHAR(100) DEFAULT 'Tourism',
    visit_status ENUM('approved', 'in_progress', 'completed', 'cancelled') DEFAULT 'approved',
    
    -- Staff tracking
    approved_by_staff_id INT,  -- Staff who approved entry (usually same as entry_recorded_by)
    entry_recorded_by_staff_id INT,  -- Staff who scanned at entry
    exit_recorded_by_staff_id INT,   -- Staff who scanned at exit
    
    -- Additional info
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (visitor_id) REFERENCES VISITOR(visitor_id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_id) REFERENCES TICKET(ticket_id) ON DELETE RESTRICT,
    FOREIGN KEY (location_id) REFERENCES LOCATION(location_id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by_staff_id) REFERENCES STAFF(staff_id) ON DELETE SET NULL,
    FOREIGN KEY (entry_recorded_by_staff_id) REFERENCES STAFF(staff_id) ON DELETE SET NULL,
    FOREIGN KEY (exit_recorded_by_staff_id) REFERENCES STAFF(staff_id) ON DELETE SET NULL,
    
    INDEX idx_visit_date (visit_date),
    INDEX idx_visit_status (visit_status),
    INDEX idx_entry_time (entry_time)
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_staff_type ON STAFF(staff_type);
CREATE INDEX idx_staff_active ON STAFF(is_active);
CREATE INDEX idx_payment_status ON PAYMENT(payment_status);
CREATE INDEX idx_location_active ON LOCATION(is_active);

-- ============================================================================
-- SAMPLE DATA INSERTION
-- ============================================================================

-- Insert Locations
INSERT INTO LOCATION (location_name, location_type, address, city, state, pincode, capacity, contact_no, email, opening_time, closing_time) VALUES
('Chennai Wildlife Park', 'zoo', 'Vandalur, Chennai', 'Chennai', 'Tamil Nadu', '600048', 5000, '044-22472277', 'chennai.zoo@wildlife.in', '08:30:00', '17:30:00'),
('National Museum Chennai', 'museum', 'Pantheon Road, Egmore', 'Chennai', 'Tamil Nadu', '600008', 2000, '044-28193238', 'chennai.museum@gov.in', '09:00:00', '18:00:00'),
('Botanical Garden Ooty', 'botanical_garden', 'Ooty Lake Road', 'Ooty', 'Tamil Nadu', '643001', 3000, '0423-2443625', 'ooty.garden@tn.gov.in', '07:00:00', '19:00:00');

-- Insert Departments
INSERT INTO DEPARTMENT (department_name, location_id, description) VALUES
('Security', 1, 'Handles entry/exit security and visitor safety'),
('Ticketing', 1, 'Manages ticket sales and verification'),
('Animal Care', 1, 'Responsible for animal welfare and exhibits'),
('Security', 2, 'Handles museum security'),
('Ticketing', 2, 'Manages museum ticket operations'),
('Exhibitions', 2, 'Manages museum exhibitions and displays'),
('Horticulture', 3, 'Maintains plants and gardens'),
('Ticketing', 3, 'Handles garden ticket sales');

-- Insert Staff
INSERT INTO STAFF (staff_name, staff_type, department_id, phone_no, email, shift, hire_date) VALUES
-- Zoo Staff
('Rajesh Kumar', 'security', 1, '9876543210', 'rajesh.security@zoo.in', 'morning', '2023-01-15'),
('Priya Sharma', 'ticketing', 2, '9876543211', 'priya.ticket@zoo.in', 'morning', '2023-03-20'),
('Arun Venkat', 'security', 1, '9876543212', 'arun.security@zoo.in', 'afternoon', '2023-02-10'),
('Divya Lakshmi', 'guide', 3, '9876543213', 'divya.guide@zoo.in', 'rotational', '2023-04-05'),

-- Museum Staff
('Karthik Rajan', 'security', 4, '9876543214', 'karthik.security@museum.in', 'morning', '2022-11-20'),
('Meera Patel', 'ticketing', 5, '9876543215', 'meera.ticket@museum.in', 'morning', '2022-12-15'),
('Suresh Babu', 'manager', 6, '9876543216', 'suresh.manager@museum.in', 'morning', '2022-08-10'),

-- Garden Staff
('Lakshman Reddy', 'ticketing', 8, '9876543217', 'lakshman.ticket@garden.in', 'morning', '2023-05-12'),
('Anita Singh', 'security', 8, '9876543218', 'anita.security@garden.in', 'afternoon', '2023-06-01');

-- Insert Visitors
INSERT INTO VISITOR (name, phone_no, email, address, id_proof_type, id_proof_no, visitor_qr, date_of_birth, gender) VALUES
('Arjun Krishnan', '9988776655', 'arjun.k@gmail.com', '12, Anna Nagar, Chennai', 'aadhaar', '123456789012', 'VIS_QR_001', '1990-05-15', 'male'),
('Sneha Reddy', '9988776656', 'sneha.r@gmail.com', '45, T Nagar, Chennai', 'passport', 'P9876543', 'VIS_QR_002', '1995-08-20', 'female'),
('Rahul Sharma', '9988776657', 'rahul.s@gmail.com', '78, Adyar, Chennai', 'driving_license', 'DL-TN-2019-123456', 'VIS_QR_003', '1988-12-10', 'male'),
('Kavya Iyer', '9988776658', 'kavya.i@gmail.com', '23, Mylapore, Chennai', 'aadhaar', '987654321098', 'VIS_QR_004', '2000-03-25', 'female'),
('Vikram Patel', '9988776659', 'vikram.p@gmail.com', '56, Velachery, Chennai', 'voter_id', 'VID-TN-7890', 'VIS_QR_005', '1985-11-05', 'male');

-- ============================================================================
-- WORKFLOW DEMONSTRATION: STEP-BY-STEP DATA INSERTION
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Online/Counter Purchase - PAYMENT → TICKET created (checked: FALSE)
-- ----------------------------------------------------------------------------

-- Payment 1: Arjun buys zoo ticket
INSERT INTO PAYMENT (amount, payment_date, payment_mode, payment_status, transaction_id) VALUES
(150.00, '2025-02-08 10:30:00', 'upi', 'completed', 'UPI-TXN-20250208103045');

-- Ticket 1: Zoo adult ticket for Arjun (NOT YET CHECKED)
INSERT INTO TICKET (visitor_id, location_id, ticket_category, base_price, discount_amount, final_price, 
                    issue_date, valid_from, valid_till, ticket_qr, payment_id, checked, ticket_status) VALUES
(1, 1, 'adult', 150.00, 0.00, 150.00, 
 '2025-02-08 10:30:00', '2025-02-09', '2025-02-09', 'TKT_ZOO_001', 1, FALSE, 'active');

-- Payment 2: Sneha buys museum ticket
INSERT INTO PAYMENT (amount, payment_date, payment_mode, payment_status, transaction_id) VALUES
(100.00, '2025-02-08 11:15:00', 'card', 'completed', 'CARD-TXN-20250208111530');

-- Ticket 2: Museum student ticket for Sneha
INSERT INTO TICKET (visitor_id, location_id, ticket_category, base_price, discount_amount, final_price, 
                    issue_date, valid_from, valid_till, ticket_qr, payment_id, checked, ticket_status) VALUES
(2, 2, 'student', 120.00, 20.00, 100.00, 
 '2025-02-08 11:15:00', '2025-02-09', '2025-02-09', 'TKT_MUS_002', 2, FALSE, 'active');

-- Payment 3: Rahul buys zoo family ticket
INSERT INTO PAYMENT (amount, payment_date, payment_mode, payment_status, transaction_id) VALUES
(400.00, '2025-02-08 12:00:00', 'cash', 'completed', 'CASH-TXN-20250208120015');

-- Ticket 3: Zoo family ticket for Rahul
INSERT INTO TICKET (visitor_id, location_id, ticket_category, base_price, discount_amount, final_price, 
                    issue_date, valid_from, valid_till, ticket_qr, payment_id, checked, ticket_status) VALUES
(3, 1, 'family', 500.00, 100.00, 400.00, 
 '2025-02-08 12:00:00', '2025-02-09', '2025-02-09', 'TKT_ZOO_003', 3, FALSE, 'active');

-- ----------------------------------------------------------------------------
-- STEP 2: At Gate - Staff scans ticket_qr → TICKET checked + VISIT created
-- ----------------------------------------------------------------------------

-- Arjun arrives at zoo gate on 2025-02-09 at 09:00 AM
-- Ticketing staff (Priya - staff_id=2) checks the ticket
UPDATE TICKET 
SET checked = TRUE,
    checked_by_staff_id = 2,
    checked_time = '2025-02-09 09:00:00',
    ticket_status = 'used'
WHERE ticket_id = 1;

-- VISIT record created for Arjun (status: 'approved')
INSERT INTO VISIT (visitor_id, ticket_id, location_id, visit_date, entry_time, entry_gate, 
                   visit_status, approved_by_staff_id, entry_recorded_by_staff_id) VALUES
(1, 1, 1, '2025-02-09', '2025-02-09 09:00:00', 'Main Gate', 
 'approved', 2, 2);

-- Sneha arrives at museum gate on 2025-02-09 at 10:30 AM
-- Ticketing staff (Meera - staff_id=6) checks the ticket
UPDATE TICKET 
SET checked = TRUE,
    checked_by_staff_id = 6,
    checked_time = '2025-02-09 10:30:00',
    ticket_status = 'used'
WHERE ticket_id = 2;

-- VISIT record created for Sneha
INSERT INTO VISIT (visitor_id, ticket_id, location_id, visit_date, entry_time, entry_gate, 
                   visit_status, approved_by_staff_id, entry_recorded_by_staff_id) VALUES
(2, 2, 2, '2025-02-09', '2025-02-09 10:30:00', 'North Entrance', 
 'approved', 6, 6);

-- ----------------------------------------------------------------------------
-- STEP 3: During visit - VISIT.status = 'in_progress'
-- ----------------------------------------------------------------------------

-- Update Arjun's visit to in_progress (after entry clearance)
UPDATE VISIT 
SET visit_status = 'in_progress'
WHERE visit_id = 1;

-- Update Sneha's visit to in_progress
UPDATE VISIT 
SET visit_status = 'in_progress'
WHERE visit_id = 2;

-- ----------------------------------------------------------------------------
-- STEP 4: Exit Gate - VISIT completed with duration calculated
-- ----------------------------------------------------------------------------

-- Arjun exits at 12:30 PM (3.5 hours later)
-- Security staff (Rajesh - staff_id=1) records exit
UPDATE VISIT 
SET exit_time = '2025-02-09 12:30:00',
    exit_gate = 'Main Gate',
    total_duration_minutes = TIMESTAMPDIFF(MINUTE, entry_time, '2025-02-09 12:30:00'),
    visit_status = 'completed',
    exit_recorded_by_staff_id = 1
WHERE visit_id = 1;

-- Sneha exits at 13:00 PM (2.5 hours later)
-- Security staff (Karthik - staff_id=5) records exit
UPDATE VISIT 
SET exit_time = '2025-02-09 13:00:00',
    exit_gate = 'North Entrance',
    total_duration_minutes = TIMESTAMPDIFF(MINUTE, entry_time, '2025-02-09 13:00:00'),
    visit_status = 'completed',
    exit_recorded_by_staff_id = 5
WHERE visit_id = 2;

-- ============================================================================
-- USEFUL QUERIES FOR WORKFLOW TRACKING
-- ============================================================================

-- Query 1: Check unchecked tickets (awaiting visitor arrival)
SELECT 
    t.ticket_id,
    t.ticket_qr,
    v.name AS visitor_name,
    l.location_name,
    t.ticket_category,
    t.final_price,
    t.valid_from,
    t.valid_till,
    t.ticket_status
FROM TICKET t
JOIN VISITOR v ON t.visitor_id = v.visitor_id
JOIN LOCATION l ON t.location_id = l.location_id
WHERE t.checked = FALSE 
  AND t.ticket_status = 'active'
  AND CURDATE() BETWEEN t.valid_from AND t.valid_till;

-- Query 2: Active visits in progress (people currently inside)
SELECT 
    vi.visit_id,
    v.name AS visitor_name,
    v.phone_no,
    l.location_name,
    vi.entry_time,
    vi.entry_gate,
    TIMESTAMPDIFF(MINUTE, vi.entry_time, NOW()) AS minutes_inside,
    s.staff_name AS entry_staff
FROM VISIT vi
JOIN VISITOR v ON vi.visitor_id = v.visitor_id
JOIN LOCATION l ON vi.location_id = l.location_id
LEFT JOIN STAFF s ON vi.entry_recorded_by_staff_id = s.staff_id
WHERE vi.visit_status = 'in_progress';

-- Query 3: Completed visits with duration summary
SELECT 
    vi.visit_id,
    v.name AS visitor_name,
    l.location_name,
    vi.visit_date,
    vi.entry_time,
    vi.exit_time,
    vi.total_duration_minutes,
    CONCAT(FLOOR(vi.total_duration_minutes / 60), 'h ', 
           MOD(vi.total_duration_minutes, 60), 'm') AS duration_formatted,
    t.final_price AS ticket_price
FROM VISIT vi
JOIN VISITOR v ON vi.visitor_id = v.visitor_id
JOIN LOCATION l ON vi.location_id = l.location_id
JOIN TICKET t ON vi.ticket_id = t.ticket_id
WHERE vi.visit_status = 'completed'
ORDER BY vi.visit_date DESC, vi.exit_time DESC;

-- Query 4: Daily visitor statistics by location
SELECT 
    l.location_name,
    DATE(vi.visit_date) AS visit_date,
    COUNT(DISTINCT vi.visitor_id) AS total_visitors,
    COUNT(CASE WHEN vi.visit_status = 'in_progress' THEN 1 END) AS currently_inside,
    COUNT(CASE WHEN vi.visit_status = 'completed' THEN 1 END) AS completed_visits,
    SUM(t.final_price) AS total_revenue,
    AVG(vi.total_duration_minutes) AS avg_duration_minutes
FROM VISIT vi
JOIN LOCATION l ON vi.location_id = l.location_id
JOIN TICKET t ON vi.ticket_id = t.ticket_id
GROUP BY l.location_id, DATE(vi.visit_date)
ORDER BY visit_date DESC, l.location_name;

-- Query 5: Staff performance - entries/exits processed
SELECT 
    s.staff_id,
    s.staff_name,
    s.staff_type,
    d.department_name,
    COUNT(DISTINCT vi.visit_id) AS visits_processed,
    COUNT(DISTINCT CASE WHEN vi.entry_recorded_by_staff_id = s.staff_id THEN vi.visit_id END) AS entries_recorded,
    COUNT(DISTINCT CASE WHEN vi.exit_recorded_by_staff_id = s.staff_id THEN vi.visit_id END) AS exits_recorded
FROM STAFF s
JOIN DEPARTMENT d ON s.department_id = d.department_id
LEFT JOIN VISIT vi ON (vi.entry_recorded_by_staff_id = s.staff_id 
                       OR vi.exit_recorded_by_staff_id = s.staff_id)
WHERE s.is_active = TRUE
GROUP BY s.staff_id
ORDER BY visits_processed DESC;

-- Query 6: Payment summary by mode
SELECT 
    p.payment_mode,
    COUNT(*) AS total_transactions,
    SUM(p.amount) AS total_amount,
    AVG(p.amount) AS avg_transaction,
    COUNT(CASE WHEN p.payment_status = 'completed' THEN 1 END) AS successful_payments
FROM PAYMENT p
GROUP BY p.payment_mode
ORDER BY total_amount DESC;

-- Query 7: Ticket category distribution
SELECT 
    l.location_name,
    t.ticket_category,
    COUNT(*) AS tickets_sold,
    SUM(t.final_price) AS revenue,
    AVG(t.discount_amount) AS avg_discount
FROM TICKET t
JOIN LOCATION l ON t.location_id = l.location_id
GROUP BY l.location_id, t.ticket_category
ORDER BY l.location_name, tickets_sold DESC;

-- ============================================================================
-- TRIGGERS FOR AUTOMATION
-- ============================================================================

-- Trigger 1: Auto-calculate visit duration on exit
DELIMITER //
CREATE TRIGGER calculate_visit_duration
BEFORE UPDATE ON VISIT
FOR EACH ROW
BEGIN
    IF NEW.exit_time IS NOT NULL AND OLD.exit_time IS NULL THEN
        SET NEW.total_duration_minutes = TIMESTAMPDIFF(MINUTE, NEW.entry_time, NEW.exit_time);
        SET NEW.visit_status = 'completed';
    END IF;
END//
DELIMITER ;

-- Trigger 2: Auto-update ticket status when checked
DELIMITER //
CREATE TRIGGER update_ticket_on_check
BEFORE UPDATE ON TICKET
FOR EACH ROW
BEGIN
    IF NEW.checked = TRUE AND OLD.checked = FALSE THEN
        SET NEW.ticket_status = 'used';
    END IF;
END//
DELIMITER ;

-- Trigger 3: Validate ticket dates before creating visit
DELIMITER //
CREATE TRIGGER validate_ticket_before_visit
BEFORE INSERT ON VISIT
FOR EACH ROW
BEGIN
    DECLARE ticket_valid_from DATE;
    DECLARE ticket_valid_till DATE;
    
    SELECT valid_from, valid_till INTO ticket_valid_from, ticket_valid_till
    FROM TICKET WHERE ticket_id = NEW.ticket_id;
    
    IF NEW.visit_date < ticket_valid_from OR NEW.visit_date > ticket_valid_till THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Visit date must be within ticket validity period';
    END IF;
END//
DELIMITER ;

-- ============================================================================
-- VIEWS FOR COMMON REPORTS
-- ============================================================================

-- View 1: Current visitors inside locations
CREATE VIEW current_visitors_view AS
SELECT 
    v.name AS visitor_name,
    v.phone_no,
    l.location_name,
    vi.entry_time,
    vi.entry_gate,
    TIMESTAMPDIFF(MINUTE, vi.entry_time, NOW()) AS minutes_inside,
    t.ticket_category,
    s.staff_name AS approved_by
FROM VISIT vi
JOIN VISITOR v ON vi.visitor_id = v.visitor_id
JOIN LOCATION l ON vi.location_id = l.location_id
JOIN TICKET t ON vi.ticket_id = t.ticket_id
LEFT JOIN STAFF s ON vi.approved_by_staff_id = s.staff_id
WHERE vi.visit_status = 'in_progress';

-- View 2: Today's visit summary
CREATE VIEW todays_visits_summary AS
SELECT 
    l.location_name,
    COUNT(DISTINCT vi.visitor_id) AS total_visitors,
    COUNT(CASE WHEN vi.visit_status = 'in_progress' THEN 1 END) AS currently_inside,
    COUNT(CASE WHEN vi.visit_status = 'completed' THEN 1 END) AS completed,
    SUM(t.final_price) AS revenue,
    AVG(vi.total_duration_minutes) AS avg_duration_min
FROM VISIT vi
JOIN LOCATION l ON vi.location_id = l.location_id
JOIN TICKET t ON vi.ticket_id = t.ticket_id
WHERE vi.visit_date = CURDATE()
GROUP BY l.location_id;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
