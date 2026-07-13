/**
 * Risk attribution: Component Expected Shortfall and Marginal Expected Shortfall.
 *
 * Uses the Euler allocation (conditional tail mean) approach:
 *
 *   CES_i = -w_i × E[R_i | R_portfolio ≤ -VaR_α]
 *
 * The conditional mean of asset returns in the portfolio's tail is an
 * EXPECTED SHORTFALL allocation, not a VaR allocation — the Euler
 * decomposition of ES is exactly the conditional expectation, so by
 * linearity the components sum to the portfolio ES:
 *   Σ CES_i = Portfolio ES_α  (up to tie-handling at the tail boundary)
 *
 * Marginal ES (dES/dw_i) follows from the same Euler theorem and is exact
 * (not an approximation, unlike the analogous formula for VaR):
 *   MES_i = -E[R_i | tail] = CES_i / w_i
 *
 * Diversification benefit measures how much the portfolio benefits from
 * imperfect correlation (this one genuinely uses VaR):
 *   DB = 1 - portfolioVaR / Σ(w_i × standaloneVaR_i)
 */

import { computeVaR } from '../core/statistics.js';

export interface RiskAttribution {
  /** Per-asset contribution to portfolio ES at 95% (sums to portfolio ES95). */
  componentExpectedShortfall95: number[];
  /** Per-asset contribution to portfolio ES at 99% (sums to portfolio ES99). */
  componentExpectedShortfall99: number[];
  /** componentExpectedShortfall95[i] / Σ components; sums to 1. */
  expectedShortfallContributions95: number[];
  /** componentExpectedShortfall99[i] / Σ components; sums to 1. */
  expectedShortfallContributions99: number[];
  /** Marginal ES via Euler: dES/dw_i = -E[R_i | tail] = CES_i / w_i. */
  marginalExpectedShortfall95: number[];
  /**
   * Diversification benefit at 95%:
   *   1 - portfolioVaR95 / Σ(w_i × standaloneVaR95_i)
   * Positive means the portfolio has lower risk than the sum of its parts.
   */
  diversificationBenefit95: number;
}

/**
 * Compute Expected Shortfall attribution for a simulated portfolio.
 *
 * @param assetPaths       One Float64Array per asset, length = paths. Each
 *                         element is the asset's total return for that path
 *                         (NOT sorted — in original simulation order).
 * @param weights          Portfolio weights, length = n assets.
 * @param portfolioReturns Portfolio total returns, sorted ascending (worst first).
 *                         Length = paths.
 * @param alpha95          95% confidence level (0.95).
 * @param alpha99          99% confidence level (0.99).
 */
export function computeExpectedShortfallAttribution(
  assetPaths: Float64Array[],
  weights: Float64Array,
  portfolioReturns: Float64Array,
  alpha95: number,
  alpha99: number,
): RiskAttribution {
  const n = assetPaths.length;
  const paths = portfolioReturns.length;

  if (n === 0 || paths === 0) {
    return {
      componentExpectedShortfall95: [],
      componentExpectedShortfall99: [],
      expectedShortfallContributions95: [],
      expectedShortfallContributions99: [],
      marginalExpectedShortfall95: [],
      diversificationBenefit95: 0,
    };
  }

  const portfolioVaR95 = computeVaR(portfolioReturns, alpha95);
  const portfolioVaR99 = computeVaR(portfolioReturns, alpha99);

  // Tail thresholds (negative returns beyond VaR).
  const varThreshold95 = -portfolioVaR95;
  const varThreshold99 = -portfolioVaR99;

  // We need to map sorted portfolio return indices back to original path indices.
  // Since assetPaths are in simulation order, we reconstruct portfolio returns
  // from weights and asset returns, then identify tail paths.
  const portfolioByPath = new Float64Array(paths);
  for (let p = 0; p < paths; p++) {
    let portRet = 0;
    for (let i = 0; i < n; i++) {
      portRet += (weights[i] ?? 0) * (assetPaths[i]?.[p] ?? 0);
    }
    portfolioByPath[p] = portRet;
  }

  // For each confidence level, compute the conditional mean of each asset return
  // given the portfolio return is in the tail (at or beyond the VaR threshold).
  const componentES95 = new Array<number>(n).fill(0);
  const componentES99 = new Array<number>(n).fill(0);

  const assetTailSum95 = new Float64Array(n);
  const assetTailSum99 = new Float64Array(n);
  let tailHits95 = 0;
  let tailHits99 = 0;

  for (let p = 0; p < paths; p++) {
    const portRet = portfolioByPath[p] ?? 0;
    const inTail95 = portRet <= varThreshold95;
    const inTail99 = portRet <= varThreshold99;

    if (inTail95) {
      tailHits95++;
      for (let i = 0; i < n; i++) {
        assetTailSum95[i] = (assetTailSum95[i] ?? 0) + (assetPaths[i]?.[p] ?? 0);
      }
    }
    if (inTail99) {
      tailHits99++;
      for (let i = 0; i < n; i++) {
        assetTailSum99[i] = (assetTailSum99[i] ?? 0) + (assetPaths[i]?.[p] ?? 0);
      }
    }
  }

  const denom95 = Math.max(tailHits95, 1);
  const denom99 = Math.max(tailHits99, 1);

  for (let i = 0; i < n; i++) {
    const w = weights[i] ?? 0;
    // CES_i = -w_i × E[R_i | in tail] — negated so losses are positive.
    const condMean95 = (assetTailSum95[i] ?? 0) / denom95;
    const condMean99 = (assetTailSum99[i] ?? 0) / denom99;
    componentES95[i] = -w * condMean95;
    componentES99[i] = -w * condMean99;
  }

  // Percent contributions.
  const sumCES95 = componentES95.reduce((a, b) => a + b, 0);
  const sumCES99 = componentES99.reduce((a, b) => a + b, 0);

  const expectedShortfallContributions95 = componentES95.map((v) =>
    sumCES95 === 0 ? 1 / n : v / sumCES95,
  );
  const expectedShortfallContributions99 = componentES99.map((v) =>
    sumCES99 === 0 ? 1 / n : v / sumCES99,
  );

  // Marginal ES: CES_i / w_i (avoid divide-by-zero).
  const marginalExpectedShortfall95 = componentES95.map((v, i) => {
    const w = weights[i] ?? 0;
    return w > 1e-10 ? v / w : 0;
  });

  // Standalone VaR per asset (for diversification benefit).
  let weightedStandaloneSum95 = 0;
  for (let i = 0; i < n; i++) {
    const assetRets = assetPaths[i];
    if (!assetRets) continue;
    const sorted = assetRets.slice().sort();
    const standaloneVaR = computeVaR(sorted, alpha95);
    weightedStandaloneSum95 += (weights[i] ?? 0) * standaloneVaR;
  }

  const diversificationBenefit95 =
    weightedStandaloneSum95 > 0
      ? 1 - portfolioVaR95 / weightedStandaloneSum95
      : 0;

  return {
    componentExpectedShortfall95: componentES95,
    componentExpectedShortfall99: componentES99,
    expectedShortfallContributions95,
    expectedShortfallContributions99,
    marginalExpectedShortfall95,
    diversificationBenefit95,
  };
}
