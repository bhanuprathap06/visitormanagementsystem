# Visitor Management System — Setup & Free Deployment Guide

## Project Structure

```
DBMS (frontend and backend)/
├── database/
│   └── schema_expanded.sql     ← Run this in MySQL first
├── backend/                    ← Node.js + Express API (port 5000)
│   ├── server.js
│   ├── .env.example            ← Copy to .env and fill in your DB details
│   ├── config/database.js
│   ├── routes/
│   │   ├── dashboard.js
│   │   ├── locations.js
│   │   ├── departments.js
│   │   ├── staff.js
│   │   ├── visitors.js
│   │   ├── payments.js
│   │   ├── tickets.js
│   │   ├── visits.js
│   │   ├── reports.js
│   │   ├── announcements.js
│   │   ├── incidents.js
│   │   └── feedback.js
│   └── middleware/errorHandler.js
└── frontend/                   ← React + Tailwind (port 5173)
    ├── src/
    │   ├── pages/              ← Dashboard, Locations, Departments, Staff,
    │   │                          Visitors, Tickets, Gate, Visits, Reports, Incidents
    │   ├── components/         ← Layout, Sidebar, Modal, DataTable, StatCard
    │   └── api/axios.js
    └── ...config files
```

---

## LOCAL SETUP (Step-by-Step)

