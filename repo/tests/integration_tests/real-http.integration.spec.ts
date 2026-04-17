/**
 * Real-HTTP integration suite — the confidence layer that compensates for the
 * mock-heavy unit suite. Every test below drives the running NestJS app end to
 * end: real guards, real interceptors, real services, real TypeORM, real
 * Postgres. There is intentionally no `jest.mock`, no service stub, and no
 * controller override.
 *
 * Preconditions: the stack must be up (`docker-compose up`) and reachable at
 * API_BASE_URL. If `/health` is not 200 the suite fails fast with an actionable
 * message — it does NOT soft-skip, because silent skipping masks regressions in
 * CI. Developers who genuinely want a host-side-only unit run should use
 * `npm run test:unit`; the full pipeline is driven by `run_tests.sh`, which
 * brings the stack up before invoking this suite.
 */

type JsonValue = unknown;

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001/api/v1';
const OPS_USERNAME = process.env.BOOTSTRAP_OPS_USERNAME ?? 'dev_ops_admin';
const OPS_PASSWORD = process.env.BOOTSTRAP_OPS_PASSWORD ?? 'DevOpsAdmin123!';
const BASE_PASSWORD = 'Password123!';

type HttpResponse = { status: number; body: JsonValue; rawText: string };

async function http(
  method: string,
  path: string,
  options: { headers?: Record<string, string>; body?: unknown } = {}
): Promise<HttpResponse> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  let serializedBody: string | undefined;
  if (options.body !== undefined) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    serializedBody = typeof options.body === 'string' ? (options.body as string) : JSON.stringify(options.body);
  }
  const response = await fetch(url, { method, headers, body: serializedBody });
  const rawText = await response.text();
  let parsed: JsonValue = undefined;
  if (rawText.length > 0) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = rawText;
    }
  }
  return { status: response.status, body: parsed, rawText };
}

