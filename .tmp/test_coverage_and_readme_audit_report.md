# Test Coverage Audit

## Project Type Detection
- README explicitly declares project type as backend (`README.md:3`).
- Inferred type is also backend by code structure (no frontend source tree under `src/`, no `frontend/` or `client/` directories).

## Backend Endpoint Inventory
`Endpoint = METHOD + resolved path` with global prefix `api/v1` (`src/main.ts:35`).

```text
GET /api/v1/access/audit-logs
GET /api/v1/access/audit-logs/verify-integrity
GET /api/v1/access/roles
GET /api/v1/access/scopes
GET /api/v1/access/users/:param/scopes
GET /api/v1/analytics/aggregations/content-quality
GET /api/v1/analytics/aggregations/funnel
GET /api/v1/analytics/aggregations/retention
GET /api/v1/analytics/experiments/:param/assignment/:param
GET /api/v1/analytics/exports/:param
GET /api/v1/analytics/exports/:param/download
GET /api/v1/auth/me
GET /api/v1/auth/security-questions
GET /api/v1/files/:param/download
GET /api/v1/follow-up/adherence
GET /api/v1/follow-up/plans/:param
GET /api/v1/health
GET /api/v1/health/error-sample
GET /api/v1/identity-documents/:param
GET /api/v1/notifications
GET /api/v1/reservations
GET /api/v1/reservations/:param
GET /api/v1/reservations/:param/attachments
GET /api/v1/reservations/:param/messages
GET /api/v1/reservations/:param/reviews
GET /api/v1/sensitive-words
GET /api/v1/support/tickets
GET /api/v1/sync/pull
GET /api/v1/trust/credit-tiers/:param
GET /api/v1/trust/fraud-flags
POST /api/v1/access/provision-user
POST /api/v1/access/roles
POST /api/v1/analytics/events
POST /api/v1/analytics/experiments
POST /api/v1/analytics/exports/csv
POST /api/v1/appeals/:param/arbitrate
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/password-reset/confirm
POST /api/v1/auth/password-reset/verify-security-answer
POST /api/v1/auth/refresh
POST /api/v1/auth/register
POST /api/v1/follow-up/plans
POST /api/v1/follow-up/plan-templates
POST /api/v1/follow-up/tags/ingest
POST /api/v1/follow-up/tasks/:param/outcomes
POST /api/v1/identity-documents
POST /api/v1/notifications
POST /api/v1/notifications/:param/read
POST /api/v1/reservations
POST /api/v1/reservations/:param/attachments
POST /api/v1/reservations/:param/cancel
POST /api/v1/reservations/:param/complete
POST /api/v1/reservations/:param/confirm
POST /api/v1/reservations/:param/messages
POST /api/v1/reservations/:param/messages/read
POST /api/v1/reservations/:param/notes
POST /api/v1/reservations/:param/reschedule
POST /api/v1/reservations/:param/reviews
POST /api/v1/reviews/:param/appeals
POST /api/v1/sensitive-words
POST /api/v1/sensitive-words/:param/toggle
POST /api/v1/sensitive-words/:param/update
POST /api/v1/support/tickets
POST /api/v1/support/tickets/:param/close
POST /api/v1/support/tickets/:param/escalate
POST /api/v1/support/tickets/:param/resolve
POST /api/v1/sync/push
POST /api/v1/workflows/definitions
POST /api/v1/workflows/requests
POST /api/v1/workflows/requests/:param/approve
POST /api/v1/workflows/requests/:param/reject
PUT /api/v1/access/users/:param/roles
PUT /api/v1/access/users/:param/scopes
```

