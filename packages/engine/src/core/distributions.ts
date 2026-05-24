/**
 * Random variate generation.
 *
 * All functions take an RNG instance so that results are fully reproducible
 * given the same seed. No global state is used.
 */

const TWO_PI = 2 * Math.PI;

/**
 * Generate a pair of independent standard normal variates using
 * the Box-Muller transform. Consuming both saves one log call.
 *
 * Returns [z1, z2] where each zi ~ N(0, 1).
 */
export function normalPair(rng: () => number): [number, number] {
  let u1: number;
  // Guard against log(0) — extremely rare with a good PRNG but not impossible.
  do {
    u1 = rng();
  } while (u1 === 0);

  const u2 = rng();
  const mag = Math.sqrt(-2 * Math.log(u1));
  const theta = TWO_PI * u2;
  return [mag * Math.cos(theta), mag * Math.sin(theta)];
}

/**
 * Fill a Float64Array with independent N(0,1) samples.
 * Uses Box-Muller; handles odd array lengths cleanly.
 */
export function fillNormals(out: Float64Array, rng: () => number): void {
  const n = out.length;
  const pairs = Math.floor(n / 2);

  for (let i = 0; i < pairs; i++) {
    const [z1, z2] = normalPair(rng);
    out[2 * i] = z1;
    out[2 * i + 1] = z2;
  }

  if (n % 2 === 1) {
    // Last element if n is odd — consume a full pair, discard the second.
    const [z1] = normalPair(rng);
    out[n - 1] = z1;
  }
}

/**
 * Draw a chi-squared(df) variate by summing df squared normals.
 * Used internally for Student-t generation.
 */
function chiSquared(df: number, rng: () => number): number {
  let sum = 0;
  const pairs = Math.floor(df / 2);

  for (let i = 0; i < pairs; i++) {
    const [z1, z2] = normalPair(rng);
    sum += z1 * z1 + z2 * z2;
  }
  if (df % 2 === 1) {
    const [z1] = normalPair(rng);
    sum += z1 * z1;
  }

  return sum;
}

/**
 * Scale a vector of standard normals to produce a multivariate Student-t
 * sample with `df` degrees of freedom.
 *
 * The operation is:  t_i = z_i × sqrt(df / W)   where W ~ chi2(df).
 *
 * This preserves the correlation structure already embedded in `z` via
 * Cholesky decomposition — only the tail weight changes.
 */
export function applyStudentTScale(
  z: Float64Array,
  df: number,
  rng: () => number,
): void {
  const w = chiSquared(df, rng);
  const scale = Math.sqrt(df / w);
  for (let i = 0; i < z.length; i++) {
    z[i] = (z[i] ?? 0) * scale;
  }
}

/**
 * Uniform draw from [min, max).
 */
export function uniform(min: number, max: number, rng: () => number): number {
  return min + rng() * (max - min);
}

// ─── Gamma sampling (Marsaglia-Tsang algorithm) ───────────────────────────────

/**
 * Sample from Gamma(shape, 1) distribution using Marsaglia-Tsang (2000).
 * Works for shape >= 1. For shape < 1, uses the Ahrens-Dieter boost:
 * Gamma(alpha) = Gamma(alpha+1) * U^(1/alpha).
 */
function gammaSample(shape: number, rng: () => number): number {
  if (shape < 1) {
    // Boost: Gamma(alpha) = Gamma(alpha + 1) * U^(1/alpha)
    let u: number;
    do {
      u = rng();
    } while (u === 0);
    return gammaSample(shape + 1, rng) * Math.pow(u, 1 / shape);
  }

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  for (;;) {
    let x: number;
    let v: number;
    do {
      const [z1] = normalPair(rng);
      x = z1;
      v = 1 + c * x;
    } while (v <= 0);

    v = v * v * v; // v = (1 + c*x)^3
    const u = rng();
    const x2 = x * x;

    // Squeeze test (fast path).
    if (u < 1 - 0.0331 * x2 * x2) {
      return d * v;
    }
    // Logarithmic acceptance test.
    if (Math.log(u) < 0.5 * x2 + d * (1 - v + Math.log(v))) {
      return d * v;
    }
  }
}

