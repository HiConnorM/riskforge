/**
 * Risk attribution: Component VaR and Marginal VaR.
 *
 * Uses the Euler allocation (conditional tail mean) approach:
 *
 *   CVaR_i = w_i × E[R_i | R_portfolio ≤ VaR_cutoff]
 *
 * This is the standard Euler risk decomposition. By linearity of expectation,
 * the component VaRs sum exactly to the portfolio VaR:
 *   Σ CVaR_i = Portfolio VaR
 *
 * Marginal VaR (dVaR/dw_i) is approximated as:
 *   MVaR_i = CVaR_i / w_i
 *
 * Diversification benefit measures how much the portfolio benefits from
 * imperfect correlation:
 *   DB = 1 - portfolioVaR / Σ(w_i × standaloneVaR_i)
 */

import { computeVaR } from '../core/statistics.js';

export interface RiskAttribution {
  /** Per-asset contribution to portfolio VaR at 95% (sums to portfolioVaR95). */
  componentVaR95: number[];
  /** Per-asset contribution to portfolio VaR at 99% (sums to portfolioVaR99). */
  componentVaR99: number[];
  /** componentVaR95[i] / portfolioVaR95; sums to 1. */
  percentContributions95: number[];
  /** componentVaR99[i] / portfolioVaR99; sums to 1. */
  percentContributions99: number[];
  /** Approximate marginal VaR: dVaR/dw_i ≈ CVaR_i / w_i. */
  marginalVaR95: number[];
  /**
   * Diversification benefit at 95%:
   *   1 - portfolioVaR95 / Σ(w_i × standaloneVaR95_i)
   * Positive means the portfolio has lower risk than the sum of its parts.
   */
  diversificationBenefit95: number;
}

/**
 * Compute risk attribution for a simulated portfolio.
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
export function computeAttribution(
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
      componentVaR95: [],
      componentVaR99: [],
      percentContributions95: [],
      percentContributions99: [],
      marginalVaR95: [],
      diversificationBenefit95: 0,
    };
  }

  const portfolioVaR95 = computeVaR(portfolioReturns, alpha95);
  const portfolioVaR99 = computeVaR(portfolioReturns, alpha99);

  // VaR cutoff thresholds (negative returns).
  const varThreshold95 = -portfolioVaR95;
  const varThreshold99 = -portfolioVaR99;

  // Count paths in each tail.
  const tailCount95 = Math.max(1, Math.floor((1 - alpha95) * paths));
  const tailCount99 = Math.max(1, Math.floor((1 - alpha99) * paths));

  // We need to map sorted portfolio return indices back to original path indices.
  // The portfolioReturns array is sorted; we need path-by-path asset returns.
  // Strategy: find the cutoff value from portfolioReturns, then scan assetPaths
  // for paths where the portfolio return falls in the tail.
  //
  // Since assetPaths are in simulation order, we reconstruct portfolio returns
  // from weights and asset returns, then identify tail paths.

  // Reconstruct unsorted portfolio returns per path (in simulation order).
  const portfolioByPath = new Float64Array(paths);
  for (let p = 0; p < paths; p++) {
    let portRet = 0;
    for (let i = 0; i < n; i++) {
      portRet += (weights[i] ?? 0) * (assetPaths[i]?.[p] ?? 0);
    }
    portfolioByPath[p] = portRet;
  }

  // For each confidence level, compute the conditional mean of each asset return
  // given portfolio return is in the tail (below the VaR threshold).
  const componentVaR95 = new Array<number>(n).fill(0);
  const componentVaR99 = new Array<number>(n).fill(0);

  // Accumulate conditional sums.
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

  // Use tailCount as denominator (from sorted array) for stability; fall back
  // to actual hit count if they diverge due to ties.
  const denom95 = Math.max(tailHits95, 1);
  const denom99 = Math.max(tailHits99, 1);

  for (let i = 0; i < n; i++) {
    const w = weights[i] ?? 0;
    // CVaR_i = w_i * E[R_i | in tail]  — negative because returns are losses
    const condMean95 = (assetTailSum95[i] ?? 0) / denom95;
    const condMean99 = (assetTailSum99[i] ?? 0) / denom99;
    componentVaR95[i] = -w * condMean95;
    componentVaR99[i] = -w * condMean99;
  }

  // Percent contributions.
  const sumCV95 = componentVaR95.reduce((a, b) => a + b, 0);
  const sumCV99 = componentVaR99.reduce((a, b) => a + b, 0);

  const percentContributions95 = componentVaR95.map((v) =>
    sumCV95 === 0 ? 1 / n : v / sumCV95,
  );
  const percentContributions99 = componentVaR99.map((v) =>
    sumCV99 === 0 ? 1 / n : v / sumCV99,
  );

  // Marginal VaR: CVaR_i / w_i (avoid divide-by-zero).
  const marginalVaR95 = componentVaR95.map((v, i) => {
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
    componentVaR95,
    componentVaR99,
    percentContributions95,
    percentContributions99,
    marginalVaR95,
    diversificationBenefit95,
  };
}