function uniqueSuffix(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

async function requireApiUp(): Promise<void> {
  try {
    const result = await http('GET', '/health');
    if (result.status !== 200) {
      throw new Error(`GET /health returned ${result.status}`);
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Integration suite precondition failed: API at ${API_BASE_URL} is not healthy (${reason}). ` +
        'Start the stack with docker-compose up (or run the top-level ./run_tests.sh, which autostarts Docker). ' +
        'Strict mode does not allow soft-skipping integration tests.'
    );
  }
}

async function getSecurityQuestionId(): Promise<string> {
  const resp = await http('GET', '/auth/security-questions');
  expect(resp.status).toBe(200);
  const questions = resp.body as Array<{ id: string }>;
  if (!questions.length) {
    throw new Error('No security questions seeded — migrations may not have run.');
  }
  return questions[0]!.id;
}

async function loginOps(): Promise<string> {
  const resp = await http('POST', '/auth/login', {
    body: { username: OPS_USERNAME, password: OPS_PASSWORD }
  });
  expect(resp.status).toBe(200);
  return (resp.body as { access_token: string }).access_token;
}

async function registerPatient(
  suffix: string,
  securityQuestionId: string,
  username = `int-patient-${suffix}`
): Promise<{ token: string; userId: string; username: string }> {
  const resp = await http('POST', '/auth/register', {
    headers: { 'Idempotency-Key': `int-reg-${suffix}-${username}` },
    body: {
      username,
      password: BASE_PASSWORD,
      role: 'patient',
      security_question_id: securityQuestionId,
      security_answer: 'integration-answer'
    }
  });
  expect(resp.status).toBe(201);
  const body = resp.body as { access_token: string; user_id: string };
  return { token: body.access_token, userId: body.user_id, username };
}

async function provisionRole(
  opsToken: string,
  suffix: string,
  role: string,
  securityQuestionId: string
): Promise<{ token: string; userId: string; username: string }> {
  const username = `int-${role}-${suffix}`;
  const create = await http('POST', '/access/provision-user', {
    headers: { Authorization: `Bearer ${opsToken}`, 'Idempotency-Key': `int-prov-${suffix}-${role}` },
    body: {
      username,
      password: BASE_PASSWORD,
      role,
      security_question_id: securityQuestionId,
      security_answer: 'int'
    }
  });
  expect(create.status).toBe(201);
  const userId = (create.body as { user_id: string }).user_id;

  const login = await http('POST', '/auth/login', { body: { username, password: BASE_PASSWORD } });
  expect(login.status).toBe(200);
  return { token: (login.body as { access_token: string }).access_token, userId, username };
}

describe('CareReserve integration suite — real HTTP, real Nest, real Postgres', () => {
  const suffix = uniqueSuffix();
  let securityQuestionId = '';
  let opsToken = '';
  let patient: { token: string; userId: string; username: string };
  let otherPatient: { token: string; userId: string; username: string };
  let staff: { token: string; userId: string; username: string };
  let provider: { token: string; userId: string; username: string };
  let analytics: { token: string; userId: string; username: string };

  beforeAll(async () => {
    await requireApiUp();
    securityQuestionId = await getSecurityQuestionId();
    opsToken = await loginOps();
    patient = await registerPatient(suffix, securityQuestionId, `int-patient-${suffix}`);
    otherPatient = await registerPatient(suffix, securityQuestionId, `int-other-${suffix}`);
    staff = await provisionRole(opsToken, suffix, 'staff', securityQuestionId);
    provider = await provisionRole(opsToken, suffix, 'provider', securityQuestionId);
    analytics = await provisionRole(opsToken, suffix, 'analytics_viewer', securityQuestionId);
  }, 120_000);

  describe('health + auth', () => {
    test('public /health returns status ok', async () => {
      const result = await http('GET', '/health');
      expect(result.status).toBe(200);
      expect(result.rawText).toContain('"status":"ok"');
    });

    test('/auth/me returns the registered patient (success path)', async () => {
      const me = await http('GET', '/auth/me', { headers: { Authorization: `Bearer ${patient.token}` } });
      expect(me.status).toBe(200);
      const body = me.body as { user_id: string; username: string; roles: string[] };
      expect(body.user_id).toBe(patient.userId);
      expect(body.roles).toContain('patient');
    });

    test('/auth/me rejects missing token (authorization negative)', async () => {
      const me = await http('GET', '/auth/me');
      expect(me.status).toBe(401);
      expect(me.rawText).toContain('UNAUTHORIZED');
    });

    test('/auth/login rejects wrong password (validation/auth failure)', async () => {
      const bad = await http('POST', '/auth/login', {
        body: { username: patient.username, password: 'WrongPassword123!' }
      });
      expect(bad.status).toBe(401);
      expect(bad.rawText).toContain('AUTH_INVALID_CREDENTIALS');
    });

    test('/auth/register rejects missing Idempotency-Key (validation negative)', async () => {
      const r = await http('POST', '/auth/register', {
        body: {
          username: `int-noidem-${suffix}`,
          password: BASE_PASSWORD,
          role: 'patient',
          security_question_id: securityQuestionId,
          security_answer: 'x'
        }
      });
      expect(r.status).toBe(400);
      expect(r.rawText).toContain('IDEMPOTENCY_KEY_REQUIRED');
    });

    test('/auth/register rejects staff role on public endpoint (authz negative)', async () => {
      const r = await http('POST', '/auth/register', {
        headers: { 'Idempotency-Key': `int-reg-staff-${suffix}` },
        body: {
          username: `int-public-staff-${suffix}`,
          password: BASE_PASSWORD,
          role: 'staff',
          security_question_id: securityQuestionId,
          security_answer: 'x'
        }
      });
      expect(r.status).toBe(422);
      expect(r.rawText).toContain('AUTH_REGISTRATION_ROLE_NOT_ALLOWED');
    });
  });

  describe('reservations', () => {
    let reservationId = '';

    test('patient creates own reservation (success)', async () => {
      const create = await http('POST', '/reservations', {
        headers: { Authorization: `Bearer ${patient.token}`, 'Idempotency-Key': `int-res-create-${suffix}` },
        body: { start_time: '2027-03-01T10:00:00.000Z', end_time: '2027-03-01T11:00:00.000Z' }
      });
      expect(create.status).toBe(201);
      reservationId = (create.body as { reservation_id: string }).reservation_id;
      expect(reservationId).toBeTruthy();
    });

    test('patient list includes own reservation and excludes other patient', async () => {
      const mine = await http('GET', '/reservations?page=1&page_size=50', {
        headers: { Authorization: `Bearer ${patient.token}` }
      });
      expect(mine.status).toBe(200);
      expect(mine.rawText).toContain(reservationId);

      const theirs = await http('GET', '/reservations?page=1&page_size=50', {
        headers: { Authorization: `Bearer ${otherPatient.token}` }
      });
      expect(theirs.status).toBe(200);
      expect(theirs.rawText).not.toContain(reservationId);
    });

    test('cross-patient GET returns 403 (authz negative)', async () => {
      const r = await http(`GET`, `/reservations/${reservationId}`, {
        headers: { Authorization: `Bearer ${otherPatient.token}` }
      });
      expect(r.status).toBe(403);
      expect(r.rawText).toContain('FORBIDDEN');
    });

    test('patient cannot create reservation for another patient (validation/authz negative)', async () => {
      const r = await http('POST', '/reservations', {
        headers: { Authorization: `Bearer ${otherPatient.token}`, 'Idempotency-Key': `int-res-forbid-${suffix}` },
        body: {
          patient_id: patient.userId,
          start_time: '2027-03-05T10:00:00.000Z',
          end_time: '2027-03-05T11:00:00.000Z'
        }
      });
      expect(r.status).toBe(403);
      expect(r.rawText).toContain('RESERVATION_PATIENT_SELF_ONLY');
    });
  });

  describe('access-control (RBAC)', () => {
    test('patient forbidden from /access/roles; ops succeeds (authz)', async () => {
      const forbidden = await http('GET', '/access/roles', {
        headers: { Authorization: `Bearer ${patient.token}` }
      });
      expect(forbidden.status).toBe(403);

      const allowed = await http('GET', '/access/roles', { headers: { Authorization: `Bearer ${opsToken}` } });
      expect(allowed.status).toBe(200);
      expect(allowed.rawText).toContain('items');
    });

    test('POST /access/roles rejects empty permission_ids (validation)', async () => {
      const r = await http('POST', '/access/roles', {
        headers: { Authorization: `Bearer ${opsToken}`, 'Idempotency-Key': `int-role-val-${suffix}` },
        body: { name: 'a', permission_ids: [] }
      });
      expect(r.status).toBe(400);
      expect(r.rawText).toContain('VALIDATION_ERROR');
    });

    test('PUT /access/users/:id/roles forbidden for patient (authz)', async () => {
      const r = await http('PUT', `/access/users/${staff.userId}/roles`, {
        headers: { Authorization: `Bearer ${patient.token}`, 'Idempotency-Key': `int-roles-patient-${suffix}` },
        body: { role_ids: ['00000000-0000-0000-0000-000000000001'] }
      });
      expect(r.status).toBe(403);
    });
  });

  describe('workflow', () => {
    let anyDefinitionId = '';
    let anyRequestId = '';

    test('ops creates workflow definition (success)', async () => {
      const r = await http('POST', '/workflows/definitions', {
        headers: { Authorization: `Bearer ${opsToken}`, 'Idempotency-Key': `int-wfdef-${suffix}` },
        body: {
          name: `integration wf ${suffix}`,
          approval_mode: 'ANY_ONE',
          steps: [{ order: 1, approver_role: 'staff', conditions: {} }]
        }
      });
      expect(r.status).toBe(201);
      anyDefinitionId = (r.body as { workflow_definition_id: string }).workflow_definition_id;
      expect(anyDefinitionId).toBeTruthy();
    });

    test('patient forbidden from creating workflow definitions (authz)', async () => {
      const r = await http('POST', '/workflows/definitions', {
        headers: { Authorization: `Bearer ${patient.token}`, 'Idempotency-Key': `int-wfdef-patient-${suffix}` },
        body: { name: 'nope', approval_mode: 'ANY_ONE', steps: [{ order: 1, approver_role: 'staff', conditions: {} }] }
      });
      expect(r.status).toBe(403);
    });

    test('submit + reject workflow request (success + state validation)', async () => {
      const submit = await http('POST', '/workflows/requests', {
        headers: { Authorization: `Bearer ${staff.token}`, 'Idempotency-Key': `int-wfreq-${suffix}` },
        body: {
          workflow_definition_id: anyDefinitionId,
          resource_type: 'appointment_slot',
          resource_ref: `int-ref-${suffix}`,
          payload: {}
        }
      });
      expect(submit.status).toBe(201);
      anyRequestId = (submit.body as { request_id: string }).request_id;

      const reject = await http('POST', `/workflows/requests/${anyRequestId}/reject`, {
        headers: { Authorization: `Bearer ${staff.token}`, 'Idempotency-Key': `int-wfrej-${suffix}` },
        body: { reason: 'integration reject' }
      });
      expect(reject.status).toBe(200);
      expect(reject.rawText).toContain('REJECTED');

      // Double-reject on non-pending → 422 (validation negative)
      const again = await http('POST', `/workflows/requests/${anyRequestId}/reject`, {
        headers: { Authorization: `Bearer ${staff.token}`, 'Idempotency-Key': `int-wfrej-dup-${suffix}` },
        body: { reason: 'duplicate' }
      });
      expect(again.status).toBe(422);
      expect(again.rawText).toContain('WORKFLOW_REQUEST_NOT_PENDING');
    });
  });

  describe('communication / support', () => {
    let reservationId = '';
    let ticketId = '';
    let messageId = '';

    beforeAll(async () => {
      const r = await http('POST', '/reservations', {
        headers: { Authorization: `Bearer ${patient.token}`, 'Idempotency-Key': `int-comm-res-${suffix}` },
        body: { start_time: '2027-04-10T10:00:00.000Z', end_time: '2027-04-10T11:00:00.000Z' }
      });
      expect(r.status).toBe(201);
      reservationId = (r.body as { reservation_id: string }).reservation_id;
    });

    test('patient posts message on own reservation (success)', async () => {
      const r = await http('POST', `/reservations/${reservationId}/messages`, {
        headers: { Authorization: `Bearer ${patient.token}`, 'Idempotency-Key': `int-msg-${suffix}` },
        body: { content: 'integration hello' }
      });
      expect(r.status).toBe(201);
      messageId = (r.body as { message_id: string }).message_id;
      expect(messageId).toBeTruthy();
    });

    test('unrelated user cannot read messages (authz)', async () => {
      const r = await http('GET', `/reservations/${reservationId}/messages?page=1&page_size=20`, {
        headers: { Authorization: `Bearer ${otherPatient.token}` }
      });
      expect(r.status).toBe(403);
    });

    test('missing Idempotency-Key on message post rejected (validation)', async () => {
      const r = await http('POST', `/reservations/${reservationId}/messages`, {
        headers: { Authorization: `Bearer ${patient.token}` },
        body: { content: 'no-idem' }
      });
      expect(r.status).toBe(400);
      expect(r.rawText).toContain('IDEMPOTENCY_KEY_REQUIRED');
    });

    test('owner creates support ticket, staff escalates + resolves + closes', async () => {
      const create = await http('POST', '/support/tickets', {
        headers: { Authorization: `Bearer ${patient.token}`, 'Idempotency-Key': `int-tix-${suffix}` },
        body: { reservation_id: reservationId, category: 'BILLING', description: 'integration ticket' }
      });
      expect(create.status).toBe(201);
      ticketId = (create.body as { ticket_id: string }).ticket_id;

      const escalate = await http('POST', `/support/tickets/${ticketId}/escalate`, {
        headers: { Authorization: `Bearer ${patient.token}`, 'Idempotency-Key': `int-tix-esc-${suffix}` },
        body: { reason: 'owner escalation' }
      });
      expect(escalate.status).toBe(200);
      expect(escalate.rawText).toContain('ESCALATED');

      const resolve = await http('POST', `/support/tickets/${ticketId}/resolve`, {
        headers: { Authorization: `Bearer ${staff.token}`, 'Idempotency-Key': `int-tix-res-${suffix}` },
        body: { resolution_note: 'integration resolved' }
      });
      expect(resolve.status).toBe(200);
      expect(resolve.rawText).toContain('RESOLVED');

      const close = await http('POST', `/support/tickets/${ticketId}/close`, {
        headers: { Authorization: `Bearer ${staff.token}`, 'Idempotency-Key': `int-tix-close-${suffix}` },
        body: { close_note: 'integration closed' }
      });
      expect(close.status).toBe(200);
      expect(close.rawText).toContain('CLOSED');
    });

    test('owner cannot close ticket (authz)', async () => {
      const r = await http('POST', `/support/tickets/${ticketId}/close`, {
        headers: { Authorization: `Bearer ${patient.token}`, 'Idempotency-Key': `int-tix-close-owner-${suffix}` },
        body: { close_note: 'owner cannot close' }
      });
      expect(r.status).toBe(403);
    });

    test('list support tickets: ops sees items', async () => {
      const r = await http('GET', '/support/tickets?page=1&page_size=20', {
        headers: { Authorization: `Bearer ${opsToken}` }
      });
      expect(r.status).toBe(200);
      expect(r.rawText).toContain('items');
    });
  });

  describe('analytics', () => {
    let experimentId = '';

    test('patient forbidden from analytics ingest (authz)', async () => {
      const r = await http('POST', '/analytics/events', {
        headers: { Authorization: `Bearer ${patient.token}`, 'Idempotency-Key': `int-analytics-patient-${suffix}` },
        body: {
          event_type: 'impression',
          subject_type: 'article',
          subject_id: patient.userId,
          occurred_at: '2026-04-10T10:00:00.000Z'
        }
      });
      expect(r.status).toBe(403);
    });

    test('ops creates experiment; analytics_viewer ingests events (success)', async () => {
      const exp = await http('POST', '/analytics/experiments', {
        headers: { Authorization: `Bearer ${opsToken}`, 'Idempotency-Key': `int-exp-${suffix}` },
        body: { name: `int-exp-${suffix}`, variants: ['control', 'variant_a'], active: true }
      });
      expect(exp.status).toBe(201);
      experimentId = (exp.body as { experiment_id: string }).experiment_id;
      expect(experimentId).toBeTruthy();

      const event = await http('POST', '/analytics/events', {
        headers: { Authorization: `Bearer ${analytics.token}`, 'Idempotency-Key': `int-event-${suffix}` },
        body: {
          event_type: 'impression',
          subject_type: 'article',
          subject_id: patient.userId,
          occurred_at: '2026-04-10T10:00:00.000Z',
          metadata: { source: 'integration' }
        }
      });
      expect(event.status).toBe(201);
    });

    test('retention aggregation returns expected shape (success)', async () => {
      const r = await http(
        'GET',
        '/analytics/aggregations/retention?cohort_start=2026-04-10T00:00:00.000Z&cohort_end=2026-04-11T00:00:00.000Z&bucket=overall',
        { headers: { Authorization: `Bearer ${opsToken}` } }
      );
      expect(r.status).toBe(200);
      const body = r.body as Record<string, unknown>;
      expect(body).toHaveProperty('cohort_size');
      expect(body).toHaveProperty('retention_rate_percent');
    });

    test('export rejects invalid report_type (validation)', async () => {
      const r = await http('POST', '/analytics/exports/csv', {
        headers: { Authorization: `Bearer ${analytics.token}`, 'Idempotency-Key': `int-exp-bad-${suffix}` },
        body: {
          report_type: 'unsupported_type',
          filters: { from: '2026-04-10T00:00:00.000Z', to: '2026-04-11T00:00:00.000Z' },
          columns: ['metric', 'value']
        }
      });
      expect(r.status).toBe(400);
    });
  });

  describe('trust-rating', () => {
    test('patient self credit tier (success)', async () => {
      const r = await http('GET', `/trust/credit-tiers/${patient.userId}`, {
        headers: { Authorization: `Bearer ${patient.token}` }
      });
      expect(r.status).toBe(200);
      expect(r.rawText).toContain('tier');
    });

    test('patient forbidden from another patient credit tier (authz)', async () => {
      const r = await http('GET', `/trust/credit-tiers/${otherPatient.userId}`, {
        headers: { Authorization: `Bearer ${patient.token}` }
      });
      expect(r.status).toBe(403);
    });

    test('ops can read fraud flags (success)', async () => {
      const r = await http('GET', '/trust/fraud-flags?page=1&page_size=20', {
        headers: { Authorization: `Bearer ${opsToken}` }
      });
      expect(r.status).toBe(200);
    });

    test('arbitrate missing appeal returns 404 (validation)', async () => {
      const r = await http('POST', '/appeals/00000000-0000-0000-0000-000000000999/arbitrate', {
        headers: { Authorization: `Bearer ${opsToken}`, 'Idempotency-Key': `int-arb-miss-${suffix}` },
        body: { outcome: 'UPHOLD', notes: 'missing appeal' }
      });
      expect(r.status).toBe(404);
      expect(r.rawText).toContain('NOT_FOUND');
    });
  });

  describe('files / identity-documents', () => {
    let documentId = '';

    test('patient creates identity document for self (success)', async () => {
      const r = await http('POST', '/identity-documents', {
        headers: { Authorization: `Bearer ${patient.token}`, 'Idempotency-Key': `int-id-${suffix}` },
        body: { document_type: 'passport', document_number: `INT-${suffix}`, country: 'US' }
      });
      expect(r.status).toBe(201);
      documentId = (r.body as { document_id?: string; id?: string }).document_id ?? (r.body as { id: string }).id;
      expect(documentId).toBeTruthy();
    });

    test('unrelated patient cannot read identity document (authz)', async () => {
      const r = await http('GET', `/identity-documents/${documentId}`, {
        headers: { Authorization: `Bearer ${otherPatient.token}` }
      });
      expect([403, 404]).toContain(r.status);
    });

    test('missing Idempotency-Key on create rejected (validation)', async () => {
      const r = await http('POST', '/identity-documents', {
        headers: { Authorization: `Bearer ${patient.token}` },
        body: { document_type: 'passport', document_number: `NOIDEM-${suffix}` }
      });
      expect(r.status).toBe(400);
      expect(r.rawText).toContain('IDEMPOTENCY_KEY_REQUIRED');
    });

    test('unknown identity document returns 404 (validation)', async () => {
      const r = await http('GET', '/identity-documents/00000000-0000-0000-0000-000000000999', {
        headers: { Authorization: `Bearer ${patient.token}` }
      });
      expect(r.status).toBe(404);
      expect(r.rawText).toContain('NOT_FOUND');
    });
  });

  describe('reservations — provider + staff scoped flow', () => {
    let confirmedReservationId = '';

    test('patient creates reservation assigned to provider; provider confirms (success)', async () => {
      const create = await http('POST', '/reservations', {
        headers: {
          Authorization: `Bearer ${patient.token}`,
          'Idempotency-Key': `int-res-prov-${suffix}`
        },
        body: {
          provider_id: provider.userId,
          start_time: '2027-05-10T10:00:00.000Z',
          end_time: '2027-05-10T11:00:00.000Z'
        }
      });
      expect(create.status).toBe(201);
      confirmedReservationId = (create.body as { reservation_id: string }).reservation_id;

      const confirm = await http('POST', `/reservations/${confirmedReservationId}/confirm`, {
        headers: {
          Authorization: `Bearer ${provider.token}`,
          'Idempotency-Key': `int-res-confirm-${suffix}`
        }
      });
      expect(confirm.status).toBe(200);
      expect(confirm.rawText).toContain('CONFIRMED');
    });

    test('patient reschedules own confirmed reservation (success)', async () => {
      const r = await http('POST', `/reservations/${confirmedReservationId}/reschedule`, {
        headers: {
          Authorization: `Bearer ${patient.token}`,
          'Idempotency-Key': `int-res-resched-${suffix}`
        },
        body: {
          new_start_time: '2027-05-11T10:00:00.000Z',
          new_end_time: '2027-05-11T11:00:00.000Z',
          reason: 'patient requested'
        }
      });
      expect(r.status).toBe(200);
      expect(r.rawText).toContain('RESCHEDULED');
    });

    test('unrelated user cannot cancel reservation (authz)', async () => {
      const r = await http('POST', `/reservations/${confirmedReservationId}/cancel`, {
        headers: {
          Authorization: `Bearer ${otherPatient.token}`,
          'Idempotency-Key': `int-res-cancel-forbid-${suffix}`
        },
        body: { reason: 'unrelated' }
      });
      expect(r.status).toBe(403);
    });
  });
});
