#!/usr/bin/env bash
set -u

# Always run from this script's directory (repo root). CI often invokes tests without a prior cd.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# Strict-mode behaviour: by default this runner is Docker-first. Unit tests run
# inside the `app` container (built by docker-compose.yml), which already has
# devDependencies installed at image build time. The local `npm ci` fallback
# below is an *opt-in escape hatch* for developer machines that are running the
# unit suite without Docker; it is skipped unless explicitly enabled.
#
# Controls:
#   RUN_TESTS_STRICT=1                 → refuse to install host deps, fail fast if missing.
#   RUN_TESTS_ALLOW_NPM_CI=1           → enable the legacy host-side `npm ci` fallback.
#   RUN_TESTS_SKIP_NPM_CI=1            → legacy alias that already disables the install.
#
# Default (no flags): behave strictly — do not install. This satisfies the
# "no silent runtime dependency installation" strict-environment policy.
need_node_modules=0
if [[ ! -f node_modules/jest/bin/jest.js ]] || [[ ! -f node_modules/ts-jest/package.json ]]; then
  need_node_modules=1
fi

if [[ "$need_node_modules" == "1" ]]; then
  if [[ "${RUN_TESTS_STRICT:-}" == "1" ]]; then
    echo "ERROR: node_modules is missing and RUN_TESTS_STRICT=1 forbids host-side install."
    echo "Run tests inside Docker: docker-compose up --build   (or)   docker compose run --rm app npm run test:unit"
    exit 1
  fi
  if [[ "${RUN_TESTS_ALLOW_NPM_CI:-}" == "1" ]] && [[ "${RUN_TESTS_SKIP_NPM_CI:-}" != "1" ]]; then
    echo "Unit tests require devDependencies — RUN_TESTS_ALLOW_NPM_CI=1 set; running npm ci in $(pwd) ..."
    npm ci
  else
    echo "NOTICE: node_modules is missing. Skipping host-side install (strict default)."
    echo "       - To use Docker (preferred):  docker-compose up --build"
    echo "       - To opt into a local install: RUN_TESTS_ALLOW_NPM_CI=1 bash run_tests.sh"
    echo "       - Unit suite will be skipped for this run."
    SKIP_UNIT_TESTS=1
  fi
fi

TOTAL=0
PASSED=0
FAILED=0

run_suite() {
  local suite_name="$1"
  local command="$2"

  TOTAL=$((TOTAL + 1))
  echo ""
  echo "=== Running $suite_name ==="

  if eval "$command"; then
    PASSED=$((PASSED + 1))
    echo "[PASS] $suite_name"
  else
    FAILED=$((FAILED + 1))
    echo "[FAIL] $suite_name"
  fi
}

echo "Test runner started"
echo "- Test sources live under tests/ (tests/unit_tests, tests/integration_tests, tests/API_tests)"
echo "- Suite order: unit -> integration -> API -> perf. Any failure exits non-zero."
echo "- Live suites (integration/API/perf) require a running API + migrated DB (docker-compose up -d)"
echo "- After changing server code, rebuild/restart the API (e.g. docker compose up --build) so tests hit the latest image"
echo "- On Windows under OneDrive, if docker compose build fails with invalid file request Dockerfile, run: ./docker-build.sh --no-cache app (or DOCKER_BUILDKIT=0 docker compose build ...)"
echo "- If you see 404 on /support/tickets/*/escalate, /access/audit-logs/verify-integrity, /sensitive-words, or missing analytics routes, the running container is stale — rebuild: docker compose up -d --build"
echo "- Override API URL with API_BASE_URL if needed"
echo "- Performance gate checks p95 latency on /health (<300ms by default)"
echo "- Dev-only soft-skip: SKIP_LIVE_TESTS=1 runs unit only (not permitted in strict mode)"
echo "- Strict mode: RUN_TESTS_STRICT=1 refuses host-side npm ci AND refuses SKIP_LIVE_TESTS"
echo "- Auto-start: if API is down and RUN_TESTS_AUTOSTART_DOCKER!=0 the runner brings the stack up and waits for /health"

