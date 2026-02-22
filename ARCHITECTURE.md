# Placement ERP — Architecture Documentation

## System Overview

The Placement ERP is a microservice-oriented backend system built to manage college placement operations — including student profiles, company management, job postings, eligibility checking, applications, and event-driven notifications.

**Tech Stack:**
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** PostgreSQL (via `node-postgres` / `pg`)
- **Event Streaming:** Redpanda (Kafka-compatible)
- **Logging:** Winston (structured JSON logging via Loki)
- **Containerization:** Docker + Docker Compose

---

## Folder Structure

```
├── controller/              # Express route handlers (validation + orchestration)
│   ├── jobs.controller.js
│   ├── job_requirements.controller.js
│   ├── applications.controller.js
│   ├── companies.controller.js
│   ├── student.controller.js
│   ├── student_academics.controller.js
│   ├── student_addresses.controller.js
│   ├── student_certifications.controller.js
│   ├── student_documents.controller.js
│   ├── student_family.controller.js
│   ├── student_internships.controller.js
│   ├── student_languages.controller.js
│   ├── student_offers.controller.js
│   ├── student_projects.controller.js
│   ├── student_report.controller.js
│   ├── student_users.controller.js
│   ├── users.controller.js
│   ├── roles.controller.js
│   ├── permission.controller.js
│   └── role_permissions.controller.js
│
├── db/                      # Repository / data-access layer (SQL queries)
│   ├── connection.js        # PostgreSQL connection pool
│   ├── jobs.db.js
│   ├── job_requirements.db.js
│   ├── applications.db.js   # Includes eligibility checking logic
│   ├── companies.db.js
│   ├── student.db.js
│   ├── student_academics.db.js
│   ├── student_addresses.db.js
│   ├── student_certifications.db.js
│   ├── student_documents.db.js
│   ├── student_family.db.js
│   ├── student_internships.db.js
│   ├── student_languages.db.js
│   ├── student_offers.db.js
│   ├── student_projects.db.js
│   ├── student_report.db.js
│   ├── student_users.db.js
│   ├── users.db.js
│   ├── role.db.js
│   ├── permission.db.js
│   └── role_permissions.db.js
│
├── routes/                  # Express route definitions
│   ├── jobs.route.js
│   ├── job_requirements.route.js
│   ├── applications.route.js
│   ├── companies.route.js
│   ├── student.route.js
│   └── ...                  # (one per resource)
│
├── services/
│   └── events/              # Kafka event publishers
│       ├── jobReady.publisher.js
│       └── jobEligibility.publisher.js
│
├── middleware/
│   ├── authWithRefresh.js   # JWT auth middleware with token refresh
│   └── cookieParser.js      # Cookie parsing middleware
│
├── utils/
│   ├── app.js               # Express app setup (middleware, routes, error handling)
│   ├── kafka.js             # Kafka client, producer, TOPICS, publishEvent
│   ├── logger.js            # Winston logger (console + Loki transport)
│   ├── jwt.js               # JWT token utilities
│   ├── cloudinary.js        # Cloudinary file upload config
│   ├── multer.js            # File upload middleware
│   └── excelParser.js       # Excel file parsing for bulk imports
│
├── sql/
│   └── 001_schema_and_indexes.sql  # Schema creation + migration + indexes
│
├── index.js                 # Server entry point
├── package.json
├── Dockerfile
├── docker-compose.yml
└── .dockerignore
```

---

## Database Schema

### ER Diagram (Text-Based)

