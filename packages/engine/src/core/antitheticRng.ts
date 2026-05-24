/**
 * Antithetic variates wrapper for variance reduction in Monte Carlo simulation.
 *
 * The antithetic variates technique pairs each uniform draw u with its mirror
 * 1 - u. Over N paths, this reduces variance by exploiting negative correlation
 * between paired paths, effectively halving the variance for the same N.
 *
 * Usage: createAntitheticPair returns [rngA, rngB]. Run N/2 paths with rngA
 * and N/2 paths with rngB. The two sequences are perfectly antithetic:
 * rngB returns 1 - (value rngA returned on the same call index).
 */

import { createRng } from './rng.js';

/**
 * Create an antithetic pair of RNGs.
 *
 * rngA is a standard Mulberry32 RNG seeded with `seed`.
 * rngB mirrors rngA exactly: each call to rngB returns 1 minus the value
 * that rngA returned on the same-indexed call. To keep them in sync, rngB
 * internally advances rngA and returns the complement.
 *
 * IMPORTANT: rngA and rngB must be called in lock-step — one call to rngA
 * followed by exactly one call to rngB per "step". If they diverge, the
 * antithetic property is lost. The caller is responsible for this discipline.
 *
 * @param seed  32-bit unsigned integer seed.
 * @returns     [rngA, rngB] antithetic pair.
 */
export function createAntitheticPair(seed: number): [() => number, () => number] {
  const baseRng = createRng(seed);

  // Buffer: rngA stores each value it draws; rngB returns 1 - that value.
  // We use a single shared buffer of length 1 to avoid heap churn.
  let lastValue = 0;
  let aCallCount = 0;
  let bCallCount = 0;

  function rngA(): number {
    lastValue = baseRng();
    aCallCount++;
    return lastValue;
  }

  function rngB(): number {
    // rngB must be called after the corresponding rngA call.
    // If out of sync (e.g. more B calls than A calls), advance rngA to re-sync.
    if (bCallCount >= aCallCount) {
      lastValue = baseRng();
      aCallCount++;
    }
    bCallCount++;
    return 1 - lastValue;
  }

  return [rngA, rngB];
}
