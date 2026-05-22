# Contributing to RiskForge

Short version: branch, change, PR, get CI green, merge.

## Workflow

1. Fork or clone, then create a branch off `main`:
   ```bash
   git checkout -b <yourname>/<short-topic>
   ```
2. Make changes. Run locally:
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm deps:up
   pnpm --filter @riskforge/api dev   # in another terminal
   pnpm --filter @riskforge/worker dev
   ```
3. Open a PR against `main`. CI (typecheck + lint + smoke) must pass.
4. Squash-merge once approved. Delete your branch after merge.

## Commit conventions

Use [Conventional Commits](https://www.conventionalcommits.org/) — short, imperative, scope optional:

```
feat: add VaR99 to portfolio summary
fix(api): correct idempotency key length cap
refactor(engine): hoist drift terms out of the path loop
chore(ci): bump pnpm cache key
docs: clarify Cholesky stress semantics
```

## Architecture rules of thumb

- **`packages/engine` is pure.** No I/O, no network, no clock except `elapsedMs`. If you need entropy, take an RNG argument.
- **Schemas drive types.** When you add a field, add it to the Zod schema; the type comes from `z.infer<typeof X>` for free.
- **Config lives in one place.** Don't reach for `process.env` outside `packages/config/src/env.ts`. Import the typed `env` object.
- **Worker failures must declare retryability.** Throw `UnrecoverableError` for anything deterministic (validation, math). Let transient errors (Redis blip) bubble so BullMQ can back off and retry.
- **Errors carry codes.** API errors extend `AppError` with a stable `code`. Engine failures use `SimulationError`. Never return raw `Error.message` to the client in production.

## Adding dependencies

- Add to the specific package that needs it, not the root.
- Pin major versions. Avoid `^` for runtime-critical libraries (e.g. `zod`, `bullmq`).
- Re-run `pnpm install` and commit the updated `pnpm-lock.yaml` in the same commit.

## Pull request checklist

- [ ] Tests added / updated (when tests exist)
- [ ] `pnpm typecheck` passes locally
- [ ] `pnpm lint` passes locally
- [ ] No `process.env` reads outside `packages/config`
- [ ] No new circular imports between packages
- [ ] `docs/progress.md` updated if this completes a roadmap item
- [ ] README updated if API surface or env contract changed
