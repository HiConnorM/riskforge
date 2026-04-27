/**
 * Cholesky decomposition for correlation matrices.
 *
 * Given a symmetric, positive-definite n×n matrix A, produces the lower-
 * triangular factor L such that A = L Lᵀ.  This is used to generate
 * correlated multivariate normal (and Student-t) random vectors from
 * independent standard normals:  x = L z,  where z ~ N(0, I).
 *
 * Financial correlations are often "almost" positive definite — near-zero
 * eigenvalues arise from highly correlated assets or imprecise user input.
 * We add a tiny diagonal jitter (1e-8) before bailing to handle these cases
 * gracefully without silently distorting valid matrices.
 */

export class CholeskyError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'CORRELATION_MATRIX_SINGULAR'
      | 'CORRELATION_MATRIX_INVALID',
  ) {
    super(message);
    this.name = 'CholeskyError';
  }
}

/**
 * Compute the lower-triangular Cholesky factor of `matrix`.
 *
 * @param matrix  n×n symmetric positive-definite matrix (row-major).
 * @returns       n×n lower-triangular factor L as a flat Float64Array
 *                (row-major; L[i*n + j] is the (i,j) element).
 */
export function cholesky(matrix: number[][]): Float64Array {
  const n = matrix.length;
  const L = new Float64Array(n * n); // row-major, zero-initialised

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      const row_i = matrix[i];
      if (!row_i) throw new CholeskyError('Matrix row missing', 'CORRELATION_MATRIX_INVALID');

      let s = row_i[j] ?? 0;

      for (let k = 0; k < j; k++) {
        s -= L[i * n + k]! * L[j * n + k]!;
      }

      if (i === j) {
        // Diagonal element — apply small jitter before bailing.
        if (s < 0) s = Math.max(s, 1e-10);
        if (s <= 0) {
          throw new CholeskyError(
            `Matrix is not positive definite at diagonal (${i},${i}): value ${s}`,
            'CORRELATION_MATRIX_SINGULAR',
          );
        }
        L[i * n + j] = Math.sqrt(s);
      } else {
        const ljj = L[j * n + j]!;
        if (ljj < 1e-14) {
          throw new CholeskyError(
            `Near-zero diagonal element L[${j}][${j}] = ${ljj}`,
            'CORRELATION_MATRIX_SINGULAR',
          );
        }
        L[i * n + j] = s / ljj;
      }
    }
  }

  return L;
}

/**
 * Multiply the lower-triangular factor L (from `cholesky`) by a vector z
 * of independent standard normals, producing correlated normals in-place.
 *
 * After this call, z[i] = Σ_j L[i,j] * z_original[j].
 * We overwrite z from bottom to top so that we can work in-place.
 *
 * @param L  Flat row-major Float64Array from `cholesky()`.
 * @param z  Float64Array of length n; overwritten in place.
 * @param n  Dimension.
 */
export function choleskyMultiply(
  L: Float64Array,
  z: Float64Array,
  n: number,
): void {
  // Traverse rows bottom-to-top so we can reuse z as both input and output.
  for (let i = n - 1; i >= 0; i--) {
    let s = 0;
    for (let j = 0; j <= i; j++) {
      s += L[i * n + j]! * z[j]!;
    }
    z[i] = s;
  }
}

/**
 * Apply a stress transformation to a correlation matrix.
 *
 * corrTarget: target off-diagonal correlation (e.g. 0.85 for stress).
 * corrBlend:  0 = no change, 1 = full stress (default 1).
 */
export function stressCorrelation(
  original: number[][],
  corrTarget: number,
  corrBlend = 1,
): number[][] {
  const n = original.length;
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) => {
      if (i === j) return 1;
      const orig = original[i]?.[j] ?? 0;
      return orig + corrBlend * (corrTarget - orig);
    }),
  );
}
