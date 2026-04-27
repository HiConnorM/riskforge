/**
 * Personal cashflow Monte Carlo simulation engine.
 *
 * Algorithm (per path):
 *   balance₀ = currentSavings
 *   For each month m in [1, horizonMonths]:
 *     balance += monthlyIncome − fixedExpenses − variableExpenses
 *     For each risk event e:
 *       if uniform() < e.probabilityPerMonth  (and occurrences < maxOccurrences):
 *         balance −= uniform(e.minCost, e.maxCost)
 *     track: is balance < 0?  is balance < emergencyThreshold?  monthly tally.
 *
 * Metrics computed across all paths:
 *   - P(ever below zero)
 *   - P(ever below emergency threshold)
 *   - Median / p10 / p05 ending balance
 *   - Recommended emergency fund (to bring P(< 0) to ≤ 5 %)
 *   - Month where the most paths are below zero
 *   - Expected total event cost
 */

import type {
  PersonalCashflowInput,
  CashflowSimConfig,
  PersonalCashflowResult,
  ResilienceLevel,
  RiskEvent,
} from '@riskforge/domain';
import { createRng } from '../core/rng.js';
import { uniform } from '../core/distributions.js';
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
  } = input;

  const { paths } = config;
  const seed = config.seed ?? Math.floor(Math.random() * 0xffff_ffff);

  const monthlyExpenses = monthlyFixedExpenses + monthlyVariableExpenses;
  const netMonthly = monthlyIncome - monthlyExpenses;
  const emergencyThreshold =
    input.emergencyThreshold ?? 3 * monthlyExpenses;

  const rng = createRng(seed);

  // Output arrays.
  const finalBalances = new Float64Array(paths);
  const everBelowZero = new Uint8Array(paths);         // 0 or 1
  const everBelowEmergency = new Uint8Array(paths);   // 0 or 1

  // Per-event total cost across all paths (for ranking).
  const eventTotalCosts = new Float64Array(riskEvents.length);

  // Monthly below-zero count (to find most fragile month).
  const monthlyBelowZeroCount = new Int32Array(horizonMonths);

  for (let p = 0; p < paths; p++) {
    let balance = currentSavings;
    const occurrences = new Int32Array(riskEvents.length);

    for (let m = 0; m < horizonMonths; m++) {
      // Regular cashflow.
      balance += netMonthly;

      // Stochastic risk events.
      for (let e = 0; e < riskEvents.length; e++) {
        const ev = riskEvents[e];
        if (!ev) continue;

        const maxOcc = ev.maxOccurrences ?? Infinity;
        const currentOcc = occurrences[e] ?? 0;
        if (currentOcc >= maxOcc) continue;

        if (rng() < ev.probabilityPerMonth) {
          const cost = uniform(ev.minCost, ev.maxCost, rng);
          balance -= cost;
          eventTotalCosts[e] = (eventTotalCosts[e] ?? 0) + cost;
          occurrences[e] = currentOcc + 1;
        }
      }

      if (balance < 0) {
        everBelowZero[p] = 1;
        monthlyBelowZeroCount[m] = (monthlyBelowZeroCount[m] ?? 0) + 1;
      }
      if (balance < emergencyThreshold) {
        everBelowEmergency[p] = 1;
      }
    }

    finalBalances[p] = balance;
  }

  // Sort for quantile computation.
  sortAsc(finalBalances);

  const probBelowZero =
    Array.from(everBelowZero).reduce((a, b) => a + b, 0) / paths;
  const probBelowEmergency =
    Array.from(everBelowEmergency).reduce((a, b) => a + b, 0) / paths;

  const medianEnding = quantile(finalBalances, 0.5);
  const p10Ending = quantile(finalBalances, 0.1);
  const p05Ending = quantile(finalBalances, 0.05);
  const worstCase = finalBalances[0] ?? 0;

  // Recommended emergency fund: amount needed to shift p05 to >= 0.
  const recommendedEmergencyFund = Math.max(0, Math.ceil(-p05Ending / 100) * 100);

  const mostFragileMonth = argMax(monthlyBelowZeroCount) + 1; // 1-indexed

  const expectedTotalEventCost =
    mean(eventTotalCosts) > 0
      ? Array.from(eventTotalCosts).reduce((a, b) => a + b, 0) / paths
      : 0;

  // Rank events by average cost contribution.
  type EventEntry = { name: string; avgCost: number };
  const eventRanked: EventEntry[] = riskEvents
    .map((ev: RiskEvent, i: number): EventEntry => ({ name: ev.name, avgCost: (eventTotalCosts[i] ?? 0) / paths }))
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