if [[ "${SKIP_UNIT_TESTS:-}" == "1" ]]; then
  if [[ "${RUN_TESTS_STRICT:-}" == "1" ]]; then
    echo "ERROR: Unit suite skipped (node_modules missing) under RUN_TESTS_STRICT=1."
    exit 1
  fi
  echo "[SKIP] Unit tests — node_modules missing and strict mode refuses host-side install"
else
  run_suite "Unit tests" "npm run test:unit"
fi

if [[ "${SKIP_LIVE_TESTS:-}" == "1" ]]; then
  if [[ "${RUN_TESTS_STRICT:-}" == "1" ]]; then
    echo "ERROR: SKIP_LIVE_TESTS=1 is not allowed under RUN_TESTS_STRICT=1."
    echo "Strict mode requires integration + API + performance suites to run."
    exit 1
  fi
  echo ""
  echo "=== Skipping live suites (SKIP_LIVE_TESTS=1) ==="
  echo "[SKIP] Integration tests — unset SKIP_LIVE_TESTS and start the stack to run them"
  echo "[SKIP] API tests"
  echo "[SKIP] Performance check"
else
  LIVE_API_BASE="${API_BASE_URL:-http://localhost:3001/api/v1}"
  LIVE_API_BASE="${LIVE_API_BASE%/}"

  health_http_code() {
    curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 2 --max-time 12 "${LIVE_API_BASE}/health" 2>/dev/null || printf '%s' '000'
  }

  api_health_ok() {
    [[ "$(health_http_code)" == "200" ]]
  }

  should_autostart_docker() {
    [[ "${RUN_TESTS_AUTOSTART_DOCKER:-1}" == "1" ]] || return 1
    case "$LIVE_API_BASE" in
      *localhost*|*127.0.0.1*) ;;
      *) return 1 ;;
    esac
    command -v docker >/dev/null 2>&1 || return 1
    docker compose version >/dev/null 2>&1 || return 1
    return 0
  }

  if ! api_health_ok; then
    if should_autostart_docker; then
      echo ""
      echo "=== API not reachable at $LIVE_API_BASE — starting Docker Compose ==="
      if ! docker compose up -d; then
        echo "ERROR: docker compose up -d failed. Start Docker Desktop (or the engine), then retry."
        exit 1
      fi
      echo "Waiting for GET $LIVE_API_BASE/health (up to ~4 minutes for image build/migrations on first run)..."
      waited=0
      max_wait=120
      while [[ "$waited" -lt "$max_wait" ]]; do
        if api_health_ok; then
          echo "API is healthy."
          break
        fi
        sleep 2
        waited=$((waited + 1))
        if [[ $((waited % 10)) -eq 0 ]]; then
          echo "  ... still waiting (${waited}s / $((max_wait * 2))s)"
        fi
      done
      if ! api_health_ok; then
        echo "ERROR: API still not healthy. Try: docker compose logs -f app"
        echo "First-time builds can take several minutes; run bash run_tests.sh again when the app container is up."
        exit 1
      fi
    else
      echo ""
      echo "ERROR: API is not reachable at $LIVE_API_BASE (health not HTTP 200)."
      echo "From this directory run: docker compose up -d"
      echo "Or set SKIP_LIVE_TESTS=1 to run unit tests only (dev mode)."
      exit 1
    fi
  fi

  run_suite "Integration tests" "npm run test:integration"
  run_suite "API tests" "npm run test:api"
  run_suite "Performance check" "npm run test:perf"
fi

echo ""
echo "=== Final Summary ==="
echo "total=$TOTAL"
echo "passed=$PASSED"
echo "failed=$FAILED"

if [[ $FAILED -gt 0 ]]; then
  exit 1
fi

exit 0
