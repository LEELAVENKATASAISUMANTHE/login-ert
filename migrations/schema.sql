-- ============================================================================
-- DATABASE SCHEMA  —  Generated from db/*.db.js source files
-- PostgreSQL
-- ============================================================================

-- =========================
-- 1. ROLES
-- =========================
CREATE TABLE IF NOT EXISTS roles (
    role_id        SERIAL PRIMARY KEY,
    role_name      VARCHAR(50)  NOT NULL UNIQUE,
    role_description TEXT,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- =========================
-- 2. PERMISSIONS
-- =========================
CREATE TABLE IF NOT EXISTS permissions (
    permission_id   SERIAL PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL UNIQUE,
    module          VARCHAR(100),
    description     TEXT
);

-- =========================
-- 3. ROLE_PERMISSIONS  (many-to-many)
-- =========================
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id       INTEGER NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- =========================
-- 4. USERS
-- =========================
CREATE TABLE IF NOT EXISTS users (
    user_id             SERIAL PRIMARY KEY,
    username            VARCHAR(100) NOT NULL UNIQUE,
    password_hash       TEXT         NOT NULL,
    email               VARCHAR(255) UNIQUE,
    role_id             INTEGER      REFERENCES roles(role_id) ON DELETE SET NULL,
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    is_locked           BOOLEAN      NOT NULL DEFAULT FALSE,
    failed_attempts     INTEGER      NOT NULL DEFAULT 0,
    lock_until          TIMESTAMP,
    must_change_password BOOLEAN     NOT NULL DEFAULT FALSE,
    token_version       INTEGER      NOT NULL DEFAULT 0,
    last_login_at       TIMESTAMP,
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- =========================
-- 5. USER_SESSIONS
-- =========================
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id         UUID PRIMARY KEY,
    user_id            INTEGER   NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    refresh_token_hash TEXT      NOT NULL,
    ip_address         INET,
    user_agent         TEXT,
    created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    last_activity      TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at         TIMESTAMP NOT NULL
);

-- =========================
-- 6. STUDENTS
-- =========================
CREATE TABLE IF NOT EXISTS students (
    student_id         VARCHAR(50) PRIMARY KEY,
    first_name         VARCHAR(100),
    middle_name        VARCHAR(100),
    last_name          VARCHAR(100),
    full_name          VARCHAR(255),
    gender             VARCHAR(20),
    dob                DATE,
    email              VARCHAR(255),
    alt_email          VARCHAR(255),
    college_email      VARCHAR(255),
    mobile             VARCHAR(20),
    emergency_contact  VARCHAR(20),
    nationality        VARCHAR(50),
    placement_fee_status VARCHAR(50),
    student_photo_path TEXT,
    branch             VARCHAR(50) DEFAULT 'Unknown',
    graduation_year    INTEGER,
    semester           INTEGER,
    created_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- 7. STUDENT_USERS  (student ↔ user link)
-- =========================
CREATE TABLE IF NOT EXISTS student_users (
    student_id VARCHAR(50) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    user_id    INTEGER     NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    PRIMARY KEY (student_id),
    UNIQUE (user_id)
);

-- =========================
-- 8. STUDENT_ADDRESSES
-- =========================
CREATE TABLE IF NOT EXISTS student_addresses (
    address_id        SERIAL PRIMARY KEY,
    student_id        VARCHAR(50) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    permanent_address TEXT,
    permanent_city    VARCHAR(100),
    permanent_state   VARCHAR(100),
    permanent_pin     VARCHAR(20),
    permanent_contact VARCHAR(20),
    current_address   TEXT,
    current_city      VARCHAR(100),
    current_state     VARCHAR(100),
    current_pin       VARCHAR(20)
);

-- =========================
-- 9. STUDENT_ACADEMICS
-- =========================
CREATE TABLE IF NOT EXISTS student_academics (
    student_id       VARCHAR(50) PRIMARY KEY REFERENCES students(student_id) ON DELETE CASCADE,
    tenth_percent    NUMERIC(5,2),
    tenth_year       INTEGER,
    tenth_board      VARCHAR(100),
    tenth_school     VARCHAR(255),
    twelfth_percent  NUMERIC(5,2),
    twelfth_year     INTEGER,
    twelfth_board    VARCHAR(100),
    twelfth_college  VARCHAR(255),
    diploma_percent  NUMERIC(5,2),
    diploma_year     INTEGER,
    diploma_college  VARCHAR(255),
    ug_cgpa          NUMERIC(4,2),
    history_of_backs INTEGER,
    updated_arrears  INTEGER,
    gap_years        INTEGER,
    cet_rank         INTEGER,
    comedk_rank      INTEGER,
    category         VARCHAR(50)
);

-- =========================
-- 10. STUDENT_FAMILY
-- =========================
CREATE TABLE IF NOT EXISTS student_family (
    student_id        VARCHAR(50) PRIMARY KEY REFERENCES students(student_id) ON DELETE CASCADE,
    father_name       VARCHAR(255),
    father_occupation VARCHAR(255),
    father_phone      VARCHAR(20),
    mother_name       VARCHAR(255),
    mother_occupation VARCHAR(255),
    mother_phone      VARCHAR(20),
    blood_group       VARCHAR(10)
);

-- =========================
-- 11. STUDENT_LANGUAGES
-- =========================
CREATE TABLE IF NOT EXISTS student_languages (
    lang_id    SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    language   VARCHAR(50) NOT NULL,
    level      VARCHAR(10) NOT NULL,
    UNIQUE (student_id, language)
);

-- =========================
-- 12. STUDENT_INTERNSHIPS
-- =========================
CREATE TABLE IF NOT EXISTS student_internships (
    internship_id   SERIAL PRIMARY KEY,
    student_id      VARCHAR(50) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    organization    VARCHAR(255),
    skills_acquired TEXT,
    duration        VARCHAR(100),
    start_date      DATE,
    end_date        DATE,
    description     TEXT,
    stipend         NUMERIC(10,2)
);

-- =========================
-- 13. STUDENT_PROJECTS
-- =========================
CREATE TABLE IF NOT EXISTS student_projects (
    project_id  SERIAL PRIMARY KEY,
    student_id  VARCHAR(50) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    title       VARCHAR(255),
    description TEXT,
    tools_used  TEXT,
    repo_link   TEXT
);

-- =========================
-- 14. STUDENT_CERTIFICATIONS
-- =========================
CREATE TABLE IF NOT EXISTS student_certifications (
    cert_id          SERIAL PRIMARY KEY,
    student_id       VARCHAR(50) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    skill_name       VARCHAR(255),
    duration         VARCHAR(100),
    vendor           VARCHAR(255),
    certificate_file TEXT
);

-- =========================
-- 15. STUDENT_DOCUMENTS
-- =========================
CREATE TABLE IF NOT EXISTS student_documents (
    doc_id        SERIAL PRIMARY KEY,
    student_id    VARCHAR(50) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    document_type VARCHAR(100),
    file_path     TEXT,
    uploaded_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- 16. COMPANIES
-- =========================
CREATE TABLE IF NOT EXISTS companies (
    company_id     SERIAL PRIMARY KEY,
    company_name   VARCHAR(255) NOT NULL UNIQUE,
    company_type   VARCHAR(100),
    website        TEXT,
    contact_person VARCHAR(255),
    contact_email  VARCHAR(255),
    contact_phone  VARCHAR(20),
    company_logo   TEXT,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- 17. JOBS
-- =========================
CREATE TABLE IF NOT EXISTS jobs (
    job_id               SERIAL PRIMARY KEY,
    company_id           INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    job_title            VARCHAR(255) NOT NULL,
    job_description      TEXT,
    job_type             VARCHAR(50),
    ctc_lpa              NUMERIC(10,2),
    stipend_per_month    NUMERIC(10,2),
    location             VARCHAR(255),
    interview_mode       VARCHAR(50),
    application_deadline DATE,
    drive_date           DATE,
    year_of_graduation   INTEGER,
    created_at           TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- 18. JOB_REQUIREMENTS
-- =========================
CREATE TABLE IF NOT EXISTS job_requirements (
    job_requirement_id SERIAL PRIMARY KEY,
    job_id             INTEGER NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    tenth_percent      NUMERIC(5,2),
    twelfth_percent    NUMERIC(5,2),
    ug_cgpa            NUMERIC(4,2),
    min_experience_yrs INTEGER,
    allowed_branches   TEXT[],
    skills_required    TEXT,
    additional_notes   TEXT,
    backlogs_allowed   INTEGER
);

-- =========================
-- 19. STUDENT_OFFERS
-- =========================
CREATE TABLE IF NOT EXISTS student_offers (
    offer_id              SERIAL PRIMARY KEY,
    student_id            VARCHAR(50) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    job_id                INTEGER     REFERENCES jobs(job_id) ON DELETE SET NULL,
    offered_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
    is_primary_offer      BOOLEAN     NOT NULL DEFAULT FALSE,
    is_pbc                BOOLEAN     NOT NULL DEFAULT FALSE,
    is_internship         BOOLEAN     NOT NULL DEFAULT FALSE,
    is_offcampus          BOOLEAN     NOT NULL DEFAULT FALSE,
    offcampus_company_name VARCHAR(255),
    offcampus_job_title    VARCHAR(255),
    offcampus_location     VARCHAR(255),
    offer_ctc             NUMERIC(10,2),
    offer_stipend         NUMERIC(10,2),
    remarks               TEXT
);

-- ============================================================================
-- INDEXES  (recommended for common query patterns found in the codebase)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email            ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role_id          ON users (role_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id  ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires  ON user_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_student_users_user_id  ON student_users (user_id);
CREATE INDEX IF NOT EXISTS idx_student_addresses_sid  ON student_addresses (student_id);
CREATE INDEX IF NOT EXISTS idx_student_languages_sid  ON student_languages (student_id);
CREATE INDEX IF NOT EXISTS idx_student_internships_sid ON student_internships (student_id);
CREATE INDEX IF NOT EXISTS idx_student_projects_sid   ON student_projects (student_id);
CREATE INDEX IF NOT EXISTS idx_student_certs_sid      ON student_certifications (student_id);
CREATE INDEX IF NOT EXISTS idx_student_docs_sid       ON student_documents (student_id);
CREATE INDEX IF NOT EXISTS idx_student_offers_sid     ON student_offers (student_id);
CREATE INDEX IF NOT EXISTS idx_student_offers_jid     ON student_offers (job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id        ON jobs (company_id);
CREATE INDEX IF NOT EXISTS idx_job_requirements_jid   ON job_requirements (job_id);
