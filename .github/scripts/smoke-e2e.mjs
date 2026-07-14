/**
 * CI smoke E2E: request → API validation → queue → worker → engine → result.
 *
 * Asserts the full pipeline against a running API (API_BASE, default
 * http://localhost:3001) and that the contract-critical behaviours hold:
 *   - a stressed run is accepted, executes, and reports meta.stressed
 *   - stress parameters are actually applied (stressed VaR ≫ baseline VaR
 *     at the same seed — guards the Zod unknown-key-stripping bug class)
 *   - Expected Shortfall attribution is present under its correct names
 *     and sums to the portfolio ES
 */

const API = process.env.API_BASE ?? 'http://localhost:3001';

const baseRequest = {
  kind: 'portfolio_risk',
  input: {
    assets: [
      { name: 'Stocks', weight: 0.6, mu: 0.08, sigma: 0.16 },
      { name: 'Bonds', weight: 0.4, mu: 0.03, sigma: 0.06 },
    ],
    corr: [
      [1, -0.1],
      [-0.1, 1],
    ],
  },
  config: { paths: 2_000, horizonDays: 21, distribution: 'normal', seed: 99 },
};

async function runSim(payload, label) {
  const res = await fetch(`${API}/v1/simulations`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const enq = await res.json();
  if (!res.ok) {
    throw new Error(`${label}: enqueue failed (${res.status}): ${JSON.stringify(enq)}`);
  }
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const rr = await fetch(`${API}/v1/simulations/${enq.jobId}/result`);
    if (rr.status === 200) return rr.json();
    if (rr.status >= 400 && rr.status !== 404) {
      throw new Error(`${label}: result fetch failed (${rr.status})`);
    }
  }
  throw new Error(`${label}: timed out waiting for result`);
}

const fail = (msg) => {
  console.error(`❌ ${msg}`);
  process.exit(1);
};

const baseline = await runSim(baseRequest, 'baseline');
const stressed = await runSim(
  {
    ...baseRequest,
    config: { ...baseRequest.config, stress: { volMultiplier: 3, corrTarget: 0.9 } },
  },
  'stressed',
);

// Pipeline sanity.
if (typeof baseline.summary?.valueAtRisk95 !== 'number') fail('missing valueAtRisk95');
if (baseline.meta.stressed !== false) fail('baseline reported stressed');
if (stressed.meta.stressed !== true) fail('stressed run not flagged stressed');

// Stress must actually stress (same seed).
const ratio = stressed.summary.valueAtRisk95 / baseline.summary.valueAtRisk95;
if (!(ratio > 1.5)) fail(`stress not applied: VaR95 ratio ${ratio.toFixed(2)}× (expected > 1.5×)`);

// ES attribution present under correct names and coherent.
const att = stressed.attribution;
if (!Array.isArray(att?.componentExpectedShortfall95)) {
  fail('componentExpectedShortfall95 missing from attribution');
}
const sumCES = att.componentExpectedShortfall95.reduce((a, b) => a + b, 0);
const es = stressed.summary.expectedShortfall95;
if (Math.abs(sumCES - es) / es > 0.05) {
  fail(`component ES sum ${sumCES} deviates from portfolio ES ${es}`);
}

console.log(
  `✅ smoke E2E passed — VaR95 baseline ${(baseline.summary.valueAtRisk95 * 100).toFixed(2)}% ` +
    `→ stressed ${(stressed.summary.valueAtRisk95 * 100).toFixed(2)}% (${ratio.toFixed(2)}×), ` +
    `Σ componentES = portfolio ES within 5%`,
);
