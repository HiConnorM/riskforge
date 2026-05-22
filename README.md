# RiskForge

> Monte Carlo risk simulation as a service — portfolio drawdown / VaR / ES and
> personal cashflow resilience modeling, exposed over a clean HTTP API.

[![CI](https://github.com/HiConnorM/riskforge/actions/workflows/ci.yml/badge.svg)](https://github.com/HiConnorM/riskforge/actions/workflows/ci.yml)

RiskForge runs two families of stochastic simulations:

| Kind | What it answers |
|------|-----------------|
| `portfolio_risk` | Given assets with drift, vol, and a correlation matrix, what does the distribution of returns and drawdowns look like over an N-day horizon? |
| `personal_cashflow_risk` | Given income, expenses, savings, and a set of stochastic risk events, what is the probability of going negative over the next 1–60 months, and what emergency fund would prevent it? |

The engine is pure TypeScript, fully seeded, and deterministic — same input + same seed always produces identical output, which is required for reproducibility and audit.

---

## Table of contents

- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [Quickstart](#quickstart)
- [Configuration](#configuration)
- [HTTP API](#http-api)
- [Engine internals](#engine-internals)
- [Development workflow](#development-workflow)
- [CI/CD](#cicd)
- [Roadmap](#roadmap)
- [License](#license)

---

## Architecture

RiskForge is a pnpm monorepo with two runnable services and five shared libraries.

```
                       ┌─────────────────────────┐
        HTTP           │  apps/api (Fastify)     │
   ─────────────────▶  │                         │
                       │  • validates with Zod   │
                       │  • enforces path caps   │
                       │  • idempotency-keyed    │
                       │  • enqueues to BullMQ   │
                       └──────────┬──────────────┘
                                  │
                                  ▼
                       ┌─────────────────────────┐
                       │  Redis (BullMQ queue +  │
                       │  result cache)          │
                       └──────────┬──────────────┘
                                  │
                                  ▼
                       ┌─────────────────────────┐
                       │  apps/worker            │
                       │                         │
                       │  • re-validates payload │
                       │  • runs @riskforge/     │
                       │    engine (pure math)   │
                       │  • caches result        │
                       └─────────────────────────┘
```

### Design principles

1. **Pure engine.** `packages/engine` has zero I/O. It accepts validated input, returns a result object, and never touches Redis, the network, or the clock for anything except `elapsedMs`. This keeps simulations deterministic and trivially testable.
2. **Validate at the edge AND at the consumer.** The API validates with Zod before enqueueing; the worker re-validates after dequeueing. Defense in depth against corrupted queue payloads.
3. **Fail fast on bad env.** `@riskforge/config` parses `process.env` with Zod at module load. A malformed `REDIS_URL` or missing required var crashes the process at startup with a precise error.
4. **Deterministic non-retry.** Worker processors throw `UnrecoverableError` for validation failures and `SimulationError`s, so BullMQ skips the remaining attempts instead of burning retries on errors that will never succeed.
5. **No PII / secrets in logs.** Pino is configured with redaction paths for `authorization`, `cookie`, `*.token`, `*.apiKey`, `*.password`, `*.secret`.

---

## Repository layout

```
riskforge/
├── apps/
│   ├── api/                    Fastify HTTP service — POST /v1/simulations
│   └── worker/                 BullMQ consumer — runs the engine
├── packages/
│   ├── config/                 Zod-validated env (import { env } from '@riskforge/config')
│   ├── domain/                 Types + Zod schemas (the contract surface)
│   ├── engine/                 Pure Monte Carlo engine — no I/O
│   ├── infra/                  Redis client, BullMQ queue, Pino logger, cache helpers
│   └── database/               Prisma schema (Postgres) — Phase 3
├── ops/
│   └── docker-compose.yml      Local Redis + Postgres
├── docs/
│   └── progress.md             Phase-by-phase build log
├── .github/workflows/ci.yml    CI: typecheck + lint + deps smoke
└── .env.example                Documented env contract
```

### Dependency graph

```
apps/api      → config, domain, infra
apps/worker   → config, domain, engine, infra
engine        → domain
infra         → (none — leaf)
config        → (none — leaf)
domain        → (none — leaf)
database      → (none — leaf; not yet wired into services)
```

There are no cycles. `infra` and `config` are leaves so they can be imported anywhere.

---

## Quickstart

### Prerequisites

- Node.js 20+ (LTS)
- pnpm 9.15.4 (`corepack enable && corepack prepare pnpm@9.15.4 --activate`)
- Docker (for Redis + Postgres)

### 60-second setup

```bash
git clone https://github.com/HiConnorM/riskforge.git
cd riskforge
pnpm install
cp .env.example .env
pnpm deps:up                                          # Redis + Postgres
pnpm --filter @riskforge/api dev                      # terminal 1
pnpm --filter @riskforge/worker dev                   # terminal 2
curl http://localhost:3000/health
```

You should see `{"status":"ok","version":"1.0.0",...}`.

### Run your first simulation

```bash
curl -X POST http://localhost:3000/v1/simulations \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: demo-1" \
  -d '{
    "kind": "personal_cashflow_risk",
    "input": {
      "monthlyIncome": 4200,
      "monthlyFixedExpenses": 2600,
      "monthlyVariableExpenses": 700,
      "currentSavings": 1500,
      "horizonMonths": 12,
      "riskEvents": [
        { "name": "Car repair", "category": "car", "probabilityPerMonth": 0.06, "minCost": 600, "maxCost": 2000 },
        { "name": "Pet emergency", "category": "pet", "probabilityPerMonth": 0.03, "minCost": 300, "maxCost": 2500 }
      ]
    },
    "config": { "paths": 5000, "seed": 42 }
  }'
# → {"jobId":"<id>","status":"queued"}

curl http://localhost:3000/v1/simulations/<id>          # poll status
curl http://localhost:3000/v1/simulations/<id>/result   # fetch result
```

---

## Configuration

All env vars are documented in [`.env.example`](.env.example) and parsed by [`packages/config/src/env.ts`](packages/config/src/env.ts). The contract:

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `NODE_ENV` | no | `development` | `production` redacts unknown error messages |
| `PORT` | no | `3000` | API listen port |
| `LOG_LEVEL` | no | `info` | Pino level |
| `ENGINE_VERSION` | no | `1.0.0` | Tagged on every job for reproducibility |
| `REDIS_URL` | no | `redis://localhost:6379` | Queue + cache |
| `DATABASE_URL` | only for Prisma | — | Postgres connection string |
| `WORKER_CONCURRENCY` | no | `4` | Parallel jobs per worker process |
| `RESULT_TTL_SECONDS` | no | `86400` | How long results live in Redis |
| `MAX_PATHS_ANONYMOUS` | no | `5000` | Path cap for unauthenticated callers |
| `MAX_PATHS_FREE` | no | `10000` | (Reserved — auth-gated) |
| `MAX_PATHS_PRO` | no | `500000` | (Reserved — auth-gated) |
| `MAX_PATHS_ENTERPRISE` | no | `5000000` | (Reserved — auth-gated) |

Bad config = process exits at startup with a Zod error. No silent fallbacks.

---

## HTTP API

Base URL: `http://localhost:3000` (default).

### `POST /v1/simulations`

Enqueue a simulation job.

**Headers**

| Header | Required | Notes |
|--------|----------|-------|
| `Content-Type` | yes | `application/json` |
| `Idempotency-Key` | no | Up to 128 chars. Within 24h, the same key returns the same `jobId`. |

**Body — portfolio risk**

```json
{
  "kind": "portfolio_risk",
  "input": {
    "assets": [
      { "name": "US Stocks", "weight": 0.6, "mu": 0.08, "sigma": 0.16 },
      { "name": "Bonds",     "weight": 0.3, "mu": 0.03, "sigma": 0.06 },
      { "name": "Crypto",    "weight": 0.1, "mu": 0.15, "sigma": 0.80 }
    ],
    "corr": [[1, -0.1, 0.05], [-0.1, 1, -0.05], [0.05, -0.05, 1]]
  },
  "config": {
    "paths": 5000,
    "horizonDays": 252,
    "distribution": "student_t",
    "df": 5,
    "seed": 42,
    "stress": { "volMultiplier": 1.5, "corrTarget": 0.85, "corrBlend": 0.5 }
  }
}
```

Required input invariants (enforced by Zod):
- Asset weights must sum to 1 (tolerance 1e-5)
- `corr` must be n×n with 1's on the diagonal, entries in [-1, 1]
- `paths` ∈ [1 000, 5 000 000], `horizonDays` ∈ [1, 5 000]
- If `distribution: "student_t"`, `df` must be ≥ 3

**Body — personal cashflow**

```json
{
  "kind": "personal_cashflow_risk",
  "input": {
    "monthlyIncome": 4200,
    "monthlyFixedExpenses": 2600,
    "monthlyVariableExpenses": 700,
    "currentSavings": 1500,
    "horizonMonths": 12,
    "riskEvents": [
      { "name": "Car repair", "category": "car", "probabilityPerMonth": 0.06, "minCost": 600, "maxCost": 2000 }
    ]
  },
  "config": { "paths": 5000, "seed": 42 }
}
```

**Responses**

| Code | Shape | Meaning |
|------|-------|---------|
| `202` | `{ jobId, status: "queued" }` | Job enqueued |
| `200` | `{ jobId, status, cached: true }` | Idempotency hit |
| `400` | `{ error: { code: "VALIDATION_ERROR", message, details } }` | Bad body |
| `402` | `{ error: { code: "PLAN_LIMIT_EXCEEDED", message } }` | Paths > anonymous cap |
| `500` | `{ error: { code: "INTERNAL_ERROR", message } }` | Unexpected |

### `GET /v1/simulations/:id`

Poll job state. Returns BullMQ status (`waiting`, `active`, `completed`, `failed`, `delayed`).

### `GET /v1/simulations/:id/result`

Fetch the completed result.

| Code | Shape |
|------|-------|
| `200` | Full result object (see [Engine internals](#engine-internals)) |
| `202` | Still running (poll status endpoint) |
| `404` | Unknown job, or result expired from cache |
| `422` | Job failed (`{ error: { code: "JOB_FAILED", details: { failedReason } } }`) |

### `GET /health`

Liveness probe. Returns 200 if Redis is reachable, 503 otherwise.

---

## Engine internals

The engine is the heart of the system. It's worth knowing how it works.

### Portfolio Monte Carlo ([`packages/engine/src/portfolio/simulatePortfolio.ts`](packages/engine/src/portfolio/simulatePortfolio.ts))

For each path:

1. Draw `n` independent N(0,1) variates (Box-Muller).
2. Correlate them via Cholesky decomposition of the correlation matrix: `z_corr = L z`.
3. If `distribution: "student_t"`, scale by `sqrt(df / W)` where `W ~ χ²(df)` — preserves correlation structure, fattens tails.
4. GBM step per asset, per day: `S_i(t) = S_i(t-1) · exp((μ - ½σ²)·dt + σ·√dt · z_corr_i)`.
5. Aggregate to portfolio value `Σ w_i · S_i(T)`, track running peak and max drawdown.

Output includes VaR(95/99), Expected Shortfall (CVaR), drawdown probabilities at 10/20/30/50%, annualized vol, and a plain-English risk-level summary.

### Personal cashflow Monte Carlo ([`packages/engine/src/personal/simulateCashflow.ts`](packages/engine/src/personal/simulateCashflow.ts))

For each path, for each month:
1. Apply regular net cashflow.
2. For each risk event, sample whether it occurs this month (Bernoulli) and uniform-draw cost in `[minCost, maxCost]` if so.
3. Track whether balance ever went negative or below the emergency threshold.

Output includes probability below zero, recommended emergency fund (the amount that would push p05 ending balance to ≥ 0), top risk events by cost contribution, and an actionable resilience summary.

### Reproducibility

Every job records the `seed` it ran with (auto-generated if not provided) and the `engineVersion`. Re-running the same input with the same seed and engine version is guaranteed to produce identical output, byte-for-byte.

The PRNG is Mulberry32 — fast, seeded, passes BigCrush. See [`packages/engine/src/core/rng.ts`](packages/engine/src/core/rng.ts).

---

## Development workflow

### Common commands

```bash
pnpm install                    # install everything
pnpm deps:up                    # docker compose up redis + postgres
pnpm deps:down                  # tear them down
pnpm typecheck                  # tsc --noEmit across all packages
pnpm lint                       # run lint in every package
pnpm --filter @riskforge/api dev      # API with tsx watch
pnpm --filter @riskforge/worker dev   # worker with tsx watch
```

### Adding a new simulation kind

1. Add the literal to `SimulationKind` in [`packages/domain/src/simulation-kind.ts`](packages/domain/src/simulation-kind.ts).
2. Create `packages/domain/src/<kind>/{types.ts,schemas.ts}` mirroring an existing one.
3. Export from `packages/domain/src/index.ts` and include in the discriminated union.
4. Implement the pure function in `packages/engine/src/<kind>/<kind>.ts` taking `(input, config, engineVersion)` and returning a typed result.
5. Add a worker processor in `apps/worker/src/processors/`. Throw `UnrecoverableError` for validation failures and any `SimulationError`.
6. Route to it from the `kind` switch in `apps/worker/src/worker.ts`.

The API needs no changes — it dispatches based on the discriminated union.

### Code conventions

- **TypeScript strict everywhere.** No `any`, no unchecked casts. `Float64Array` access uses `?? 0` to satisfy `noUncheckedIndexedAccess`.
- **Schemas are the source of truth.** Types are `z.infer<typeof Schema>` — never redeclared.
- **No `process.env` in business logic.** Read it once in `packages/config`, import the typed `env` object everywhere else.
- **Errors carry codes.** All API errors extend `AppError` with a stable `code` field. Engine errors are `SimulationError` with a `SimulationErrorCode`.
- **Pure functions in the engine.** No `Date.now()` outside `meta.elapsedMs`. No randomness without an injected RNG.

---

## CI/CD

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and pull request to `main`:

1. **Typecheck** — strict TypeScript across all 6 production packages.
2. **Lint** — `pnpm -r lint` (currently a stub per-package; hook up `eslint` to fail real on landing).
3. **Smoke** — boots `docker-compose` deps, waits for Redis, tears down. Catches regressions in env validation or compose definitions.

Concurrency groups cancel superseded runs to save CI minutes. Lockfile is enforced via `pnpm install --frozen-lockfile`.

### Branch strategy

- `main` is the canonical branch. CI must be green before merge.
- Feature branches: short-lived, named `<author>/<topic>`. Opened as PRs against `main`.
- Force-push only into your own branch — never `main`.

### Releases (post-launch)

Plan is conventional commits → semantic version bumps → tagged Docker images for `apps/api` and `apps/worker`. Not yet wired.

---

## Roadmap

Status as of this commit. Tracked in detail in [`docs/progress.md`](docs/progress.md).

### Done

- [x] Pure engine (portfolio + personal cashflow), seeded and reproducible
- [x] Fastify API with Zod validation, idempotency, structured errors
- [x] BullMQ worker with non-retryable error handling
- [x] Redis result cache with TTL
- [x] Centralized env validation
- [x] CI: typecheck + lint + smoke

### Next (Phase 3)

- [ ] Prisma migrations + persistence layer wired into API/worker
- [ ] Test suite (Vitest) with engine reproducibility tests + API integration tests
- [ ] `scripts/bench.ts` — engine throughput benchmark
- [ ] Web frontend (Next.js)
- [ ] Authentication (Clerk or Supabase) + per-plan rate limiting
- [ ] Stripe billing
- [ ] Dockerfiles for `apps/api` and `apps/worker`, deploy to Fly.io / Railway
- [ ] Observability: OpenTelemetry traces from API → worker → engine

---

## License

UNLICENSED — private project. Contact the author before reuse.
