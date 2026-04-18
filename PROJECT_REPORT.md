# Visitor Management System (VMS) — Final Year Project Report

## Abstract
The **Visitor Management System (VMS)** is a full-stack platform designed for tourism venues such as **zoos, museums, and botanical gardens**. It digitizes the complete visitor journey: **ticket booking**, **QR-based gate validation**, **entry/exit tracking**, **real-time occupancy**, and **analytics** for internal operations.  
The system is delivered as **two separate web applications**:

- **Public Visitor Website** (customer-facing): booking flow, QR ticket download, exhibits, events, map, FAQ, contact.
- **Admin Dashboard** (internal): live operational control panel, gate scanning, staff/visitor/ticket management, reports.

Both apps share the **same MySQL database** and communicate through a **Node.js + Express REST API**.

---

## 1. Introduction
Tourism locations commonly face operational issues such as manual ticketing, long queues, inconsistent entry logs, and difficulty in estimating crowd levels. VMS solves this by:

- Providing **online booking** with QR tickets
- Enabling **fast gate scanning** (entry + exit)
- Recording **visit duration automatically**
- Showing **real-time occupancy**
- Producing **revenue and visitor analytics**

---

## 2. Objectives
- Build a **normalized relational schema** in MySQL for a real-world VMS.
- Implement **atomic booking** (PAYMENT → TICKET) using DB transactions.
- Ensure **QR-based workflow** with strict status transitions.
- Provide a modern **Admin Dashboard** with real-time sync and analytics.
- Provide a modern **Public Website** with mobile-first UX and smooth animations.
- Maintain reliability via **constraints, indexes, triggers, and views**.

---

## 3. System Architecture
### 3.1 Architecture Style: 3-tier (Web)
1. **Presentation Layer**
   - Admin dashboard (React + Vite + Tailwind)
   - Public website (React + Vite + Tailwind + Framer Motion)
2. **Application Layer**
   - Node.js + Express REST API
   - JWT authentication for visitor accounts
   - Transaction handling and validation logic
3. **Data Layer**
   - MySQL relational database with triggers and views

### 3.2 High-Level Flow
- Public website books tickets through backend public APIs.
- Admin dashboard manages operational data through admin APIs.
- Gate scanning updates tickets/visits and instantly affects:
  - occupancy counters
  - live visitor board
  - reports/analytics

---

## 4. User Types & Roles
### 4.1 Admin Users (Internal)
- Receptionists
- Ticketing staff
- Security staff
- Managers

### 4.2 Public Users
- Guests (no login required)
- Registered visitors (login for booking history and QR downloads)

---

## 5. Core Workflow (Preserved Business Rules)
### 5.1 Ticket Booking
1. **PAYMENT created**
2. **TICKET created**
   - `checked = FALSE`
   - `ticket_status = 'active'`
   - `ticket_qr` generated

### 5.2 Gate Entry (QR scan)
1. Ticket QR scanned
2. Ticket validated (status, dates, location)
3. Ticket updated:
   - `checked = TRUE`
   - `ticket_status = 'used'`
4. VISIT created:
   - `visit_status = 'in_progress'`
   - `entry_time = NOW()`

### 5.3 Exit Scan (Checkout)
1. VISIT updated:
   - `exit_time = NOW()`
   - `visit_status = 'completed'`
   - `total_duration_minutes = TIMESTAMPDIFF(MINUTE, entry_time, NOW())`

---

## 6. Database Design
### 6.1 Core Tables
- `LOCATION`
- `DEPARTMENT`
- `STAFF`
- `VISITOR`
- `PAYMENT`
- `TICKET`
- `VISIT`

### 6.2 Extended Tables (Operational + Analytics)
- `USER_AUTH` (staff authentication)
- `PRICING_CONFIG` (dynamic pricing by category/location)
- `FEEDBACK`
- `INCIDENT_REPORT`
- `ANNOUNCEMENT`
- `TOUR_ASSIGNMENT`
- `AUDIT_LOG`

### 6.3 New Additions (Public website support)
- `VISITOR_ACCOUNT`
  - Holds public login credentials (JWT)
  - Links to `VISITOR` only after profile is completed during booking
- `DAILY_CAPACITY`
  - Daily ticket capacity per location/date (`max_tickets`, `tickets_sold`)

### 6.4 Relationships (ER Summary)
- `LOCATION (1) → (M) DEPARTMENT`
- `DEPARTMENT (1) → (M) STAFF`
- `VISITOR (1) → (M) TICKET`
- `PAYMENT (1) → (M) TICKET` (one payment can generate multiple tickets in a booking)
- `TICKET (1) → (1) VISIT` (enforced by `VISIT.ticket_id UNIQUE`)
- `VISITOR_ACCOUNT (0..1) → (0..1) VISITOR` (optional link)
- `LOCATION (1) → (M) DAILY_CAPACITY`