// ─── Beta-PERT distribution ───────────────────────────────────────────────────

/**
 * Beta-PERT distribution: a smooth three-point estimate distribution with
 * min, most-likely (mode), and max parameters. Widely used in project
 * management and risk modelling for cost/duration estimates.
 *
 * The PERT Beta parameters are:
 *   α = 1 + 4 * (likely - min) / (max - min)
 *   β = 1 + 4 * (max - likely) / (max - min)
 *
 * A Beta(α, β) variate is generated via the Gamma ratio method:
 *   X = G1 / (G1 + G2)  where G1 ~ Gamma(α), G2 ~ Gamma(β)
 * Then scaled back to [min, max].
 *
 * @param min     Lower bound (inclusive).
 * @param likely  Mode — the most probable value.
 * @param max     Upper bound (inclusive).
 * @param rng     RNG instance.
 */
export function betaPERT(
  min: number,
  likely: number,
  max: number,
  rng: () => number,
): number {
  if (max <= min) return likely;

  const range = max - min;
  const alpha = 1 + 4 * (likely - min) / range;
  const beta  = 1 + 4 * (max - likely) / range;

  const g1 = gammaSample(alpha, rng);
  const g2 = gammaSample(beta, rng);
  const x = g1 / (g1 + g2);

  return min + x * range;
}

// ─── Log-normal distribution ─────────────────────────────────────────────────

/**
 * Sample from a log-normal distribution with log-space parameters mu_ln and
 * sigma_ln. The resulting value X satisfies ln(X) ~ N(mu_ln, sigma_ln²).
 *
 * Good for right-skewed costs such as medical bills or car repairs.
 *
 * @param mu     Log-space mean (location parameter).
 * @param sigma  Log-space standard deviation (shape parameter, > 0).
 * @param rng    RNG instance.
 */
export function lognormalSample(
  mu: number,
  sigma: number,
  rng: () => number,
): number {
  const [z] = normalPair(rng);
  return Math.exp(mu + sigma * z);
}

/**
 * Convert a three-point [min, likely, max] PERT estimate to approximate
 * log-normal parameters (mu, sigma in log-space).
 *
 * Method: set the log-normal mean = PERT mean and log-normal 95th percentile
 * ≈ max. This gives a practical approximation:
 *
 *   PERT mean   = (min + 4 * likely + max) / 6
 *   PERT stdDev = (max - min) / 6
 *
 *   E[X] = exp(mu + 0.5 * sigma^2)  =>  mu + 0.5 * sigma^2 = ln(E[X])
 *   Var[X] = (exp(sigma^2) - 1) * E[X]^2
 *
 * We solve for mu and sigma by matching mean and variance of the PERT.
 *
 * @param min     Lower bound.
 * @param likely  Mode.
 * @param max     Upper bound.
 */
export function pertToLognormal(
  min: number,
  likely: number,
  max: number,
): { mu: number; sigma: number } {
  const pertMean = (min + 4 * likely + max) / 6;
  const pertStd  = (max - min) / 6;

  // Guard: if pertMean <= 0 (degenerate input), fall back to mode.
  const safeMean = Math.max(pertMean, 1e-10);

  // sigma^2 = ln(1 + (pertStd / pertMean)^2)
  const cv2 = (pertStd / safeMean) * (pertStd / safeMean);
  const sigma2 = Math.log(1 + cv2);
  const sigma = Math.sqrt(Math.max(sigma2, 1e-10));

  // mu = ln(mean) - 0.5 * sigma^2
  const mu = Math.log(safeMean) - 0.5 * sigma2;

  return { mu, sigma };
}
