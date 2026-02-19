import type { Grade, DimensionId } from '@/types/scorecard';

// Grade scale: A=90-100, B=75-89, C=60-74, D=40-59, F=0-39
export function scoreToGrade(score: number): Grade {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

// Clamp and normalize a value to 0-100 based on min/max where lower is better
function normalizeLowerBetter(value: number, best: number, worst: number): number {
  if (worst === best) return 50;
  const score = ((worst - value) / (worst - best)) * 100;
  return Math.max(0, Math.min(100, score));
}

// Clamp and normalize a value to 0-100 based on min/max where higher is better
function normalizeHigherBetter(value: number, best: number, worst: number): number {
  if (best === worst) return 50;
  const score = ((value - worst) / (best - worst)) * 100;
  return Math.max(0, Math.min(100, score));
}

// ── FISCAL grading thresholds ──
// Cost-to-serve ratio: A if <0.8, F if >1.5 (ICMA benchmarks)
export function gradeCostToServe(ratio: number): number {
  return normalizeLowerBetter(ratio, 0.8, 1.5);
}

// Infrastructure cost per unit: A if <$20k, F if >$60k
export function gradeInfraCostPerUnit(cost: number): number {
  return normalizeLowerBetter(cost, 20000, 60000);
}

// Tax revenue (higher is better)
export function gradeTaxRevenue(revenue: number, maxRevenue: number): number {
  return normalizeHigherBetter(revenue, maxRevenue, 0);
}

// Debt capacity (higher is better)
export function gradeDebtCapacity(capacity: number, maxCapacity: number): number {
  return normalizeHigherBetter(capacity, maxCapacity, 0);
}

// ── ENVIRONMENTAL grading thresholds ──
// Wetland acres impacted: A if 0, F if >20
export function gradeWetlandImpact(acres: number): number {
  return normalizeLowerBetter(acres, 0, 20);
}

// Floodplain encroachment: A if 0, F if >15
export function gradeFloodplainImpact(acres: number): number {
  return normalizeLowerBetter(acres, 0, 15);
}

// Impervious surface increase (% of developed area): A if <35%, F if >65%
export function gradeImperviousSurface(pct: number): number {
  return normalizeLowerBetter(pct, 0.35, 0.65);
}

// Stream buffer violations: A if 0, F if >5
export function gradeStreamBufferViolations(count: number): number {
  return normalizeLowerBetter(count, 0, 5);
}

// ── SOCIAL & HOUSING grading thresholds ──
// Affordable housing %: A if >25%, F if <5%
export function gradeAffordableHousing(pct: number): number {
  return normalizeHigherBetter(pct, 0.25, 0.05);
}

// Jobs-housing balance: A if 0.9-1.1, F if <0.5 or >2.0
export function gradeJobsHousing(ratio: number): number {
  if (ratio >= 0.9 && ratio <= 1.1) return 95;
  if (ratio < 0.9) return normalizeHigherBetter(ratio, 0.9, 0.5);
  return normalizeLowerBetter(ratio, 1.1, 2.0);
}

// ── TRANSPORTATION grading thresholds ──
// Transit access %: A if >60%, F if <10%
export function gradeTransitAccess(pct: number): number {
  return normalizeHigherBetter(pct, 0.60, 0.10);
}

// VMT increase (lower is better): based on daily VMT per unit
export function gradeVMT(vmtPerUnit: number): number {
  return normalizeLowerBetter(vmtPerUnit, 15, 40);
}

// Road-miles needed (lower is better)
export function gradeRoadMiles(miles: number, maxMiles: number): number {
  return normalizeLowerBetter(miles, 0, maxMiles);
}

// Aggregate dimension score from metric scores
export function computeDimensionScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

// Overall score from dimension scores (weighted equally)
export function computeOverallScore(dimensionScores: Record<DimensionId, number>): number {
  const vals = Object.values(dimensionScores);
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// Adopted Model criteria pass/fail (from PDF page 21)
export interface AdoptedModelCriteria {
  growthRatePass: boolean; // ≤75 ac/yr
  streamBufferStatus: 'pass' | 'warn' | 'fail';
  wetlandBufferStatus: 'pass' | 'warn' | 'fail';
  railCorridorPreference: 'high' | 'med' | 'low';
  groundwaterRechargePreference: 'high' | 'med' | 'low';
  agPreservation: 'high' | 'med' | 'low';
  gravitySewerPreference: 'high' | 'med' | 'low';
}

export function evaluateAdoptedCriteria(
  scenarioId: string,
  growthRate: number,
  streamBufferViolations: number,
  wetlandAcres: number
): AdoptedModelCriteria {
  // Scenario-specific preferences based on their design intent
  const prefs: Record<string, Partial<AdoptedModelCriteria>> = {
    'fuda-lateral':     { railCorridorPreference: 'low', groundwaterRechargePreference: 'low', agPreservation: 'low', gravitySewerPreference: 'med' },
    'concentric':       { railCorridorPreference: 'med', groundwaterRechargePreference: 'med', agPreservation: 'med', gravitySewerPreference: 'med' },
    'rail-corridor':    { railCorridorPreference: 'high', groundwaterRechargePreference: 'med', agPreservation: 'med', gravitySewerPreference: 'med' },
    'utility-service':  { railCorridorPreference: 'med', groundwaterRechargePreference: 'med', agPreservation: 'med', gravitySewerPreference: 'high' },
    'ag-preservation':  { railCorridorPreference: 'med', groundwaterRechargePreference: 'med', agPreservation: 'high', gravitySewerPreference: 'low' },
    'infill':           { railCorridorPreference: 'med', groundwaterRechargePreference: 'high', agPreservation: 'high', gravitySewerPreference: 'high' },
    'resource-based':   { railCorridorPreference: 'med', groundwaterRechargePreference: 'high', agPreservation: 'med', gravitySewerPreference: 'med' },
  };

  const p = prefs[scenarioId] || {};

  return {
    growthRatePass: growthRate <= 75,
    streamBufferStatus: streamBufferViolations === 0 ? 'pass' : streamBufferViolations <= 2 ? 'warn' : 'fail',
    wetlandBufferStatus: wetlandAcres === 0 ? 'pass' : wetlandAcres <= 5 ? 'warn' : 'fail',
    railCorridorPreference: p.railCorridorPreference || 'med',
    groundwaterRechargePreference: p.groundwaterRechargePreference || 'med',
    agPreservation: p.agPreservation || 'med',
    gravitySewerPreference: p.gravitySewerPreference || 'med',
  };
}
