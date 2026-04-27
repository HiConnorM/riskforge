# RiskForge Progress

## Day 1 — Fintech Skeleton ✓
- [x] Monorepo created (apps + packages)
- [x] Redis running via docker compose
- [x] API boots and /health works
- [x] Worker boots and can ping Redis
- [x] pnpm dev runs both services

## Day 2 — Domain contracts ✓
- [x] @riskforge/domain package (types + zod schemas)
- [x] SimRequest, SimConfig types
- [x] Validation errors modeled

## Day 3 — Queue + job lifecycle ✓
- [x] BullMQ queue in @riskforge/infra
- [x] POST /v1/sims enqueues job
- [x] GET /v1/sims/:id returns status

## Phase 1: Architecture & Infrastructure ✓
- [x] packages/config — env validation with Zod, typed env object
- [x] packages/domain — full type system:
  - Discriminated union SimulationRequest (portfolio_risk | personal_cashflow_risk)
  - PortfolioRiskInput, PortfolioRiskResult with all quantitative fields
  - PersonalCashflowInput, PersonalCashflowResult with resilience scoring
  - All Zod schemas with superRefine business-logic validation
- [x] packages/engine — pure mathematical simulation engine:
  - core/rng.ts: Mulberry32 seeded PRNG (BigCrush tested, fully reproducible)
  - core/distributions.ts: Box-Muller normal, Student-t (via chi-squared scaling)
  - core/statistics.ts: quantiles, VaR, CVaR/ES, fractionBelow, argMax
  - portfolio/cholesky.ts: Cholesky decomposition with positive-definite validation
  - portfolio/simulatePortfolio.ts: GBM Monte Carlo — correlated multi-asset paths, drawdown tracking
  - personal/simulateCashflow.ts: Monthly cashflow simulation with stochastic risk events
  - Stress testing: vol multiplier, correlation blending
  - Interpretation: plain-English summaries, risk level classification
- [x] packages/infra — redis client, Pino logger (PII redaction), BullMQ queue, Redis cache
- [x] packages/database — full Prisma schema (users, orgs, jobs, results, API keys, audit log, usage events)
- [x] ops/docker-compose.yml — Redis 7 + Postgres 16 with health checks and persistent volumes

## Phase 2: Application Layer ✓
- [x] apps/api:
  - Fastify app factory (testable without starting listener)
  - POST /v1/simulations — validates, idempotency, path-limit guard, enqueues
  - GET /v1/simulations/:id — job status from BullMQ
  - GET /v1/simulations/:id/result — result from Redis cache
  - Centralised error handler with typed AppError hierarchy
  - 512 KB request body limit
- [x] apps/worker:
  - processors/portfolio-risk.processor.ts — validates, runs engine, caches result
  - processors/personal-cashflow.processor.ts — validates, runs engine, caches result
  - Non-retryable error detection (validation failures, engine errors)
  - Graceful shutdown on SIGTERM/SIGINT

## Next Steps: Phase 3
- [ ] Wire up Redis result storage end-to-end (start deps, run API + worker)
- [ ] Add Postgres + Prisma migrations (DATABASE_URL required)
- [ ] Add test fixtures (fixtures/portfolio/60-40.json, fixtures/personal/fragile.json)
- [ ] Benchmark engine throughput (scripts/bench.ts)
- [ ] Build web-lite frontend (Next.js + Tailwind)
- [ ] Add authentication (Clerk or Supabase Auth)
- [ ] Rate limiting middleware (Redis-backed, per-plan)
- [ ] Stripe billing integration

## How to Run

```bash
# Start dependencies (Redis + Postgres)
pnpm deps:up

# Start API (port 3000)
pnpm --filter @riskforge/api dev

# Start worker (separate terminal)
pnpm --filter @riskforge/worker dev

# Health check
curl http://localhost:3000/health

# Personal cashflow simulation
curl -X POST http://localhost:3000/v1/simulations \
  -H "Content-Type: application/json" \
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

# Portfolio simulation
curl -X POST http://localhost:3000/v1/simulations \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "portfolio_risk",
    "input": {
      "assets": [
        { "name": "US Stocks", "weight": 0.6, "mu": 0.08, "sigma": 0.16 },
        { "name": "Bonds", "weight": 0.3, "mu": 0.03, "sigma": 0.06 },
        { "name": "Crypto", "weight": 0.1, "mu": 0.15, "sigma": 0.80 }
      ],
      "corr": [[1, -0.1, 0.05], [-0.1, 1, -0.05], [0.05, -0.05, 1]]
    },
    "config": { "paths": 5000, "horizonDays": 252, "distribution": "student_t", "df": 5, "seed": 42 }
  }'
```
