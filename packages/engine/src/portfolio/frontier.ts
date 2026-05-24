/**
 * Efficient frontier computation via projected gradient descent (mean-variance).
 *
 * For each target return r, we solve the constrained QP:
 *   min  w^T Σ w
 *   s.t. w^T μ = r
 *        Σ w_i = 1
 *        w_i >= 0   (long-only)
 *
 * We use a projected gradient descent with Dykstra projection onto the
 * constrained set.  The covariance matrix Σ is built from vols and correlations.
 *
 * The efficient frontier is traced from the minimum-variance portfolio
 * (lowest achievable vol) to the maximum-return portfolio.
 */

const RISK_FREE_RATE = 0.045; // 4.5% annualised

export interface FrontierPoint {
  targetReturn: number;
  portfolioVol: number;
  weights: number[];
  sharpeRatio: number;
}

export interface EfficientFrontier {
  /** 25 evenly-spaced points from min-var return to max-return. */
  points: FrontierPoint[];
  minVarianceWeights: number[];
  maxSharpeWeights: number[];
  minVarianceVol: number;
  minVarianceReturn: number;
  maxSharpeReturn: number;
  maxSharpeVol: number;
}

// ─── Covariance matrix ────────────────────────────────────────────────────────

function buildCovariance(
  sigma: Float64Array,
  corr: number[][],
  n: number,
): Float64Array {
  const cov = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      cov[i * n + j] = (sigma[i] ?? 0) * (sigma[j] ?? 0) * (corr[i]?.[j] ?? (i === j ? 1 : 0));
    }
  }
  return cov;
}

// ─── Portfolio variance ───────────────────────────────────────────────────────

function portfolioVariance(w: Float64Array, cov: Float64Array, n: number): number {
  let v = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      v += (w[i] ?? 0) * (w[j] ?? 0) * (cov[i * n + j] ?? 0);
    }
  }
  return v;
}

function portfolioReturn(w: Float64Array, mu: Float64Array, n: number): number {
  let r = 0;
  for (let i = 0; i < n; i++) r += (w[i] ?? 0) * (mu[i] ?? 0);
  return r;
}

// ─── Gradient of w^T Σ w = 2 Σ w ─────────────────────────────────────────────

function gradVariance(w: Float64Array, cov: Float64Array, n: number, out: Float64Array): void {
  for (let i = 0; i < n; i++) {
    let g = 0;
    for (let j = 0; j < n; j++) {
      g += (cov[i * n + j] ?? 0) * (w[j] ?? 0);
    }
    out[i] = 2 * g;
  }
}

// ─── Project onto simplex { w >= 0, Σw = 1 } ─────────────────────────────────
// Sort-based O(n log n) projection (Duchi et al. 2008).

function projectSimplex(w: Float64Array, n: number): void {
  // Copy to scratch, sort descending.
  const u = Array.from({ length: n }, (_, i) => w[i] ?? 0).sort((a, b) => b - a);

  let cssv = 0;
  let rho = 0;
  for (let j = 0; j < n; j++) {
    cssv += u[j] ?? 0;
    if ((u[j] ?? 0) - (cssv - 1) / (j + 1) > 0) rho = j;
  }

  let cssv2 = 0;
  for (let j = 0; j <= rho; j++) cssv2 += u[j] ?? 0;
  const theta = (cssv2 - 1) / (rho + 1);

  for (let i = 0; i < n; i++) {
    w[i] = Math.max((w[i] ?? 0) - theta, 0);
  }
}

// ─── Project onto { Σw = 1, w >= 0, w^T μ = r_target } ──────────────────────
// We alternate between:
//   1. Project onto simplex (non-negative, sum=1)
//   2. Project onto the return constraint hyperplane, then clamp negative weights.
//
// For robustness we use a softer approach: penalised gradient descent with
// a return-targeting term, then project onto the simplex at each step.

