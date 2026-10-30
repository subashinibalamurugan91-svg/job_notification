# Architecture & System Design Documentation: Reference Module

This document outlines the architecture, data models, diagrams, and operational specifications for the **Reference** module within the Campus Recruitment System, reflecting the project-wide transition from *Resource* to *Reference*.

---

## 1. Module Descriptions

### 1.1 Student Module: Learning References
*   **Purpose**: Provides candidates with direct access to placement study guides, aptitude question banks, interview blueprint manuals, syllabus blueprints, and company-specific preparation guides.
*   **Features**:
    *   **Reference Library**: Browsable directory of all published preparation materials.
    *   **Categorization & Filters**: Instant multi-criteria filtering by company name or "General / Core Topics".
    *   **Live Search**: Real-time searching across reference titles and topic descriptions.
    *   **Document Preview**: Secure JWT-authenticated inline PDF viewer.
    *   **Reference Details**: Clear visibility of upload timestamps, file types (`PDF`), and associated company tags.

### 1.2 Admin Module: Manage References
*   **Purpose**: Empowers Training and Placement Officers (TPOs) and administrators to curate, upload, categorize, and maintain preparation documents.
*   **Features**:
    *   **Manage References Dashboard**: Centralized management portal listing all documents.
    *   **Reference Upload**: Multi-part upload handler enforcing PDF file validation (max 5 MB) and metadata entry (title, description, optional company affiliation).
    *   **Reference Deletion**: Safe deletion of document metadata from the database and physical removal of files from server storage.
    *   **Audit Logging**: Every reference creation and deletion action is captured in system audit trails.

---

## 2. Database Design (`references` Table)

In MySQL, `REFERENCES` is an SQL reserved keyword; therefore, the table name is safely enclosed with backticks (`` `references` ``) in SQL migrations and JPA mappings (`@Table(name = "\`references\`")`).

### Schema Definition
```sql
CREATE TABLE IF NOT EXISTS `references` (
    reference_id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    reference_type VARCHAR(100) DEFAULT 'PDF',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_references_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE SET NULL
);
```

### Backward Compatibility View
```sql
CREATE OR REPLACE VIEW `resources` AS SELECT * FROM `references`;
```

---

## 3. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    COMPANIES ||--o{ REFERENCES : "supplies preparation material for"
    COMPANIES ||--o{ APPLICATIONS : "receives"
    COMPANIES ||--o{ INTERVIEWS : "conducts"
    STUDENTS ||--o{ APPLICATIONS : "submits"
    STUDENTS ||--o{ NOTIFICATIONS : "receives"
    ADMINS ||--o{ AUDIT_LOGS : "performs actions recorded in"

    REFERENCES {
        int reference_id PK
        int company_id FK "Nullable"
        varchar title "NOT NULL"
        text description
        varchar file_url "NOT NULL"
        varchar file_name
        varchar reference_type "Default 'PDF'"
        timestamp uploaded_at
    }

    COMPANIES {
        int company_id PK
        varchar company_name
        decimal eligibility_cgpa
        text eligible_departments
        text required_skills
        decimal package_amount
        date drive_date
        boolean active
    }

    STUDENTS {
        int student_id PK
        varchar reg_no UK
        varchar name
        varchar email UK
        decimal cgpa
        varchar department
    }
```

---

## 4. Data Flow Diagram (DFD)

### 4.1 Level 0: Context Diagram
```mermaid
graph TD
    Admin[Administrator / TPO] -->|Uploads PDF & Metadata| System[Campus Recruitment System]
    System -->|Logs action| AuditLogs[(Audit Log Store)]
    System -->|Stores document metadata| DB[(`references` Table)]
    System -->|Stores binary PDF| Storage[(File Storage)]
    
    Student[Student Candidate] -->|Requests Reference Catalog| System
    DB -->|Fetches references| System
    System -->|Streams PDF Document| Student
```

### 4.2 Level 1: Reference Module Data Flow
```mermaid
flowchart TD
    A[Admin User] -->|1. Submit Multipart Form| P1[1.0 Validate & Sanitize Upload]
    P1 -->|Check file type & size <= 5MB| P2[2.0 Save Binary File]
    P2 -->|Write to disk| FS[(uploads/resources/)]
    P1 -->|Construct Reference Entity| P3[3.0 Persist Reference Record]
    P3 -->|INSERT INTO `references`| DB[(`references` Table)]
    P3 -->|Log CREATE_REFERENCE| P4[4.0 Audit Logger]
    P4 -->|Write log| AL[(Audit Logs)]

    S[Student User] -->|5. View References Page| P5[5.0 Reference Service Query]
    P5 -->|SELECT * FROM `references`| DB
    P5 -->|JSON DTO List| S
    S -->|6. Click View PDF Reference| P6[6.0 Document Streaming Service]
    P6 -->|Fetch stream with JWT token| FS
    FS -->|Binary stream response| S
```

---

## 5. Use Case Diagram

```mermaid
graph TD
    Admin((Placement Admin / TPO))
    Student((Student Candidate))

    subgraph Reference Management System
        UC1[Browse Learning References]
        UC2[Filter References by Category]
        UC3[Search References by Keyword]
        UC4[Preview & Download PDF Reference]
        UC5[Upload New Study Reference]
        UC6[Assign Reference to Company Drive]
        UC7[Delete Obsolete Reference]
        UC8[Track Reference Audit Logs]
    end

    Student --> UC1
    Student --> UC2
    Student --> UC3
    Student --> UC4

    Admin --> UC1
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
```

---

## 6. Activity Diagram: Reference Upload & Retrieval

```mermaid
stateDiagram-v2
    [*] --> SelectUploadDocument: Admin initiates upload

    state "Admin Upload Flow" as AdminFlow {
        SelectUploadDocument --> ValidateForm: Enters title, description, category
        ValidateForm --> ValidateFile: Attaches PDF file
        
        state "Validation Rules" as Validation {
            ValidateFile --> FileError: Not PDF or > 5MB
            FileError --> ValidateFile: Reselect valid file
            ValidateFile --> WriteStorage: Valid PDF (<= 5MB)
        }
        
        WriteStorage --> InsertDatabase: File saved to disk
        InsertDatabase --> CreateAuditLog: Record inserted into `references`
        CreateAuditLog --> UploadSuccess: Action logged in `audit_logs`
    }

    UploadSuccess --> StudentAccessFlow: Reference available in catalog

    state "Student Retrieval Flow" as StudentFlow {
        StudentAccessFlow --> BrowseCatalog: Student navigates to /student/references
        BrowseCatalog --> ApplyFilters: Filters by company or keyword
        ApplyFilters --> ClickViewDocument: Clicks View PDF Reference
        ClickViewDocument --> StreamPDF: GET /api/references/download/{id}
        StreamPDF --> PreviewInBrowser: In-browser PDF renderer displays manual
    }

    PreviewInBrowser --> [*]
```