```
┌──────────────┐       ┌──────────────────┐       ┌────────────────────┐
│   companies  │       │      jobs        │       │  job_requirements  │
├──────────────┤       ├──────────────────┤       ├────────────────────┤
│ company_id PK│◄──────│ company_id FK    │       │ job_requirement_id │
│ company_name │       │ job_id PK        │──────►│ job_id FK (CASCADE)│
│ company_type │       │ job_title        │       │ tenth_percent      │
│ website      │       │ job_description  │       │ twelfth_percent    │
│ contact_*    │       │ job_type         │       │ ug_cgpa            │
│ company_logo │       │ ctc_lpa          │       │ pg_cgpa            │
│ created_at   │       │ stipend_per_month│       │ min_experience_yrs │
└──────────────┘       │ location         │       │ allowed_branches[] │
                       │ interview_mode   │       │ skills_required    │
                       │ application_dead │       │ backlogs_allowed   │
                       │ drive_date       │       │ additional_notes   │
                       │ year_of_graduation│      └────────────────────┘
                       │ status           │
                       │ created_at       │
                       └────────┬─────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
              ┌─────┴──────┐        ┌───────┴────────┐
              │applications│        │ student_offers  │
              ├────────────┤        ├────────────────┤
              │app_id PK   │        │ offer_id PK    │
              │student_id  │        │ student_id FK  │
              │job_id FK   │        │ job_id FK      │
              │status      │        │ is_primary     │
              │eligibility │        │ is_offcampus   │
              │checks      │        │ offer_ctc      │
              └─────┬──────┘        └───────┬────────┘
                    │                       │
              ┌─────┴───────────────────────┴────┐
              │            students               │
              ├──────────────────────────────────┤
              │ student_id PK (VARCHAR)          │
              │ first_name, last_name, full_name │
              │ gender, dob, email, mobile       │
              │ branch                           │
              │ graduation_year                  │
              │ semester                         │
              │ nationality, placement_fee_status│
              └──────────────┬───────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────┴──────────┐ ┌──────┴───────────┐ ┌──────┴──────────┐
│student_academics │ │ student_family   │ │student_addresses│
├──────────────────┤ ├──────────────────┤ ├─────────────────┤
│student_id PK/FK  │ │student_id FK     │ │address_id PK    │
│tenth/twelfth_%   │ │father/mother_*   │ │student_id FK    │
│ug_cgpa, pg_cgpa  │ │blood_group       │ │permanent_*      │
│ug_year_of_passing│ └──────────────────┘ │current_*        │
│history_of_backs  │                      └─────────────────┘
│category          │
└──────────────────┘
        │
        ├── student_certifications (cert_id, student_id, skill_name, vendor)
        ├── student_documents     (doc_id, student_id, document_type, file_path)
        ├── student_internships   (internship_id, student_id, organization, skills)
        ├── student_languages     (lang_id, student_id, language, level)
        └── student_projects      (project_id, student_id, title, tools_used)

┌──────────┐     ┌──────────────────┐     ┌──────────────┐
│  roles   │     │ role_permissions │     │ permissions  │
├──────────┤     ├──────────────────┤     ├──────────────┤
│role_id PK│◄────│ role_id FK       │     │permission_id │
│role_name │     │ permission_id FK │────►│perm_name     │
└────┬─────┘     └──────────────────┘     │module        │
     │                                    └──────────────┘
     │
┌────┴─────┐     ┌───────────────┐
│  users   │     │ student_users │
├──────────┤     ├───────────────┤
│user_id PK│◄────│ user_id FK    │
│username  │     │ student_id FK │────► students.student_id
│role_id FK│     └───────────────┘
│email     │
└──────────┘
```

### Table Relationships

| Parent Table | Child Table | FK Column | On Delete |
|---|---|---|---|
| companies | jobs | company_id | — |
| jobs | job_requirements | job_id | CASCADE |
| jobs | applications | job_id | — |
| jobs | student_offers | job_id | — |
| students | student_academics | student_id | CASCADE |
| students | student_addresses | student_id | — |
| students | student_family | student_id | — |
| students | student_certifications | student_id | — |
| students | student_documents | student_id | — |
| students | student_internships | student_id | — |
| students | student_languages | student_id | — |
| students | student_projects | student_id | — |
| students | applications | student_id | — |
| students | student_offers | student_id | — |
| roles | users | role_id | — |
| users | student_users | user_id | — |
| students | student_users | student_id | — |
| roles | role_permissions | role_id | — |
| permissions | role_permissions | permission_id | — |

---

## Indexing Strategy

Indexes are designed to accelerate the most performance-critical query: the **eligibility check**.