## API Test Mapping Table
| Endpoint | Covered | Test type | Test files | Evidence |
|---|---|---|---|---|
| GET /api/v1/access/audit-logs | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:725; src/modules/access-control/access-control.controller.ts:127 |
| GET /api/v1/access/audit-logs/verify-integrity | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:176; src/modules/access-control/access-control.controller.ts:111 |
| GET /api/v1/access/roles | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1712; src/modules/access-control/access-control.controller.ts:36 |
| GET /api/v1/access/scopes | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1726; src/modules/access-control/access-control.controller.ts:79 |
| GET /api/v1/access/users/:param/scopes | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1739; src/modules/access-control/access-control.controller.ts:88 |
| GET /api/v1/analytics/aggregations/content-quality | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:167; src/modules/analytics/analytics.controller.ts:48 |
| GET /api/v1/analytics/aggregations/funnel | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:757; src/modules/analytics/analytics.controller.ts:34 |
| GET /api/v1/analytics/aggregations/retention | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1827; src/modules/analytics/analytics.controller.ts:41 |
| GET /api/v1/analytics/experiments/:param/assignment/:param | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1587; src/modules/analytics/analytics.controller.ts:66 |
| GET /api/v1/analytics/exports/:param | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1650; src/modules/analytics/analytics.controller.ts:102 |
| GET /api/v1/analytics/exports/:param/download | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1636; src/modules/analytics/analytics.controller.ts:88 |
| GET /api/v1/auth/me | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:2212; src/modules/auth/auth.controller.ts:97 |
| GET /api/v1/auth/security-questions | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:192; src/modules/auth/auth.controller.ts:112 |
| GET /api/v1/files/:param/download | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1169; src/modules/file/file.controller.ts:66 |
| GET /api/v1/follow-up/adherence | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:955; src/modules/follow-up/follow-up.controller.ts:64 |
| GET /api/v1/follow-up/plans/:param | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:901; src/modules/follow-up/follow-up.controller.ts:47 |
| GET /api/v1/health | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:150; src/modules/health/health.controller.ts:16 |
| GET /api/v1/health/error-sample | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1847; src/modules/health/health.controller.ts:23 |
| GET /api/v1/identity-documents/:param | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1878; src/modules/file/file.controller.ts:89 |
| GET /api/v1/notifications | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1901; src/modules/communication/communication.controller.ts:150 |
| GET /api/v1/reservations | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:200; src/modules/reservation/reservation.controller.ts:30 |
| GET /api/v1/reservations/:param | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:401; src/modules/reservation/reservation.controller.ts:35 |
| GET /api/v1/reservations/:param/attachments | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1163; src/modules/file/file.controller.ts:57 |
| GET /api/v1/reservations/:param/messages | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1940; src/modules/communication/communication.controller.ts:67 |
| GET /api/v1/reservations/:param/reviews | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1971; src/modules/trust-rating/trust-rating.controller.ts:33 |
| GET /api/v1/sensitive-words | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:810; src/modules/communication/communication.controller.ts:179 |
| GET /api/v1/support/tickets | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1983; src/modules/communication/communication.controller.ts:98 |
| GET /api/v1/sync/pull | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:205; src/modules/sync/sync.controller.ts:27 |
| GET /api/v1/trust/credit-tiers/:param | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:2027; src/modules/trust-rating/trust-rating.controller.ts:64 |
| GET /api/v1/trust/fraud-flags | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:741; src/modules/trust-rating/trust-rating.controller.ts:73 |
| POST /api/v1/access/provision-user | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:361; src/modules/access-control/access-control.controller.ts:56 |
| POST /api/v1/access/roles | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1751; src/modules/access-control/access-control.controller.ts:45 |
| POST /api/v1/analytics/events | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1540; src/modules/analytics/analytics.controller.ts:26 |
| POST /api/v1/analytics/experiments | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1530; src/modules/analytics/analytics.controller.ts:55 |
| POST /api/v1/analytics/exports/csv | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1607; src/modules/analytics/analytics.controller.ts:77 |
| POST /api/v1/appeals/:param/arbitrate | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:2047; src/modules/trust-rating/trust-rating.controller.ts:53 |
| POST /api/v1/auth/login | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:323; src/modules/auth/auth.controller.ts:58 |
| POST /api/v1/auth/logout | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:2201; src/modules/auth/auth.controller.ts:87 |
| POST /api/v1/auth/password-reset/confirm | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:2230; src/modules/auth/auth.controller.ts:129 |
| POST /api/v1/auth/password-reset/verify-security-answer | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:2221; src/modules/auth/auth.controller.ts:119 |
| POST /api/v1/auth/refresh | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:352; src/modules/auth/auth.controller.ts:73 |
| POST /api/v1/auth/register | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:240; src/modules/auth/auth.controller.ts:36 |
| POST /api/v1/follow-up/plans | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:881; src/modules/follow-up/follow-up.controller.ts:40 |
| POST /api/v1/follow-up/plan-templates | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:844; src/modules/follow-up/follow-up.controller.ts:30 |
| POST /api/v1/follow-up/tags/ingest | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:546; src/modules/follow-up/follow-up.controller.ts:23 |
| POST /api/v1/follow-up/tasks/:param/outcomes | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:913; src/modules/follow-up/follow-up.controller.ts:53 |
| POST /api/v1/identity-documents | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1860; src/modules/file/file.controller.ts:79 |
| POST /api/v1/notifications | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1310; src/modules/communication/communication.controller.ts:140 |
| POST /api/v1/notifications/:param/read | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1320; src/modules/communication/communication.controller.ts:159 |
| POST /api/v1/reservations | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:380; src/modules/reservation/reservation.controller.ts:23 |
| POST /api/v1/reservations/:param/attachments | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1129; src/modules/file/file.controller.ts:36 |
| POST /api/v1/reservations/:param/cancel | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:2088; src/modules/reservation/reservation.controller.ts:75 |
| POST /api/v1/reservations/:param/complete | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1027; src/modules/reservation/reservation.controller.ts:86 |
| POST /api/v1/reservations/:param/confirm | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:607; src/modules/reservation/reservation.controller.ts:54 |
| POST /api/v1/reservations/:param/messages | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1913; src/modules/communication/communication.controller.ts:54 |
| POST /api/v1/reservations/:param/messages/read | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1952; src/modules/communication/communication.controller.ts:77 |
| POST /api/v1/reservations/:param/notes | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:442; src/modules/reservation/reservation.controller.ts:43 |
| POST /api/v1/reservations/:param/reschedule | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:2134; src/modules/reservation/reservation.controller.ts:64 |
| POST /api/v1/reservations/:param/reviews | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1034; src/modules/trust-rating/trust-rating.controller.ts:22 |
| POST /api/v1/reviews/:param/appeals | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1053; src/modules/trust-rating/trust-rating.controller.ts:42 |
| POST /api/v1/sensitive-words | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:178; src/modules/communication/communication.controller.ts:169 |
| POST /api/v1/sensitive-words/:param/toggle | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:835; src/modules/communication/communication.controller.ts:199 |
| POST /api/v1/sensitive-words/:param/update | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:817; src/modules/communication/communication.controller.ts:188 |
| POST /api/v1/support/tickets | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1207; src/modules/communication/communication.controller.ts:88 |
| POST /api/v1/support/tickets/:param/close | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1995; src/modules/communication/communication.controller.ts:129 |
| POST /api/v1/support/tickets/:param/escalate | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1217; src/modules/communication/communication.controller.ts:107 |
| POST /api/v1/support/tickets/:param/resolve | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1235; src/modules/communication/communication.controller.ts:118 |
| POST /api/v1/sync/push | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1691; src/modules/sync/sync.controller.ts:20 |
| POST /api/v1/workflows/definitions | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1374; src/modules/workflow/workflow.controller.ts:21 |
| POST /api/v1/workflows/requests | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1402; src/modules/workflow/workflow.controller.ts:31 |
| POST /api/v1/workflows/requests/:param/approve | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1412; src/modules/workflow/workflow.controller.ts:41 |
| POST /api/v1/workflows/requests/:param/reject | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:2163; src/modules/workflow/workflow.controller.ts:52 |
| PUT /api/v1/access/users/:param/roles | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1782; src/modules/access-control/access-control.controller.ts:67 |
| PUT /api/v1/access/users/:param/scopes | yes | true no-mock HTTP | tests/API_tests/run_api_tests.sh | tests/API_tests/run_api_tests.sh:1804; src/modules/access-control/access-control.controller.ts:98 |

