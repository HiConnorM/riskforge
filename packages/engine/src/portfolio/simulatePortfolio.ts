/**
 * Portfolio Monte Carlo simulation engine.
 *
 * Algorithm (per path):
 *   For each trading day t in [1, horizonDays]:
 *     1. Draw n independent N(0,1) variates.
 *     2. Correlate via Cholesky:  z_corr = L z.
 *     3. If Student-t: scale z_corr by sqrt(df / chi2(df)).
 *     4. GBM step for each asset:
 *          S_i(t) = S_i(t-1) × exp((μ_i − ½σ_i²) dt + σ_i √dt · z_corr_i)
 *     5. Portfolio value = Σ w_i · S_i(T)  (buy-and-hold, rebalanced daily).
 *     6. Track peak value and running max drawdown.
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
import { fillNormals, applyStudentTScale } from '../core/distributions.js';
import {
  sortAsc,
  mean,
  quantile,
  computeVaR,
  computeES,
  fractionBelow,
} from '../core/statistics.js';
import {
  cholesky,
  choleskyMultiply,
  stressCorrelation,
  CholeskyError,
} from './cholesky.js';

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
  result: Omit<PortfolioRiskResult, 'interpretation'>,
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

export function simulatePortfolio(
  input: PortfolioRiskInput,
  config: PortfolioSimConfig,
  engineVersion = '1.0.0',
): PortfolioRiskResult {
  const t0 = Date.now();

  const { assets } = input;
  const n = assets.length;
  const { paths, horizonDays, distribution, df, stress } = config;
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

  // Pre-compute drift terms:  (μ_i − ½σ_i²) dt
  const drift = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const s = effectiveSigma[i] ?? 0;
    drift[i] = ((mu[i] ?? 0) - 0.5 * s * s) * dt;
  }

  const rng = createRng(seed);

  // Output arrays.
  const finalReturns = new Float64Array(paths);
  const maxDrawdowns = new Float64Array(paths);

  // Per-path working arrays (avoid allocation inside loop).
  const assetValues = new Float64Array(n);
  const z = new Float64Array(n);

  for (let p = 0; p < paths; p++) {
    // Initialise asset prices to 1.
    assetValues.fill(1);

    let portfolioValue = 1;
    let peakValue = 1;
    let maxDd = 0;

    for (let day = 0; day < horizonDays; day++) {
      // 1. Independent standard normals.
      fillNormals(z, rng);

      // 2. Correlate via Cholesky.
      choleskyMultiply(L, z, n);

      // 3. Student-t tail scaling.
      if (distribution === 'student_t') {
        applyStudentTScale(z, df!, rng);
      }

      // 4. GBM update for each asset.
      portfolioValue = 0;
      for (let i = 0; i < n; i++) {
        const ret = Math.exp((drift[i] ?? 0) + (effectiveSigma[i] ?? 0) * sqrtDt * (z[i] ?? 0));
        assetValues[i] = (assetValues[i] ?? 1) * ret;
        portfolioValue += (weights[i] ?? 0) * (assetValues[i] ?? 1);
      }

      // 5. Drawdown tracking.
      if (portfolioValue > peakValue) peakValue = portfolioValue;
      const dd = (peakValue - portfolioValue) / peakValue;
      if (dd > maxDd) maxDd = dd;
    }

    finalReturns[p] = portfolioValue - 1;
    maxDrawdowns[p] = maxDd;
  }

  // Sort returns ascending for quantile / VaR / ES computations.
  sortAsc(finalReturns);
  sortAsc(maxDrawdowns);

  const annualFactor = TRADING_DAYS_PER_YEAR / horizonDays;

  const summary: PortfolioRiskResult['summary'] = {
    meanReturn: mean(finalReturns),
    medianReturn: quantile(finalReturns, 0.5),
    p05Return: quantile(finalReturns, 0.05),
    p01Return: quantile(finalReturns, 0.01),
    valueAtRisk95: computeVaR(finalReturns, 0.95),
    valueAtRisk99: computeVaR(finalReturns, 0.99),
    expectedShortfall95: computeES(finalReturns, 0.95),
    expectedShortfall99: computeES(finalReturns, 0.99),
    probabilityDrawdownOver10: fractionBelow(maxDrawdowns, -0.10) === 0
      ? 1 - fractionBelow(new Float64Array(Array.from(maxDrawdowns).map(v => -v)), 0.10)
      : fractionBelow(maxDrawdowns, -0.10),
    probabilityDrawdownOver20: 1 - fractionBelow(new Float64Array(Array.from(maxDrawdowns).map(v => 1 - v)), 0.80),
    probabilityDrawdownOver30: 1 - fractionBelow(new Float64Array(Array.from(maxDrawdowns).map(v => 1 - v)), 0.70),
    probabilityDrawdownOver50: 1 - fractionBelow(new Float64Array(Array.from(maxDrawdowns).map(v => 1 - v)), 0.50),
    medianMaxDrawdown: quantile(maxDrawdowns, 0.5),
    p95MaxDrawdown: quantile(maxDrawdowns, 0.95),
    annualizedVolatility: Math.sqrt(annualFactor) *
      Math.sqrt(
        mean(new Float64Array(Array.from(finalReturns).map(r => r * r))) -
        mean(finalReturns) ** 2,
      ),
  };

  // Fix drawdown probability calculations (max drawdown is always >= 0).
  const ddArr = maxDrawdowns; // already sorted ascending [0..maxDd]
  summary.probabilityDrawdownOver10 = fractionAbove(ddArr, 0.10);
  summary.probabilityDrawdownOver20 = fractionAbove(ddArr, 0.20);
  summary.probabilityDrawdownOver30 = fractionAbove(ddArr, 0.30);
  summary.probabilityDrawdownOver50 = fractionAbove(ddArr, 0.50);

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

  const partial = { summary, meta };
  const interpretation = buildInterpretation(
    partial as Omit<PortfolioRiskResult, 'interpretation'>,
    input,
    stressed,
  );

  return { summary, interpretation, meta };
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
