import { describe, it, expect } from 'vitest';
import { createRng } from './rng.js';
import { normalPair, fillNormals, applyStudentTScale, uniform } from './distributions.js';

const LARGE_N = 50_000;

/** Sample mean of an array */
function sampleMean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/** Sample standard deviation (population) */
function sampleStd(arr: number[]): number {
  const m = sampleMean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

describe('normalPair — Box-Muller transform', () => {
  it('returns a tuple of two numbers', () => {
    const rng = createRng(1);
    const [z1, z2] = normalPair(rng);
    expect(typeof z1).toBe('number');
    expect(typeof z2).toBe('number');
  });

  it('is deterministic given the same RNG state', () => {
    const r1 = createRng(77);
    const r2 = createRng(77);
    expect(normalPair(r1)).toEqual(normalPair(r2));
  });

  it('produces samples with mean ≈ 0 over large N', () => {
    const rng = createRng(42);
    const samples: number[] = [];
    for (let i = 0; i < LARGE_N / 2; i++) {
      const [z1, z2] = normalPair(rng);
      samples.push(z1, z2);
    }
    expect(Math.abs(sampleMean(samples))).toBeLessThan(0.05);
  });

  it('produces samples with std ≈ 1 over large N', () => {
    const rng = createRng(99);
    const samples: number[] = [];
    for (let i = 0; i < LARGE_N / 2; i++) {
      const [z1, z2] = normalPair(rng);
      samples.push(z1, z2);
    }
    expect(Math.abs(sampleStd(samples) - 1)).toBeLessThan(0.05);
  });
});

describe('fillNormals', () => {
  it('fills an even-length array', () => {
    const rng = createRng(5);
    const out = new Float64Array(4);
    fillNormals(out, rng);
    for (const v of out) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  it('fills an odd-length array without hanging', () => {
    const rng = createRng(7);
    const out = new Float64Array(5);
    fillNormals(out, rng);
    for (const v of out) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  it('fills a length-1 array', () => {
    const rng = createRng(1);
    const out = new Float64Array(1);
    fillNormals(out, rng);
    expect(Number.isFinite(out[0]!)).toBe(true);
  });

  it('is deterministic', () => {
    const r1 = createRng(100);
    const r2 = createRng(100);
    const a = new Float64Array(6);
    const b = new Float64Array(6);
    fillNormals(a, r1);
    fillNormals(b, r2);
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it('produces ~N(0,1) over large N', () => {
    const rng = createRng(200);
    const out = new Float64Array(LARGE_N);
    fillNormals(out, rng);
    const samples = Array.from(out);
    expect(Math.abs(sampleMean(samples))).toBeLessThan(0.05);
    expect(Math.abs(sampleStd(samples) - 1)).toBeLessThan(0.05);
  });
});

describe('applyStudentTScale', () => {
  it('scales an array of normals in place', () => {
    const rng = createRng(13);
    const z = new Float64Array([1, 0, -1, 0.5]);
    applyStudentTScale(z, 5, rng);
    // Values should be scaled — not identical to input
    const original = [1, 0, -1, 0.5];
    const changed = Array.from(z).some((v, i) => v !== original[i]);
    expect(changed).toBe(true);
  });

  it('preserves sign of non-zero elements (scale is positive)', () => {
    // Student-t scale = sqrt(df / chi2) which is always positive, so signs must be preserved.
    const rng = createRng(31);
    const z = new Float64Array([2, -3, 1, -1]);
    applyStudentTScale(z, 10, rng);
    expect(z[0]).toBeGreaterThan(0);
    expect(z[1]).toBeLessThan(0);
    expect(z[2]).toBeGreaterThan(0);
    expect(z[3]).toBeLessThan(0);
  });

  it('produces fattened tails compared to normal — higher kurtosis (statistical)', () => {
    // Student-t with low df has fatter tails than normal.
    // Compare variance of scaled output: E[z²] ≈ df/(df-2) for t_df
    const n = 10_000;
    const rng = createRng(55);
    let sumSq = 0;
    for (let i = 0; i < n; i++) {
      const z = new Float64Array(1);
      fillNormals(z, rng);
      applyStudentTScale(z, 5, rng);
      sumSq += (z[0] ?? 0) ** 2;
    }
    const sampleVar = sumSq / n;
    // For t(5): theoretical variance = 5/(5-2) = 1.667
    expect(sampleVar).toBeGreaterThan(1.2);
  });

  it('is deterministic given the same RNG state', () => {
    const r1 = createRng(77);
    const r2 = createRng(77);
    const z1 = new Float64Array([1, -1, 0.5]);
    const z2 = new Float64Array([1, -1, 0.5]);
    applyStudentTScale(z1, 5, r1);
    applyStudentTScale(z2, 5, r2);
    expect(Array.from(z1)).toEqual(Array.from(z2));
  });
});

describe('uniform', () => {
  it('returns values in [min, max)', () => {
    const rng = createRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = uniform(100, 500, rng);
      expect(v).toBeGreaterThanOrEqual(100);
      expect(v).toBeLessThan(500);
    }
  });

  it('is deterministic', () => {
    expect(uniform(0, 1, createRng(9))).toBe(uniform(0, 1, createRng(9)));
  });

  it('handles min = 0 and max = 1', () => {
    const rng = createRng(1);
    const v = uniform(0, 1, rng);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  });

  it('covers the range uniformly (rough coverage test)', () => {
    const rng = createRng(100);
    const buckets = [0, 0, 0, 0, 0];
    for (let i = 0; i < 5000; i++) {
      const v = uniform(0, 5, rng);
      const idx = Math.floor(v);
      buckets[idx] = (buckets[idx] ?? 0) + 1;
    }
    // Each bucket should get roughly 1000 samples (±30%)
    for (const count of buckets) {
      expect(count).toBeGreaterThan(700);
      expect(count).toBeLessThan(1300);
    }
  });
});
