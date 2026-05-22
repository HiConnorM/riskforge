import { describe, it, expect } from 'vitest';
import {
  quantile,
  mean,
  stdDev,
  sortAsc,
  computeVaR,
  computeES,
  fractionBelow,
  argMax,
} from './statistics.js';

describe('quantile', () => {
  const arr = new Float64Array([1, 2, 3, 4, 5]);

  it('p=0 returns minimum', () => {
    expect(quantile(arr, 0)).toBe(1);
  });

  it('p=1 returns maximum', () => {
    expect(quantile(arr, 1)).toBe(5);
  });

  it('p=0.5 returns median of odd-length array', () => {
    expect(quantile(arr, 0.5)).toBe(3);
  });

  it('interpolates for p=0.25', () => {
    // idx = 0.25 * 4 = 1.0 → exactly index 1 → 2
    expect(quantile(arr, 0.25)).toBe(2);
  });

  it('interpolates mid-point between two values', () => {
    const twoEl = new Float64Array([0, 10]);
    expect(quantile(twoEl, 0.5)).toBe(5);
  });

  it('returns NaN for empty array', () => {
    expect(quantile(new Float64Array([]), 0.5)).toBeNaN();
  });

  it('returns the only element for single-element array', () => {
    expect(quantile(new Float64Array([42]), 0.5)).toBe(42);
  });

  it('works with plain number arrays', () => {
    expect(quantile([10, 20, 30], 0.5)).toBe(20);
  });
});

describe('mean', () => {
  it('computes correct mean for simple array', () => {
    expect(mean(new Float64Array([2, 4, 6]))).toBe(4);
  });

  it('handles negative values', () => {
    expect(mean(new Float64Array([-3, 3]))).toBe(0);
  });

  it('works with plain number arrays', () => {
    expect(mean([10, 20, 30])).toBeCloseTo(20, 10);
  });

  it('handles single element', () => {
    expect(mean(new Float64Array([7]))).toBe(7);
  });
});

describe('stdDev', () => {
  it('returns 0 for constant array (within floating point)', () => {
    // std of [5,5,5,5] should be 0 (n-1 denominator, but all same)
    expect(stdDev(new Float64Array([5, 5, 5, 5]))).toBeCloseTo(0, 10);
  });

  it('computes known std correctly', () => {
    // [2, 4, 4, 4, 5, 5, 7, 9]: mean=5, sum_sq=32, n-1=7, std=sqrt(32/7)≈2.138
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(Math.sqrt(32 / 7), 8);
  });

  it('uses n-1 (Bessel correction)', () => {
    // [1, 3]: mean=2, sum_sq=(1-2)^2+(3-2)^2=2, n-1=1, std=sqrt(2)
    expect(stdDev([1, 3])).toBeCloseTo(Math.sqrt(2), 10);
  });
});

describe('sortAsc', () => {
  it('sorts in ascending order', () => {
    const arr = new Float64Array([5, 1, 3, 2, 4]);
    sortAsc(arr);
    expect(Array.from(arr)).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns the same array (in-place)', () => {
    const arr = new Float64Array([3, 1, 2]);
    const result = sortAsc(arr);
    expect(result).toBe(arr);
  });

  it('handles already-sorted array', () => {
    const arr = new Float64Array([1, 2, 3]);
    sortAsc(arr);
    expect(Array.from(arr)).toEqual([1, 2, 3]);
  });

  it('handles negative values', () => {
    const arr = new Float64Array([-5, 0, -10, 3]);
    sortAsc(arr);
    expect(Array.from(arr)).toEqual([-10, -5, 0, 3]);
  });
});

describe('computeVaR', () => {
  it('returns positive VaR for a loss distribution', () => {
    // Sorted ascending (worst to best)
    const returns = new Float64Array([-0.3, -0.2, -0.1, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4]);
    const var95 = computeVaR(returns, 0.95);
    expect(var95).toBeGreaterThan(0);
  });

  it('VaR99 >= VaR95 for same distribution', () => {
    const returns = sortAsc(new Float64Array(
      Array.from({ length: 1000 }, (_, i) => -0.5 + i * 0.001)
    ));
    const var95 = computeVaR(returns, 0.95);
    const var99 = computeVaR(returns, 0.99);
    expect(var99).toBeGreaterThanOrEqual(var95);
  });

  it('VaR of uniformly good returns is negative (profit scenario)', () => {
    // If all returns are positive, VaR is negative (the "loss" is a gain)
    const returns = new Float64Array([0.1, 0.2, 0.3, 0.4, 0.5]);
    const var95 = computeVaR(returns, 0.95);
    expect(var95).toBeLessThan(0); // -quantile at 5th percentile
  });
});

describe('computeES', () => {
  it('ES >= VaR for same distribution (ES is worse than VaR)', () => {
    const returns = sortAsc(new Float64Array(
      Array.from({ length: 1000 }, (_, i) => -0.5 + i * 0.001)
    ));
    const var95 = computeVaR(returns, 0.95);
    const es95 = computeES(returns, 0.95);
    expect(es95).toBeGreaterThanOrEqual(var95);
  });

  it('is coherent — larger alpha gives more conservative (larger) ES', () => {
    const returns = sortAsc(new Float64Array(
      Array.from({ length: 2000 }, (_, i) => -1 + i * 0.001)
    ));
    const es95 = computeES(returns, 0.95);
    const es99 = computeES(returns, 0.99);
    expect(es99).toBeGreaterThanOrEqual(es95);
  });

  it('ES is positive for a return distribution with losses', () => {
    const returns = sortAsc(new Float64Array(
      Array.from({ length: 100 }, (_, i) => -0.5 + i * 0.01)
    ));
    expect(computeES(returns, 0.95)).toBeGreaterThan(0);
  });
});

describe('fractionBelow', () => {
  it('returns 0 when no values are below threshold', () => {
    expect(fractionBelow(new Float64Array([1, 2, 3]), 0)).toBe(0);
  });

  it('returns 1 when all values are below threshold', () => {
    expect(fractionBelow(new Float64Array([1, 2, 3]), 10)).toBe(1);
  });

  it('returns correct fraction', () => {
    const arr = new Float64Array([1, 2, 3, 4, 5]);
    expect(fractionBelow(arr, 3)).toBeCloseTo(2 / 5, 10); // 1 and 2 are strictly < 3
  });

  it('handles threshold on exact value (strict less-than)', () => {
    const arr = new Float64Array([1, 2, 3]);
    expect(fractionBelow(arr, 2)).toBeCloseTo(1 / 3, 10); // only 1 is < 2
  });
});

describe('argMax', () => {
  it('returns index of maximum in Float64Array', () => {
    const arr = new Float64Array([3, 1, 4, 1, 5, 9, 2, 6]);
    expect(argMax(arr)).toBe(5); // index of 9
  });

  it('returns index of maximum in Int32Array', () => {
    const arr = new Int32Array([0, 10, 3, 7]);
    expect(argMax(arr)).toBe(1);
  });

  it('returns 0 for single-element array', () => {
    expect(argMax(new Float64Array([42]))).toBe(0);
  });

  it('returns first index when multiple maxima (first wins)', () => {
    const arr = new Float64Array([5, 5, 5]);
    expect(argMax(arr)).toBe(0);
  });
});
