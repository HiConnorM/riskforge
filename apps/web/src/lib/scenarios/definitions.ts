/**
 * RiskForge Scenario Library — 100+ modeled scenarios.
 *
 * Parameters are grounded in real U.S. financial data:
 * - Bureau of Labor Statistics (income, unemployment, inflation)
 * - AAA, CarMD, Consumer Reports (vehicle repair costs)
 * - Kaiser Family Foundation (health costs, premiums)
 * - AVMA (veterinary care costs)
 * - Zillow, Census Bureau (housing costs)
 * - NOAA, FEMA (disaster costs)
 * - Federal Reserve, Bloomberg (market crash magnitudes)
 */

import type { ScenarioDefinition } from './types'

export const SCENARIOS: ScenarioDefinition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // INCOME & JOB RISK
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'job-loss-short',
    name: 'Job Loss — Short Term',
    group: 'income_job',
    subcategory: 'Employment',
    description:
      'Primary income disappears for 1–3 months. Covers a quick layoff, company shutdown, or contract ending with fast re-employment.',
    historicalRef: 'U.S. average unemployment spell duration: ~3.5 months (BLS 2023).',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 7,
    incomeShocks: [
      {
        name: 'Job loss',
        probabilityPerYear: 0.9,
        incomeFractionLost: 1.0,
        durationMonthsMin: 1,
        durationMonthsMax: 3,
      },
    ],
    horizonMonths: 6,
    inflationRate: 0.03,
  },

  {
    id: 'job-loss-long',
    name: 'Job Loss — Extended',
    group: 'income_job',
    subcategory: 'Employment',
    description:
      'Income drops to zero for 4–9 months — layoff in a weak job market, specialized role with few openings, or industry downturn.',
    historicalRef: 'During COVID-19 (Apr 2020), U.S. unemployment hit 14.7%. Long-term unemployed (27+ weeks) peaked at 4M in 2021.',
    tier: 'everyday',
    severity: 'extreme',
    annualProbabilityPct: 3,
    incomeShocks: [
      {
        name: 'Extended job loss',
        probabilityPerYear: 0.85,
        incomeFractionLost: 1.0,
        durationMonthsMin: 4,
        durationMonthsMax: 9,
      },
    ],
    horizonMonths: 12,
    inflationRate: 0.03,
  },

  {
    id: 'reduced-hours',
    name: 'Reduced Hours / Pay Cut',
    group: 'income_job',
    subcategory: 'Employment',
    description:
      'Employer cuts hours or implements a temporary pay reduction of 20–40%. Common during slow seasons, downturns, or restructurings.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 12,
    incomeShocks: [
      {
        name: 'Pay reduction',
        probabilityPerYear: 0.9,
        incomeFractionLost: 0.30,
        durationMonthsMin: 2,
        durationMonthsMax: 6,
      },
    ],
    horizonMonths: 9,
  },

  {
    id: 'client-loss-freelancer',
    name: 'Major Client Lost',
    group: 'income_job',
    subcategory: 'Self-employment',
    description:
      'Freelancer or consultant loses a primary client that represents 25–60% of monthly income. Replacement takes 2–6 months to find.',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 18,
    incomeShocks: [
      {
        name: 'Client loss',
        probabilityPerYear: 0.85,
        incomeFractionLost: 0.45,
        durationMonthsMin: 2,
        durationMonthsMax: 6,
      },
    ],
    horizonMonths: 9,
  },

  {
    id: 'self-employment-tax-shock',
    name: 'Self-Employment Tax Shock',
    group: 'income_job',
    subcategory: 'Self-employment',
    description:
      'Freelancer underpays quarterly taxes and faces a large bill in April. SE tax is 15.3% on top of income tax; most freelancers underestimate it.',
    historicalRef: 'IRS self-employment tax = 15.3% on net earnings below $160,200 (2023).',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 25,
    riskEvents: [
      {
        name: 'Self-employment tax underpayment',
        category: 'other',
        probabilityPerMonth: 1 / 12,
        minCost: 1500,
        likelyCost: 3500,
        maxCost: 8000,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 12,
  },

  {
    id: 'platform-income-disruption',
    name: 'Platform Income Disruption',
    group: 'income_job',
    subcategory: 'Gig & creator',
    description:
      'Etsy, Shopify, Uber, DoorDash, TikTok, or a marketplace suspends or restricts the user\'s account — income drops 50–100% for months.',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 10,
    incomeShocks: [
      {
        name: 'Platform suspension',
        probabilityPerYear: 0.8,
        incomeFractionLost: 0.70,
        durationMonthsMin: 1,
        durationMonthsMax: 4,
      },
    ],
    horizonMonths: 6,
  },

  {
    id: 'bonus-cancellation',
    name: 'Bonus Canceled or Delayed',
    group: 'income_job',
    subcategory: 'Compensation',
    description:
      'User planned around a bonus that gets eliminated or significantly reduced. Common during company performance shortfalls or recessions.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 20,
    riskEvents: [
      {
        name: 'Missing bonus',
        category: 'job',
        probabilityPerMonth: 1 / 12,
        minCost: 2000,
        likelyCost: 6000,
        maxCost: 20000,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 12,
  },

  {
    id: 'second-earner-loss',
    name: 'Second Household Earner Loses Income',
    group: 'income_job',
    subcategory: 'Household',
    description:
      'Partner or roommate loses their job, cutting total household income. If they share expenses, fixed costs become a larger burden.',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 5,
    incomeShocks: [
      {
        name: 'Second earner loss',
        probabilityPerYear: 0.85,
        incomeFractionLost: 0.35,
        durationMonthsMin: 2,
        durationMonthsMax: 6,
      },
    ],
    expenseModifiers: { fixedIncreasePct: 0.05 }, // slightly higher expenses as they adjust
    horizonMonths: 9,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HOUSING RISK
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'rent-increase',
    name: 'Rent Increase',
    group: 'housing',
    subcategory: 'Rental',
    description:
      'Monthly rent rises by 10–25% at lease renewal — driven by market rate increases, new ownership, or renovation. Common in supply-constrained cities.',
    historicalRef: 'U.S. median rent rose 26% between 2020 and 2023 (Zillow Rental Index).',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 35,
    expenseModifiers: { fixedIncreasePct: 0.15 },
    horizonMonths: 12,
    inflationRate: 0.03,
  },

  {
    id: 'forced-move',
    name: 'Forced Relocation',
    group: 'housing',
    subcategory: 'Rental',
    description:
      'Lease is not renewed, property is sold, or landlord issue forces a move. Moving costs plus security deposit gap creates a cash crunch.',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 12,
    riskEvents: [
      {
        name: 'Moving costs',
        category: 'housing',
        probabilityPerMonth: 1 / 6,
        minCost: 1500,
        likelyCost: 3500,
        maxCost: 7000,
        maxOccurrences: 1,
      },
    ],
    expenseModifiers: { fixedIncreasePct: 0.12 }, // assume slightly higher rent after move
    horizonMonths: 9,
  },

  {
    id: 'roommate-leaves',
    name: 'Roommate Leaves',
    group: 'housing',
    subcategory: 'Rental',
    description:
      'User suddenly covers full rent or must quickly find a replacement. Could increase monthly housing cost by $600–$1,500.',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 15,
    expenseModifiers: { fixedIncreaseFlat: 850 }, // median single-roommate rent share
    horizonMonths: 6,
  },

  {
    id: 'hvac-failure',
    name: 'HVAC Failure',
    group: 'housing',
    subcategory: 'Home systems',
    description:
      'Heating or cooling system breaks down. Full HVAC replacement costs $5,000–$12,000; repairs $1,500–$4,000. Often happens during extreme weather.',
    historicalRef: 'Average HVAC replacement: $7,500. 90% of U.S. households use HVAC (EIA 2022).',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 6,
    riskEvents: [
      {
        name: 'HVAC failure',
        category: 'appliance',
        probabilityPerMonth: 0.08,
        minCost: 1500,
        likelyCost: 5500,
        maxCost: 12000,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 12,
  },

  {
    id: 'plumbing-emergency',
    name: 'Plumbing Emergency',
    group: 'housing',
    subcategory: 'Home systems',
    description:
      'Pipe burst, major leak, or sewer backup causing immediate repair costs plus potential water damage. Often involves multiple contractors.',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 8,
    riskEvents: [
      {
        name: 'Plumbing emergency',
        category: 'housing',
        probabilityPerMonth: 0.10,
        minCost: 800,
        likelyCost: 3500,
        maxCost: 12000,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 12,
  },

  {
    id: 'appliance-failure',
    name: 'Major Appliance Failure',
    group: 'housing',
    subcategory: 'Home systems',
    description:
      'Refrigerator, washer, dryer, oven, or water heater breaks down. Replacement or major repair typically runs $600–$2,500.',
    tier: 'everyday',
    severity: 'mild',
    annualProbabilityPct: 22,
    riskEvents: [
      {
        name: 'Appliance failure',
        category: 'appliance',
        probabilityPerMonth: 0.15,
        minCost: 400,
        likelyCost: 900,
        maxCost: 2800,
        maxOccurrences: 2,
      },
    ],
    horizonMonths: 12,
  },

  {
    id: 'pest-infestation',
    name: 'Pest Infestation',
    group: 'housing',
    subcategory: 'Home systems',
    description:
      'Termites, rodents, roaches, or bed bugs requiring professional extermination. Can also involve structural damage and temporary relocation.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 10,
    riskEvents: [
      {
        name: 'Pest treatment',
        category: 'housing',
        probabilityPerMonth: 0.12,
        minCost: 300,
        likelyCost: 1200,
        maxCost: 8000,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 12,
  },

  {
    id: 'mortgage-payment-shock',
    name: 'Mortgage Payment Shock',
    group: 'housing',
    subcategory: 'Homeownership',
    description:
      'Adjustable-rate mortgage resets, escrow impound changes, or property tax increase causes monthly housing payment to jump $300–$800.',
    historicalRef: 'ARM resets caused widespread default in 2007–2008. ~10% of U.S. mortgages are ARMs (2024 MBA data).',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 15,
    expenseModifiers: { fixedIncreaseFlat: 450 },
    horizonMonths: 12,
    inflationRate: 0.03,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSPORTATION RISK
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'car-minor-repair',
    name: 'Car — Minor Repair',
    group: 'transportation',
    subcategory: 'Vehicle',
    description:
      'Battery, brakes, tires, sensors, or alignment. Usually $300–$1,500. Manageable but hits cash reserves if savings are thin.',
    tier: 'everyday',
    severity: 'mild',
    annualProbabilityPct: 55,
    riskEvents: [
      {
        name: 'Minor car repair',
        category: 'car',
        probabilityPerMonth: 0.25,
        minCost: 250,
        likelyCost: 650,
        maxCost: 1600,
        maxOccurrences: 3,
      },
    ],
    horizonMonths: 12,
  },

  {
    id: 'car-major-repair',
    name: 'Car — Major Repair',
    group: 'transportation',
    subcategory: 'Vehicle',
    description:
      'Transmission, engine, AC, or electrical failure. Typically $2,000–$7,000. Often forces a financing decision between repair and replacement.',
    historicalRef: 'Average major car repair: $3,000–$4,500 (AAA/CarMD 2023).',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 14,
    riskEvents: [
      {
        name: 'Major car repair',
        category: 'car',
        probabilityPerMonth: 0.12,
        minCost: 1800,
        likelyCost: 3800,
        maxCost: 7500,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 12,
  },

  {
    id: 'car-accident',
    name: 'Car Accident — Deductible Hit',
    group: 'transportation',
    subcategory: 'Vehicle',
    description:
      'At-fault or uninsured-motorist collision triggers insurance deductible plus rental car costs. Followed by premium increase of 20–40%.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 6,
    riskEvents: [
      {
        name: 'Insurance deductible',
        category: 'car',
        probabilityPerMonth: 0.08,
        minCost: 500,
        likelyCost: 1500,
        maxCost: 4000,
        maxOccurrences: 1,
      },
    ],
    expenseModifiers: { fixedIncreaseFlat: 60 }, // post-accident premium increase
    horizonMonths: 12,
  },

  {
    id: 'car-totaled',
    name: 'Car Totaled',
    group: 'transportation',
    subcategory: 'Vehicle',
    description:
      'Vehicle is written off. Gap between payout and replacement cost forces new financing at higher rates, plus insurance gap period.',
    tier: 'everyday',
    severity: 'extreme',
    annualProbabilityPct: 2,
    riskEvents: [
      {
        name: 'Vehicle replacement gap',
        category: 'car',
        probabilityPerMonth: 1 / 24,
        minCost: 3000,
        likelyCost: 7000,
        maxCost: 15000,
        maxOccurrences: 1,
      },
    ],
    expenseModifiers: { fixedIncreaseFlat: 200 }, // new car payment increase
    horizonMonths: 12,
  },

  {
    id: 'fuel-price-spike',
    name: 'Fuel Price Spike',
    group: 'transportation',
    subcategory: 'Vehicle',
    description:
      'Gas prices surge 30–60%, raising commute costs for car-dependent users by $100–$350 per month.',
    historicalRef: 'U.S. avg gas hit $5.01/gal in June 2022 (+62% YoY). Energy supply shocks from geopolitical events can move prices 30-60%.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 20,
    expenseModifiers: { variableIncreaseFlat: 180 },
    horizonMonths: 6,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HEALTH & MEDICAL RISK
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'urgent-care',
    name: 'Urgent Care Visit',
    group: 'health',
    subcategory: 'Medical',
    description:
      'Non-emergency but urgent injury or illness requiring an urgent care clinic visit. Typical out-of-pocket: $150–$600.',
    tier: 'everyday',
    severity: 'mild',
    annualProbabilityPct: 45,
    riskEvents: [
      {
        name: 'Urgent care visit',
        category: 'medical',
        probabilityPerMonth: 0.20,
        minCost: 120,
        likelyCost: 280,
        maxCost: 700,
        maxOccurrences: 3,
      },
    ],
    horizonMonths: 12,
  },

  {
    id: 'emergency-room',
    name: 'Emergency Room Visit',
    group: 'health',
    subcategory: 'Medical',
    description:
      'Unexpected ER visit triggering hospital facility fee, physician bill, and labs. Average out-of-pocket: $1,000–$6,000 after insurance.',
    historicalRef: 'Avg ER facility fee: $2,200+ (KFF 2023). 40% of Americans cannot afford an unexpected $1,000 expense.',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 18,
    riskEvents: [
      {
        name: 'Emergency room visit',
        category: 'medical',
        probabilityPerMonth: 0.15,
        minCost: 800,
        likelyCost: 2500,
        maxCost: 8000,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 12,
  },

  {
    id: 'dental-emergency',
    name: 'Dental Emergency',
    group: 'health',
    subcategory: 'Medical',
    description:
      'Root canal, crown, extraction, or broken tooth. Most dental insurance caps are $1,000–$1,500/yr; major procedures cost $1,500–$4,500.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 25,
    riskEvents: [
      {
        name: 'Dental emergency',
        category: 'medical',
        probabilityPerMonth: 0.12,
        minCost: 600,
        likelyCost: 1800,
        maxCost: 5000,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 12,
  },

  {
    id: 'prescription-increase',
    name: 'Prescription Cost Surge',
    group: 'health',
    subcategory: 'Medical',
    description:
      'Monthly medication cost rises significantly — brand-name switch, formulary change, or insurance coverage gap. Impact: $50–$500/month ongoing.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 20,
    expenseModifiers: { fixedIncreaseFlat: 180 },
    horizonMonths: 12,
  },

  {
    id: 'insurance-gap',
    name: 'Health Insurance Gap',
    group: 'health',
    subcategory: 'Medical',
    description:
      'Coverage lapses between jobs, COBRA is unaffordable, or ACA enrollment is missed. Any medical event in this window is 100% out-of-pocket.',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 12,
    riskEvents: [
      {
        name: 'Uninsured medical event',
        category: 'medical',
        probabilityPerMonth: 0.20,
        minCost: 500,
        likelyCost: 3500,
        maxCost: 15000,
        maxOccurrences: 2,
      },
    ],
    expenseModifiers: { fixedIncreaseFlat: 400 }, // COBRA or marketplace premium
    horizonMonths: 6,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PET RISK
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'pet-emergency',
    name: 'Pet Emergency Vet Visit',
    group: 'pet',
    subcategory: 'Veterinary',
    description:
      'Sudden illness, injury, or ingestion requiring an emergency animal hospital visit. Avg cost: $800–$3,500. Often requires deposits before treatment.',
    historicalRef: 'Emergency vet visits avg $800–$3,000+. U.S. pet healthcare spend grew 11% in 2022 (APPA).',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 30,
    riskEvents: [
      {
        name: 'Pet emergency',
        category: 'pet',
        probabilityPerMonth: 0.18,
        minCost: 500,
        likelyCost: 1500,
        maxCost: 4500,
        maxOccurrences: 2,
      },
    ],
    horizonMonths: 12,
  },

  {
    id: 'pet-surgery',
    name: 'Pet Surgery',
    group: 'pet',
    subcategory: 'Veterinary',
    description:
      'Orthopedic, abdominal, or cancer surgery for a pet. Without insurance, costs run $2,000–$10,000. Many owners face a difficult financial decision.',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 10,
    riskEvents: [
      {
        name: 'Pet surgery',
        category: 'pet',
        probabilityPerMonth: 0.08,
        minCost: 1800,
        likelyCost: 4500,
        maxCost: 12000,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 12,
  },

  {
    id: 'pet-medication-ongoing',
    name: 'Pet — New Ongoing Medication',
    group: 'pet',
    subcategory: 'Veterinary',
    description:
      'Pet develops a chronic condition requiring monthly medication: thyroid, diabetes, arthritis, or allergy treatments at $80–$300/month.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 15,
    expenseModifiers: { fixedIncreaseFlat: 150 },
    horizonMonths: 12,
    inflationRate: 0.04,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOD, GROCERIES & DAILY LIVING
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'grocery-spike',
    name: 'Grocery Cost Spike',
    group: 'food_living',
    subcategory: 'Food',
    description:
      'Grocery prices rise 15–30% due to inflation, supply disruption, or regional shortage. Affects all households but hits fixed-income and low-savings users hardest.',
    historicalRef: 'U.S. grocery prices rose 11.4% YoY in Feb 2023 (BLS CPI Food at Home). Structural price reset post-pandemic.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 40,
    expenseModifiers: { variableIncreasePct: 0.20 },
    horizonMonths: 12,
    inflationRate: 0.05,
  },

  {
    id: 'utility-spike',
    name: 'Utility Bill Surge',
    group: 'food_living',
    subcategory: 'Utilities',
    description:
      'Electricity, gas, or water bills spike during extreme weather (heat wave, polar vortex) or rate increases. Typical surge: $100–$400/month.',
    historicalRef: 'Texas utility bills hit $5,000–$17,000 during Winter Storm Uri (Feb 2021). Summer AC bills can double in heat waves.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 30,
    expenseModifiers: { fixedIncreaseFlat: 200 },
    horizonMonths: 6,
  },

  {
    id: 'subscription-creep',
    name: 'Subscription Creep',
    group: 'food_living',
    subcategory: 'Recurring bills',
    description:
      'Streaming, software, phone plans, gym, and app subscriptions quietly accumulate. Users often underestimate total recurring costs by $150–$400/month.',
    tier: 'everyday',
    severity: 'mild',
    annualProbabilityPct: 80,
    expenseModifiers: { variableIncreaseFlat: 200 },
    horizonMonths: 12,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DEBT & CREDIT RISK
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'credit-card-emergency',
    name: 'Credit Card Emergency Charge',
    group: 'debt_credit',
    subcategory: 'Credit',
    description:
      'User covers an unexpected expense on a high-interest card and cannot immediately pay it off. At 25% APR, a $3,000 balance costs $750/year in interest.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 35,
    riskEvents: [
      {
        name: 'Emergency credit charge',
        category: 'other',
        probabilityPerMonth: 0.20,
        minCost: 500,
        likelyCost: 2000,
        maxCost: 6000,
        maxOccurrences: 2,
      },
    ],
    expenseModifiers: { fixedIncreaseFlat: 120 }, // interest carry cost
    horizonMonths: 12,
  },

  {
    id: 'bnpl-stackup',
    name: 'Buy-Now-Pay-Later Stack',
    group: 'debt_credit',
    subcategory: 'Credit',
    description:
      'Multiple BNPL installment plans (Affirm, Klarna, Afterpay) collide in the same months. Each feels small; together they crowd out essential spending.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 25,
    expenseModifiers: { fixedIncreaseFlat: 450 },
    horizonMonths: 6,
  },

  {
    id: 'student-loan-return',
    name: 'Student Loan Payments Resume',
    group: 'debt_credit',
    subcategory: 'Loans',
    description:
      'Federal pause ends or income-driven plan recalculates. Typical payment: $250–$700/month. The reintroduction of this fixed cost strains household budgets.',
    historicalRef: 'Federal student loan payments resumed Oct 2023 after 3+ year pause. 43M+ borrowers affected (Education Dept).',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 30,
    expenseModifiers: { fixedIncreaseFlat: 400 },
    horizonMonths: 12,
  },

  {
    id: 'missed-payment-spiral',
    name: 'Missed Payment Fee Spiral',
    group: 'debt_credit',
    subcategory: 'Credit',
    description:
      'One missed bill triggers late fees, credit score damage, and potential interest rate hikes on existing balances.',
    tier: 'everyday',
    severity: 'mild',
    annualProbabilityPct: 20,
    riskEvents: [
      {
        name: 'Late fees and penalties',
        category: 'other',
        probabilityPerMonth: 0.15,
        minCost: 35,
        likelyCost: 100,
        maxCost: 300,
        maxOccurrences: 4,
      },
    ],
    horizonMonths: 6,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FAMILY & RELATIONSHIP RISK
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'childcare-increase',
    name: 'Childcare Cost Spike',
    group: 'family',
    subcategory: 'Children',
    description:
      'Daycare rate increase, provider switch, or after-school care added raises monthly childcare costs by $300–$900.',
    historicalRef: 'U.S. avg childcare cost: $1,230/month (Economic Policy Institute 2023). Rose 26% since 2018.',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 22,
    expenseModifiers: { fixedIncreaseFlat: 500 },
    horizonMonths: 12,
    inflationRate: 0.03,
  },

  {
    id: 'family-emergency-travel',
    name: 'Family Emergency Travel',
    group: 'family',
    subcategory: 'Family',
    description:
      'Sudden illness, accident, or death in the family requires urgent flights, hotel, missed work, and possibly caregiving costs.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 18,
    riskEvents: [
      {
        name: 'Emergency travel',
        category: 'family',
        probabilityPerMonth: 0.12,
        minCost: 600,
        likelyCost: 2000,
        maxCost: 5000,
        maxOccurrences: 2,
      },
    ],
    horizonMonths: 12,
  },

  {
    id: 'breakup-housing-shock',
    name: 'Breakup / Divorce Housing Shock',
    group: 'family',
    subcategory: 'Relationship',
    description:
      'Partnership or marriage ends, requiring one or both parties to find new housing, cover moving costs, and absorb previously shared expenses.',
    tier: 'everyday',
    severity: 'extreme',
    annualProbabilityPct: 5,
    riskEvents: [
      {
        name: 'Separation costs',
        category: 'family',
        probabilityPerMonth: 1 / 24,
        minCost: 3000,
        likelyCost: 8000,
        maxCost: 25000,
        maxOccurrences: 1,
      },
    ],
    expenseModifiers: { fixedIncreasePct: 0.40 }, // covering full housing alone
    horizonMonths: 12,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DISASTERS & EXTERNAL SHOCKS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'hurricane-evacuation',
    name: 'Hurricane / Major Storm Evacuation',
    group: 'disaster',
    subcategory: 'Natural disaster',
    description:
      'Mandatory evacuation requiring hotel, gas, food, pet boarding, and missed income. Follow-up home repairs and insurance deductibles add to the total.',
    historicalRef: 'Avg Hurricane evacuation cost: $1,000–$5,000 per family (FEMA). Katrina displaced 1.2M people; Ida caused $75B in damage.',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 8,
    riskEvents: [
      {
        name: 'Evacuation costs',
        category: 'other',
        probabilityPerMonth: 0.08,
        minCost: 800,
        likelyCost: 2500,
        maxCost: 7000,
        maxOccurrences: 1,
      },
      {
        name: 'Home damage deductible',
        category: 'housing',
        probabilityPerMonth: 0.05,
        minCost: 2000,
        likelyCost: 5000,
        maxCost: 20000,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 6,
  },

  {
    id: 'power-outage-extended',
    name: 'Extended Power Outage',
    group: 'disaster',
    subcategory: 'Natural disaster',
    description:
      'Power outage lasting 3–10 days causes food loss, hotel costs, generator fuel, and possibly pipe damage in winter.',
    historicalRef: 'Texas Winter Storm Uri (Feb 2021): 4.5M households without power avg 3–4 days. Some faced $2K–$10K utility bills.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 15,
    riskEvents: [
      {
        name: 'Outage costs',
        category: 'utility',
        probabilityPerMonth: 0.10,
        minCost: 200,
        likelyCost: 800,
        maxCost: 3000,
        maxOccurrences: 2,
      },
    ],
    horizonMonths: 12,
  },

  {
    id: 'identity-theft',
    name: 'Identity Theft / Account Fraud',
    group: 'disaster',
    subcategory: 'Financial crime',
    description:
      'Bank account frozen, funds stolen, or fraudulent accounts opened. Recovery takes weeks–months; costs include replacement cards, credit monitoring, and lost time.',
    historicalRef: 'FTC received 1.4M identity theft reports in 2023. Avg victim loss: $500–$2,000 out-of-pocket (FTC Consumer Sentinel).',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 6,
    riskEvents: [
      {
        name: 'Fraud recovery costs',
        category: 'other',
        probabilityPerMonth: 0.05,
        minCost: 200,
        likelyCost: 1200,
        maxCost: 5000,
        maxOccurrences: 1,
      },
    ],
    expenseModifiers: { fixedIncreaseFlat: 30 }, // ongoing credit monitoring
    horizonMonths: 12,
  },

  {
    id: 'multiple-small-things',
    name: 'Multiple Small Hits — Same Month',
    group: 'disaster',
    subcategory: 'Compound risk',
    description:
      'No single catastrophe, but 4–6 smaller problems collide: minor car repair, vet bill, dental, overdue subscription, and grocery overrun all in one month.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 60,
    riskEvents: [
      {
        name: 'Car minor issue',
        category: 'car',
        probabilityPerMonth: 0.30,
        minCost: 200,
        likelyCost: 500,
        maxCost: 900,
        maxOccurrences: 2,
      },
      {
        name: 'Pet care',
        category: 'pet',
        probabilityPerMonth: 0.25,
        minCost: 150,
        likelyCost: 350,
        maxCost: 700,
        maxOccurrences: 2,
      },
      {
        name: 'Medical copay',
        category: 'medical',
        probabilityPerMonth: 0.25,
        minCost: 100,
        likelyCost: 250,
        maxCost: 500,
        maxOccurrences: 2,
      },
      {
        name: 'Household overrun',
        category: 'other',
        probabilityPerMonth: 0.40,
        minCost: 100,
        likelyCost: 300,
        maxCost: 600,
        maxOccurrences: 3,
      },
    ],
    horizonMonths: 3,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MACRO & HISTORICAL SCENARIOS (pro tier)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'macro-gfc-2008',
    name: '2008 Global Financial Crisis',
    group: 'macro_historical',
    subcategory: 'Credit crisis',
    description:
      'Triggered by the collapse of subprime mortgage-backed securities. S&P 500 fell 57% peak-to-trough. Unemployment rose from 4.7% to 10%. Credit froze for 18 months.',
    historicalRef:
      'Lehman Brothers collapsed Sep 15, 2008. Bear Stearns failed Mar 2008. S&P 500 bottom: March 9, 2009. U.S. GDP contracted 4.3% peak-to-trough.',
    tier: 'pro',
    severity: 'extreme',
    annualProbabilityPct: 2,
    incomeShocks: [
      {
        name: 'Recession job loss',
        probabilityPerYear: 0.40,
        incomeFractionLost: 1.0,
        durationMonthsMin: 4,
        durationMonthsMax: 12,
      },
    ],
    expenseModifiers: { fixedIncreaseFlat: 0 },
    horizonMonths: 18,
    inflationRate: -0.01, // deflation during crisis
    portfolioParams: {
      stressFactor: 3.5,
      targetCorr: 0.85,
      horizonDays: 252,
      distribution: 'student_t',
      df: 4,
      description: 'S&P 500 fell 57% over 17 months. Equity-bond correlation spiked. Credit spreads blew out. Fat tails: daily moves of 10%+ happened repeatedly.',
    },
  },

  {
    id: 'macro-covid-2020',
    name: 'COVID-19 Pandemic Shock',
    group: 'macro_historical',
    subcategory: 'Pandemic',
    description:
      'Global lockdowns in March 2020 caused the fastest 30%+ equity decline in history (23 trading days). U.S. unemployment jumped from 3.5% to 14.7% in 6 weeks.',
    historicalRef:
      'S&P 500 fell 34% in 23 trading days (Feb 19 – Mar 23, 2020). Fastest bear market ever. Recovered fully by Aug 2020. GDP fell 31.4% annualized Q2 2020.',
    tier: 'pro',
    severity: 'extreme',
    annualProbabilityPct: 3,
    incomeShocks: [
      {
        name: 'Pandemic job loss/furlough',
        probabilityPerYear: 0.35,
        incomeFractionLost: 0.80,
        durationMonthsMin: 2,
        durationMonthsMax: 6,
      },
    ],
    expenseModifiers: { variableIncreasePct: 0.10 },
    horizonMonths: 12,
    portfolioParams: {
      stressFactor: 4.0,
      targetCorr: 0.90,
      horizonDays: 21,
      distribution: 'student_t',
      df: 3,
      description: 'Volatility spiked to COVID-highs (VIX 82.69 on Mar 16). All major asset classes sold off simultaneously. Then fastest-ever recovery driven by Fed QE and fiscal stimulus.',
    },
  },

  {
    id: 'macro-inflation-2022',
    name: '2022 Inflation + Rate Shock',
    group: 'macro_historical',
    subcategory: 'Inflation',
    description:
      'Post-pandemic supply disruptions and stimulus drove U.S. CPI to 9.1% (June 2022). The Fed hiked rates 525 bps in 18 months — the fastest tightening cycle in 40 years.',
    historicalRef:
      'CPI peaked at 9.1% YoY in Jun 2022 (highest since 1981). Fed Funds went from 0.25% to 5.5% in 15 months. S&P 500 fell 25%; bonds fell 13% (worst since 1976).',
    tier: 'pro',
    severity: 'severe',
    annualProbabilityPct: 5,
    expenseModifiers: {
      fixedIncreasePct: 0.12,
      variableIncreasePct: 0.18,
    },
    horizonMonths: 18,
    inflationRate: 0.09,
    portfolioParams: {
      stressFactor: 2.0,
      targetCorr: 0.65,
      horizonDays: 252,
      distribution: 'normal',
      description: 'Rare negative equity-bond correlation breakdown. Both stocks and bonds fell together. Classic 60/40 portfolio lost ~16%. Cash outperformed most assets.',
    },
  },

  {
    id: 'macro-svb-2023',
    name: '2023 Regional Banking Crisis',
    group: 'macro_historical',
    subcategory: 'Banking',
    description:
      'Silicon Valley Bank failed March 10, 2023 after a bank run driven by interest-rate losses on its bond portfolio. Signature Bank and First Republic followed within weeks.',
    historicalRef:
      'SVB ($209B in assets) collapsed in 48 hours — second-largest U.S. bank failure ever. Triggered risk-off across regional banks. Fed BTFP facility deployed $35B within days.',
    tier: 'pro',
    severity: 'moderate',
    annualProbabilityPct: 5,
    expenseModifiers: { fixedIncreaseFlat: 0 },
    horizonMonths: 6,
    portfolioParams: {
      stressFactor: 2.0,
      targetCorr: 0.60,
      horizonDays: 42,
      distribution: 'student_t',
      df: 5,
      description: 'Regional bank stocks fell 30–70%. Credit tightened. Payroll providers and tech startups faced liquidity risk. Broader market fell ~8% before recovering.',
    },
  },

  {
    id: 'macro-dot-com-2000',
    name: '2000–2002 Dot-com Bust',
    group: 'macro_historical',
    subcategory: 'Market bubble',
    description:
      'Internet/tech bubble burst after March 2000. NASDAQ fell 78% over 30 months. S&P 500 fell 49%. Growth-heavy and tech-concentrated portfolios were devastated.',
    historicalRef:
      'NASDAQ peaked Mar 10, 2000 at 5,132. Hit bottom Oct 9, 2002 at 1,114 (-78%). S&P 500 bottomed at -49%. Recovery to pre-crash levels took until 2007.',
    tier: 'pro',
    severity: 'extreme',
    annualProbabilityPct: 2,
    horizonMonths: 30,
    portfolioParams: {
      stressFactor: 2.8,
      targetCorr: 0.70,
      horizonDays: 252,
      distribution: 'student_t',
      df: 5,
      description: 'Tech sector lost 80%+ of value. Value stocks held up better. Diversification was rewarded. Bubble concentration (heavy NASDAQ) was catastrophic.',
    },
  },

  {
    id: 'macro-tariff-shock',
    name: 'Trade War / Tariff Escalation',
    group: 'macro_historical',
    subcategory: 'Policy shock',
    description:
      'Broad tariff increases on imports raise prices for consumers, disrupt supply chains, and hit corporate earnings. Markets reprice on policy uncertainty.',
    historicalRef:
      'U.S.-China trade war (2018–2020): S&P 500 fell 19% Q4 2018 on tariff fears. 2025 tariff announcements caused multi-day market swings of 3–9%.',
    tier: 'pro',
    severity: 'moderate',
    annualProbabilityPct: 15,
    expenseModifiers: { variableIncreasePct: 0.08 }, // higher import prices
    horizonMonths: 12,
    inflationRate: 0.05,
    portfolioParams: {
      stressFactor: 1.8,
      targetCorr: 0.55,
      horizonDays: 63,
      distribution: 'student_t',
      df: 6,
      description: 'Volatility spiked on policy announcements. Export-heavy sectors (agriculture, manufacturing, tech hardware) hit hardest. Reversal rallies also sharp.',
    },
  },

  {
    id: 'macro-geopolitical-energy',
    name: 'Geopolitical Energy Shock',
    group: 'macro_historical',
    subcategory: 'Energy',
    description:
      'Major conflict or disruption cuts oil supply, driving energy prices up 40–80%. Cascades into food, shipping, and manufacturing costs within months.',
    historicalRef:
      'Russia-Ukraine war (Feb 2022): Brent crude hit $130/bbl. European gas prices 10x. Global food prices rose 30%+ (wheat, sunflower, fertilizer). Shipping costs tripled.',
    tier: 'pro',
    severity: 'severe',
    annualProbabilityPct: 10,
    expenseModifiers: {
      variableIncreaseFlat: 250,
      fixedIncreasePct: 0.08,
    },
    horizonMonths: 12,
    inflationRate: 0.07,
    portfolioParams: {
      stressFactor: 2.2,
      targetCorr: 0.65,
      horizonDays: 126,
      distribution: 'student_t',
      df: 5,
      description: 'Energy sector surged while consumer/tech fell. Inflation hit bonds hard. Supply-chain dependent industries lost 20–40%. Safe havens (gold, energy) outperformed.',
    },
  },

  {
    id: 'macro-rate-hike-cycle',
    name: 'Rapid Rate Hike Cycle',
    group: 'macro_historical',
    subcategory: 'Interest rates',
    description:
      'Central bank raises rates aggressively to fight inflation. Mortgage costs surge, business loans become expensive, bond values fall, and growth stocks re-price significantly lower.',
    historicalRef:
      'Fed hiked 525 bps in 2022–2023. Long-duration bonds (TLT) fell 30%. ARMs reset higher. 30yr mortgage hit 8% in Oct 2023. Corporate debt refinancing risk spiked.',
    tier: 'pro',
    severity: 'severe',
    annualProbabilityPct: 8,
    expenseModifiers: { fixedIncreasePct: 0.10 }, // debt service costs
    horizonMonths: 18,
    portfolioParams: {
      stressFactor: 1.9,
      targetCorr: 0.60,
      horizonDays: 252,
      distribution: 'normal',
      description: 'Duration risk hit bonds worse than expected. High-beta tech fell 50–70%. Value and energy outperformed. Quality fixed income and cash outperformed long bonds.',
    },
  },

  {
    id: 'macro-crypto-winter',
    name: 'Crypto Winter',
    group: 'macro_historical',
    subcategory: 'Crypto',
    description:
      'Major crypto assets fall 70–90% from peak. Exchange failures, protocol collapses, or regulatory crackdowns freeze markets. Recovery timelines: 1–3 years.',
    historicalRef:
      'FTX collapsed Nov 2022 ($32B fraud). Bitcoin fell from $69K to $15.8K (-77%). Terra/LUNA wiped $45B in days. Celsius froze $4B+ in deposits.',
    tier: 'pro',
    severity: 'extreme',
    annualProbabilityPct: 15,
    horizonMonths: 18,
    portfolioParams: {
      stressFactor: 5.0,
      targetCorr: 0.80,
      horizonDays: 252,
      distribution: 'student_t',
      df: 3,
      description: 'Crypto correlation to risk assets rose sharply in stress. Exchange failures locked funds. Regulatory uncertainty prolonged the drawdown. DeFi protocols failed in cascade.',
    },
  },

  {
    id: 'macro-govt-shutdown',
    name: 'Government Shutdown',
    group: 'macro_historical',
    subcategory: 'Policy shock',
    description:
      'Federal government shuts down due to budget impasse. Federal workers go unpaid, contractors lose work, SNAP/WIC delayed, and national park services suspend.',
    historicalRef:
      'Longest shutdown: 35 days (Dec 2018–Jan 2019). ~800K federal workers furloughed or worked without pay. 2023 shutdown threats caused market volatility.',
    tier: 'both',
    severity: 'moderate',
    annualProbabilityPct: 20,
    incomeShocks: [
      {
        name: 'Federal pay furlough',
        probabilityPerYear: 0.5,
        incomeFractionLost: 1.0,
        durationMonthsMin: 1,
        durationMonthsMax: 2,
      },
    ],
    horizonMonths: 3,
    portfolioParams: {
      stressFactor: 1.3,
      targetCorr: 0.45,
      horizonDays: 21,
      distribution: 'normal',
      description: 'Short-term Treasury yields can spike. Consumer confidence falls. Duration: days to weeks typically. Long shutdowns create meaningful GDP drag.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PORTFOLIO-SPECIFIC SCENARIOS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'portfolio-mild-correction',
    name: 'Mild Market Correction (−15%)',
    group: 'market_portfolio',
    subcategory: 'Equity',
    description:
      'Normal pullback — happens roughly every 1–2 years. Drawdown of 10–20% over 1–3 months. Recovers within 6–12 months historically.',
    historicalRef: 'S&P 500 has experienced 15%+ corrections ~20 times since 1950. Average recovery: 4 months.',
    tier: 'pro',
    severity: 'moderate',
    annualProbabilityPct: 30,
    horizonMonths: 6,
    portfolioParams: {
      stressFactor: 1.5,
      targetCorr: 0.55,
      horizonDays: 42,
      distribution: 'normal',
      description: 'Typical risk-off rotation. Growth sells off more than value. Quality/low-vol outperforms. Recovery usually faster than feared.',
    },
  },

  {
    id: 'portfolio-deep-bear',
    name: 'Deep Bear Market (−40%+)',
    group: 'market_portfolio',
    subcategory: 'Equity',
    description:
      'Severe multi-month drawdown of 40–60% driven by fundamental or systemic factors. Tests long-term conviction and forces liquidity decisions.',
    historicalRef: 'Average bear market since 1950: 34% drawdown, 14 months duration (Hartford Funds 2023).',
    tier: 'pro',
    severity: 'extreme',
    annualProbabilityPct: 5,
    horizonMonths: 18,
    portfolioParams: {
      stressFactor: 3.0,
      targetCorr: 0.80,
      horizonDays: 252,
      distribution: 'student_t',
      df: 4,
      description: 'Broad drawdown with elevated volatility. Correlation spikes. Safe havens (gold, T-bills) outperform. Liquidity becomes critical for leveraged positions.',
    },
  },

  {
    id: 'portfolio-volatility-spike',
    name: 'Volatility Spike (VIX > 40)',
    group: 'market_portfolio',
    subcategory: 'Volatility',
    description:
      'Fear index spikes above 40 — typically during a crisis, policy shock, or geopolitical event. Portfolio swings of 3–8% per day become common.',
    historicalRef: 'VIX hit 82.69 on Mar 16, 2020. Peaked at 80.86 on Nov 20, 2008. VIX > 40 historically signals extreme stress.',
    tier: 'pro',
    severity: 'severe',
    annualProbabilityPct: 10,
    horizonMonths: 3,
    portfolioParams: {
      stressFactor: 2.5,
      targetCorr: 0.75,
      horizonDays: 21,
      distribution: 'student_t',
      df: 3,
      description: 'Short-term extreme volatility. Options prices spike. Risk-parity strategies hit by correlation breakdown. Long-vol strategies profit while short-vol explode.',
    },
  },

  {
    id: 'portfolio-sequence-risk',
    name: 'Retirement Sequence-of-Returns Risk',
    group: 'market_portfolio',
    subcategory: 'Retirement',
    description:
      'Retiree or near-retiree experiences a major market loss in the first 1–3 years of withdrawals — permanently impairs the portfolio\'s ability to sustain distributions.',
    historicalRef: 'Retiring in 2000 or 2008 meant withdrawing from a falling portfolio. Monte Carlo studies show first-year returns disproportionately determine success.',
    tier: 'pro',
    severity: 'extreme',
    annualProbabilityPct: 10,
    horizonMonths: 24,
    portfolioParams: {
      stressFactor: 2.5,
      targetCorr: 0.70,
      horizonDays: 252,
      distribution: 'student_t',
      df: 5,
      description: 'Combines market drawdown with forced selling. Each withdrawal at depressed prices permanently reduces principal. Sequence matters even if long-run average return is fine.',
    },
  },

  {
    id: 'portfolio-concentrated-crash',
    name: 'Concentrated Position Collapse',
    group: 'market_portfolio',
    subcategory: 'Concentration',
    description:
      'A single stock or sector representing 30%+ of the portfolio falls 60–90%. Company fraud, earnings miss, regulatory action, or sector rotation can all trigger this.',
    historicalRef: 'Enron: fell 99% in 2001. WeWork: never IPO\'d, wrote down to near zero. Bed Bath & Beyond: -99% over 2022–23. Concentration = tail risk.',
    tier: 'pro',
    severity: 'extreme',
    annualProbabilityPct: 8,
    horizonMonths: 6,
    portfolioParams: {
      stressFactor: 4.5,
      targetCorr: 0.30, // idiosyncratic — low correlation with rest of portfolio
      horizonDays: 63,
      distribution: 'student_t',
      df: 3,
      description: 'Idiosyncratic risk dominates systematic. Diversification provides no protection. Permanent capital loss possible. Timely stop-loss or hedging is critical.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL INCOME & JOB SCENARIOS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'wage-stagnation',
    name: 'Wage Stagnation (No Raise)',
    group: 'income_job',
    subcategory: 'Compensation',
    description:
      'No merit raise despite inflation of 4–8%. Real purchasing power erodes by 5–10% annually. Fixed expenses grow while income stays flat.',
    historicalRef: 'Real wages fell 2.2% in 2021 and 1.9% in 2022 (BLS). Most workers missed raises during those years.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 30,
    expenseModifiers: { fixedIncreasePct: 0.05, variableIncreasePct: 0.05 },
    horizonMonths: 24,
    inflationRate: 0.06,
  },

  {
    id: 'gig-income-volatility',
    name: 'Gig / Rideshare Income Drop',
    group: 'income_job',
    subcategory: 'Gig & creator',
    description:
      'Uber, Lyft, DoorDash, Instacart, TaskRabbit, or similar platform cuts pay rates, changes the algorithm, or increases competition — reducing effective hourly earnings 20–40%.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 25,
    incomeShocks: [
      {
        name: 'Gig platform income reduction',
        probabilityPerYear: 0.80,
        incomeFractionLost: 0.30,
        durationMonthsMin: 3,
        durationMonthsMax: 12,
      },
    ],
    horizonMonths: 12,
  },

  {
    id: 'remote-work-rto',
    name: 'Return-to-Office Mandate',
    group: 'income_job',
    subcategory: 'Employment',
    description:
      'Employer mandates 3–5 days/week in office. New commute costs, work wardrobe, lunch expenses, and childcare changes add $300–$900/month.',
    historicalRef: 'Major RTO waves in 2022–2024 (Amazon, Google, JPMorgan). 40% of remote workers say they\'d quit before returning full-time.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 20,
    expenseModifiers: { variableIncreaseFlat: 450 },
    horizonMonths: 12,
  },

  {
    id: 'ai-job-displacement',
    name: 'AI / Automation Job Disruption',
    group: 'income_job',
    subcategory: 'Employment',
    description:
      'Role is eliminated, downgraded, or reduced by AI tools — copywriters, customer service reps, junior coders, and data entry workers are first in line. Re-skilling takes 6–18 months.',
    historicalRef: 'Goldman Sachs (2023): 300M jobs globally exposed to AI automation. Already occurring in content, coding, and finance roles.',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 8,
    incomeShocks: [
      {
        name: 'AI-driven job loss',
        probabilityPerYear: 0.70,
        incomeFractionLost: 1.0,
        durationMonthsMin: 3,
        durationMonthsMax: 9,
      },
    ],
    horizonMonths: 12,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL HOUSING SCENARIOS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'flood-water-damage',
    name: 'Flood / Water Damage',
    group: 'housing',
    subcategory: 'Natural disaster',
    description:
      'Flooding from storm surge, burst pipe, or groundwater damages floors, walls, furniture, and appliances. Standard homeowner/renter policies often exclude flooding — NFIP deductibles are $1,000–$10,000.',
    historicalRef: 'FEMA: flood is the most common U.S. natural disaster. Average NFIP claim: $52,000. ~20% of flood claims come from low-risk areas.',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 6,
    riskEvents: [
      {
        name: 'Flood damage repair',
        category: 'housing',
        probabilityPerMonth: 0.06,
        minCost: 3000,
        likelyCost: 12000,
        maxCost: 40000,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 12,
  },

  {
    id: 'homeowner-insurance-spike',
    name: 'Home Insurance Premium Spike',
    group: 'housing',
    subcategory: 'Homeownership',
    description:
      'Insurer non-renews or raises premiums 30–60% due to climate risk, catastrophic loss history, or market changes. Florida, California, and Gulf Coast hardest hit.',
    historicalRef: 'Average Florida homeowner insurance rose 42% in 2022–23. State Farm and Allstate exited California (2023). U.S. avg premiums up 21% in 2 years.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 18,
    expenseModifiers: { fixedIncreaseFlat: 280 },
    horizonMonths: 12,
  },

  {
    id: 'property-tax-spike',
    name: 'Property Tax Reassessment',
    group: 'housing',
    subcategory: 'Homeownership',
    description:
      'Home is reassessed at post-boom market value, causing property tax to jump $1,000–$5,000/year. Hits fixed-income retirees and long-time owners especially hard.',
    historicalRef: 'Many municipalities reassessed at 2021-22 peak home prices. Texas property taxes rose 26% avg in one cycle. Some states cap annual increases; most don\'t.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 15,
    expenseModifiers: { fixedIncreaseFlat: 220 },
    horizonMonths: 12,
  },

  {
    id: 'hoa-special-assessment',
    name: 'HOA Special Assessment',
    group: 'housing',
    subcategory: 'Homeownership',
    description:
      'Condo or HOA levies a one-time special assessment for roof replacement, garage repair, or reserve fund shortfall. Bills of $5,000–$30,000 can arrive with little warning.',
    historicalRef: 'Surfside condo collapse (2021) prompted wave of structural inspections and surprise assessments, some exceeding $100,000/unit in older buildings.',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 10,
    riskEvents: [
      {
        name: 'HOA special assessment',
        category: 'housing',
        probabilityPerMonth: 0.08,
        minCost: 3000,
        likelyCost: 9000,
        maxCost: 30000,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 12,
  },

  {
    id: 'roof-replacement',
    name: 'Roof Replacement',
    group: 'housing',
    subcategory: 'Home systems',
    description:
      'Roof reaches end of life or is damaged. Full replacement of average home: $9,000–$18,000. Many insurance claims are denied for "wear and tear."',
    historicalRef: 'Average U.S. roof replacement: $11,500 (HomeAdvisor 2023). Asphalt shingles last 20–25 years. ~5% of homes need roof work each year.',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 5,
    riskEvents: [
      {
        name: 'Roof replacement',
        category: 'housing',
        probabilityPerMonth: 0.05,
        minCost: 7000,
        likelyCost: 12000,
        maxCost: 22000,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 12,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL TRANSPORTATION SCENARIOS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'car-theft',
    name: 'Vehicle Theft',
    group: 'transportation',
    subcategory: 'Vehicle',
    description:
      'Vehicle is stolen. Insurance payout lags 2–4 weeks, leaving a rental cost gap. Total out-of-pocket (deductible + rental + inconvenience): $1,500–$5,000.',
    historicalRef: 'U.S. vehicle thefts hit a 10-year high in 2023: 1.02M stolen (NICB). Hyundai/Kia thefts spiked 1,000%+ after social media tutorial went viral.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 3,
    riskEvents: [
      {
        name: 'Vehicle theft costs',
        category: 'car',
        probabilityPerMonth: 0.03,
        minCost: 1000,
        likelyCost: 2800,
        maxCost: 7000,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 3,
  },

  {
    id: 'traffic-violation-dui',
    name: 'DUI or Major Traffic Violation',
    group: 'transportation',
    subcategory: 'Vehicle',
    description:
      'DUI, reckless driving, or excessive speeding leads to fines, lawyer fees, license suspension, and insurance rate hikes that persist 3–5 years.',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 2,
    riskEvents: [
      {
        name: 'Legal fees and fines',
        category: 'car',
        probabilityPerMonth: 0.02,
        minCost: 2000,
        likelyCost: 6000,
        maxCost: 15000,
        maxOccurrences: 1,
      },
    ],
    expenseModifiers: { fixedIncreaseFlat: 150 }, // SR-22 and premium hike
    horizonMonths: 12,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL HEALTH SCENARIOS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'hospitalization-surgery',
    name: 'Hospitalization / Surgery',
    group: 'health',
    subcategory: 'Medical',
    description:
      'Elective or emergency surgery requiring inpatient stay. Even with insurance, out-of-pocket max (~$8,700/yr) is often hit. Plus missed work and recovery time.',
    historicalRef: 'Average inpatient hospital stay: $15,734 total cost (KFF 2022). Most insured Americans hit their OOPM after any significant hospitalization.',
    tier: 'everyday',
    severity: 'extreme',
    annualProbabilityPct: 8,
    riskEvents: [
      {
        name: 'Surgery out-of-pocket',
        category: 'medical',
        probabilityPerMonth: 0.06,
        minCost: 2000,
        likelyCost: 6500,
        maxCost: 15000,
        maxOccurrences: 1,
      },
    ],
    incomeShocks: [
      {
        name: 'Recovery / medical leave',
        probabilityPerYear: 0.30,
        incomeFractionLost: 0.40,
        durationMonthsMin: 1,
        durationMonthsMax: 3,
      },
    ],
    horizonMonths: 6,
  },

  {
    id: 'chronic-illness-diagnosis',
    name: 'Chronic Illness Diagnosis',
    group: 'health',
    subcategory: 'Medical',
    description:
      'New diagnosis of diabetes, MS, lupus, cancer, or other chronic condition creates ongoing medication, specialist, and monitoring costs of $400–$2,500/month.',
    historicalRef: 'Avg annual out-of-pocket for Type 2 diabetes: $4,800; MS: $18,000+ (Healthline/KFF). ~60% of adults have at least one chronic condition.',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 5,
    expenseModifiers: { fixedIncreaseFlat: 600 },
    horizonMonths: 24,
    inflationRate: 0.04,
  },

  {
    id: 'mental-health-crisis',
    name: 'Mental Health Crisis / Inpatient Stay',
    group: 'health',
    subcategory: 'Medical',
    description:
      'Psychiatric inpatient stay or intensive outpatient program following a crisis. 5–14 days inpatient can cost $5,000–$35,000; ongoing therapy adds $200–$500/month.',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 3,
    riskEvents: [
      {
        name: 'Mental health treatment',
        category: 'medical',
        probabilityPerMonth: 0.03,
        minCost: 3000,
        likelyCost: 10000,
        maxCost: 30000,
        maxOccurrences: 1,
      },
    ],
    expenseModifiers: { fixedIncreaseFlat: 300 }, // ongoing therapy
    horizonMonths: 12,
  },

  {
    id: 'medical-debt-spiral',
    name: 'Medical Debt Collection',
    group: 'health',
    subcategory: 'Medical',
    description:
      'Old medical bills go to collections — credit score damage triggers higher rates on new credit, and a lump-sum settlement demand arrives.',
    historicalRef: '100M Americans have medical debt (KFF 2022). Medical debt is the #1 cause of personal bankruptcy in the U.S.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 12,
    riskEvents: [
      {
        name: 'Medical debt settlement',
        category: 'medical',
        probabilityPerMonth: 0.08,
        minCost: 500,
        likelyCost: 3000,
        maxCost: 12000,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 12,
  },

  {
    id: 'vision-hearing-loss',
    name: 'Vision / Hearing Loss Treatment',
    group: 'health',
    subcategory: 'Medical',
    description:
      'Cataracts, glaucoma, significant hearing loss, or LASIK corrective surgery. Most vision/dental insurance severely limits coverage for these high-cost events.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 8,
    riskEvents: [
      {
        name: 'Vision or hearing treatment',
        category: 'medical',
        probabilityPerMonth: 0.06,
        minCost: 600,
        likelyCost: 3200,
        maxCost: 8000,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 6,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL PET SCENARIOS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'new-pet-adoption-costs',
    name: 'New Pet — First-Year Costs',
    group: 'pet',
    subcategory: 'Pet ownership',
    description:
      'Adopting or buying a pet creates a first-year cost spike: adoption fees, spay/neuter, vaccines, microchip, food, supplies, and initial vet visits.',
    historicalRef: 'APPA estimates first-year dog cost: $2,400–$4,500. First-year cat: $1,500–$2,000. Ongoing annual: $1,200–$2,500.',
    tier: 'everyday',
    severity: 'mild',
    annualProbabilityPct: 10,
    riskEvents: [
      {
        name: 'New pet setup costs',
        category: 'pet',
        probabilityPerMonth: 0.08,
        minCost: 800,
        likelyCost: 2000,
        maxCost: 5000,
        maxOccurrences: 1,
      },
    ],
    expenseModifiers: { fixedIncreaseFlat: 120 },
    horizonMonths: 12,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL FOOD & LIVING SCENARIOS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'internet-phone-bill-surge',
    name: 'Internet / Phone Bill Surge',
    group: 'food_living',
    subcategory: 'Recurring bills',
    description:
      'Provider ends promotional rate, adds new fees, or data overage charges hit. Average American overpays $30–$80/month vs. available alternatives.',
    tier: 'everyday',
    severity: 'mild',
    annualProbabilityPct: 40,
    expenseModifiers: { fixedIncreaseFlat: 55 },
    horizonMonths: 12,
  },

  {
    id: 'restaurant-delivery-habit',
    name: 'Dining / Delivery Cost Spiral',
    group: 'food_living',
    subcategory: 'Food',
    description:
      'Reliance on DoorDash, Uber Eats, or dining out increases variable food spending by $300–$600/month beyond grocery baseline. Often accompanies stress or long working hours.',
    tier: 'everyday',
    severity: 'mild',
    annualProbabilityPct: 50,
    expenseModifiers: { variableIncreaseFlat: 380 },
    horizonMonths: 12,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL DEBT & CREDIT SCENARIOS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'variable-rate-debt-shock',
    name: 'Variable-Rate Debt Shock',
    group: 'debt_credit',
    subcategory: 'Loans',
    description:
      'HELOC, private student loans, or variable-rate personal loans reprice as interest rates rise. A $30,000 HELOC at prime+1% rose ~$300/month in 2022–23.',
    historicalRef: 'U.S. HELOC balances: $340B (2023). Prime rate went from 3.25% to 8.5% in 18 months, raising payments on $1 trillion in variable consumer debt.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 20,
    expenseModifiers: { fixedIncreaseFlat: 280 },
    horizonMonths: 18,
  },

  {
    id: 'bankruptcy-debt-settlement',
    name: 'Bankruptcy / Debt Settlement',
    group: 'debt_credit',
    subcategory: 'Loans',
    description:
      'Debt becomes unmanageable; debt settlement (paying pennies on the dollar) or Chapter 7/13 filing creates immediate legal costs and long-term credit damage.',
    tier: 'everyday',
    severity: 'extreme',
    annualProbabilityPct: 1,
    riskEvents: [
      {
        name: 'Legal and filing costs',
        category: 'other',
        probabilityPerMonth: 1 / 24,
        minCost: 1500,
        likelyCost: 4000,
        maxCost: 8000,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 12,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL FAMILY SCENARIOS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'new-baby-costs',
    name: 'New Baby — First-Year Costs',
    group: 'family',
    subcategory: 'Children',
    description:
      'Birth, newborn supplies, parental leave income gap, new childcare, and healthcare plan changes. First-year costs often run $15,000–$25,000 above baseline.',
    historicalRef: 'USDA estimates: $17,000+ for baby year 1 in U.S. cities. Hospital birth avg: $13,000 before insurance. C-section: $22,000+.',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 5,
    riskEvents: [
      {
        name: 'Birth and newborn expenses',
        category: 'medical',
        probabilityPerMonth: 0.04,
        minCost: 4000,
        likelyCost: 9000,
        maxCost: 20000,
        maxOccurrences: 1,
      },
    ],
    expenseModifiers: { fixedIncreaseFlat: 1200 },
    incomeShocks: [
      {
        name: 'Parental leave income gap',
        probabilityPerYear: 0.60,
        incomeFractionLost: 0.40,
        durationMonthsMin: 1,
        durationMonthsMax: 3,
      },
    ],
    horizonMonths: 12,
  },

  {
    id: 'elder-care-costs',
    name: 'Parent / Elder Care Costs',
    group: 'family',
    subcategory: 'Family',
    description:
      'Aging parent or family member needs assisted living, home health aide, or nursing care. Costs: $2,000–$8,500/month. Often hits when the user is in peak earning years.',
    historicalRef: 'Avg assisted living: $4,500/month (Genworth 2023). Home health aide: $27/hr. 53M Americans are unpaid caregivers (AARP).',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 12,
    riskEvents: [
      {
        name: 'Emergency elder care costs',
        category: 'family',
        probabilityPerMonth: 0.08,
        minCost: 2000,
        likelyCost: 6000,
        maxCost: 15000,
        maxOccurrences: 2,
      },
    ],
    expenseModifiers: { fixedIncreaseFlat: 500 },
    horizonMonths: 24,
  },

  {
    id: 'divorce-legal-fees',
    name: 'Divorce — Legal and Settlement Costs',
    group: 'family',
    subcategory: 'Relationship',
    description:
      'Contested divorce with attorneys, court filings, asset division, and potential alimony/child support obligation. Average contested divorce: $15,000–$30,000.',
    historicalRef: 'Avg U.S. divorce cost: $15,000 (contested). Lawyers: $200–$500/hr. ~40% of first marriages end in divorce (CDC).',
    tier: 'everyday',
    severity: 'extreme',
    annualProbabilityPct: 4,
    riskEvents: [
      {
        name: 'Divorce legal fees',
        category: 'family',
        probabilityPerMonth: 1 / 24,
        minCost: 8000,
        likelyCost: 18000,
        maxCost: 45000,
        maxOccurrences: 1,
      },
    ],
    expenseModifiers: { fixedIncreasePct: 0.30 },
    horizonMonths: 24,
  },

  {
    id: 'funeral-estate-costs',
    name: 'Death in Family / Funeral Costs',
    group: 'family',
    subcategory: 'Family',
    description:
      'Unexpected death of a family member triggers funeral costs, travel, estate administration, and possible inheritance debt or tax obligations.',
    historicalRef: 'Average U.S. funeral: $7,848 (NFDA 2023). Estate administration adds $2,000–$10,000. Life insurance often lags 2–6 months.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 6,
    riskEvents: [
      {
        name: 'Funeral and estate costs',
        category: 'family',
        probabilityPerMonth: 0.05,
        minCost: 3000,
        likelyCost: 8000,
        maxCost: 18000,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 6,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL DISASTER SCENARIOS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'wildfire-evacuation',
    name: 'Wildfire Evacuation',
    group: 'disaster',
    subcategory: 'Natural disaster',
    description:
      'Wildfire forces evacuation; possible home loss or damage. Even partial damage triggers deductibles. Air quality forces temporary relocation costs.',
    historicalRef: 'Camp Fire (2018): 18,804 structures destroyed. Maui fires (2023): $5.5B damage. California insurance non-renewals hit record highs afterward.',
    tier: 'everyday',
    severity: 'extreme',
    annualProbabilityPct: 4,
    riskEvents: [
      {
        name: 'Evacuation and temporary housing',
        category: 'housing',
        probabilityPerMonth: 0.04,
        minCost: 2000,
        likelyCost: 8000,
        maxCost: 35000,
        maxOccurrences: 1,
      },
    ],
    expenseModifiers: { fixedIncreasePct: 0.20 },
    horizonMonths: 12,
  },

  {
    id: 'earthquake-damage',
    name: 'Earthquake Damage',
    group: 'disaster',
    subcategory: 'Natural disaster',
    description:
      'Earthquake causes structural damage, chimney failure, or foundation cracks. Standard insurance excludes earthquakes; separate earthquake coverage carries 10–20% deductibles.',
    historicalRef: 'Northridge 1994: $25B total damage, avg claim $50K. Only ~10% of California homeowners carry earthquake insurance (CA Dept. of Insurance).',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 3,
    riskEvents: [
      {
        name: 'Earthquake structural damage',
        category: 'housing',
        probabilityPerMonth: 0.03,
        minCost: 5000,
        likelyCost: 20000,
        maxCost: 80000,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 12,
  },

  {
    id: 'home-burglary-theft',
    name: 'Home Burglary / Theft',
    group: 'disaster',
    subcategory: 'Financial crime',
    description:
      'Home broken into — electronics, jewelry, and appliances stolen. Homeowner/renter insurance deductible: $500–$1,500. Total loss often $3,000–$15,000.',
    historicalRef: 'FBI: 847,000 burglaries in 2022. Avg loss per incident: $2,661. Less than 14% of burglaries are solved.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 3,
    riskEvents: [
      {
        name: 'Theft losses (after insurance)',
        category: 'other',
        probabilityPerMonth: 0.03,
        minCost: 800,
        likelyCost: 4000,
        maxCost: 12000,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 6,
  },

  {
    id: 'ransomware-data-breach',
    name: 'Ransomware / Data Breach',
    group: 'disaster',
    subcategory: 'Financial crime',
    description:
      'Personal devices or small business accounts hit by ransomware. Data recovery, new hardware, credit monitoring, and potential regulatory fines create a multi-week cash drain.',
    tier: 'everyday',
    severity: 'moderate',
    annualProbabilityPct: 5,
    riskEvents: [
      {
        name: 'Ransomware recovery costs',
        category: 'other',
        probabilityPerMonth: 0.04,
        minCost: 500,
        likelyCost: 2500,
        maxCost: 10000,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 3,
  },

  {
    id: 'lawsuit-legal-defense',
    name: 'Lawsuit / Legal Defense Costs',
    group: 'disaster',
    subcategory: 'Legal',
    description:
      'User is sued (car accident liability, landlord/tenant dispute, business dispute, or personal injury) and must hire a defense attorney. Even winning costs $5,000–$30,000.',
    tier: 'everyday',
    severity: 'severe',
    annualProbabilityPct: 3,
    riskEvents: [
      {
        name: 'Legal defense costs',
        category: 'other',
        probabilityPerMonth: 0.03,
        minCost: 3000,
        likelyCost: 10000,
        maxCost: 40000,
        maxOccurrences: 1,
      },
    ],
    horizonMonths: 12,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL MACRO SCENARIOS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'macro-ai-bubble',
    name: 'AI Bubble Correction',
    group: 'macro_historical',
    subcategory: 'Market bubble',
    description:
      'AI/tech sector re-prices as earnings fail to materialize at scale or regulation disrupts business models. Heavy concentration in AI-exposed equities (NVDA, MSFT, META) leads to sharp drawdowns.',
    historicalRef:
      'Analyst parallels: Cisco/Intel in 2000. NVDA trades at 40-50x sales at peak. AI capital expenditure at $200B+ before returns are proven. A typical bubble unwind: -60 to -80% in leading stocks.',
    tier: 'pro',
    severity: 'extreme',
    annualProbabilityPct: 12,
    horizonMonths: 18,
    portfolioParams: {
      stressFactor: 3.0,
      targetCorr: 0.75,
      horizonDays: 252,
      distribution: 'student_t',
      df: 4,
      description: 'AI-heavy portfolios most exposed. Semiconductor and cloud infrastructure stocks hit hardest. Diversified portfolios partially insulated. Parallels to dot-com: hype monetization failed.',
    },
  },

  {
    id: 'macro-china-shock',
    name: 'China Economic Hard Landing',
    group: 'macro_historical',
    subcategory: 'Emerging markets',
    description:
      'Chinese property sector collapse, banking crisis, or Taiwan-related risk event triggers global risk-off. Emerging market contagion spreads to commodity and export-dependent economies.',
    historicalRef:
      'Evergrande default: $300B+ in liabilities (2021–23). China GDP growth slowed from 8%+ to near 2–3% (2023). A hard landing would transmit through trade, FX, and commodities.',
    tier: 'pro',
    severity: 'extreme',
    annualProbabilityPct: 10,
    horizonMonths: 12,
    portfolioParams: {
      stressFactor: 2.8,
      targetCorr: 0.80,
      horizonDays: 126,
      distribution: 'student_t',
      df: 4,
      description: 'EM equities and currencies sold off. Commodity exporters hit. Safe havens (USD, JPY, gold) rallied. U.S. multinationals exposed to China revenues saw sharp drawdowns.',
    },
  },

  {
    id: 'macro-eu-debt-crisis',
    name: 'European Debt / Sovereign Crisis',
    group: 'macro_historical',
    subcategory: 'Sovereign debt',
    description:
      'Sovereign debt tensions in EU periphery (Italy, Spain, Greece) re-ignite. EUR breaks under political pressure, contagion hits European banks and U.S. exposure.',
    historicalRef:
      'Greece debt crisis (2010–2015): Yields hit 35%+, ECB implemented OMT. "Whatever it takes" (Draghi, 2012) saved the Euro. Italian spreads widened 400+ bps in 2022.',
    tier: 'pro',
    severity: 'severe',
    annualProbabilityPct: 8,
    horizonMonths: 12,
    portfolioParams: {
      stressFactor: 2.2,
      targetCorr: 0.70,
      horizonDays: 126,
      distribution: 'student_t',
      df: 5,
      description: 'European equity markets led the selloff. EUR/USD dropped sharply. U.S. banks with EU exposure fell 20–40%. Flight to USD and Treasuries. ECB policy uncertainty amplified moves.',
    },
  },

  {
    id: 'macro-flash-crash',
    name: 'Flash Crash / Liquidity Event',
    group: 'macro_historical',
    subcategory: 'Market structure',
    description:
      'Sudden algorithmic-driven price collapse and immediate partial recovery. Market makers withdraw, spreads widen dramatically, stop-loss orders cascade.',
    historicalRef:
      'Flash Crash May 6, 2010: Dow dropped 1,000 pts in minutes (-9%). Aug 24, 2015: S&P futures halted; S&P opened -5.5%. Crypto flash crashes 20-30% in minutes are common.',
    tier: 'pro',
    severity: 'severe',
    annualProbabilityPct: 15,
    horizonMonths: 1,
    portfolioParams: {
      stressFactor: 3.0,
      targetCorr: 0.85,
      horizonDays: 5,
      distribution: 'student_t',
      df: 3,
      description: 'Extreme short-term VaR spike. Recovers quickly in most cases. Leveraged positions and stop-losses get triggered at the worst prices. Illiquid positions worst affected.',
    },
  },

  {
    id: 'macro-pandemic-repeat',
    name: 'New Pandemic / Biosecurity Event',
    group: 'macro_historical',
    subcategory: 'Pandemic',
    description:
      'Novel pathogen triggers global lockdowns, travel bans, and supply-chain shutdowns. Markets front-run the economic shock. Speed of response determines recovery trajectory.',
    historicalRef:
      'WHO declared COVID-19 a pandemic Mar 11, 2020. Mpox 2022: limited financial impact. H5N1 bird flu (2024): market nervousness without human transmission. Probability ~3-5%/yr for significant event.',
    tier: 'pro',
    severity: 'extreme',
    annualProbabilityPct: 4,
    horizonMonths: 12,
    portfolioParams: {
      stressFactor: 3.5,
      targetCorr: 0.88,
      horizonDays: 42,
      distribution: 'student_t',
      df: 3,
      description: 'Travel, hospitality, and retail hardest hit. Tech and e-commerce can outperform. Massive fiscal and monetary response likely (as in 2020). Initial shock severe; recovery depends on vaccine timeline.',
    },
  },

  {
    id: 'macro-currency-crisis',
    name: 'Dollar Shock / Currency Crisis',
    group: 'macro_historical',
    subcategory: 'Currency',
    description:
      'Rapid USD strengthening or foreign currency crisis. EM assets collapse as dollar-denominated debt becomes unpayable. U.S. exporters hurt; import prices fall.',
    historicalRef:
      'DXY gained 15% in 2022 — worst EM sell-off in a decade. Argentina, Turkey, Sri Lanka faced currency collapses 40–80%. UK Gilt crisis (Sep 2022) triggered LDI pension blowup.',
    tier: 'pro',
    severity: 'severe',
    annualProbabilityPct: 10,
    horizonMonths: 6,
    portfolioParams: {
      stressFactor: 2.0,
      targetCorr: 0.60,
      horizonDays: 63,
      distribution: 'student_t',
      df: 5,
      description: 'EM equity and bond funds worst hit. Commodity prices dislocate. USD-hedged portfolios outperform unhedged. Gold often rallied during USD crises once peak USD is in.',
    },
  },

  {
    id: 'macro-climate-transition-risk',
    name: 'Climate / Carbon Transition Shock',
    group: 'macro_historical',
    subcategory: 'Climate',
    description:
      'Rapid carbon pricing, stranded-asset write-downs in fossil fuel companies, or physical climate losses re-price portfolios. Insurance companies retreat from high-risk geographies.',
    historicalRef:
      'IPCC estimates physical risk could reduce global GDP 4–23% by 2100. "Climate bubble" in fossil fuels: IEA estimates $1 trillion in stranded assets under Net Zero 2050 scenario.',
    tier: 'pro',
    severity: 'severe',
    annualProbabilityPct: 10,
    horizonMonths: 24,
    portfolioParams: {
      stressFactor: 2.0,
      targetCorr: 0.55,
      horizonDays: 252,
      distribution: 'normal',
      description: 'Energy sector bifurcates: fossil fuel write-downs vs. clean energy gains. Financial sector exposed via mortgage/insurance risk in flood/fire zones. Long-horizon investors most exposed.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL PORTFOLIO SCENARIOS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'portfolio-margin-call',
    name: 'Margin Call Cascade',
    group: 'market_portfolio',
    subcategory: 'Leverage',
    description:
      'Leveraged position falls below maintenance margin, forcing liquidation at depressed prices. Forced selling amplifies the initial move and can cascade across correlated positions.',
    historicalRef: 'Archegos Capital (2021): $20B in positions unwound in days, causing $10B+ in bank losses. LTCM (1998): 25:1 leverage forced Fed-brokered bailout.',
    tier: 'pro',
    severity: 'extreme',
    annualProbabilityPct: 5,
    horizonMonths: 1,
    portfolioParams: {
      stressFactor: 4.0,
      targetCorr: 0.85,
      horizonDays: 10,
      distribution: 'student_t',
      df: 3,
      description: 'Amplified by leverage ratio. Forced selling into illiquid markets causes permanent capital loss beyond the initial drawdown. Correlation to other assets spikes at liquidation.',
    },
  },

  {
    id: 'portfolio-momentum-unwind',
    name: 'Factor Crash — Momentum Unwind',
    group: 'market_portfolio',
    subcategory: 'Factor',
    description:
      'Crowded momentum factor reverses sharply as trend-followers all exit simultaneously. High-beta winners become worst losers in a matter of days.',
    historicalRef: 'Momentum factor crashed ~40% in Aug 2020 in 3 days. Sep 2023 momentum reversal: -15% in 2 weeks. Quant funds running momentum strategies faced synchronized losses.',
    tier: 'pro',
    severity: 'severe',
    annualProbabilityPct: 15,
    horizonMonths: 1,
    portfolioParams: {
      stressFactor: 2.5,
      targetCorr: 0.65,
      horizonDays: 10,
      distribution: 'student_t',
      df: 4,
      description: 'Recent winners become the worst performers. Defensive, cheap stocks can outperform dramatically. High-vol strategies hit by factor risk crowding. Diversification across factors helps.',
    },
  },

  {
    id: 'portfolio-esg-regulatory-shock',
    name: 'ESG / Regulatory Shock',
    group: 'market_portfolio',
    subcategory: 'Regulation',
    description:
      'New regulation mandates ESG disclosures, restricts certain investments, or a major ESG scandal triggers forced selling of once-favored assets.',
    tier: 'pro',
    severity: 'moderate',
    annualProbabilityPct: 12,
    horizonMonths: 6,
    portfolioParams: {
      stressFactor: 1.6,
      targetCorr: 0.50,
      horizonDays: 63,
      distribution: 'normal',
      description: 'Sector-specific impact: fossil fuel exposure, mining, defense can see sharp repricing. ESG-screened funds may outperform or underperform depending on direction of policy.',
    },
  },

  {
    id: 'portfolio-liquidity-crunch',
    name: 'Liquidity Crunch — Redemption Run',
    group: 'market_portfolio',
    subcategory: 'Liquidity',
    description:
      'Fund or asset experiences mass redemptions, forcing managers to sell illiquid holdings at fire-sale prices. Gating provisions trap investors.',
    historicalRef: 'Commercial real estate funds gated in 2022–23 (Blackstone BREIT, Starwood). UK gilts crisis forced Bank of England emergency intervention (Sep 2022).',
    tier: 'pro',
    severity: 'severe',
    annualProbabilityPct: 8,
    horizonMonths: 3,
    portfolioParams: {
      stressFactor: 2.8,
      targetCorr: 0.75,
      horizonDays: 42,
      distribution: 'student_t',
      df: 4,
      description: 'Illiquid assets (real estate, private credit, alternatives) hardest hit. Public market proxies also fall on contagion fear. Investors with liquid portfolios face forced discount selling.',
    },
  },

  {
    id: 'portfolio-black-swan',
    name: 'Black Swan Event',
    group: 'market_portfolio',
    subcategory: 'Tail risk',
    description:
      'Completely unforeseen event — nuclear incident, catastrophic cyberattack on financial infrastructure, or sudden geopolitical shock — moves markets in ways no model predicted.',
    historicalRef: 'Taleb\'s "Black Swan" (2007) described 9/11, LTCM, COVID-19. By definition, these are unpredictable — the probability estimate here models the frequency of extreme unexpected events.',
    tier: 'pro',
    severity: 'extreme',
    annualProbabilityPct: 3,
    horizonMonths: 6,
    portfolioParams: {
      stressFactor: 5.0,
      targetCorr: 0.95,
      horizonDays: 21,
      distribution: 'student_t',
      df: 3, // engine minimum — Student-t below df 3 has infinite variance
      description: 'Maximum tail risk. Ultra-fat tails. All correlations approach 1. Only true safe havens (physical gold, T-bills, USD) provide any protection. Option hedges pay off dramatically.',
    },
  },
]

/** Quick lookup by ID. */
export const SCENARIOS_BY_ID = new Map(SCENARIOS.map((s) => [s.id, s]))

/** Filter helpers. */
export const getScenariosByGroup = (group: ScenarioDefinition['group']) =>
  SCENARIOS.filter((s) => s.group === group)

export const getScenariosByTier = (tier: 'everyday' | 'pro') =>
  SCENARIOS.filter((s) => s.tier === tier || s.tier === 'both')

export const MVP_SCENARIO_IDS = [
  'job-loss-short',
  'reduced-hours',
  'client-loss-freelancer',
  'car-minor-repair',
  'car-major-repair',
  'car-accident',
  'rent-increase',
  'forced-move',
  'roommate-leaves',
  'hvac-failure',
  'plumbing-emergency',
  'appliance-failure',
  'urgent-care',
  'emergency-room',
  'dental-emergency',
  'prescription-increase',
  'pet-emergency',
  'pet-surgery',
  'grocery-spike',
  'utility-spike',
  'credit-card-emergency',
  'bnpl-stackup',
  'childcare-increase',
  'family-emergency-travel',
  'hurricane-evacuation',
  'power-outage-extended',
  'multiple-small-things',
  'self-employment-tax-shock',
  'student-loan-return',
  'subscription-creep',
]
