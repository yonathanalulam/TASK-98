# CareReserve API

Project type: backend

Backend API for clinical operations workflows (reservations, follow-up, communication, trust/risk, workflow approvals, analytics, sync, and audit).

## Architecture & Tech Stack

- Frontend: N/A (backend-only repository)
- Backend: NestJS 10, TypeScript, Node.js
- Database: PostgreSQL 16 (container)
- Containerization: Docker and Docker Compose

## Project Structure

Below is the project structure for this repository.

```text
.
├── src/                    # Backend source code
├── tests/                  # API, integration, and unit tests
│   ├── API_tests/
│   ├── integration_tests/
│   └── unit_tests/
├── docs/                   # Supplemental documentation
├── .env.example            # Example environment variables
├── docker-compose.yml      # Multi-container orchestration
├── run_tests.sh            # Standardized test execution script
└── README.md               # Project documentation
```

## Prerequisites

To ensure a consistent environment, run everything in containers.

- Docker
- Docker Compose

## Running the Application

Start the stack with the canonical startup command:

```bash
docker-compose up
```

For a clean build in the background, use:

```bash
docker-compose up --build -d
```

Create local env file (if missing):

```bash
cp .env.example .env
```

### Access the App

- Frontend: N/A (no frontend in this repository)
- Backend API: `http://localhost:3001/api/v1`
- API Documentation: `http://localhost:3001/api/docs`

Stop the application:

```bash
docker-compose down -v
```

## Verification

Run these steps against the live stack after `docker-compose up` to confirm the API is healthy and authentication works end-to-end. `./run_tests.sh` runs the full automated suite, but it does **not** replace the manual checks below — reviewers should execute each step and match the expected outcome.

1. Health check:

   ```bash
   curl http://localhost:3001/api/v1/health
   ```

   Expected: HTTP **200** and JSON containing `"status":"ok"`.

2. Login check (seeded admin):

   ```bash
   curl -X POST "http://localhost:3001/api/v1/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"username":"dev_ops_admin","password":"DevOpsAdmin123!"}'
   ```

   Expected: HTTP **200** with a JSON body that contains `access_token`.

3. Protected route check using the token:

   ```bash
   OPS_TOKEN="<access_token from step 2>"
   curl -H "Authorization: Bearer $OPS_TOKEN" http://localhost:3001/api/v1/access/roles
   ```

   Expected outcomes:
   - **200** with the seeded role list when called with a valid `ops_admin` token.
   - **401** when no `Authorization` header is sent.
   - **403** when the token belongs to a role without `access.roles.read` (for example `patient`).

4. Automated suite (complementary, not a substitute for manual verification):

   ```bash
   chmod +x run_tests.sh
   ./run_tests.sh
   ```

   Exits `0` on success and non-zero on any failure.

## Seeded Credentials and Demo Roles

The app startup and migrations seed exactly one default application user in the non-production dev compose flow. Every other role is created deterministically via the ops-admin provisioning API (no manual DB edits, no runtime installers). The block below creates one demo user per role and produces the credentials listed in the final table.

### Seeded role (pre-existing after `docker-compose up`)

| Role | Username | Password | Source |
|------|----------|----------|--------|
| `ops_admin` | `dev_ops_admin` | `DevOpsAdmin123!` | Seeded from `BOOTSTRAP_OPS_USERNAME` and `BOOTSTRAP_OPS_PASSWORD_HASH` defaults in `docker-compose.yml`. |

### Deterministic provisioning for all other roles

Copy/paste this block in a shell that can reach the API. It logs in as the seeded `ops_admin`, discovers the security-question id required for registration, and then creates one demo user per remaining role using the published API endpoints.

```bash
BASE="http://localhost:3001/api/v1"

OPS_TOKEN=$(curl -sS -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"dev_ops_admin","password":"DevOpsAdmin123!"}' \
  | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync(0,'utf8')).access_token)")

SQ_ID=$(curl -sS "$BASE/auth/security-questions" \
  | node -e "const a=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(a[0].id)")

# 1) Patient — created via public registration endpoint.
curl -sS -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: demo-patient" \
  -d "{\"username\":\"demo_patient\",\"password\":\"Password123!\",\"role\":\"patient\",\"security_question_id\":\"$SQ_ID\",\"security_answer\":\"demo\"}"

# 2–5) Privileged roles — created by ops_admin via POST /access/provision-user.
for pair in "staff:demo_staff" "provider:demo_provider" "merchant:demo_merchant" "analytics_viewer:demo_analytics"; do
  role="${pair%%:*}"
  user="${pair##*:}"
  curl -sS -X POST "$BASE/access/provision-user" \
    -H "Authorization: Bearer $OPS_TOKEN" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: demo-$role" \
    -d "{\"username\":\"$user\",\"password\":\"Password123!\",\"role\":\"$role\",\"security_question_id\":\"$SQ_ID\",\"security_answer\":\"demo\"}"
done
```

Endpoints used by the block above:

- `POST /api/v1/auth/login` — ops admin log-in.
- `GET /api/v1/auth/security-questions` — lookup required `security_question_id`.
- `POST /api/v1/auth/register` — public patient registration (role must be `patient`).
- `POST /api/v1/access/provision-user` — ops-only creation of privileged roles (`staff`, `provider`, `merchant`, `analytics_viewer`).

### Resulting credentials (after running the block)

| Role | Username | Password | Created via |
|------|----------|----------|-------------|
| `ops_admin` | `dev_ops_admin` | `DevOpsAdmin123!` | Seeded at migration time |
| `patient` | `demo_patient` | `Password123!` | `POST /api/v1/auth/register` |
| `staff` | `demo_staff` | `Password123!` | `POST /api/v1/access/provision-user` |
| `provider` | `demo_provider` | `Password123!` | `POST /api/v1/access/provision-user` |
| `merchant` | `demo_merchant` | `Password123!` | `POST /api/v1/access/provision-user` |
| `analytics_viewer` | `demo_analytics` | `Password123!` | `POST /api/v1/access/provision-user` |

Notes:

- Only the `ops_admin` account is pre-seeded. Every other role in the table is created at runtime via the API endpoints listed above — the repository does not pre-seed fixed `patient`, `staff`, `provider`, `merchant`, or `analytics_viewer` accounts.
- All demo passwords above are for local development only. Rotate `BOOTSTRAP_OPS_PASSWORD_HASH` (and replace the `Password123!` defaults) before running against a production database.

## Testing

All unit, integration, and API tests are orchestrated through `run_tests.sh`.

```bash
chmod +x run_tests.sh
./run_tests.sh
```

The script exits with `0` on success and non-zero on failure.
