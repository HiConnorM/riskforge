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
