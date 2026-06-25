# Reimbursements Management System

A full-stack web application for managing and tracking employee expense reimbursements with a strict multi-level approval pipeline. 

Built with **Express.js, PostgreSQL, Drizzle ORM**, and a modern **Vanilla JS/CSS** frontend dashboard.

## 🚀 Features

- **Role-Based Access Control (RBAC):** Four distinct roles (`EMP`, `RM`, `APE`, `CFO`), each with specialized dashboard views and permissions.
- **Multi-Level Approval Pipeline:** Requests must flow from Reporting Manager (RM) ➡️ Accounts Payable (APE) ➡️ Chief Financial Officer (CFO).
- **Secure Authentication:** Cookie-based JWT authentication (`httpOnly`, `secure`, `sameSite`).
- **Domain Restriction:** Only `@org.com` email addresses can register and access the system.
- **Modern UI:** Glassmorphism-styled dashboard using Vanilla HTML/CSS (no heavy frontend frameworks required).

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (Supabase)
- **ORM:** Drizzle ORM
- **Security:** bcrypt (password hashing), jsonwebtoken (JWT)
- **Frontend:** Vanilla HTML, CSS, JavaScript

---

## ⚙️ Local Development Setup

### 1. Clone & Install
```bash
git clone https://github.com/nikukaushik001/reimbursements-project-.git
cd "RazorPay Backend"
npm install
```

### 2. Environment Variables
Copy the example environment file and fill in your details:
```bash
cp .env.example .env
```
Inside `.env`, you must provide a PostgreSQL connection string (e.g., from Supabase) and a JWT secret.

### 3. Database Initialization
Run the following scripts to generate tables and seed the initial data:
```bash
# Apply the schema migrations to your database
npm run db:migrate

# Seed the default CFO account (cfo@org.com / CFO#ORG@April2026)
npm run db:seed-data
```

### 4. Start the Application

**Start the Backend Server (Port 7002):**
```bash
npm run dev
```

**Start the Frontend Dashboard (Port 3000):**
Open a new terminal window in the root directory and run:
```bash
npx serve frontend -p 3000
```
Then visit `http://localhost:3000` in your browser.

---

## 👥 Roles & Workflows

### The Roles
1. **EMP (Employee):** The default role. Can create reimbursement requests and track their status.
2. **RM (Reporting Manager):** Reviews and approves/rejects requests from their assigned employees.
3. **APE (Accounts Payable Executive):** Reviews requests that have been approved by the RM.
4. **CFO (Chief Financial Officer):** The root administrator. Can assign roles, link EMPs to RMs, and provide final approval on expenses.

### The Approval Flow
1. **EMP** submits a request ➡️ Status is `PENDING`.
2. **RM** approves it ➡️ Request is forwarded to APE.
3. **APE** approves it ➡️ In the EMP's view, the request is now officially `APPROVED`.
4. **CFO** reviews APE-approved requests for final auditing/approval.
*(Note: Any role in the chain can **Reject** the request at any time, instantly changing its status to `REJECTED`).*

---

## 🔌 API Endpoints

All API endpoints are prefixed with `/rest`.

### Auth (Public)
- `POST /rest/onboardings/register` - Register a new EMP
- `POST /rest/onboardings/login` - Login and receive an auth cookie
- `POST /rest/onboardings/logout` - Clear auth cookie

### Employees & Roles (Protected)
- `GET /rest/employees` - List employees (visibility based on role)
- `POST /rest/roles/assign` - Assign a role to a user *(CFO only)*
- `POST /rest/employees/assign` - Assign an EMP to an RM *(CFO only)*
- `DELETE /rest/employees/assign` - Remove an EMP-RM assignment *(CFO only)*

### Reimbursements (Protected)
- `POST /rest/reimbursements` - Create a new request *(EMP only)*
- `PATCH /rest/reimbursements` - Approve or reject a request *(RM, APE, CFO)*
- `GET /rest/reimbursements` - View requests (filtered automatically by your role)
- `GET /rest/reimbursements/:userId` - View your own requests *(EMP only)*
