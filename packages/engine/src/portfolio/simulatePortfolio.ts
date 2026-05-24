/**
 * Portfolio Monte Carlo simulation engine.
 *
 * Algorithm (per path):
 *   For each trading day t in [1, horizonDays]:
 *     1. Draw n independent N(0,1) variates.
 *     2. Correlate via Cholesky:  z_corr = L z.
 *     3. If Student-t: scale z_corr by sqrt(df / chi2(df)).
 *     4. GBM step for each asset:
 *          S_i(t) = S_i(t-1) × exp((μ_i − ½σ_i²) dt + σ_i_eff √dt · z_corr_i)
 *        Where σ_i_eff = GARCH daily sigma when useGarch = true.
 *     5. Merton jump diffusion (optional): add Poisson-distributed jumps.
 *     6. Portfolio value = Σ w_i · S_i(T)  (buy-and-hold, rebalanced daily).
 *     7. Track peak value and running max drawdown.
 *
 * Antithetic variates (optional): run N/2 independent paths + N/2 antithetic
 * paths (negated z innovations) to reduce Monte Carlo variance.
 *
 * All computations use typed arrays (Float64Array) for cache-friendliness.
 * The engine is pure — no I/O, no global state.
 */

import type {
  PortfolioRiskInput,
  PortfolioSimConfig,
  PortfolioRiskResult,
  PortfolioAsset,
} from '@riskforge/domain';
import { createRng } from '../core/rng.js';
import { fillNormals, applyStudentTScale, normalPair } from '../core/distributions.js';
import {
  sortAsc,
  mean,
  quantile,
  computeVaR,
  computeES,
} from '../core/statistics.js';
import {
  cholesky,
  choleskyMultiply,
  stressCorrelation,
  CholeskyError,
} from './cholesky.js';
import {
  initGarchState,
  updateGarchState,
  DEFAULT_GARCH_EQUITY,
} from './garch.js';
import type { GarchState } from './garch.js';
import { computeAttribution } from './attribution.js';
import { computeEfficientFrontier } from './frontier.js';

const TRADING_DAYS_PER_YEAR = 252;

export class SimulationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'SimulationError';
  }
}

function buildInterpretation(
  result: Omit<PortfolioRiskResult, 'interpretation' | 'attribution' | 'frontier'>,
  input: PortfolioRiskInput,
  stressed: boolean,
): PortfolioRiskResult['interpretation'] {
  const { p05Return, probabilityDrawdownOver20, probabilityDrawdownOver30 } =
    result.summary;

  let riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  if (p05Return < -0.40 || probabilityDrawdownOver30 > 0.25) {
    riskLevel = 'severe';
  } else if (p05Return < -0.20 || probabilityDrawdownOver20 > 0.30) {
    riskLevel = 'high';
  } else if (p05Return < -0.10 || probabilityDrawdownOver20 > 0.10) {
    riskLevel = 'moderate';
  } else {
    riskLevel = 'low';
  }

  // Rank assets by marginal risk contribution: w_i × σ_i
  const drivers = input.assets
    .map((a: PortfolioAsset) => ({ name: a.name, score: a.weight * a.sigma }))
    .sort((a: { name: string; score: number }, b: { name: string; score: number }) => b.score - a.score)
    .slice(0, 3)
    .map((d: { name: string; score: number }) => d.name);

  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

  const summary =
    `Under ${stressed ? 'stressed' : 'baseline'} conditions, this portfolio has a ` +
    `${pct(probabilityDrawdownOver20)} probability of experiencing a drawdown exceeding 20%. ` +
    `The worst 5% of outcomes show a loss of ${pct(-p05Return)} or more. ` +
    `Primary risk contributors: ${drivers.join(', ')}.`;

  const stressImpact = stressed
    ? 'Correlation stress increases co-movement between assets, reducing diversification ' +
      'benefits and amplifying tail losses materially.'
    : undefined;

  return {
    riskLevel,
    mainRiskDrivers: drivers,
    plainEnglishSummary: summary,
    ...(stressImpact !== undefined ? { stressImpact } : {}),
  };
}