## API Test Classification
1. **True No-Mock HTTP**
   - `tests/API_tests/run_api_tests.sh` issues real `curl` requests to `API_BASE_URL` (`tests/API_tests/run_api_tests.sh:4`, `tests/API_tests/run_api_tests.sh:150`).
   - `tests/integration_tests/real-http.integration.spec.ts` and `tests/integration_tests/mock-replacement.integration.spec.ts` issue real `fetch` requests against running API with no mocked request path (`tests/integration_tests/real-http.integration.spec.ts:25`, `tests/integration_tests/mock-replacement.integration.spec.ts:34`).
2. **HTTP with Mocking**
   - No active HTTP-with-mocking tests found.
3. **Non-HTTP (unit/integration without HTTP)**
   - `tests/unit_tests/*.spec.ts` directly test utility/service/migration units.

## Mock Detection Rules
- `jest.mock` / `vi.mock` / `sinon.stub`:
  - No active usage in `tests/unit_tests/*.spec.ts`.
- Remaining unit-level stub usage (`jest.fn`) detected:
  - `tests/unit_tests/workflow-business-time.service.spec.ts:18`
  - `tests/unit_tests/privileged-audit-health.spec.ts:5`
  - `tests/unit_tests/bootstrap-admin-migration.spec.ts:14`
- HTTP layer bypass exists in unit scope (direct invocation), but critical behaviors are additionally covered in no-mock integration/API suites.

## Coverage Summary
- Total endpoints: **74**
- Endpoints with HTTP tests: **74**
- Endpoints with TRUE no-mock HTTP tests: **74**
- HTTP coverage %: **100%**
- True API coverage %: **100%**

## Unit Test Analysis

