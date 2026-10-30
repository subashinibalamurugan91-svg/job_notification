# Admin Module API Reference

This document outlines the REST endpoints implemented for administrative operations within the Student Placement Portal, including company criteria adjustments, student details retrieval, status progressions, resources uploading, and interview schedules.

---

## Base URL
*   `http://localhost:8081`

---

## 1. Company Management

### 1.1 List All Companies
*   **URL:** `/api/companies`
*   **Method:** `GET`
*   **Headers:** `Authorization: Bearer <token>`
*   **Response (200 OK):**
    ```json
    [
      {
        "companyId": 1,
        "companyName": "Google",
        "description": "Software engineering roles...",
        "eligibilityCgpa": 8.50,
        "eligibleDepartments": "Computer Science,Information Technology",
        "packageAmount": 35.5,
        "applicationDeadline": "2026-09-01",
        "driveDate": "2026-09-10",
        "active": true
      }
    ]
    ```

### 1.2 Add Company Drive
*   **URL:** `/api/admin/companies`
*   **Method:** `POST`
*   **Headers:**
    *   `Authorization: Bearer <token>`
    *   `Content-Type: application/json`
*   **Request Body:**
    ```json
    {
      "companyName": "Netflix",
      "description": "Streaming media technology roles.",
      "eligibilityCgpa": 8.00,
      "eligibleDepartments": "Computer Science",
      "packageAmount": 28.00,
      "applicationDeadline": "2026-09-15",
      "driveDate": "2026-09-25",
      "active": true
    }
    ```
*   **Response (201 Created):** Returns the created company JSON object.

### 1.3 Edit Company Details
*   **URL:** `/api/admin/companies/{id}`
*   **Method:** `PUT`
*   **Headers:** `Authorization: Bearer <token>`
*   **Request Body:** (Same format as POST)
*   **Response (200 OK):** Returns the updated company JSON object.

### 1.4 Delete Company Drive
*   **URL:** `/api/admin/companies/{id}`
*   **Method:** `DELETE`
*   **Headers:** `Authorization: Bearer <token>`
*   **Response (204 No Content):** Empty payload.

---

## 2. Student Tracking

### 2.1 View and Filter Student Profiles
Returns a list of registered students. Supports optional department filtering.

*   **URL:** `/api/admin/students`
*   **Method:** `GET`
*   **Headers:** `Authorization: Bearer <token>`
*   **Params:** `department` (optional, e.g. `Computer Science`)
*   **Response (200 OK):**
    ```json
    [
      {
        "studentId": 1,
        "regNo": "CS2023001",
        "name": "Amit Sharma",
        "email": "amit.sharma@student.edu",
        "department": "Computer Science",
        "cgpa": 9.20,
        "phone": "+919876543210"
      }
    ]
    ```

### 2.2 Get Specific Student
*   **URL:** `/api/admin/students/{id}`
*   **Method:** `GET`
*   **Headers:** `Authorization: Bearer <token>`
*   **Response (200 OK):** Returns student's profile DTO.

---

## 3. Application Workflow

### 3.1 List and Filter Applications
Returns all drives applied for by students. Supports optional companyId and status filtering.

*   **URL:** `/api/admin/applications`
*   **Method:** `GET`
*   **Headers:** `Authorization: Bearer <token>`
*   **Params:**
    *   `companyId` (optional, integer)
    *   `status` (optional, string)
*   **Response (200 OK):**
    ```json
    [
      {
        "applicationId": 1,
        "studentId": 1,
        "studentName": "Amit Sharma",
        "companyId": 1,
        "companyName": "Google",
        "appliedDate": "2026-08-10T12:00:00",
        "status": "APPLIED"
      }
    ]
    ```

### 3.2 Transition Application Status
Updates the interview/placement phase status. Automatically generates status history trails and registers internal student alert notifications.

*   **URL:** `/api/admin/applications/{id}/status`
*   **Method:** `PUT`
*   **Headers:**
    *   `Authorization: Bearer <token>`
    *   `Content-Type: application/json`
*   **Request Body:**
    ```json
    {
      "status": "SHORTLISTED",
      "remarks": "Cleared initial resume screening."
    }
    ```
*   **Response (200 OK):** Returns the updated application DTO.

---

## 4. Interview Scheduler

### 4.1 List All Interview Rounds
*   **URL:** `/api/admin/interviews`
*   **Method:** `GET`
*   **Headers:** `Authorization: Bearer <token>`

### 4.2 Create Interview Schedule
*   **URL:** `/api/admin/interviews`
*   **Method:** `POST`
*   **Headers:** `Authorization: Bearer <token>`
*   **Request Body:**
    ```json
    {
      "companyId": 1,
      "roundName": "Technical Round 1",
      "interviewDate": "2026-09-12T10:00:00",
      "venue": "Virtual",
      "meetingLink": "https://meet.google.com/abc-defg-hij",
      "instructions": "Be ready 15 mins prior with a working webcam."
    }
    ```
*   **Response (201 Created):** Returns the created interview schedule object.

---

## 5. Study Guides & Placement References (Reference Library)

### 5.1 Upload Reference File
Saves a reference link to study materials and placement preparation guides. Requires file form part of type `application/pdf` and less than 5MB.

*   **URL:** `/api/admin/references` *(Legacy alias: `/api/admin/resources`)*
*   **Method:** `POST`
*   **Headers:**
    *   `Authorization: Bearer <token>`
    *   `Content-Type: multipart/form-data`
*   **Form Data Params:**
    *   `title` (string)
    *   `description` (string)
    *   `companyId` (integer, optional)
    *   `file` (binary PDF file)
*   **Response (201 Created):** Returns Reference DTO containing reference path `fileUrl`, `referenceId`, `title`, and `referenceType`.

### 5.2 Delete Reference File
Deletes a reference material entry and its physical PDF document from the system.

*   **URL:** `/api/admin/references/{id}` *(Legacy alias: `/api/admin/resources/{id}`)*
*   **Method:** `DELETE`
*   **Headers:** `Authorization: Bearer <token>`
*   **Response (204 No Content):** Empty payload.

### 5.3 Fetch All References
Retrieves all uploaded learning and recruitment references for students and administrators.

*   **URL:** `/api/references` *(Legacy alias: `/api/resources`)*
*   **Method:** `GET`
*   **Headers:** `Authorization: Bearer <token>`
*   **Response (200 OK):** Array of Reference objects (`referenceId`, `title`, `description`, `companyName`, `referenceType`, `fileUrl`, `uploadedAt`).

### 5.4 Download Reference Document
Streams the binary PDF reference file for in-browser preview or download.

*   **URL:** `/api/references/download/{id}` *(Legacy alias: `/api/resources/download/{id}`)*
*   **Method:** `GET`
*   **Params:** `token` (JWT query parameter when streaming inline or via direct window opening)
*   **Response (200 OK):** Binary PDF stream (`Content-Type: application/pdf`).
