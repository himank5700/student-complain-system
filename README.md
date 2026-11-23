# Student Complaint Management System (SCMS)

> A production-ready, full-stack campus grievance management portal built with **Node.js**, **Express.js**, **MySQL**, **Bootstrap 5**, and containerized using **Docker**, **Nginx**, and **GitHub Actions CI/CD**.

---

## 1. Project Abstract

In traditional collegiate environments, grievance redressal typically relies on physical suggestion boxes, paper-based forms, or disjointed emails. These legacy methods lack accountability, real-time tracking, categorized routing, and analytical transparency. 

The **Student Complaint Management System (SCMS)** is an end-to-end, multi-tier web application designed to streamline and digitize campus grievances. Students can lodge complaints across diverse campus domains (Hostel, Wi-Fi, Library, Classrooms, Laboratories, Transport, Canteen), track their real-time resolution timeline, and view administrative remarks. Simultaneously, college administrators can monitor KPIs via an interactive dashboard, assign tickets to dedicated campus departments, and update grievance statuses through an audit-logged workflow. 

Emphasizing modern **DevOps engineering principles**, the system is containerized with **Docker**, orchestrated using **Docker Compose**, reverse-proxied via **Nginx**, tested automatically with **Jest and Supertest**, and continuously integrated with **GitHub Actions**.

---

## 2. Problem Statement & Objectives

### Problem Statement
Students often encounter daily campus infrastructure, academic, and facility bottlenecks. Existing manual reporting mechanisms introduce:
* **Lack of Transparency**: Students have no visibility into who is handling their issue or expected resolution times.
* **Administrative Burden**: Hand-written logs are prone to misplacement and lack searchability or metric tracking.
* **Siloed Communication**: Issues fail to reach the specific department (e.g. IT, Hostel Maintenance, Estate).

### Project Objectives
1. **Digitize Grievance Redressal**: Provide an intuitive web interface for submitting complaints with category tagging.
2. **Ensure Accountability**: Provide unique tracking IDs and maintain a complete audit log of all status transitions.
3. **Role-Based Security**: Restrict administrative operations to verified staff while ensuring student privacy.
4. **DevOps Lifecycle**: Implement version control, containerized reproducibility, automated CI/CD pipelines, and health monitoring.

---

## 3. Technology Stack

| Layer | Technologies & Tools |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript (Vanilla ES6+), Bootstrap 5.3, Bootstrap Icons |
| **Backend** | Node.js (v20+), Express.js (v4.x), REST API Architecture |
| **Database** | MySQL Server 8.0, InnoDB Storage Engine, Parameterized SQL Queries |
| **Authentication** | JSON Web Tokens (JWT), Password Hashing via `bcryptjs` (Cost 10) |
| **DevOps & Containers** | Docker, Docker Compose, Nginx (Reverse Proxy & Web Server) |
| **CI/CD Automation** | GitHub Actions (automated test runner and Docker container builder) |
| **Automated Testing** | Jest, Supertest (12 automated unit and integration tests) |

---

## 4. System Architecture

The project adheres to a robust **3-Tier Client-Server Architecture** decoupled via an **Nginx Reverse Proxy**:

```
[ Browser / Client ]
         │ (HTTP Port 80)
         ▼
 ┌───────────────┐
 │  Nginx Proxy  │ (Reverse Proxy, Load Balancing, Gzip, Static Files)
 └───────┬───────┘
         │ (Forward to Backend Port 5000)
         ▼
 ┌───────────────┐
 │ Express API   │ (JWT Auth, Role Guard, Input Validation, Business Logic)
 └───────┬───────┘
         │ (MySQL Port 3306 - Parameterized Queries)
         ▼
 ┌───────────────┐
 │ MySQL 8.0 DB  │ (InnoDB: users, complaints, complaint_logs tables)
 └───────────────┘
```

---

## 5. Database Schema Design

The application uses the `student_complaint_system` database with 3 normalized relational tables:

