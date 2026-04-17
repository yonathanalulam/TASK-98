Fix only README hard-gate failures identified in:
`.tmp/test_coverage_and_readme_audit_report.md`
## Objective
Update `README.md` so the README audit passes strict gates.
## Current failing gates to fix
1. Missing explicit verification method (must include concrete API verification flow).
2. Demo credentials incomplete for auth-enabled system (must include credentials for all roles used by the system, or deterministic creation flow plus resulting credentials).
## Required changes
### A) Add explicit project type declaration
At top of README, add a dedicated line:
`Project type: backend`
### B) Keep startup instruction gate compliant
Ensure README contains the literal command:
`docker-compose up`
(You may also keep `docker-compose up --build -d`, but the literal must appear.)
### C) Add strict verification section (MANDATORY)
Add a section titled `Verification` with concrete steps and expected outcomes, including:
1. Health check:
```bash
curl http://localhost:3001/api/v1/health
Expected: HTTP 200 and JSON containing "status":"ok".
2. Login check (seeded admin):
curl -X POST "http://localhost:3001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"dev_ops_admin","password":"DevOpsAdmin123!"}'
Expected: HTTP 200 with access_token.
3. Protected route check using token (example route):
GET /api/v1/access/roles
Expected:
- 200 with valid ops token
- 401/403 without token or insufficient permissions
4. Optional note:
Mention that ./run_tests.sh is the full automated suite, but it does not replace the required manual verification examples above.
D) Fix demo credentials gate (MANDATORY)
Auth exists, so provide complete role coverage in README.
You must include either:
- full credential table for all roles used in system, or
- deterministic provisioning instructions + final credentials for each role.
Use this exact practical approach:
1. Keep seeded role:
   - ops_admin → dev_ops_admin / DevOpsAdmin123!
2. Add deterministic creation steps for:
   - patient
   - staff
   - provider
   - merchant
   - analytics_viewer
3. Provide resulting login usernames/passwords in a final table (for example demo_patient, demo_staff, etc. with Password123!), and include the exact API endpoints used to create them.
E) Keep strict environment rules compliant
Do not add runtime install instructions like:
- npm install
- pip install
- apt-get
- manual DB setup steps
F) Preserve accuracy
Do not claim pre-seeded users that are not actually seeded.
If a role is provisioned via API, say so explicitly.
Output requirements
1. Update only README.md.
2. Keep markdown clean and readable.
3. At the end, provide a short checklist in your response:
- Project type declaration: PASS/FAIL
- Startup command gate: PASS/FAIL
- Access method: PASS/FAIL
- Verification method: PASS/FAIL
- Demo credentials/auth gate: PASS/FAIL
- Environment rules: PASS/FAIL
Acceptance target
README should pass all hard gates in the strict README audit.