# Student Job Eligibility Validation

## Overview
The system now validates student eligibility against job requirements before allowing applications to be created.

## Validation Checks Performed

### 1. Academic Requirements
- **10th Grade Percentage**: Student's 10th percentage must meet or exceed job requirement
- **12th Grade Percentage**: Student's 12th percentage must meet or exceed job requirement
- **UG CGPA**: Student's undergraduate CGPA must meet or exceed job requirement
- **PG CGPA**: Student's postgraduate CGPA must meet or exceed job requirement (if applicable)

### 2. Branch Eligibility
- **Allowed Branches**: Student's academic branch must be in the list of allowed branches for the job

### 3. Experience Requirements
- **Minimum Experience**: Student's total experience (calculated from internships) must meet minimum requirement

### 4. Application Status
- **Duplicate Check**: Prevents students from applying multiple times to the same job

## API Endpoints

### Create Application (POST /api/applications)
Now includes automatic eligibility validation. Returns error if student doesn't meet requirements.

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Application created successfully. You meet all the job requirements."
}
```

**Eligibility Failure Response:**
```json
{
  "success": false,
  "message": "Eligibility check failed: You do not meet the following job requirements: 10th grade: Required 75%, You have 70%; UG CGPA: Required 7.5, You have 7.0"
}
```

### Check Eligibility (GET /api/applications/check-eligibility/:studentId/:jobId)
New endpoint to check eligibility before applying.

**Success Response (Eligible):**
```json
{
  "success": true,
  "eligible": true,
  "message": "You meet all the job requirements."
}
```

**Success Response (Not Eligible):**
```json
{
  "success": true,
  "eligible": false,
  "message": "You do not meet the following job requirements: Branch: Required one of [CSE, IT], You have ECE"
}
```

## Error Messages
The system provides detailed feedback on which specific requirements are not met:
- Grade/CGPA requirements with actual vs required values
- Branch mismatch with allowed vs student's branch
- Experience shortfall with required vs actual experience
- Already applied status

## Prerequisites
- Student must have completed academic profile in `student_academics` table
- Job must have requirements defined in `job_requirements` table (if no requirements exist, application is allowed)
- Student record must exist in `students` table

## Implementation Details
- Eligibility validation is performed within database transaction
- All validations must pass for application creation
- Experience calculation includes all internships from `student_internships` table
- Branch comparison is case-insensitive
- If no job requirements are set, student is automatically eligible