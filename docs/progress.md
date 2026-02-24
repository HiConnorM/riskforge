# RiskForge Progress

## Day 1 — Fintech Skeleton
- [ ] Monorepo created (apps + packages)
- [ ] Redis running via docker compose
- [ ] API boots and /health works
- [ ] Worker boots and can ping Redis
- [ ] pnpm dev runs both services

## Day 2 — Domain contracts
- [ ] Add @riskforge/domain package (types + zod schemas)
- [ ] Define SimRequest, SimConfig
- [ ] Validation errors modeled

## Day 3 — Queue + job lifecycle
- [ ] Add BullMQ queue in @riskforge/infra
- [ ] POST /v1/sims enqueues job
- [ ] GET /v1/sims/:id returns status
