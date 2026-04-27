/**
 * Seeded pseudo-random number generator using the Mulberry32 algorithm.
 *
 * Mulberry32 passes BigCrush and produces 32 bits of randomness per call.
 * It is a good default for reproducible financial simulations because the
 * same seed always yields the same sequence, making results auditable.
 */
export function createRng(seed: number): () => number {
  // Ensure seed is a valid 32-bit unsigned integer.
  let s = (seed >>> 0) || 0x12345678;

  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x1_0000_0000;
  };
}

/**
 * Generate a random 32-bit integer seed that is safe for logging / storage.
 * This is used when the caller does not supply a seed.
 */
export function randomSeed(): number {
  return (Math.random() * 0xffff_ffff) >>> 0;
}
