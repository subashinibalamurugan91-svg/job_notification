# MASTER BUILD PROMPT
# Student Placement Progress Monitoring and Analytics System

You are the lead full-stack engineer for this project.

IMPORTANT:
Before writing code, read:
1. `/BRAIN.md`
2. `/docs/Project-Brain.pdf`
3. `/prompts/master-build-prompt.md`

`BRAIN.md` is the authoritative project specification.

## Mission

Build the Student Placement Progress Monitoring and Analytics System as a complete, working React + Spring Boot + MySQL application.

Do not create a superficial UI prototype. Implement real frontend-backend-database integration.

## Build Rules

- Follow BRAIN.md exactly.
- Use clean layered Spring Boot architecture.
- Use DTOs, services, repositories, controllers, validation, exception handling and security.
- Use JWT authentication and role-based authorization.
- Use MySQL with proper relationships and constraints.
- Use React Router for protected navigation.
- Use Axios service modules for API communication.
- Do not put business rules only in React.
- Backend is the authority for eligibility, application rules and status transitions.
- Never hard-code secrets.
- Use environment variables/configuration.
- Do not implement future AI modules during the initial build.
- Do not introduce unnecessary technologies.
- Preserve working code when extending the project.

## Required Build Order

### STEP 1
Create the complete repository structure described in BRAIN.md.

### STEP 2
Create MySQL schema and realistic demo seed data.

### STEP 3
Create Spring Boot backend:
- entities
- enums
- repositories
- DTOs
- services
- controllers
- validation
- global exception handling
- JWT security
- role authorization
- CORS
- CSV reporting

### STEP 4
Create React frontend:
- authentication
- protected routes
- layouts
- student pages
- admin pages
- API services
- forms
- tables
- dashboards
- charts
- notifications
- status tracking

### STEP 5
Integrate frontend and backend.

### STEP 6
Test every major workflow.

## Critical Workflows

### Student workflow
Register -> Login -> Profile -> View Eligible Companies -> Apply -> Track Application -> View Round Progress -> View Interview Schedule -> Access Resources -> Read Notifications

### Admin workflow
Login -> Dashboard -> Add Company -> Define Eligibility -> View Applications -> Shortlist -> Schedule Round -> Update Round Result -> Select/Reject -> View Analytics -> Export CSV

## Required UX

Student dashboard should clearly show:
- Application count
- Active applications
- Upcoming interviews
- Selected count
- Recent notifications

Admin dashboard should clearly show:
- Total students
- Companies
- Applications
- Selected
- Rejected
- Placement percentage
- Company-wise chart
- Department-wise chart
- Recent activity

Use professional academic placement-cell styling. Keep it responsive and easy to demonstrate.

## Status Tracking

Use only:
ELIGIBLE
APPLIED
SHORTLISTED
APTITUDE_CLEARED
TECHNICAL_CLEARED
HR_CLEARED
SELECTED
REJECTED

Display the journey visually as a progress tracker/timeline.

## API Quality

- RESTful endpoints
- Correct HTTP status codes
- Consistent JSON response/error format
- Validation
- Pagination/filtering where useful
- No entity leakage
- Authorization on every protected admin operation

## Final Verification

Before declaring completion:
1. Run backend build.
2. Run frontend build.
3. Verify database connection.
4. Test authentication.
5. Test student application flow.
6. Test admin management flow.
7. Test status history.
8. Test interview schedule.
9. Test resources.
10. Test notifications.
11. Test analytics.
12. Test CSV downloads.
13. Fix build/runtime errors.
14. Update README with exact setup commands.

At the end provide:
- implemented modules
- database setup
- backend run command
- frontend run command
- demo credentials (only if seeded)
- API summary
- known limitations
- next recommended phase

Do not claim a feature is implemented unless it is actually implemented and tested.
