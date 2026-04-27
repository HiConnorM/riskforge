/**
 * Core statistical utilities.
 *
 * All functions operate on plain number arrays or Float64Arrays.
 * Inputs must be sorted ascending unless noted otherwise.
 */

/**
 * Linear-interpolation quantile on a sorted array.
 * p = 0 → minimum, p = 1 → maximum.
 */
export function quantile(sorted: Float64Array | number[], p: number): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  if (n === 1) return sorted[0] ?? NaN;

  const idx = p * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const vLo = sorted[lo] ?? 0;
  const vHi = sorted[hi] ?? 0;
  return vLo + (vHi - vLo) * (idx - lo);
}

/**
 * Arithmetic mean of an array.
 */
export function mean(arr: Float64Array | number[]): number {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i] ?? 0;
  return sum / arr.length;
}

/**
 * Sample standard deviation (n-1 denominator).
 */
export function stdDev(arr: Float64Array | number[]): number {
  const m = mean(arr);
  let sq = 0;
  for (let i = 0; i < arr.length; i++) {
    const d = (arr[i] ?? 0) - m;
    sq += d * d;
  }
  return Math.sqrt(sq / (arr.length - 1));
}

/**
 * Sort a Float64Array in-place ascending and return it (for chaining).
 */
export function sortAsc(arr: Float64Array): Float64Array {
  arr.sort();
  return arr;
}

/**
 * Value-at-Risk at confidence level `alpha`.
 *
 * VaR_α = loss such that P(loss > VaR_α) = 1 − α.
 * Returns a positive number representing the magnitude of the loss.
 *
 * @param sortedReturns  Returns sorted ascending (worst first).
 * @param alpha          Confidence level, e.g. 0.95.
 */
export function computeVaR(
  sortedReturns: Float64Array,
  alpha: number,
): number {
  const p = 1 - alpha;
  return -quantile(sortedReturns, p);
}

/**
 * Expected Shortfall (CVaR) at confidence level `alpha`.
 *
 * ES_α = mean of losses beyond VaR_α.
 * Returns a positive number.
 *
 * @param sortedReturns  Returns sorted ascending (worst first).
 * @param alpha          Confidence level, e.g. 0.95.
 */
export function computeES(sortedReturns: Float64Array, alpha: number): number {
  const cutoff = Math.max(1, Math.floor((1 - alpha) * sortedReturns.length));
  let sum = 0;
  for (let i = 0; i < cutoff; i++) sum += sortedReturns[i] ?? 0;
  return -(sum / cutoff);
}

/**
 * Fraction of values in arr that are strictly less than threshold.
 */
export function fractionBelow(
  arr: Float64Array,
  threshold: number,
): number {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    if ((arr[i] ?? 0) < threshold) count++;
  }
  return count / arr.length;
}

/**
 * Index of the maximum value in a typed array.
 */
export function argMax(arr: Int32Array | Float64Array): number {
  let best = -Infinity;
  let idx = 0;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i] ?? -Infinity;
    if (v > best) {
      best = v;
      idx = i;
    }
  }
  return idx;
}