```sql
-- Students table
CREATE INDEX idx_students_branch ON students (branch);
CREATE INDEX idx_students_grad_year ON students (graduation_year);
CREATE INDEX idx_students_grad_year_branch ON students (graduation_year, branch);

-- Student academics (eligibility composite)
CREATE INDEX idx_sa_ug_year_of_passing ON student_academics (ug_year_of_passing);
CREATE INDEX idx_sa_ug_cgpa ON student_academics (ug_cgpa);
CREATE INDEX idx_sa_eligibility_composite ON student_academics (ug_year_of_passing, ug_cgpa, history_of_backs);

-- Jobs table
CREATE INDEX idx_jobs_year_of_graduation ON jobs (year_of_graduation);
CREATE INDEX idx_jobs_status ON jobs (status);

-- Job requirements
CREATE INDEX idx_jr_job_id ON job_requirements (job_id);
```

**Why these indexes?**
- The eligibility query filters by `graduation_year`, `ug_cgpa`, `branch`, and `history_of_backs`
- The composite index on `student_academics` covers the most selective filters in one B-tree scan
- `jobs.status` index speeds up queries filtering for READY/DRAFT/CLOSED jobs

---

## Event-Driven Architecture

### Redpanda Topic Design

| Topic | Publisher | Purpose |
|---|---|---|
| `job.ready` | Job creation endpoint | Signals a job is ready for eligibility evaluation |
| `job.eligibility` | Job creation endpoint | Legacy eligibility event with batch/branch data |
| `job.eligible.students` | Eligibility Service (consumer) | List of students eligible for a specific job |
| `job.notification.send` | Notification Service (consumer) | Trigger notifications to students and staff |

### Event Flow Diagram

```
┌──────────────┐     POST /api/jobs      ┌───────────────┐
│   Frontend   │ ──────────────────────► │ Jobs Controller│
└──────────────┘                         └───────┬───────┘
                                                 │
                                          ┌──────▼──────┐
                                          │  PostgreSQL  │
                                          │  Transaction │
                                          │  (BEGIN)     │
                                          │              │
                                          │ INSERT jobs  │
                                          │ INSERT reqs  │
                                          │ status=READY │
                                          │              │
                                          │  (COMMIT)    │
                                          └──────┬───────┘
                                                 │
                                          Only after COMMIT
                                                 │
                                          ┌──────▼──────┐
                                          │  Redpanda    │
                                          │  job.ready   │
                                          └──────┬───────┘
                                                 │
                                   ┌─────────────▼──────────────┐
                                   │   Eligibility Service      │
                                   │   (Consumer)               │
                                   │                            │
                                   │  SELECT eligible students  │
                                   │  WHERE graduation_year = X │
                                   │    AND ug_cgpa >= Y         │
                                   │    AND branch = ANY(Z)     │
                                   │    AND backlogs <= W       │
                                   │                            │
                                   │  + app-layer skill match   │
                                   └─────────────┬──────────────┘
                                                 │
                                          ┌──────▼──────────────┐
                                          │  job.eligible.students│
                                          └──────┬──────────────┘
                                                 │
                                   ┌─────────────▼──────────────┐
                                   │   Notification Service     │
                                   │   (Consumer)               │
                                   │                            │
                                   │  → job.notification.send   │
                                   │  → Email / SMS / Push      │
                                   └────────────────────────────┘
```

### Event Payloads

**job.ready:**
```json
{
  "event": "JOB_READY",
  "jobId": 42,
  "companyId": 5,
  "yearOfGraduation": 2026,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## Eligibility Algorithm

When a student applies for a job (or when the eligibility service runs):

1. **Graduation Year Check:** `students.graduation_year = jobs.year_of_graduation`
2. **10th Percentage:** `student_academics.tenth_percent >= job_requirements.tenth_percent`
3. **12th Percentage:** `student_academics.twelfth_percent >= job_requirements.twelfth_percent`
4. **UG CGPA:** `student_academics.ug_cgpa >= job_requirements.ug_cgpa`
5. **PG CGPA:** `student_academics.pg_cgpa >= job_requirements.pg_cgpa` (if required)
6. **Experience:** Calculated from `student_internships` duration sum
7. **Branch:** `students.branch = ANY(job_requirements.allowed_branches)`
8. **Backlogs:** `student_academics.history_of_backs <= job_requirements.backlogs_allowed`
9. **Skills:** Application-layer matching of `student_certifications.skill_name` against `job_requirements.skills_required`

**Optimized SQL (batch eligibility):**
```sql
SELECT s.student_id, s.full_name, s.branch, sa.ug_cgpa
FROM students s
JOIN student_academics sa ON s.student_id = sa.student_id
WHERE s.graduation_year = $1              -- uses idx_students_grad_year
  AND sa.ug_cgpa >= $2                    -- uses idx_sa_eligibility_composite
  AND s.branch = ANY($3)                  -- uses idx_students_branch
  AND COALESCE(sa.history_of_backs, 0) <= $4;
