#!/usr/bin/env bash
set -u

# Always run from this script's directory (repo root). CI often invokes tests without a prior cd.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

compose_style=""
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  compose_style="docker"
elif command -v docker-compose >/dev/null 2>&1; then
  compose_style="docker-compose"
fi

compose() {
  if [[ "$compose_style" == "docker" ]]; then
    docker compose "$@"
    return $?
  fi
  docker-compose "$@"
}

have_compose() {
  [[ -n "$compose_style" ]]
}

DEFAULT_LIVE_API_BASE="http://localhost:3001/api/v1"
REQUESTED_API_BASE="${API_BASE_URL:-}"

is_local_api_base() {
  case "$1" in
    *localhost*|*127.0.0.1*) return 0 ;;
    *) return 1 ;;
  esac
}

if [[ -z "$REQUESTED_API_BASE" ]]; then
  LIVE_API_BASE="$DEFAULT_LIVE_API_BASE"
elif is_local_api_base "$REQUESTED_API_BASE"; then
  LIVE_API_BASE="${REQUESTED_API_BASE%/}"
elif [[ "${RUN_TESTS_ALLOW_REMOTE_API:-0}" == "1" ]]; then
  LIVE_API_BASE="${REQUESTED_API_BASE%/}"
else
  LIVE_API_BASE="$DEFAULT_LIVE_API_BASE"
  echo "NOTICE: Ignoring non-local API_BASE_URL=$REQUESTED_API_BASE"
  echo "        Using local Docker endpoint $LIVE_API_BASE (set RUN_TESTS_ALLOW_REMOTE_API=1 to override)."
fi

LIVE_API_BASE="${LIVE_API_BASE%/}"
export API_BASE_URL="$LIVE_API_BASE"

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

RUN_NODE_TESTS_IN_DOCKER=0

if [[ "$need_node_modules" == "1" ]]; then
  if [[ "${RUN_TESTS_ALLOW_NPM_CI:-}" == "1" ]] && [[ "${RUN_TESTS_SKIP_NPM_CI:-}" != "1" ]] && [[ "${RUN_TESTS_STRICT:-}" != "1" ]]; then
    echo "Unit tests require devDependencies - RUN_TESTS_ALLOW_NPM_CI=1 set; running npm ci in $(pwd) ..."
    npm ci
  else
    if have_compose; then
      RUN_NODE_TESTS_IN_DOCKER=1
      echo "NOTICE: node_modules is missing. Running Node-based suites inside Docker app container."
      echo "       - Host-side npm ci remains disabled by default."
      echo "       - To opt into local install: RUN_TESTS_ALLOW_NPM_CI=1 bash run_tests.sh"
    else
      if [[ "${RUN_TESTS_STRICT:-}" == "1" ]]; then
        echo "ERROR: node_modules is missing, strict mode forbids host npm ci, and docker compose is unavailable."
        echo "Install Docker (recommended) or provide node_modules before running strict mode."
        exit 1
      fi
      echo "NOTICE: node_modules is missing. Skipping host-side install (strict default)."
      echo "       - To use Docker (preferred):  docker compose up --build"
      echo "       - To opt into a local install: RUN_TESTS_ALLOW_NPM_CI=1 bash run_tests.sh"
      echo "       - Unit suite will be skipped for this run."
      SKIP_UNIT_TESTS=1
    fi
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

health_http_code() {
  curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 2 --max-time 12 "${LIVE_API_BASE}/health" 2>/dev/null || printf '%s' '000'
}

api_health_ok() {
  [[ "$(health_http_code)" == "200" ]]
}

should_autostart_docker() {
  [[ "${RUN_TESTS_AUTOSTART_DOCKER:-1}" == "1" ]] || return 1
  is_local_api_base "$LIVE_API_BASE" || return 1
  have_compose || return 1
  return 0
}

compose_up_detached() {
  if [[ "${RUN_TESTS_DOCKER_BUILD:-1}" == "1" ]]; then
    compose up -d --build
    return $?
  fi
  compose up -d
}

ensure_live_api_ready() {
  if api_health_ok; then
    return 0
  fi

  if ! should_autostart_docker; then
    echo ""
    echo "ERROR: API is not reachable at $LIVE_API_BASE (health not HTTP 200)."
    echo "From this directory run: docker compose up -d --build"
    echo "Or set SKIP_LIVE_TESTS=1 to run unit tests only (dev mode)."
    return 1
  fi

  echo ""
  echo "=== API not reachable at $LIVE_API_BASE - starting Docker Compose ==="
  if ! compose_up_detached; then
    echo "ERROR: docker compose up -d failed. Start Docker Desktop (or the engine), then retry."
    return 1
  fi
  echo "Waiting for GET $LIVE_API_BASE/health (up to ~4 minutes for image build/migrations on first run)..."
  waited=0
  max_wait_seconds=240
  while [[ "$waited" -lt "$max_wait_seconds" ]]; do
    if api_health_ok; then
      echo "API is healthy."
      return 0
    fi
    sleep 2
    waited=$((waited + 2))
    if [[ $((waited % 20)) -eq 0 ]]; then
      echo "  ... still waiting (${waited}s / ${max_wait_seconds}s)"
    fi
  done

  echo "ERROR: API still not healthy. Try: docker compose logs -f app"
  echo "First-time builds can take several minutes; run bash run_tests.sh again when the app container is up."
  return 1
}

if [[ "$RUN_NODE_TESTS_IN_DOCKER" == "1" ]]; then
  if ! ensure_live_api_ready; then
    exit 1
  fi
fi

if [[ "${SKIP_UNIT_TESTS:-}" == "1" ]]; then
  if [[ "${RUN_TESTS_STRICT:-}" == "1" ]]; then
    echo "ERROR: Unit suite skipped (node_modules missing) under RUN_TESTS_STRICT=1."
    exit 1
  fi
  echo "[SKIP] Unit tests - node_modules missing and strict mode refuses host-side install"
else
  if [[ "$RUN_NODE_TESTS_IN_DOCKER" == "1" ]]; then
    run_suite "Unit tests" "compose exec -T app npm run test:unit"
  else
    run_suite "Unit tests" "npm run test:unit"
  fi
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
  if ! ensure_live_api_ready; then
    exit 1
  fi

  if [[ "$RUN_NODE_TESTS_IN_DOCKER" == "1" ]]; then
    run_suite "Integration tests" "compose exec -T -e API_BASE_URL=http://localhost:3000/api/v1 app npm run test:integration"
  else
    run_suite "Integration tests" "API_BASE_URL=\"$LIVE_API_BASE\" npm run test:integration"
  fi
  run_suite "API tests" "API_BASE_URL=\"$LIVE_API_BASE\" npm run test:api"
  run_suite "Performance check" "API_BASE_URL=\"$LIVE_API_BASE\" npm run test:perf"
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