/**
 * Sample a Poisson(lambda) random variate using the inverse transform method.
 * Efficient for small lambda (< ~30).
 */
function poissonSample(lambda: number, rng: () => number): number {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}

export function simulatePortfolio(
  input: PortfolioRiskInput,
  config: PortfolioSimConfig,
  engineVersion = '1.0.0',
): PortfolioRiskResult {
  const t0 = Date.now();

  const { assets } = input;
  const n = assets.length;
  const {
    paths,
    horizonDays,
    distribution,
    df,
    stress,
    useGarch,
    garchParams: garchParamsConfig,
    jumps,
    computeFrontier,
    antitheticVariates,
  } = config;
  const seed = config.seed ?? Math.floor(Math.random() * 0xffff_ffff);

  if (distribution === 'student_t' && (df === undefined || df < 3)) {
    throw new SimulationError(
      'Student-t distribution requires df ≥ 3',
      'STUDENT_T_DF_REQUIRED',
    );
  }

  const weights = new Float64Array(assets.map((a: PortfolioAsset) => a.weight));
  const mu = new Float64Array(assets.map((a: PortfolioAsset) => a.mu));
  const sigma = new Float64Array(assets.map((a: PortfolioAsset) => a.sigma));

  // Apply volatility stress.
  const stressed = stress !== undefined;
  const effectiveSigma = sigma.slice();
  if (stress?.volMultiplier !== undefined) {
    for (let i = 0; i < n; i++) {
      effectiveSigma[i] = (effectiveSigma[i] ?? 0) * stress.volMultiplier!;
    }
  }

  // Apply correlation stress.
  let corrMatrix = input.corr;
  if (stress?.corrTarget !== undefined) {
    corrMatrix = stressCorrelation(
      corrMatrix,
      stress.corrTarget,
      stress.corrBlend ?? 1,
    );
  }

  // Cholesky decomposition.
  let L: Float64Array;
  try {
    L = cholesky(corrMatrix);
  } catch (err) {
    if (err instanceof CholeskyError) {
      throw new SimulationError(err.message, err.code);
    }
    throw err;
  }

  const dt = 1 / TRADING_DAYS_PER_YEAR;
  const sqrtDt = Math.sqrt(dt);

  // GARCH setup.
  const garchParams = garchParamsConfig ?? DEFAULT_GARCH_EQUITY;
  const initialGarchStates: GarchState[] = [];
  if (useGarch) {
    for (let i = 0; i < n; i++) {
      initialGarchStates.push(initGarchState(effectiveSigma[i] ?? 0, garchParams));
    }
  }

  // Jump diffusion setup (Merton model).
  // Drift adjustment: compensate expected jump return to preserve mu.
  const jumpDriftAdj = new Float64Array(n);
  if (jumps !== undefined) {
    const { lambda, muJ, sigmaJ } = jumps;
    const jumpMeanReturn = Math.exp(muJ + 0.5 * sigmaJ * sigmaJ) - 1;
    for (let i = 0; i < n; i++) {
      jumpDriftAdj[i] = -lambda * jumpMeanReturn * dt;
    }
  }

  // Pre-compute static drift terms:  (μ_i − ½σ_i²) dt
  // When GARCH is active, the static drift uses σ_i for the Ito correction.
  const drift = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const s = effectiveSigma[i] ?? 0;
    drift[i] = ((mu[i] ?? 0) - 0.5 * s * s) * dt + (jumpDriftAdj[i] ?? 0);
  }

  const rng = createRng(seed);

  // Output arrays.
  const totalPaths = paths;
  const finalReturns = new Float64Array(totalPaths);
  const maxDrawdowns = new Float64Array(totalPaths);

  // Per-asset return tracking for attribution.
  const assetFinalReturns: Float64Array[] = Array.from({ length: n }, () => new Float64Array(totalPaths));

  // Per-path working arrays (avoid allocation inside loop).
  const assetValues = new Float64Array(n);
  const z = new Float64Array(n);
  const garchStates: GarchState[] = [];

  // Antithetic variates: run first half normally, second half with negated z.
  const halfPaths = antitheticVariates ? Math.floor(totalPaths / 2) : totalPaths;

  function runPath(p: number, useAntithetic: boolean, antitheticZ: Float64Array | null): void {
    // Initialise asset prices to 1.
    assetValues.fill(1);

    // GARCH state: start fresh per path at unconditional variance.
    if (useGarch) {
      for (let i = 0; i < n; i++) {
        garchStates[i] = { ...(initialGarchStates[i] ?? initGarchState(effectiveSigma[i] ?? 0, garchParams)) };
      }
    }

    let portfolioValue = 1;
    let peakValue = 1;
    let maxDd = 0;

    for (let day = 0; day < horizonDays; day++) {
      if (!useAntithetic) {
        // 1. Independent standard normals.
        fillNormals(z, rng);
        // Store for antithetic partner (only if we will use antithetics).
        if (antitheticVariates && antitheticZ !== null) {
          antitheticZ.set(z);
        }
      } else {
        // Antithetic: negate z from the corresponding normal path.
        if (antitheticZ !== null) {
          for (let i = 0; i < n; i++) {
            z[i] = -(antitheticZ[i] ?? 0);
          }
        }
      }

      // 2. Correlate via Cholesky.
      choleskyMultiply(L, z, n);

      // 3. Student-t tail scaling.
      if (distribution === 'student_t') {
        applyStudentTScale(z, df!, rng);
      }

      // 4. GBM update for each asset.
      portfolioValue = 0;
      for (let i = 0; i < n; i++) {
        let effectiveDailySigma: number;
        if (useGarch) {
          const gs = garchStates[i];
          if (gs !== undefined) {
            effectiveDailySigma = Math.sqrt(gs.varianceDaily);
            // Update GARCH state after using current variance.
            garchStates[i] = updateGarchState(gs, garchParams, z[i] ?? 0, effectiveDailySigma);
          } else {
            effectiveDailySigma = (effectiveSigma[i] ?? 0) * sqrtDt;
          }
        } else {
          effectiveDailySigma = (effectiveSigma[i] ?? 0) * sqrtDt;
        }

        let logRet = (drift[i] ?? 0) + effectiveDailySigma * (z[i] ?? 0);

        // 5. Merton jump diffusion.
        if (jumps !== undefined) {
          const { lambda, muJ, sigmaJ } = jumps;
          const numJumps = poissonSample(lambda * dt, rng);
          for (let jj = 0; jj < numJumps; jj++) {
            const [jz] = normalPair(rng);
            logRet += muJ + sigmaJ * jz;
          }
        }

        const ret = Math.exp(logRet);
        assetValues[i] = (assetValues[i] ?? 1) * ret;
        portfolioValue += (weights[i] ?? 0) * (assetValues[i] ?? 1);
      }

      // 6. Drawdown tracking.
      if (portfolioValue > peakValue) peakValue = portfolioValue;
      const dd = (peakValue - portfolioValue) / peakValue;
      if (dd > maxDd) maxDd = dd;
    }

    finalReturns[p] = portfolioValue - 1;
    maxDrawdowns[p] = maxDd;
    for (let i = 0; i < n; i++) {
      const arr = assetFinalReturns[i];
      if (arr !== undefined) arr[p] = (assetValues[i] ?? 1) - 1;
    }
  }

  if (antitheticVariates) {
    // For antithetic variates we need to store the z draws from the normal path
    // so the antithetic path can negate them. We store per-day z for each path pair,
    // but that would be horizonDays * n storage per path — expensive.
    //
    // Simpler approach: run pairs sequentially. For each pair (p, p+halfPaths),
    // replay the day loop storing z values, then negate for the second path.
    // We do this by running two sub-loops sharing z storage per day.

    const zBuffer = new Float64Array(n); // z for normal path, used by antithetic
    // Per-day z storage for the current pair.
    const zDays = new Float64Array(horizonDays * n);

    for (let p = 0; p < halfPaths; p++) {
      // Normal path: collect z per day.
      assetValues.fill(1);
      if (useGarch) {
        for (let i = 0; i < n; i++) {
          garchStates[i] = { ...(initialGarchStates[i] ?? initGarchState(effectiveSigma[i] ?? 0, garchParams)) };
        }
      }

      let portfolioValue = 1;
      let peakValue = 1;
      let maxDd = 0;

      for (let day = 0; day < horizonDays; day++) {
        fillNormals(z, rng);
        // Store z for antithetic use.
        for (let i = 0; i < n; i++) {
          zDays[day * n + i] = z[i] ?? 0;
        }

        choleskyMultiply(L, z, n);
        if (distribution === 'student_t') {
          applyStudentTScale(z, df!, rng);
        }

        portfolioValue = 0;
        for (let i = 0; i < n; i++) {
          let effectiveDailySigma: number;
          if (useGarch) {
            const gs = garchStates[i];
            if (gs !== undefined) {
              effectiveDailySigma = Math.sqrt(gs.varianceDaily);
              garchStates[i] = updateGarchState(gs, garchParams, z[i] ?? 0, effectiveDailySigma);
            } else {
              effectiveDailySigma = (effectiveSigma[i] ?? 0) * sqrtDt;
            }
          } else {
            effectiveDailySigma = (effectiveSigma[i] ?? 0) * sqrtDt;
          }

          let logRet = (drift[i] ?? 0) + effectiveDailySigma * (z[i] ?? 0);
          if (jumps !== undefined) {
            const { lambda, muJ, sigmaJ } = jumps;
            const numJumps = poissonSample(lambda * dt, rng);
            for (let jj = 0; jj < numJumps; jj++) {
              const [jz] = normalPair(rng);
              logRet += muJ + sigmaJ * jz;
            }
          }

          assetValues[i] = (assetValues[i] ?? 1) * Math.exp(logRet);
          portfolioValue += (weights[i] ?? 0) * (assetValues[i] ?? 1);
        }
        if (portfolioValue > peakValue) peakValue = portfolioValue;
        const dd = (peakValue - portfolioValue) / peakValue;
        if (dd > maxDd) maxDd = dd;
      }

      finalReturns[p] = portfolioValue - 1;
      maxDrawdowns[p] = maxDd;
      for (let i = 0; i < n; i++) {
        const arr = assetFinalReturns[i];
        if (arr !== undefined) arr[p] = (assetValues[i] ?? 1) - 1;
      }

      // Antithetic path: negate z (pre-Cholesky draws).
      const ap = p + halfPaths;
      if (ap < totalPaths) {
        assetValues.fill(1);
        if (useGarch) {
          for (let i = 0; i < n; i++) {
            garchStates[i] = { ...(initialGarchStates[i] ?? initGarchState(effectiveSigma[i] ?? 0, garchParams)) };
          }
        }

        let aPortfolioValue = 1;
        let aPeakValue = 1;
        let aMaxDd = 0;

        for (let day = 0; day < horizonDays; day++) {
          // Negate the stored z values.
          for (let i = 0; i < n; i++) {
            z[i] = -(zDays[day * n + i] ?? 0);
          }

          choleskyMultiply(L, z, n);
          if (distribution === 'student_t') {
            // For the antithetic Student-t path we draw a fresh chi2 to keep
            // independence of the mixing variable.
            applyStudentTScale(z, df!, rng);
          }

          aPortfolioValue = 0;
          for (let i = 0; i < n; i++) {
            let effectiveDailySigma: number;
            if (useGarch) {
              const gs = garchStates[i];
              if (gs !== undefined) {
                effectiveDailySigma = Math.sqrt(gs.varianceDaily);
                garchStates[i] = updateGarchState(gs, garchParams, z[i] ?? 0, effectiveDailySigma);
              } else {
                effectiveDailySigma = (effectiveSigma[i] ?? 0) * sqrtDt;
              }
            } else {
              effectiveDailySigma = (effectiveSigma[i] ?? 0) * sqrtDt;
            }

            let logRet = (drift[i] ?? 0) + effectiveDailySigma * (z[i] ?? 0);
            if (jumps !== undefined) {
              const { lambda, muJ, sigmaJ } = jumps;
              const numJumps = poissonSample(lambda * dt, rng);
              for (let jj = 0; jj < numJumps; jj++) {
                const [jz] = normalPair(rng);
                logRet += muJ + sigmaJ * jz;
              }
            }

            assetValues[i] = (assetValues[i] ?? 1) * Math.exp(logRet);
            aPortfolioValue += (weights[i] ?? 0) * (assetValues[i] ?? 1);
          }
          if (aPortfolioValue > aPeakValue) aPeakValue = aPortfolioValue;
          const add = (aPeakValue - aPortfolioValue) / aPeakValue;
          if (add > aMaxDd) aMaxDd = add;
        }

        finalReturns[ap] = aPortfolioValue - 1;
        maxDrawdowns[ap] = aMaxDd;
        for (let i = 0; i < n; i++) {
          const arr = assetFinalReturns[i];
          if (arr !== undefined) arr[ap] = (assetValues[i] ?? 1) - 1;
        }
      }
    }
  } else {
    // Standard simulation (no antithetic).
    for (let p = 0; p < totalPaths; p++) {
      runPath(p, false, null);
    }
  }

  // Sort portfolio returns ascending for quantile / VaR / ES computations.
  // For attribution, we need unsorted asset returns — copy before sorting.
  // Note: assetFinalReturns are in simulation order (unsorted).
  const sortedPortfolioReturns = finalReturns.slice();
  sortAsc(sortedPortfolioReturns);
  sortAsc(maxDrawdowns);

  const annualFactor = TRADING_DAYS_PER_YEAR / horizonDays;
  const meanReturn = mean(sortedPortfolioReturns);
  const meanSquaredReturn = meanOfSquares(sortedPortfolioReturns);

  const summary: PortfolioRiskResult['summary'] = {
    meanReturn,
    medianReturn: quantile(sortedPortfolioReturns, 0.5),
    p05Return: quantile(sortedPortfolioReturns, 0.05),
    p01Return: quantile(sortedPortfolioReturns, 0.01),
    valueAtRisk95: computeVaR(sortedPortfolioReturns, 0.95),
    valueAtRisk99: computeVaR(sortedPortfolioReturns, 0.99),
    expectedShortfall95: computeES(sortedPortfolioReturns, 0.95),
    expectedShortfall99: computeES(sortedPortfolioReturns, 0.99),
    probabilityDrawdownOver10: fractionAbove(maxDrawdowns, 0.10),
    probabilityDrawdownOver20: fractionAbove(maxDrawdowns, 0.20),
    probabilityDrawdownOver30: fractionAbove(maxDrawdowns, 0.30),
    probabilityDrawdownOver50: fractionAbove(maxDrawdowns, 0.50),
    medianMaxDrawdown: quantile(maxDrawdowns, 0.5),
    p95MaxDrawdown: quantile(maxDrawdowns, 0.95),
    annualizedVolatility:
      Math.sqrt(annualFactor) *
      Math.sqrt(Math.max(0, meanSquaredReturn - meanReturn * meanReturn)),
  };

  const meta: PortfolioRiskResult['meta'] = {
    paths,
    horizonDays,
    distribution,
    ...(df !== undefined ? { df } : {}),
    seed,
    engineVersion,
    elapsedMs: Date.now() - t0,
    stressed,
  };

  // Compute risk attribution.
  const attribution = computeAttribution(
    assetFinalReturns,
    weights,
    sortedPortfolioReturns,
    0.95,
    0.99,
  );

  const interpretation = buildInterpretation({ summary, meta }, input, stressed);

  // Optionally compute efficient frontier.
  let frontier: PortfolioRiskResult['frontier'] | undefined;
  if (computeFrontier) {
    frontier = computeEfficientFrontier(mu, sigma, input.corr);
  }

  return { summary, interpretation, meta, attribution, ...(frontier !== undefined ? { frontier } : {}) };
}

function fractionAbove(sortedAsc: Float64Array, threshold: number): number {
  // Binary search for the first index > threshold.
  let lo = 0;
  let hi = sortedAsc.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if ((sortedAsc[mid] ?? 0) <= threshold) lo = mid + 1;
    else hi = mid;
  }
  return (sortedAsc.length - lo) / sortedAsc.length;
}

function meanOfSquares(arr: Float64Array): number {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i] ?? 0;
    sum += v * v;
  }
  return sum / arr.length;
}