### 6.5 Triggers & Views (Key)
- Trigger: auto-set `VISIT.total_duration_minutes` and mark completed when `exit_time` is set.
- Trigger: mark ticket `used` when `checked` becomes TRUE.
- Trigger: validate visit date inside ticket validity.
- View: current visitors inside.
- View: today's summary (visitors, revenue, avg duration).

---

## 7. Backend Design (Node.js + Express)
### 7.1 API Structure
- Modular routing (`backend/routes/*`)
- Connection pooling (`mysql2/promise`)
- Standard response pattern:
  - Success: `{ success: true, data: ... }`
  - Error: `{ success: false, message: '...' }`

### 7.2 Authentication (Public)
- JWT token stored in browser localStorage key: `vms_visitor_token`
- Token expires in **7 days**
- Protected route: `/api/public/my-tickets`

### 7.3 Transaction Handling
Public booking (`POST /api/public/book`) runs within a DB transaction:
- Validate capacity
- Create visitor (if needed)
- Create PAYMENT
- Create one TICKET row per quantity
- Update DAILY_CAPACITY.tickets_sold
If any step fails → rollback.

### 7.4 Error Handling
Central `errorHandler` returns user-friendly messages and handles common DB errors:
- Duplicate entry
- Missing foreign key references

---

## 8. Frontend Design
### 8.1 Admin Dashboard (React + Tailwind + Recharts)
Key UI/UX:
- Sidebar layout with pages: Dashboard, Locations, Departments, Staff, Visitors, Tickets, Gate, Visits, Reports, Incidents
- Stat cards + charts
- Data tables with filters
- Gate page:
  - **Preview scanned ticket**
  - Confirm entry modal: “Confirm Entry for [Name]?”
  - Live visitor board (polling)
- Real-time sync:
  - Dashboard occupancy polling every 30s
  - Tickets list polling every 30s

### 8.2 Public Visitor Website (React + Tailwind + Framer Motion)
Pages:
- Home (hero, live location cards, events, gallery lightbox, testimonials)
- Book Tickets (multi-step booking wizard)
- Login/Register (JWT)
- My Tickets (QR display + PNG download)
- Exhibits explorer
- Events calendar
- Interactive SVG map
- FAQ accordion
- Contact form (mock)

UX Features:
- Glassmorphism cards
- Smooth page transitions (Framer Motion)
- Loading skeletons for async data
- Mobile-first responsive layout

---

## 9. Real-Time Synchronization Strategy
The system maintains real-time consistency using **polling** (every 30 seconds):
- Admin dashboard uses `/api/dashboard/live-count`
- Gate page uses `/api/visits/active`
- Tickets list refreshes periodically

This approach is robust and simple for academic deployment; it can be upgraded to WebSockets for true push updates.

---

## 10. Common Issues Faced & Fixes (Development Log)
- **Port conflicts**: Vite ports already in use → enforced strict ports and killed stale listeners.
- **API response mismatch**: Frontend needed `d.data?.data ?? d.data` extraction due to `{success,data}` wrapper.
- **Modal scroll jump**: Avoided `document.body.style.overflow='hidden'`; used fixed modal with internal scroll.
- **Missing staff joins**: Used `LEFT JOIN` in staff-related reports to avoid orphan failures.
- **Checkout correctness**: ensured visit checkout updates both `visit_status='completed'` and duration calculation.
- **DB password key mismatch**: enforced `DB_PASSWORD` usage.

---

## 11. Deployment (Optional)
- Public website: Vercel
- Admin dashboard: Vercel
- Backend: Railway
- MySQL: Railway / managed MySQL

Environment variables:
- Backend: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`
- Frontends: `VITE_API_URL` (optional; otherwise uses proxy `/api`)

---

## 12. Future Enhancements
- WebSocket-based real-time updates
- Payment gateway integration (Razorpay / Stripe)
- Email confirmations (SMTP / transactional email provider)
- Mobile app (React Native)
- Face recognition / kiosk mode for high-throughput gates
- Admin RBAC (role-based access control) for staff accounts

---

## 13. Conclusion
The Visitor Management System demonstrates a complete, industry-style workflow with a normalized database, transactional backend, and two modern React applications. It delivers a strong final-year project showcasing **DBMS design, full-stack development, and real-world operational logic**.