### Prerequisites
- Node.js 18+ (https://nodejs.org)
- MySQL 8+ (https://dev.mysql.com/downloads/)
- Git (https://git-scm.com)

---

### Step 1 — Set Up the Database

1. Open MySQL Workbench or MySQL terminal
2. Run the SQL file:
   ```sql
   source /path/to/database/schema_expanded.sql
   ```
   Or copy-paste the entire file content into MySQL Workbench and execute.

---

### Step 2 — Configure & Start the Backend

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
```

Edit `.env`:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=visitor_management_system

PORT=5000
JWT_SECRET=any_long_random_string_here
```

```bash
# Start the backend
npm run dev       # development (auto-restarts on changes)
# or
npm start         # production
```

Backend runs at: **http://localhost:5000**
Test it: http://localhost:5000/api/health

---

### Step 3 — Start the Frontend

```bash
# Open a new terminal, navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

The frontend automatically proxies `/api/*` calls to the backend at port 5000.

---

## FREE DEPLOYMENT (Live .com Website)

> Deploy the full stack for **₹0 / $0** using free tiers.

### Architecture for Free Deployment:
- **Database** → PlanetScale (free MySQL) or Aiven (free MySQL)
- **Backend**  → Render.com (free Node.js hosting)
- **Frontend** → Vercel or Netlify (free React hosting)
- **Domain**   → Use the free subdomain provided, OR get a free .com from Freenom / use a cheap domain (~₹100/year)

---

### STEP A — Free MySQL Database (PlanetScale or Aiven)

#### Option 1: PlanetScale (Recommended)
1. Go to https://planetscale.com → Sign up (free tier: 5GB, no credit card)
2. Create a new database → name it `visitor_management_system`
3. Click "Connect" → Choose "Connect with: mysql2"
4. Copy the connection string — it looks like:
   ```
   mysql://user:password@host/dbname?ssl={"rejectUnauthorized":true}
   ```
5. In PlanetScale's built-in console, paste and run the SQL from `schema_expanded.sql`

#### Option 2: Aiven
1. Go to https://aiven.io → Sign up (free tier includes MySQL)
2. Create MySQL service → Copy host, port, user, password

---

### STEP B — Deploy Backend on Render.com (Free)

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/vms-backend
   git push -u origin main
   ```

2. Go to https://render.com → Sign up with GitHub

3. Click "New +" → "Web Service" → Connect your GitHub repo

4. Configure:
   - **Root directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: Node

5. Add Environment Variables (from your PlanetScale connection):
   ```
   DB_HOST     = your-planetscale-host
   DB_PORT     = 3306
   DB_USER     = your-user
   DB_PASSWORD = your-password
   DB_NAME     = visitor_management_system
   PORT        = 5000
   JWT_SECRET  = your-secret-key
   NODE_ENV    = production
   FRONTEND_URL = https://your-app.vercel.app
   ```

6. Click Deploy → Render gives you a free URL like:
   **https://vms-backend.onrender.com**

> Note: Free tier "sleeps" after 15 min of inactivity. Upgrade to $7/month to keep it always-on.

---

### STEP C — Deploy Frontend on Vercel (Free)

1. Update `frontend/src/api/axios.js` — change baseURL to your Render backend URL:
   ```js
   const api = axios.create({
     baseURL: 'https://vms-backend.onrender.com/api',
     ...
   });
   ```
   
   Also update `frontend/vite.config.js` — remove the proxy section (it's only for local dev), and add:
   ```js
   export default defineConfig({
     plugins: [react()],
     build: { outDir: 'dist' }
   });
   ```

2. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

3. Go to https://vercel.com → Sign up with GitHub

4. Click "New Project" → Import your GitHub repo

5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. Click Deploy → Vercel gives you:
   **https://vms-app.vercel.app**

---

### STEP D — Connect a Free or Cheap Domain

#### Option 1: Free subdomain (no purchase needed)
Your app is already live at `https://vms-app.vercel.app` — share this URL.

#### Option 2: Free .com from Freenom (limited availability)
1. Go to https://www.freenom.com
2. Search for your desired name
3. Register a `.tk`, `.ml`, or `.ga` domain for free (1 year)
4. In Freenom DNS settings, add a CNAME record pointing to `cname.vercel-dns.com`
5. In Vercel project settings → Domains → Add your Freenom domain

#### Option 3: Buy a cheap .com (~₹500–900/year)
- https://namecheap.com or https://godaddy.com
- Add the domain in Vercel → Vercel auto-configures HTTPS

---

## COMPLETE FREE STACK SUMMARY

| Component  | Service            | Cost   | URL Example                          |
|------------|--------------------|--------|--------------------------------------|
| MySQL DB   | PlanetScale        | FREE   | (connection string only)             |
| Backend    | Render.com         | FREE   | https://vms-api.onrender.com         |
| Frontend   | Vercel             | FREE   | https://vms-app.vercel.app           |
| Domain     | Your Vercel URL    | FREE   | https://vms-app.vercel.app           |
| SSL/HTTPS  | Auto (Vercel)      | FREE   | Included                             |

---

## API Reference

| Method | Endpoint                        | Description                  |
|--------|---------------------------------|------------------------------|
| GET    | /api/dashboard/overview         | Dashboard KPIs               |
| GET    | /api/dashboard/visitor-trends   | 30-day trend chart data      |
| GET    | /api/locations                  | All locations                |
| POST   | /api/locations                  | Create location              |
| GET    | /api/staff                      | All staff (filterable)       |
| POST   | /api/visitors                   | Register visitor             |
| POST   | /api/tickets                    | Issue ticket + payment       |
| POST   | /api/tickets/checkin            | Gate check-in (scan QR)      |
| GET    | /api/visits/active              | Live visitors inside         |
| PUT    | /api/visits/:id/checkout        | Gate check-out               |
| GET    | /api/reports/revenue            | Revenue analytics            |
| POST   | /api/incidents                  | Report incident              |

---

## Features Built

- **Dashboard** — Live stats, charts (visitor trends, revenue, categories, payment modes)
- **Locations** — Full CRUD with activate/deactivate
- **Departments** — Linked to locations, staff count
- **Staff** — Type/shift filters, activate/deactivate
- **Visitors** — Register, search, view full visit history
- **Tickets** — Issue tickets with integrated payment, cancel tickets
- **Gate Management** — QR scan check-in, live visitor board, checkout
- **Visits** — Full visit log with filters (status, location, date range)
- **Reports** — Revenue, visitors, staff performance, location summary tabs
- **Incidents** — Report and resolve security/medical/other incidents

---

## Database Tables (14 total)

Original (7): LOCATION, DEPARTMENT, STAFF, VISITOR, PAYMENT, TICKET, VISIT

Added (7): USER_AUTH, PRICING_CONFIG, FEEDBACK, INCIDENT_REPORT, ANNOUNCEMENT, TOUR_ASSIGNMENT, AUDIT_LOG
