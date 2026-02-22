-- ============================================================
-- Placement ERP: Schema & Indexes Migration
-- ============================================================
-- Run this against your PostgreSQL database.
-- For NEW deployments, use the CREATE TABLE blocks.
-- For EXISTING deployments, use the ALTER TABLE blocks.
-- ============================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. JOBS TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Full CREATE (reference / new deployments)
CREATE TABLE IF NOT EXISTS jobs (
    job_id              SERIAL PRIMARY KEY,
    company_id          INTEGER NOT NULL REFERENCES companies(company_id),
    job_title           VARCHAR(200) NOT NULL,
    job_description     TEXT,
    job_type            VARCHAR(50),
    ctc_lpa             NUMERIC(10,2),
    stipend_per_month   NUMERIC(12,2),
    location            VARCHAR(200),
    interview_mode      VARCHAR(50),
    application_deadline DATE,
    drive_date          DATE,
    year_of_graduation  INTEGER NOT NULL,
    status              VARCHAR(20) DEFAULT 'DRAFT',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migration: add missing columns to existing jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS year_of_graduation INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'DRAFT';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. JOB_REQUIREMENTS TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS job_requirements (
    job_requirement_id  SERIAL PRIMARY KEY,
    job_id              INTEGER NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    tenth_percent       NUMERIC(5,2),
    twelfth_percent     NUMERIC(5,2),
    ug_cgpa             NUMERIC(4,2),
    pg_cgpa             NUMERIC(4,2),
    min_experience_yrs  NUMERIC(4,2),
    allowed_branches    TEXT[],
    skills_required     TEXT,
    additional_notes    TEXT,
    backlogs_allowed    INTEGER DEFAULT 0
);

-- Migration: add backlogs_allowed to existing table
ALTER TABLE job_requirements ADD COLUMN IF NOT EXISTS backlogs_allowed INTEGER DEFAULT 0;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. STUDENTS TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- NOTE: Student academic data (cgpa, backlogs) lives in
--       student_academics table in the current schema.
--       graduation_year maps to ug_year_of_passing.
--       backlogs maps to history_of_backs.

CREATE TABLE IF NOT EXISTS students (
    student_id              VARCHAR(50) PRIMARY KEY,
    first_name              VARCHAR(100),
    middle_name             VARCHAR(100),
    last_name               VARCHAR(100),
    full_name               VARCHAR(300),
    gender                  VARCHAR(10),
    dob                     DATE,
    email                   VARCHAR(200),
    alt_email               VARCHAR(200),
    college_email           VARCHAR(200),
    mobile                  VARCHAR(20),
    emergency_contact       VARCHAR(20),
    nationality             VARCHAR(50),
    placement_fee_status    VARCHAR(50),
    student_photo_path      TEXT,
    branch                  VARCHAR(100) DEFAULT 'Unknown',
    graduation_year         INTEGER,
    semester                INTEGER,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migration: add graduation_year and semester to existing students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS graduation_year INTEGER;
ALTER TABLE students ADD COLUMN IF NOT EXISTS semester INTEGER;

CREATE TABLE IF NOT EXISTS student_academics (
    student_id          VARCHAR(50) PRIMARY KEY REFERENCES students(student_id) ON DELETE CASCADE,
    tenth_percent       NUMERIC(5,2),
    tenth_year          INTEGER,
    tenth_board         VARCHAR(100),
    tenth_school        VARCHAR(200),
    twelfth_percent     NUMERIC(5,2),
    twelfth_year        INTEGER,
    twelfth_board       VARCHAR(100),
    twelfth_college     VARCHAR(200),
    diploma_percent     NUMERIC(5,2),
    diploma_year        INTEGER,
    diploma_college     VARCHAR(200),
    ug_cgpa             NUMERIC(4,2),
    ug_year_of_passing  INTEGER,
    pg_cgpa             NUMERIC(4,2),
    history_of_backs    INTEGER DEFAULT 0,
    updated_arrears     INTEGER DEFAULT 0,
    gap_years           INTEGER DEFAULT 0,
    cet_rank            INTEGER,
    comedk_rank         INTEGER,
    category            VARCHAR(50)
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. INDEXING STRATEGY
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- These indexes accelerate the eligibility query:
--   SELECT ... FROM students s
--   JOIN student_academics sa ON s.student_id = sa.student_id
--   WHERE sa.ug_year_of_passing = $1
--     AND sa.ug_cgpa >= $2
--     AND s.branch = ANY($3)
--     AND COALESCE(sa.history_of_backs, 0) <= $4;

-- Index on students.branch (used in WHERE + ANY)
CREATE INDEX IF NOT EXISTS idx_students_branch
    ON students (branch);

-- Index on students.graduation_year (eligibility filter)
CREATE INDEX IF NOT EXISTS idx_students_grad_year
    ON students (graduation_year);

-- Composite index on students for eligibility queries
CREATE INDEX IF NOT EXISTS idx_students_grad_year_branch
    ON students (graduation_year, branch);

-- Index on student_academics.ug_year_of_passing (graduation year filter)
CREATE INDEX IF NOT EXISTS idx_sa_ug_year_of_passing
    ON student_academics (ug_year_of_passing);

-- Index on student_academics.ug_cgpa (CGPA filter)
CREATE INDEX IF NOT EXISTS idx_sa_ug_cgpa
    ON student_academics (ug_cgpa);

-- Composite index for the eligibility query hot path
CREATE INDEX IF NOT EXISTS idx_sa_eligibility_composite
    ON student_academics (ug_year_of_passing, ug_cgpa, history_of_backs);

-- Index on jobs.year_of_graduation
CREATE INDEX IF NOT EXISTS idx_jobs_year_of_graduation
    ON jobs (year_of_graduation);

-- Index on jobs.status
CREATE INDEX IF NOT EXISTS idx_jobs_status
    ON jobs (status);

-- Index on job_requirements.job_id (FK lookup)
CREATE INDEX IF NOT EXISTS idx_jr_job_id
    ON job_requirements (job_id);
