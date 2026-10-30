# API Documentation

This document contains the specifications for the backend authentication endpoints of the Student Placement Progress Monitoring and Analytics System.

## Base URL
*   `http://localhost:8081`

---

## 1. Authentication Endpoints

### 1.1 Register Student
Registers a new student profile in the system.

*   **URL:** `/api/auth/register`
*   **Method:** `POST`
*   **Headers:** `Content-Type: application/json`
*   **Request Body:**
    ```json
    {
      "regNo": "CS2023999",
      "name": "Test Student",
      "email": "test@student.edu",
      "password": "password123",
      "department": "Computer Science",
      "cgpa": 8.80,
      "phone": "+919999999999"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "studentId": 12,
      "regNo": "CS2023999",
      "name": "Test Student",
      "email": "test@student.edu",
      "passwordHash": "$2a$10$...",
      "department": "Computer Science",
      "cgpa": 8.80,
      "phone": "+919999999999",
      "createdAt": "2026-08-10T19:23:59.000000",
      "updatedAt": "2026-08-10T19:23:59.000000"
    }
    ```

---

### 1.2 User Login
Authenticates Student or Admin credentials and returns a valid JWT token.

*   **URL:** `/api/auth/login`
*   **Method:** `POST`
*   **Headers:** `Content-Type: application/json`
*   **Request Body:**
    ```json
    {
      "email": "test@student.edu",
      "password": "password123",
      "role": "STUDENT"
    }
    ```
    *Note: `role` must be either `STUDENT` or `ADMIN`.*
*   **Response (200 OK):**
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiU1...",
      "email": "test@student.edu",
      "role": "STUDENT",
      "id": 12,
      "name": "Test Student"
    }
    ```
*   **Error Response (500 Internal Server Error / Bad Credentials):**
    ```json
    {
      "status": 500,
      "message": "Bad credentials",
      "details": "uri=/api/auth/login",
      "timestamp": "2026-08-10T19:12:15.6277244"
    }
    ```

---

## 2. Reference & Preparation Material Endpoints

### 2.1 Fetch All References
Retrieves all uploaded study guides, interview blueprints, and practice test materials.

*   **URL:** `/api/references` *(Alias: `/api/resources`)*
*   **Method:** `GET`
*   **Headers:** `Authorization: Bearer <token>`
*   **Response (200 OK):**
    ```json
    [
      {
        "referenceId": 1,
        "title": "General Aptitude Preparation Guide",
        "description": "Comprehensive practice questions for quantitative aptitude and logical reasoning.",
        "companyId": null,
        "companyName": null,
        "referenceType": "PDF",
        "fileUrl": "uploads/resources/General_Aptitude_Guide.pdf",
        "fileName": "General_Aptitude_Guide.pdf",
        "uploadedAt": "2026-08-15T09:00:00"
      }
    ]
    ```

### 2.2 Download Reference Document
Streams the binary PDF reference file for in-browser preview or download.

*   **URL:** `/api/references/download/{id}` *(Alias: `/api/resources/download/{id}`)*
*   **Method:** `GET`
*   **Params:** `token` (JWT query param for file preview)
*   **Response (200 OK):** Binary PDF Stream
