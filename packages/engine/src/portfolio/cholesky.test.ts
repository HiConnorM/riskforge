import { describe, it, expect } from 'vitest';
import { cholesky, choleskyMultiply, stressCorrelation, CholeskyError } from './cholesky.js';

// Helpers
function matMul(A: Float64Array, n: number, B: Float64Array): Float64Array {
  const C = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += (A[i * n + k] ?? 0) * (B[k * n + j] ?? 0);
      C[i * n + j] = s;
    }
  }
  return C;
}

function transpose(A: Float64Array, n: number): Float64Array {
  const T = new Float64Array(n * n);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      T[i * n + j] = A[j * n + i] ?? 0;
  return T;
}

describe('cholesky', () => {
  it('decomposes the identity matrix correctly', () => {
    const I: number[][] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    const L = cholesky(I);
    const n = 3;
    // L should equal I for identity input
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const expected = i === j ? 1 : 0;
        expect(L[i * n + j]).toBeCloseTo(expected, 10);
      }
    }
  });

  it('satisfies L * Lᵀ ≈ A for a 2×2 correlation matrix', () => {
    const rho = 0.6;
    const A = [[1, rho], [rho, 1]];
    const L = cholesky(A);
    const Lt = transpose(L, 2);
    const reconstructed = matMul(L, 2, Lt);
    // reconstructed ≈ A
    expect(reconstructed[0]).toBeCloseTo(1, 8);
    expect(reconstructed[1]).toBeCloseTo(rho, 8);
    expect(reconstructed[2]).toBeCloseTo(rho, 8);
    expect(reconstructed[3]).toBeCloseTo(1, 8);
  });

  it('satisfies L * Lᵀ ≈ A for a 3×3 correlation matrix', () => {
    const A = [
      [1, -0.1, 0.05],
      [-0.1, 1, -0.05],
      [0.05, -0.05, 1],
    ];
    const n = 3;
    const L = cholesky(A);
    const Lt = transpose(L, n);
    const reconstructed = matMul(L, n, Lt);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        expect(reconstructed[i * n + j]).toBeCloseTo(A[i]![j]!, 8);
      }
    }
  });

  it('produces a lower-triangular result', () => {
    const A = [[1, 0.3], [0.3, 1]];
    const L = cholesky(A);
    // L[0][1] (upper triangle) should be 0
    expect(L[1]).toBeCloseTo(0, 10);
  });

  it('throws CholeskyError for a singular matrix', () => {
    // Perfect correlation → singular
    const A = [[1, 1], [1, 1]];
    expect(() => cholesky(A)).toThrow(CholeskyError);
  });

  it('throws with code CORRELATION_MATRIX_SINGULAR for near-singular matrix', () => {
    const A = [[1, 1], [1, 1]];
    try {
      cholesky(A);
      expect.fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(CholeskyError);
      expect((e as CholeskyError).code).toBe('CORRELATION_MATRIX_SINGULAR');
    }
  });

  it('handles high (but valid) correlation without throwing', () => {
    const rho = 0.99;
    const A = [[1, rho], [rho, 1]];
    expect(() => cholesky(A)).not.toThrow();
  });

  it('handles negative correlation correctly', () => {
    const A = [[1, -0.8], [-0.8, 1]];
    const L = cholesky(A);
    const Lt = transpose(L, 2);
    const R = matMul(L, 2, Lt);
    expect(R[1]).toBeCloseTo(-0.8, 8); // off-diagonal
  });
});

describe('choleskyMultiply', () => {
  it('multiplies identity L by z → z unchanged', () => {
    // L = identity (3×3)
    const L = new Float64Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    const z = new Float64Array([1.5, -0.5, 2.0]);
    choleskyMultiply(L, z, 3);
    expect(z[0]).toBeCloseTo(1.5, 10);
    expect(z[1]).toBeCloseTo(-0.5, 10);
    expect(z[2]).toBeCloseTo(2.0, 10);
  });

  it('correctly correlates 2D normals', () => {
    // Correlation 0.6: L = [[1, 0], [0.6, 0.8]]
    const rho = 0.6;
    const L2 = cholesky([[1, rho], [rho, 1]]);
    const z = new Float64Array([1.0, 0.0]);
    choleskyMultiply(L2, z, 2);
    // z[0] should equal L[0,0]*1 = 1.0
    // z[1] should equal L[1,0]*1 + L[1,1]*0 = L[1,0]
    expect(z[0]).toBeCloseTo(1.0, 8);
    expect(z[1]).toBeCloseTo(L2[2]!, 8); // L[1,0]
  });
});

describe('stressCorrelation', () => {
  it('does not change diagonal elements', () => {
    const original = [[1, 0.2], [0.2, 1]];
    const stressed = stressCorrelation(original, 0.8, 0.5);
    expect(stressed[0]![0]).toBe(1);
    expect(stressed[1]![1]).toBe(1);
  });

  it('blends toward corrTarget at corrBlend=1', () => {
    const original = [[1, 0.2], [0.2, 1]];
    const stressed = stressCorrelation(original, 0.8, 1);
    expect(stressed[0]![1]).toBeCloseTo(0.8, 10);
    expect(stressed[1]![0]).toBeCloseTo(0.8, 10);
  });

  it('does not change at corrBlend=0', () => {
    const original = [[1, 0.3], [0.3, 1]];
    const stressed = stressCorrelation(original, 0.9, 0);
    expect(stressed[0]![1]).toBeCloseTo(0.3, 10);
  });

  it('interpolates correctly at corrBlend=0.5', () => {
    const original = [[1, 0.0], [0.0, 1]];
    const stressed = stressCorrelation(original, 1.0, 0.5);
    // 0.0 + 0.5 * (1.0 - 0.0) = 0.5
    expect(stressed[0]![1]).toBeCloseTo(0.5, 10);
  });

  it('uses corrBlend=1 as default', () => {
    const original = [[1, 0.1], [0.1, 1]];
    const stressed = stressCorrelation(original, 0.9);
    expect(stressed[0]![1]).toBeCloseTo(0.9, 10);
  });
});
