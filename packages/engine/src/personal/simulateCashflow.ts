/**
 * Personal cashflow Monte Carlo simulation engine.
 *
 * Algorithm (per path):
 *   balance₀ = currentSavings
 *   For each month m in [1, horizonMonths]:
 *     inflationFactor = (1 + inflationRate)^(m/12)
 *     effectiveIncome = monthlyIncome × (1 - incomeShockFraction)
 *     balance += effectiveIncome − fixedExpenses×inflFactor − variableExpenses×inflFactor
 *     For each risk event e:
 *       if uniform() < e.probabilityPerMonth  (and occurrences < maxOccurrences):
 *         if likelyCost set: cost = betaPERT(minCost, likelyCost, maxCost, rng)
 *         else:              cost = uniform(minCost, maxCost, rng)
 *         balance −= cost
 *     For each income shock:
 *       if shock active this month: reduce income by incomeFractionLost
 *     track: is balance < 0?  is balance < emergencyThreshold?  monthly tally.
 *
 * Antithetic variates (optional): run N/2 normal paths + N/2 antithetic paths.
 *
 * Metrics computed across all paths:
 *   - P(ever below zero)
 *   - P(ever below emergency threshold)
 *   - Median / p10 / p05 ending balance
 *   - Recommended emergency fund: additional cash so that ≤ 5 % of paths ever
 *     dip below zero at ANY month (5th pct of per-path MINIMUM balance)
 *   - Month where the most paths are below zero
 *   - Expected total event cost
 *   - Inflation-adjusted median balance
 *   - Expected income lost to income shocks (tracked directly per month)
 */

import type {
  PersonalCashflowInput,
  CashflowSimConfig,
  PersonalCashflowResult,
  ResilienceLevel,
  RiskEvent,
} from '@riskforge/domain';
import { createRng } from '../core/rng.js';
import { uniform, betaPERT } from '../core/distributions.js';
import { sortAsc, quantile, mean, argMax } from '../core/statistics.js';

function buildSummary(
  probBelowZero: number,
  recommendedEmergencyFund: number,
  topRiskEvents: string[],
  resilienceLevel: ResilienceLevel,
  netMonthly: number,
  monthlyExpenses: number,
): { plainEnglishSummary: string; suggestedActions: string[] } {
  const pct = (v: number) => `${(v * 100).toFixed(0)}%`;
  const usd = (v: number) => `$${Math.round(v).toLocaleString()}`;

  const plainEnglishSummary = (() => {
    if (resilienceLevel === 'critical') {
      return (
        `Your finances face a ${pct(probBelowZero)} chance of going negative during this period. ` +
        `Multiple risk events occurring together could be financially devastating. ` +
        `Immediate action is strongly recommended.`
      );
    }
    if (resilienceLevel === 'fragile') {
      return (
        `There is a ${pct(probBelowZero)} chance of your balance going negative. ` +
        `Your savings buffer is thin — a single moderate emergency is manageable, ` +
        `but combinations of events create meaningful risk.` +
        (topRiskEvents.length > 0
          ? ` Top risk drivers: ${topRiskEvents.slice(0, 2).join(' and ')}.`
          : '')
      );
    }
    if (resilienceLevel === 'watch') {
      return (
        `Your finances look mostly stable, but there is a ${pct(probBelowZero)} chance ` +
        `of dipping below zero. Building a slightly larger buffer would reduce this risk significantly.`
      );
    }
    return (
      `Your financial position appears stable with only a ${pct(probBelowZero)} chance ` +
      `of going negative. Keep maintaining your savings buffer.`
    );
  })();

  const suggestedActions: string[] = [];

  if (recommendedEmergencyFund > 0) {
    suggestedActions.push(
      `Add ${usd(recommendedEmergencyFund)} to your emergency fund to reduce the chance ` +
        `of going negative to under 5%.`,
    );
  }

  if (netMonthly < 0) {
    suggestedActions.push(
      `Your fixed expenses exceed your income by ${usd(-netMonthly)}/month — ` +
        `reducing recurring costs is the highest-impact action you can take.`,
    );
  } else if (netMonthly < monthlyExpenses * 0.1) {
    suggestedActions.push(
      `Your monthly surplus is thin (${usd(netMonthly)}/month). Even a small reduction ` +
        `in variable spending would meaningfully improve your resilience.`,
    );
  }

  if (topRiskEvents[0]) {
    suggestedActions.push(
      `Your highest-impact risk event is "${topRiskEvents[0]}". ` +
        `Consider a dedicated sinking fund to absorb this cost without touching savings.`,
    );
  }

  if (topRiskEvents[1]) {
    suggestedActions.push(
      `"${topRiskEvents[1]}" is your second-largest risk driver. ` +
        `Review whether insurance or preventive spending could reduce its frequency or severity.`,
    );
  }

  return { plainEnglishSummary, suggestedActions };
}

