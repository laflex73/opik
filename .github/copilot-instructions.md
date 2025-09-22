# Opik AI Agent Coding Instructions

These instructions are for AI coding agents working in the Opik monorepo. They summarize essential project structure, workflows, and conventions to maximize agent productivity and code quality.

---

## Architecture Overview

- **Monorepo**: Multiple apps in `apps/` (backend, frontend, docs, Python backend, guardrails, sandbox executor)
- **Backends**:
  - `opik-backend/`: Java 21, Dropwizard, MySQL, ClickHouse. Layered: Resources → Services → DAOs → Models. See `pom.xml`, `src/`, and `config.yml`.
  - `opik-python-backend/`, `opik-guardrails-backend/`: Python, FastAPI/Flask, see `requirements.txt`, `src/`.
- **Frontend**: `opik-frontend/` (React 18, TypeScript, Vite, Tailwind, Zustand). See `src/`, `package.json`, `tailwind.config.ts`.
- **SDKs**: `sdks/python/`, `sdks/typescript/`, `sdks/opik_optimizer/` for client libraries.
- **Docs**: `opik-documentation/` (includes SDK docs).
- **Testing**: End-to-end in `tests_end_to_end/`, load in `tests_load/`, component/unit tests in each app.

---

## Key Workflows

- **Build/Run**:
  - Java backend: `mvn clean install` in `apps/opik-backend/` (see `README.md` for DB/migration steps)
  - Frontend: `pnpm install && pnpm dev` in `apps/opik-frontend/`
  - Python: `pip install -e .` or `python -m <module>` in relevant `src/`
- **Testing**:
  - Java: `mvn test` (unit/integration)
  - Frontend: `pnpm test` (Vitest), `pnpm e2e` (Playwright)
  - Python: `pytest` in backend/SDKs
  - E2E: `pytest` in `tests_end_to_end/`
- **Migrations**:
  - Java: `run_db_migrations.sh` (MySQL/ClickHouse)
  - Python: Alembic or custom scripts (see `src/`)

---

## Project-Specific Conventions

- **Branch naming**: `{username}/{ticket}-{summary}` (see `.github/copilot-instructions.md` for examples)
- **Commit messages**: `[OPIK-1234] [FE] Add feature` (see examples)
- **Backend**:
  - Always use transactions for DB writes (see `TransactionTemplate` in Java)
  - Use `@Slf4j` for logging, surround values in logs with single quotes
  - Place MySQL migrations in `liquibase/db-app-state/migrations/`, ClickHouse in `db-app-analytics/migrations/`
- **Frontend**:
  - Use `useMemo`/`useCallback` for performance
  - Use shadcn/ui, Tailwind, and established component patterns
  - State: Zustand, data: TanStack Query
  - Place E2E tests in `e2e/`, unit in `src/`
- **Python**:
  - Main entry: `opik.Opik` (SDK)
  - Use Pydantic for validation, httpx for HTTP
  - Test naming: `test_WHAT__CASE__EXPECTED`
- **Testing**:
  - Use realistic fixtures, avoid sensitive data
  - Place integration/E2E tests in dedicated folders

---

## Integration & Cross-Component Patterns

- **APIs**: REST (Java backend), OpenAPI docs in `docs/`, SDKs auto-generate clients
- **DB**: MySQL/ClickHouse for backend, SQLite for local/dev
- **Docker**: Compose files in `deployment/docker-compose/`, Helm in `helm_chart/`
- **CI/CD**: Follows branch/commit conventions, runs builds/tests for all major apps

---

## References

- See each app's `README.md` for details and commands
- `.github/copilot-instructions.md` (this file): for agent conventions
- `deployment/docker-compose/README.md`: for local stack
- `apps/opik-backend/README.md`, `apps/opik-frontend/README.md`: for app-specific details

---

**If a convention or workflow is unclear, ask for clarification or check the relevant README.**