function minimizeVarianceTargetReturn(
  mu: Float64Array,
  cov: Float64Array,
  n: number,
  targetReturn: number,
  warmStart: Float64Array | null,
): Float64Array {
  const w = new Float64Array(n);
  if (warmStart !== null) {
    w.set(warmStart);
  } else {
    // Equal weight start.
    for (let i = 0; i < n; i++) w[i] = 1 / n;
  }

  const maxIter = 2000;
  const baseLr = 0.1;
  // Return penalty: large enough to enforce constraint, small enough not to destabilise.
  const returnPenalty = 200;

  const grad = new Float64Array(n);
  const wBest = new Float64Array(n);
  let bestObj = Infinity;

  for (let iter = 0; iter < maxIter; iter++) {
    // Cosine annealing learning rate.
    const lr = baseLr * (0.01 + 0.99 * 0.5 * (1 + Math.cos(Math.PI * iter / maxIter)));

    // Variance gradient.
    gradVariance(w, cov, n, grad);

    // Return constraint penalty gradient: 2 * returnPenalty * (w^T μ - r) * μ
    const retErr = portfolioReturn(w, mu, n) - targetReturn;
    for (let i = 0; i < n; i++) {
      grad[i] = (grad[i] ?? 0) + 2 * returnPenalty * retErr * (mu[i] ?? 0);
    }

    // Gradient step.
    for (let i = 0; i < n; i++) {
      w[i] = (w[i] ?? 0) - lr * (grad[i] ?? 0);
    }

    // Project onto simplex.
    projectSimplex(w, n);

    // Track best feasible solution.
    const obj = portfolioVariance(w, cov, n) + returnPenalty * retErr * retErr;
    if (obj < bestObj) {
      bestObj = obj;
      wBest.set(w);
    }
  }

  return wBest;
}

// ─── Min-variance portfolio (no return target) ────────────────────────────────

function minimizeVarianceUnconstrained(
  cov: Float64Array,
  n: number,
): Float64Array {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) w[i] = 1 / n;

  const maxIter = 3000;
  const baseLr = 0.05;
  const grad = new Float64Array(n);

  for (let iter = 0; iter < maxIter; iter++) {
    const lr = baseLr * (0.01 + 0.99 * 0.5 * (1 + Math.cos(Math.PI * iter / maxIter)));
    gradVariance(w, cov, n, grad);
    for (let i = 0; i < n; i++) {
      w[i] = (w[i] ?? 0) - lr * (grad[i] ?? 0);
    }
    projectSimplex(w, n);
  }

  return w;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute the efficient frontier for a set of assets.
 *
 * @param mu        Expected annual returns per asset.
 * @param sigma     Annual volatilities per asset.
 * @param corr      Correlation matrix (n × n).
 * @param numPoints Number of frontier points (default 25).
 */
export function computeEfficientFrontier(
  mu: Float64Array,
  sigma: Float64Array,
  corr: number[][],
  numPoints = 25,
): EfficientFrontier {
  const n = mu.length;
  const cov = buildCovariance(sigma, corr, n);

  // Min-variance weights (unconstrained return).
  const minVarW = minimizeVarianceUnconstrained(cov, n);
  const minVarReturn = portfolioReturn(minVarW, mu, n);
  const minVarVol = Math.sqrt(Math.max(0, portfolioVariance(minVarW, cov, n)));

  // Max-return weights = concentrate on highest-mu asset.
  const maxMuIdx = Array.from(mu).reduce(
    (best, v, i) => (v > (mu[best] ?? -Infinity) ? i : best),
    0,
  );
  const maxReturn = mu[maxMuIdx] ?? 0;

  // Sweep from min-var return to max return.
  const returnStep = (maxReturn - minVarReturn) / Math.max(numPoints - 1, 1);

  const points: FrontierPoint[] = [];
  let maxSharpeW = minVarW;
  let maxSharpeRatio = -Infinity;
  let warmStart: Float64Array | null = null;

  for (let k = 0; k < numPoints; k++) {
    const targetReturn = minVarReturn + k * returnStep;
    const w = minimizeVarianceTargetReturn(mu, cov, n, targetReturn, warmStart);
    warmStart = w;

    const vol = Math.sqrt(Math.max(0, portfolioVariance(w, cov, n)));
    const ret = portfolioReturn(w, mu, n);
    const sharpe = vol > 0 ? (ret - RISK_FREE_RATE) / vol : 0;

    points.push({
      targetReturn,
      portfolioVol: vol,
      weights: Array.from(w),
      sharpeRatio: sharpe,
    });

    if (sharpe > maxSharpeRatio) {
      maxSharpeRatio = sharpe;
      maxSharpeW = w.slice();
    }
  }

  const maxSharpeReturn = portfolioReturn(maxSharpeW, mu, n);
  const maxSharpeVol = Math.sqrt(Math.max(0, portfolioVariance(maxSharpeW, cov, n)));

  return {
    points,
    minVarianceWeights: Array.from(minVarW),
    maxSharpeWeights: Array.from(maxSharpeW),
    minVarianceVol: minVarVol,
    minVarianceReturn: minVarReturn,
    maxSharpeReturn,
    maxSharpeVol,
  };
}