```

Skill matching is done in the application layer after the SQL filter because `skills_required` is a text field and student skills are in a separate `student_certifications` table.

---

## Transaction Strategy

### When to use transactions

| Operation | Transaction? | Reason |
|---|---|---|
| Single INSERT/UPDATE/DELETE | ✅ Yes | Ensures atomic writes with rollback on error |
| Multi-table writes (job + requirements) | ✅ Yes | Must be atomic — both succeed or both fail |
| Simple SELECT (read-only) | ❌ No | No transaction needed; use `pool.query()` directly |
| SELECT with JOINs (read-only) | ❌ No | Still read-only; no transaction overhead needed |

### Pattern: Transaction with Kafka

```
BEGIN
  INSERT INTO jobs ...
  INSERT INTO job_requirements ...
COMMIT

-- Only AFTER successful commit:
publishEvent('job.ready', payload)
```

**Critical Rule:** Never publish Kafka events inside the transaction. If Kafka succeeds but COMMIT fails, the event references data that doesn't exist.

---

## Scaling Strategy

### Current Architecture (Single Service)

```
[Express App] → [PostgreSQL] → [Redpanda]
```

### Phase 2: Service Separation

```
┌─────────────────┐   ┌───────────────────┐   ┌─────────────────────┐
│ Placement API   │   │ Eligibility Svc   │   │ Notification Svc    │
│ (Express)       │   │ (Consumer)        │   │ (Consumer)          │
│                 │   │                   │   │                     │
│ • Job CRUD      │   │ • Consumes        │   │ • Consumes          │
│ • Student CRUD  │   │   job.ready       │   │   job.eligible.*    │
│ • Applications  │   │ • Runs SQL checks │   │ • Sends emails/SMS  │
│ • Companies     │   │ • Publishes       │   │ • Notifies staff    │
│                 │   │   eligible list   │   │                     │
└────────┬────────┘   └─────────┬─────────┘   └──────────┬──────────┘
         │                      │                        │
         └──────────┬───────────┴────────────┬───────────┘
                    │                        │
              ┌─────▼─────┐           ┌──────▼──────┐
              │ PostgreSQL │           │  Redpanda   │
              └───────────┘           └─────────────┘
```

### Scaling Recommendations

1. **Connection Pooling:** Already configured with `max: 15`, `min: 2`. Monitor `pg_stat_activity` and increase if needed.
2. **Read Replicas:** For heavy read workloads (student reports, dashboards), add PostgreSQL read replicas.
3. **Kafka Partitioning:** Partition `job.ready` by `yearOfGraduation` to parallelize eligibility checks.
4. **Caching:** Add Redis for frequently-accessed data (company info, job requirements).
5. **Bulk Operations:** Use `COPY` or batch INSERTs for Excel imports instead of row-by-row.
6. **Horizontal Scaling:** The Express app is stateless — scale with multiple instances behind a load balancer.

---

## Future Improvements

1. **Service Layer Extraction:** Move business logic from controllers into a dedicated `services/` layer
2. **Centralized Error Handling:** Add Express error-handling middleware to avoid repetitive try/catch in controllers
3. **Environment Validation:** Validate required env vars (`KAFKA_BROKERS`, `DB_HOST`, etc.) at startup with `joi` or `envalid`
4. **API Versioning:** Prefix routes with `/api/v1/` for forward compatibility
5. **Rate Limiting:** Add `express-rate-limit` to protect against abuse
6. **Health Checks:** Add `/health` and `/ready` endpoints for container orchestration
7. **Database Migrations:** Use a migration tool (e.g., `node-pg-migrate`) instead of raw SQL files
8. **Testing:** Add integration tests for eligibility logic and transaction-critical paths
9. **Idempotency:** Add idempotency keys to Kafka events to handle consumer retries safely
10. **Audit Trail:** Add `updated_at` and `updated_by` columns for change tracking
