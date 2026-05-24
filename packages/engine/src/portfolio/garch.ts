/**
 * GARCH(1,1) volatility model.
 *
 * The GARCH(1,1) model captures time-varying volatility (volatility clustering):
 *   σ²(t+1) = ω + α·ε²(t) + β·σ²(t)
 *
 * where:
 *   ω = long-run variance × (1 - α - β)  (derived from σ_longrun)
 *   α = ARCH coefficient (news impact / short-term shock persistence)
 *   β = GARCH coefficient (long-term persistence)
 *   ε(t) = innovation = z(t) × σ(t)  (actual return shock)
 *
 * Typical equity values: α=0.09, β=0.90 (persistence = 0.99).
 * Variance is clamped to [0.1, 20] × longRunVariance to prevent explosion.
 */

const TRADING_DAYS_PER_YEAR = 252;

export interface GarchParams {
  /** ARCH coefficient (news impact). Typically 0.09 for equities. */
  alpha: number;
  /** GARCH coefficient (persistence). Typically 0.90 for equities. */
  beta: number;
  // omega is derived: omega = sigma_daily_sq * (1 - alpha - beta)
}

export interface GarchState {
  /** Current conditional variance (daily, not annualised). */
  varianceDaily: number;
  /** Unconditional (long-run) daily variance. */
  longRunVarianceDaily: number;
}

/**
 * Well-known default GARCH parameters for different asset classes.
 * These match empirical estimates from the literature.
 */
export const DEFAULT_GARCH_EQUITY: GarchParams = { alpha: 0.09, beta: 0.90 };
export const DEFAULT_GARCH_CRYPTO: GarchParams = { alpha: 0.12, beta: 0.85 };
export const DEFAULT_GARCH_BOND:   GarchParams = { alpha: 0.04, beta: 0.94 };

/**
 * Initialise a GARCH state from an annualised volatility estimate.
 *
 * The initial conditional variance is set equal to the long-run unconditional
 * variance, so the process starts at its stationary mean. This avoids
 * transient volatility spikes in the first few days of each path.
 *
 * @param sigmaAnnual  Annualised volatility (e.g. 0.16 = 16%).
 * @param params       GARCH(1,1) parameters.
 */
export function initGarchState(
  sigmaAnnual: number,
  params: GarchParams,
): GarchState {
  const varianceDaily = (sigmaAnnual * sigmaAnnual) / TRADING_DAYS_PER_YEAR;
  return {
    varianceDaily,
    longRunVarianceDaily: varianceDaily,
  };
}

/**
 * Advance GARCH state by one time step.
 *
 * Updates the conditional variance using:
 *   ω = longRunVariance × (1 - α - β)
 *   ε = innovation × effectiveSigmaDaily    (actual shock in return units)
 *   variance(t+1) = ω + α × ε² + β × variance(t)
 *
 * The result is clamped to [0.1, 20] × longRunVariance to keep variance
 * bounded and prevent numerical explosion in extreme paths.
 *
 * @param state               Current GARCH state.
 * @param params              GARCH(1,1) parameters.
 * @param innovation          Standardised shock z ~ N(0,1) or Student-t scaled.
 * @param effectiveSigmaDaily Current daily sigma = sqrt(state.varianceDaily).
 */
export function updateGarchState(
  state: GarchState,
  params: GarchParams,
  innovation: number,
  effectiveSigmaDaily: number,
): GarchState {
  const { alpha, beta } = params;
  const omega = state.longRunVarianceDaily * (1 - alpha - beta);

  // Actual shock in return units: ε = z × σ_daily
  const epsilon = innovation * effectiveSigmaDaily;

  // GARCH variance update.
  let newVariance = omega + alpha * epsilon * epsilon + beta * state.varianceDaily;

  // Clamp to prevent variance explosion or collapse.
  const lo = 0.1 * state.longRunVarianceDaily;
  const hi = 20 * state.longRunVarianceDaily;
  if (newVariance < lo) newVariance = lo;
  if (newVariance > hi) newVariance = hi;

  return {
    varianceDaily: newVariance,
    longRunVarianceDaily: state.longRunVarianceDaily,
  };
}