```
┌─────────────────────────┐       1:N       ┌─────────────────────────┐
│          users          │ ─────────────── │       complaints        │
├─────────────────────────┤                 ├─────────────────────────┤
│ id (PK, INT)            │                 │ id (PK, INT)            │
│ name (VARCHAR)          │                 │ complaint_id (VARCHAR)  │
│ email (VARCHAR, UNIQUE) │                 │ student_id (FK -> users)│
│ password_hash (VARCHAR) │                 │ category (ENUM)         │
│ role (student/admin)    │                 │ title (VARCHAR)         │
│ department (VARCHAR)    │                 │ description (TEXT)      │
│ created_at (TIMESTAMP)  │                 │ status (ENUM)           │
└─────────────────────────┘                 │ assigned_dept (VARCHAR) │
             │                              │ admin_comments (TEXT)   │
             │                              │ created_at (TIMESTAMP)  │
             │                              └─────────────────────────┘
             │ 1:N                                       │ 1:N
             ▼                                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           complaint_logs                            │
├─────────────────────────────────────────────────────────────────────┤
│ id (PK, INT)                                                        │
│ complaint_id (VARCHAR)                                              │
│ changed_by_user_id (FK -> users)                                    │
│ previous_status (VARCHAR)                                           │
│ new_status (VARCHAR)                                                │
│ comment (TEXT)                                                      │
│ created_at (TIMESTAMP)                                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Project Directory Structure

```text
student-complaint-system/
├── frontend/                     # Client-side web application
│   ├── index.html                # College-themed public landing page
│   ├── login.html                # Unified login with demo autofill
│   ├── register.html             # Student account registration
│   ├── student-dashboard.html    # Student dashboard with complaints history
│   ├── submit-complaint.html     # Complaint submission with live counter
│   ├── track-complaint.html      # Grievance tracker with visual progress stepper
│   ├── admin-dashboard.html      # Admin console with statistics and modal editor
│   ├── css/
│   │   └── style.css             # Custom responsive styling and theme variables
│   └── js/
│       └── app.js                # Core JS: JWT state, API wrapper, UI helpers
├── backend/                      # Server-side application
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js             # MySQL connection pool configuration
│   │   ├── controllers/
│   │   │   ├── authController.js # Register, login, and profile controllers
│   │   │   └── complaintController.js # Grievance CRUD and dashboard stats
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT token verification and role guards
│   │   │   └── errorHandler.js   # Centralized error and 404 handlers
│   │   ├── routes/
│   │   │   ├── authRoutes.js     # /api/auth routes
│   │   │   ├── complaintRoutes.js# /api/complaints and /api/admin routes
│   │   │   └── healthRoutes.js   # /api/health DevOps monitoring endpoint
│   │   └── app.js                # Express app configuration and static server
│   ├── tests/
│   │   └── api.test.js           # 12 automated Jest & Supertest integration tests
│   ├── package.json              # Backend dependencies and scripts
│   └── Dockerfile                # Production Alpine Node.js Docker container
├── database/
│   └── schema.sql                # Complete MySQL DDL schema and test seed data
├── nginx/
│   └── nginx.conf                # Reverse proxy, caching, and upstream routing
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # Automated GitHub Actions test & build workflow
├── docker-compose.yml            # Multi-container orchestration (DB, App, Nginx)
├── .env.example                  # Environment variable reference template
├── .gitignore                    # Excludes secrets, logs, and node_modules
└── README.md                     # Comprehensive project documentation
```

---

## 7. Installation & Running Locally

### Prerequisites
* **Node.js** (v18 or higher)
* **npm** (v9 or higher)
* **MySQL Server** (v8.0 or higher)

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/student-complaint-system.git
cd student-complaint-system
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env` in the root or `backend` folder:
```bash
cp .env.example .env
```
Update your MySQL database credentials (`DB_PASSWORD`).

### Step 4: Import the Database Schema
Using MySQL Command-Line Client or MySQL Workbench:
```bash
mysql -u root -p < database/schema.sql
```
*(Enter your MySQL root password when prompted)*

### Step 5: Run Automated Tests
```bash
npm test
```
*(All 12 tests should pass with green checkmarks)*

### Step 6: Start the Application Server
```bash
npm start
```
Open your browser and navigate to: **`http://localhost:5000`**

---

## 8. Running with Docker Compose (DevOps Mode)

The entire application stack (MySQL Database, Node.js Backend, and Nginx Web Server) can be launched in a single command without installing MySQL or Node locally:

```bash
docker compose up --build -d
```

### Inspect Container Status
```bash
docker compose ps
```

### View Real-Time Application Logs
```bash
docker compose logs -f backend
```