### Backend Unit Tests
- Unit files detected: **20** (`tests/unit_tests/*.spec.ts`).
- Covered areas: utility logic, DTO validation, migration behaviors, lockout/redaction, workflow/refund/review policy rules.
- Important backend modules not directly unit-tested as isolated classes:
  - controllers (`src/modules/*/*.controller.ts`)
  - guards/middleware (`src/common/guards/*`)
  - repository query semantics against real DB (covered by integration/API rather than unit layer)

### Frontend Unit Tests (STRICT REQUIREMENT)
- Frontend code presence: none (`src/**/*.tsx`, `src/**/*.jsx`, `frontend/`, `client/` absent).
- Frontend test files: **NONE**.
- Frameworks/tools detected: **NONE**.
- Components/modules covered: **NONE**.
- Important frontend modules not tested: **N/A (backend-only repository)**.
- **Frontend unit tests: MISSING**.
- CRITICAL GAP rule for fullstack/web does not apply because project type is backend.

### Cross-Layer Observation
- Not applicable (backend-only repo).

## API Observability Check
- Strength: API tests show endpoint, request input, expected HTTP code, and response-content checks (`tests/API_tests/run_api_tests.sh:83`, `tests/API_tests/run_api_tests.sh:240`).
- Weakness: many assertions are substring-based, not full schema assertions.

## Test Quality & Sufficiency
- Broad positive/negative coverage across auth, reservation, access-control, communication, workflow, sync, trust, analytics.
- Integration realism improved via dedicated replacement suite for previously mock-heavy scenarios (`tests/integration_tests/mock-replacement.integration.spec.ts:1`).
- Remaining caveats:
  - Unit layer still uses a few stubs (`jest.fn`) and is not strictly zero-stub.
  - Coverage thresholds are permissive (global lines 25, branches 20 in `jest.unit.config.js:31`).
  - `run_tests.sh` keeps optional host-side `npm ci` fallback (`run_tests.sh:32` to `run_tests.sh:35`), flagged in strict local-dependency interpretation.

## End-to-End Expectations
- Backend project: frontend-backend E2E not applicable.
- Real HTTP integration and API suites are present and included in runner (`run_tests.sh:158` to `run_tests.sh:160`).

## Tests Check
- Test path migration is consistent (`package.json:17`, `jest.unit.config.js:4`, `jest.integration.config.js:8`).
- `run_tests.sh` executes unit, integration, API, and perf suites in sequence.

## Test Coverage Score (0-100)
**95/100**

## Score Rationale
- + Full endpoint-level HTTP coverage (74/74).
- + Strong no-mock real HTTP coverage in API + integration suites.
- + Coverage instrumentation/reporters are configured.
- - Some residual stub usage in unit tests.
- - Permissive coverage thresholds.

## Key Gaps
1. Unit layer is low-mock but not strictly zero-stub.
2. Coverage thresholds should be tightened for stronger enforcement.
3. `run_tests.sh` still contains optional host-side install escape hatch.

## Confidence & Assumptions
- Confidence: **High** for endpoint inventory/mapping and README gate checks; **Medium** for qualitative sufficiency judgments.
- Assumptions:
  - Static audit only; no runtime execution performed.
  - Global prefix remains `api/v1` unless environment override.

## Test Coverage Verdict
**PASS**

---

# README Audit

## README Location
- `README.md` exists at repository root.

## High Priority Issues
- None.

## Medium Priority Issues
- Credentials section is accurate but long; concise quickstart + detailed appendix split could improve scanability.
- Verification examples are shell-centric; optional PowerShell equivalents could improve Windows reproducibility.

## Low Priority Issues
- Frontend access line says `N/A`; acceptable but can be shortened further for clarity.

## Hard Gate Failures
- **None detected.**

## Formatting
- Clean markdown structure with headings, lists, and code fences. **Pass**.

## Startup Instructions
- Required literal startup command is present (`README.md:44` -> `docker-compose up`). **Pass**.

## Access Method
- Backend API URL and docs URL are explicit (`README.md:62`, `README.md:63`). **Pass**.

## Verification Method
- Explicit verification steps with concrete `curl` commands and expected outcomes are present (`README.md:71` to `README.md:113`). **Pass**.

## Environment Rules (Strict)
- No prohibited runtime installation or manual DB setup instructions. Docker-first flow maintained. **Pass**.

## Demo Credentials (Conditional)
- Auth exists and README now provides username/password coverage for all operational roles, with deterministic provisioning flow and resulting credentials table (`README.md:114` to `README.md:173`). **Pass**.

## Engineering Quality
- README now balances startup, verification, and role provisioning detail with reproducible commands.

## README Verdict
**PASS**