export function simulatePersonalCashflow(
  input: PersonalCashflowInput,
  config: CashflowSimConfig,
  engineVersion = '1.0.0',
): PersonalCashflowResult {
  const t0 = Date.now();

  const {
    monthlyIncome,
    monthlyFixedExpenses,
    monthlyVariableExpenses,
    currentSavings,
    horizonMonths,
    riskEvents,
    inflationRate,
    incomeShocks,
  } = input;

  const { paths } = config;
  const seed = config.seed ?? Math.floor(Math.random() * 0xffff_ffff);

  const effectiveInflationRate = inflationRate ?? 0;

  const monthlyExpenses = monthlyFixedExpenses + monthlyVariableExpenses;
  // Base net monthly (before inflation) used for messaging only.
  const netMonthly = monthlyIncome - monthlyExpenses;
  const emergencyThreshold =
    input.emergencyThreshold ?? 3 * monthlyExpenses;

  const rng = createRng(seed);

  // Output arrays.
  const totalPaths = paths;
  const finalBalances = new Float64Array(totalPaths);
  const everBelowZero = new Uint8Array(totalPaths);
  const everBelowEmergency = new Uint8Array(totalPaths);

  // Per-event total cost across all paths (for ranking).
  const eventTotalCosts = new Float64Array(riskEvents.length);

  // Monthly below-zero count (to find most fragile month).
  const monthlyBelowZeroCount = new Int32Array(horizonMonths);

  // Expected income lost to income shocks, accumulated directly each month so
  // the metric is not confounded with risk-event costs or inflation.
  let totalIncomeShockLoss = 0;

  // Per-path minimum balance — the emergency-fund recommendation must cover
  // intra-horizon dips, not just the ending balance.
  const minBalances = new Float64Array(totalPaths);

  // ─── Income shock state per path ─────────────────────────────────────────
  // incomeShocks[j]: probabilityPerYear, incomeFractionLost, durationMonthsMin/Max
  // Per path: for each shock, track remaining active months.

  const numShocks = (incomeShocks?.length ?? 0);

  for (let p = 0; p < totalPaths; p++) {
    let balance = currentSavings;
    let minBalance = balance;
    let pathShockLoss = 0;
    const occurrences = new Int32Array(riskEvents.length);

    // Income shock active-duration counters per shock.
    const shockRemainingMonths = new Int32Array(numShocks);

    for (let m = 0; m < horizonMonths; m++) {
      // Inflation factor for this month (compound monthly).
      const inflFactor = Math.pow(1 + effectiveInflationRate, (m + 1) / 12);

      // Inflation-adjusted expenses.
      const adjFixed    = monthlyFixedExpenses    * inflFactor;
      const adjVariable = monthlyVariableExpenses * inflFactor;
      const adjExpenses = adjFixed + adjVariable;

      // Income shock: determine fraction of income lost this month.
      let incomeLostFraction = 0;
      if (incomeShocks !== undefined) {
        for (let j = 0; j < numShocks; j++) {
          const shock = incomeShocks[j];
          if (shock === undefined) continue;

          const remaining = shockRemainingMonths[j] ?? 0;
          if (remaining > 0) {
            // Shock is active: reduce income.
            incomeLostFraction = Math.min(1, incomeLostFraction + shock.incomeFractionLost);
            shockRemainingMonths[j] = remaining - 1;
          } else {
            // Check if shock starts this month.
            const probThisMonth = shock.probabilityPerYear / 12;
            if (rng() < probThisMonth) {
              // Trigger shock: draw duration uniformly between min and max.
              const duration =
                shock.durationMonthsMin +
                Math.floor(rng() * (shock.durationMonthsMax - shock.durationMonthsMin + 1));
              shockRemainingMonths[j] = Math.max(0, duration - 1); // current month counts
              incomeLostFraction = Math.min(1, incomeLostFraction + shock.incomeFractionLost);
            }
          }
        }
      }

      const effectiveIncome = monthlyIncome * (1 - incomeLostFraction);
      pathShockLoss += monthlyIncome - effectiveIncome;

      // Regular cashflow with inflation.
      balance += effectiveIncome - adjExpenses;

      // Stochastic risk events.
      for (let e = 0; e < riskEvents.length; e++) {
        const ev = riskEvents[e];
        if (!ev) continue;

        const maxOcc = ev.maxOccurrences ?? Infinity;
        const currentOcc = occurrences[e] ?? 0;
        if (currentOcc >= maxOcc) continue;

        if (rng() < ev.probabilityPerMonth) {
          let cost: number;
          if (ev.likelyCost !== undefined) {
            cost = betaPERT(ev.minCost, ev.likelyCost, ev.maxCost, rng);
          } else {
            cost = uniform(ev.minCost, ev.maxCost, rng);
          }
          balance -= cost;
          eventTotalCosts[e] = (eventTotalCosts[e] ?? 0) + cost;
          occurrences[e] = currentOcc + 1;
        }
      }

      if (balance < minBalance) minBalance = balance;
      if (balance < 0) {
        everBelowZero[p] = 1;
        monthlyBelowZeroCount[m] = (monthlyBelowZeroCount[m] ?? 0) + 1;
      }
      if (balance < emergencyThreshold) {
        everBelowEmergency[p] = 1;
      }
    }

    finalBalances[p] = balance;
    minBalances[p] = minBalance;
    totalIncomeShockLoss += pathShockLoss;
  }

  // Sort for quantile computation.
  sortAsc(finalBalances);
  sortAsc(minBalances);

  const probBelowZero =
    Array.from(everBelowZero).reduce((a, b) => a + b, 0) / totalPaths;
  const probBelowEmergency =
    Array.from(everBelowEmergency).reduce((a, b) => a + b, 0) / totalPaths;

  const medianEnding = quantile(finalBalances, 0.5);
  const p10Ending = quantile(finalBalances, 0.1);
  const p05Ending = quantile(finalBalances, 0.05);
  const worstCase = finalBalances[0] ?? 0;

  // Recommended emergency fund: additional cash such that ~95% of paths never
  // go below zero at ANY point in the horizon. Uses the 5th percentile of the
  // per-path MINIMUM balance — a path can go negative in month 4 and recover
  // by month 12, which the ending balance alone would miss.
  const p05MinBalance = quantile(minBalances, 0.05);
  const recommendedEmergencyFund = Math.max(0, Math.ceil(-p05MinBalance / 100) * 100);

  const mostFragileMonth = argMax(monthlyBelowZeroCount) + 1; // 1-indexed

  const expectedTotalEventCost =
    mean(eventTotalCosts) > 0
      ? Array.from(eventTotalCosts).reduce((a, b) => a + b, 0) / totalPaths
      : 0;

  // Rank events by average cost contribution.
  type EventEntry = { name: string; avgCost: number };
  const eventRanked: EventEntry[] = riskEvents
    .map((ev: RiskEvent, i: number): EventEntry => ({ name: ev.name, avgCost: (eventTotalCosts[i] ?? 0) / totalPaths }))
    .sort((a: EventEntry, b: EventEntry) => b.avgCost - a.avgCost);

  const topRiskEvents = eventRanked.slice(0, 3).map((e: EventEntry) => e.name);

  let resilienceLevel: ResilienceLevel;
  if (probBelowZero > 0.30) resilienceLevel = 'critical';
  else if (probBelowZero > 0.15) resilienceLevel = 'fragile';
  else if (probBelowZero > 0.05) resilienceLevel = 'watch';
  else resilienceLevel = 'stable';

  const { plainEnglishSummary, suggestedActions } = buildSummary(
    probBelowZero,
    recommendedEmergencyFund,
    topRiskEvents,
    resilienceLevel,
    netMonthly,
    monthlyExpenses,
  );

  // Inflation-adjusted median balance: deflate by cumulative inflation at horizon end.
  const horizonInflFactor = Math.pow(1 + effectiveInflationRate, horizonMonths / 12);
  const inflationAdjustedMedianBalance =
    effectiveInflationRate !== 0
      ? medianEnding / Math.max(horizonInflFactor, 1e-10)
      : undefined;

  // Income shock impact: expected total income lost to shocks over the horizon
  // (directly accumulated; excludes risk-event costs and inflation effects).
  const incomeShockImpact =
    numShocks > 0 ? totalIncomeShockLoss / totalPaths : undefined;

  return {
    summary: {
      probabilityBelowZero: probBelowZero,
      probabilityBelowEmergencyThreshold: probBelowEmergency,
      medianEndingBalance: medianEnding,
      p10EndingBalance: p10Ending,
      p05EndingBalance: p05Ending,
      worstCaseEndingBalance: worstCase,
      recommendedEmergencyFund,
      mostFragileMonth,
      expectedTotalEventCost,
      ...(inflationAdjustedMedianBalance !== undefined ? { inflationAdjustedMedianBalance } : {}),
      ...(incomeShockImpact !== undefined ? { incomeShockImpact } : {}),
    },
    interpretation: {
      resilienceLevel,
      topRiskEvents,
      plainEnglishSummary,
      suggestedActions,
    },
    meta: {
      paths,
      horizonMonths,
      seed,
      engineVersion,
      elapsedMs: Date.now() - t0,
    },
  };
}