### Stop Containers
```bash
docker compose down
```
*(To preserve database records, Docker volume `mysql_data` is automatically maintained)*

---

## 9. Demo Login Credentials

Pre-seeded accounts are immediately available:

| Role | Email Address | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@college.edu` | `Admin@123` |
| **Student (Rahul)** | `student@college.edu` | `Student@123` |
| **Student (Priya)** | `priya@college.edu` | `Student@123` |

*Note: The login page includes 1-click **"Demo Quick-Fill"** buttons for quick testing during demonstrations.*

---

## 10. Automated Testing Coverage

The project includes an automated test suite located in `backend/tests/api.test.js`:

```text
PASS tests/api.test.js
  Student Complaint Management System - API Tests
    GET /api/health
      ✓ should return 200 and healthy status when database responds
      ✓ should return 503 and degraded status if database connection fails
    POST /api/auth/register
      ✓ should register a new student successfully
      ✓ should reject registration if email is already registered (duplicate)
    POST /api/auth/login
      ✓ should successfully log in with valid credentials
      ✓ should reject login when incorrect password is provided
    POST /api/complaints
      ✓ should allow an authenticated student to submit a valid complaint
      ✓ should reject complaint submission with missing or invalid fields
    GET /api/complaints/:id (Authorization & Tracking)
      ✓ should allow student owner to view their own complaint and tracking timeline
      ✓ should reject a student trying to access another student complaint (403 Forbidden)
    Admin Role-Based Protection and Actions
      ✓ should block non-admin student from accessing admin statistics (403 Forbidden)
      ✓ should allow administrator to update complaint status and add comments

Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
```

---

## 11. CI/CD Pipeline (GitHub Actions)

The CI/CD workflow defined in `.github/workflows/ci-cd.yml` automatically triggers on every `push` or `pull_request` to the `main` branch:

1. **Checkout Code**: Retrieves the repository source.
2. **Environment Setup**: Provisions Node.js 20 with npm caching.
3. **Automated Testing**: Executes `npm test` across all endpoint suites.
4. **Docker Image Build**: Builds and validates the production Docker image.
5. **Config Validation**: Checks Docker Compose orchestration syntax.

---

## 12. College Viva Questions & Answers

1. **Q: Why did you use JWT instead of standard cookie sessions?**  
   *A:* JWT is stateless and token-based. The server does not need to store session states in memory, making the API scalable across multiple Docker containers or server instances.

2. **Q: How does the application protect against SQL Injection?**  
   *A:* All database queries use MySQL prepared statements with parameterized placeholders (`?`). User inputs are treated strictly as data literals rather than executable SQL code.

3. **Q: Why use Nginx as a reverse proxy in front of Node.js?**  
   *A:* Nginx excels at handling static file serving, SSL termination, request buffering, and gzip compression. It shields the Node.js application process from direct public exposure and port conflicts.

4. **Q: What is the role of Docker Compose in this project?**  
   *A:* Docker Compose manages multi-container lifecycles. It sets up isolated bridge networks, manages persistent volumes for MySQL, and defines health-check dependencies so the backend waits until MySQL is fully initialized.

5. **Q: How is role-based access control (RBAC) enforced?**  
   *A:* We implement custom Express middleware (`authenticateToken` and `requireAdmin`). The middleware decodes the JWT and validates the `role` claim before granting access to administrative routes.

---

## 13. Screenshots Checklist for Project Report

When preparing your final college submission document, capture the following 8 screenshots:

1. **Homepage / Landing Page**: Full view of `index.html` showcasing the college theme, feature cards, and categories.
2. **Login Page**: Showing the demo quick-fill buttons and clean form.
3. **Student Dashboard**: Displaying submitted complaints, status badges, and metric cards.
4. **Lodge Grievance Form**: Showing category selection, validation counter, and successful submission notification with generated Complaint ID.
5. **Tracking Timeline**: Detailed view of `track-complaint.html` showing the 4-step progress stepper and activity history logs.
6. **Administrator Dashboard**: Showing the 4 KPI cards (Total, Pending, In Progress, Resolved) and complaints table.
7. **Admin Update Modal**: Showing the modal where status is updated to "Resolved" and administrative remarks are entered.
8. **Automated Tests / Terminal Output**: Showing all 12 Jest tests passing with green checkmarks (`npm test`).
# student-complain-system
# student-complain-system
