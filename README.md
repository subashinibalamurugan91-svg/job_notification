# Student Placement Progress Monitoring and Analytics System

A centralized university platform designed to monitor the complete placement lifecycle of students, coordinate recruitment drives, schedule interviews, host study materials, broadcast announcements, and generate placement analytics.

---

## 🏗️ Repository Architecture

```
.
├── BRAIN.md                         # 🧠 Authoritative Source of Truth
├── README.md                        # Project setup and run instructions
├── database/
│   ├── schema.sql                   # MySQL schema definition
│   └── sample_data.sql              # Seed data populating student and drive details
├── docs/
│   └── Project-Brain.pdf            # 📕 Product requirement document
├── prompts/
│   └── master-build-prompt.md       # 🤖 Master build instructions
├── backend/                         # Java Spring Boot 3 REST API
└── frontend/                        # React.js SPA (Vite + Bootstrap 5 + Recharts)
```

---

## 🚀 Quick Start Setup & Launch

### 1. Database Setup
Restore the SQL schema and data seed to your local MySQL instance:
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS placement_db;"

# Initialize schema
mysql -u root -p placement_db < database/schema.sql

# Seed demo dataset
mysql -u root -p placement_db < database/sample_data.sql
```

### 2. Run Backend REST API (Port 8080)
Configure database credentials in `backend/src/main/resources/application.properties` if different from default (`root`/`root`), then start:
```bash
cd backend
mvn spring-boot:run
```

### 3. Run Frontend Dev Server (Port 5173)
Start the Vite development web server:
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Demo Access Credentials

The database has been seeded with default accounts:

*   **TPO Coordinator (Admin role)**:
    *   *Email*: `admin@placement.edu`
    *   *Password*: `admin123`
*   **Amit Sharma (Student role - CGPA 9.20)**:
    *   *Email*: `amit.sharma@student.edu`
    *   *Password*: `password123`
*   **Priya Patel (Student role - CGPA 8.50)**:
    *   *Email*: `priya.patel@student.edu`
    *   *Password*: `password123`
