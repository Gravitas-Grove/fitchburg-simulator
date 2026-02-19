import type { Scenario, DensityLevel } from '@/types/scenario';
import type { ScorecardResult, ScorecardDimension, ScorecardMetric, SpatialProfile, DimensionId } from '@/types/scorecard';
import { DENSITY_MAP } from './metrics';
import {
  scoreToGrade,
  gradeCostToServe,
  gradeInfraCostPerUnit,
  gradeWetlandImpact,
  gradeFloodplainImpact,
  gradeImperviousSurface,
  gradeStreamBufferViolations,
  gradeAffordableHousing,
  gradeJobsHousing,
  gradeTransitAccess,
  gradeVMT,
  computeDimensionScore,
  computeOverallScore,
} from './grading';

// ── Constants ──
const MILL_RATE = 21.5; // Fitchburg 2024 mill rate
const ASSESSED_VALUES: Record<DensityLevel, number> = { low: 350000, med: 285000, high: 220000 };
const OP_COST_PER_UNIT: Record<string, number> = { sprawl: 3200, moderate: 2400, compact: 1800 };
const PERSONS_PER_UNIT = 2.3;
const TRIPS_PER_DAY = 3.4;
const EXISTING_JOBS = 18000;
const EXISTING_UNITS = 13500;

// Infrastructure cost per acre by type
function infraCostPerAcre(scenario: Scenario): number {
  if (scenario.id === 'infill') return 25000;
  if (scenario.id === 'utility-service') return 68000; // gravity sewer baseline
  return 68000 * scenario.infraMult;
}

// Classify scenario as compact/moderate/sprawl for operating cost
function scenarioSprawl(scenario: Scenario, density: DensityLevel): 'compact' | 'moderate' | 'sprawl' {
  if (scenario.id === 'infill' || scenario.id === 'rail-corridor') return 'compact';
  if (density === 'high') return 'compact';
  if (density === 'low') return 'sprawl';
  return 'moderate';
}

// Affordable housing % by scenario type and density
function affordableHousingPct(scenario: Scenario, density: DensityLevel): number {
  if (scenario.id === 'rail-corridor' || density === 'high') return 0.20;
  if (scenario.id === 'infill') return 0.18;
  if (density === 'med') return 0.12;
  return 0.05;
}

// Average trip length based on transit proximity
function avgTripLength(scenario: Scenario): number {
  if (scenario.id === 'rail-corridor') return 6.2;
  if (scenario.id === 'infill' || scenario.id === 'concentric') return 7.5;
  return 9.8;
}

// Transit proximity % estimate (when no spatial profile)
function estimateTransitPct(scenario: Scenario): number {
  if (scenario.id === 'rail-corridor') return 0.72;
  if (scenario.id === 'infill') return 0.55;
  if (scenario.id === 'concentric') return 0.38;
  if (scenario.id === 'utility-service') return 0.25;
  if (scenario.id === 'resource-based') return 0.20;
  if (scenario.id === 'ag-preservation') return 0.15;
  return 0.12; // fuda-lateral
}

// Impervious surface ratio by density
function imperviousRatio(density: DensityLevel): number {
  return density === 'low' ? 0.35 : density === 'med' ? 0.50 : 0.65;
}

// Road-miles needed per developable acres
function acresPerRoadMile(scenario: Scenario, density: DensityLevel): number {
  const base = density === 'low' ? 8 : density === 'med' ? 12 : 20;
  return scenario.id === 'infill' ? base * 2 : base; // infill 50% reduction
}

// Estimate spatial profile from scenario metadata when GIS data unavailable
function estimateSpatialProfile(scenario: Scenario, acres: number): SpatialProfile {
  const agScale = scenario.agAcres / 820; // normalized to FUDA max

  // Estimate wetland/floodplain overlap proportional to acres and scenario type
  const envFactor = scenario.id === 'resource-based' ? 0.02 : scenario.id === 'ag-preservation' ? 0.05 : scenario.id === 'infill' ? 0.01 : scenario.id === 'fuda-lateral' ? 0.08 : 0.04;
  const wetlandAcres = parseFloat((acres * envFactor * 0.6).toFixed(1));
  const floodplainAcres = parseFloat((acres * envFactor * 0.4).toFixed(1));

  // Stream buffer violations
  const bufferViolations = scenario.id === 'resource-based' ? 0 : scenario.id === 'infill' ? 0 : scenario.id === 'ag-preservation' ? 1 : scenario.id === 'rail-corridor' ? 1 : scenario.id === 'fuda-lateral' ? 4 : 2;

  return {
    wetlandOverlapAcres: wetlandAcres,
    floodplainOverlapAcres: floodplainAcres,
    streamBufferViolationCount: bufferViolations,
    gravitySeweredPct: scenario.id === 'utility-service' ? 0.95 : scenario.id === 'infill' ? 0.90 : scenario.id === 'concentric' ? 0.65 : 0.45,
    transitProximityPct: estimateTransitPct(scenario),
    primeAgOverlapAcres: scenario.agAcres,
    vacantLandAcres: scenario.id === 'infill' ? acres : 0,
    totalDevelopableAcres: acres,
    avgLandValuePerAcre: scenario.id === 'infill' ? 180000 : scenario.id === 'rail-corridor' ? 120000 : 85000 * (1 + agScale * 0.3),
    envCorridorOverlapAcres: parseFloat((acres * envFactor * 0.3).toFixed(1)),
    soilClass1And2Pct: agScale * 0.8,
    infiltrationHighPct: scenario.id === 'resource-based' ? 0.6 : scenario.id === 'ag-preservation' ? 0.5 : 0.3,
  };
}

function fmt(value: number, unit: string): string {
  if (unit === '$') return '$' + Math.round(value).toLocaleString();
  if (unit === '$M') return '$' + value.toFixed(1) + 'M';
  if (unit === '%') return (value * 100).toFixed(0) + '%';
  if (unit === 'ratio') return value.toFixed(2);
  if (unit === 'mi') return value.toFixed(1) + ' mi';
  if (unit === 'ac') return Math.round(value).toLocaleString() + ' ac';
  if (unit === 'units') return Math.round(value).toLocaleString();
  if (unit === 'VMT') return Math.round(value).toLocaleString() + ' VMT';
  if (unit === 'count') return value.toString();
  return value.toFixed(1);
}

export function computeScorecard(
  scenario: Scenario,
  growthRate: number,
  density: DensityLevel,
  currentYear: number = 2030
): ScorecardResult {
  const yrs = Math.max(1, currentYear - 2025);
  const du = DENSITY_MAP[density];
  const acres = growthRate * yrs;
  const units = Math.round(acres * du);

  // Use real spatial profile if available, otherwise estimate
  const sp = scenario.spatialProfile || estimateSpatialProfile(scenario, acres);

  // ═══ FISCAL IMPACT ═══
  const costPerAcre = infraCostPerAcre(scenario);
  const totalInfraCost = acres * costPerAcre;
  const infraCostPerUnit = units > 0 ? totalInfraCost / units : 0;

  const assessedValue = ASSESSED_VALUES[density];
  const annualTaxRevenue = units * assessedValue * MILL_RATE / 1000;

  const sprawlType = scenarioSprawl(scenario, density);
  const annualOpCost = units * OP_COST_PER_UNIT[sprawlType];
  const costToServeRatio = annualTaxRevenue > 0 ? annualOpCost / annualTaxRevenue : 2;

  const netNewRevenue = annualTaxRevenue - annualOpCost;
  const debtCapacity = Math.max(0, netNewRevenue * 1.25 * 20);

  const fiscalScores = [
    gradeInfraCostPerUnit(infraCostPerUnit),
    gradeCostToServe(costToServeRatio),
  ];
  const fiscalScore = computeDimensionScore(fiscalScores);

  const fiscalMetrics: ScorecardMetric[] = [
    { id: 'infra-cost-unit', label: 'Infrastructure cost/unit', value: infraCostPerUnit, unit: '$', formatted: fmt(infraCostPerUnit, '$') },
    { id: 'tax-revenue', label: 'Annual tax revenue', value: annualTaxRevenue, unit: '$M', formatted: fmt(annualTaxRevenue / 1e6, '$M') },
    { id: 'cost-to-serve', label: 'Cost-to-serve ratio', value: costToServeRatio, unit: 'ratio', formatted: fmt(costToServeRatio, 'ratio') },
    { id: 'debt-capacity', label: 'Debt capacity impact', value: debtCapacity, unit: '$M', formatted: fmt(debtCapacity / 1e6, '$M') },
  ];

  // ═══ ENVIRONMENTAL ═══
  const wetlandAcres = sp.wetlandOverlapAcres;
  const floodplainAcres = sp.floodplainOverlapAcres;
  const imperviousPct = imperviousRatio(density);
  const imperviousAcres = acres * imperviousPct;
  const bufferViolations = sp.streamBufferViolationCount;

  const envScores = [
    gradeWetlandImpact(wetlandAcres),
    gradeFloodplainImpact(floodplainAcres),
    gradeImperviousSurface(imperviousPct),
    gradeStreamBufferViolations(bufferViolations),
  ];
  const envScore = computeDimensionScore(envScores);

  const envMetrics: ScorecardMetric[] = [
    { id: 'wetland-impact', label: 'Wetland acres impacted', value: wetlandAcres, unit: 'ac', formatted: fmt(wetlandAcres, 'ac') },
    { id: 'floodplain', label: 'Floodplain encroachment', value: floodplainAcres, unit: 'ac', formatted: fmt(floodplainAcres, 'ac') },
    { id: 'impervious', label: 'Impervious surface', value: imperviousAcres, unit: 'ac', formatted: fmt(imperviousPct * 100, '') + '% (' + fmt(imperviousAcres, 'ac') + ')' },
    { id: 'buffer-violations', label: 'Stream buffer violations', value: bufferViolations, unit: 'count', formatted: bufferViolations.toString() },
  ];

  // ═══ SOCIAL & HOUSING ═══
  const totalUnits = units;
  const affordPct = affordableHousingPct(scenario, density);
  const affordableUnits = Math.round(units * affordPct);
  const jobsHousingRatio = EXISTING_JOBS / (EXISTING_UNITS + units);
  const medianLotCost = sp.avgLandValuePerAcre / du;

  const socialScores = [
    gradeAffordableHousing(affordPct),
    gradeJobsHousing(jobsHousingRatio),
  ];
  const socialScore = computeDimensionScore(socialScores);

  const socialMetrics: ScorecardMetric[] = [
    { id: 'total-units', label: 'Total dwelling units', value: totalUnits, unit: 'units', formatted: fmt(totalUnits, 'units') },
    { id: 'affordable-units', label: 'Affordable units (≤80% AMI)', value: affordableUnits, unit: 'units', formatted: fmt(affordableUnits, 'units') + ' (' + fmt(affordPct * 100, '') + '%)' },
    { id: 'jobs-housing', label: 'Jobs-housing balance', value: jobsHousingRatio, unit: 'ratio', formatted: fmt(jobsHousingRatio, 'ratio') },
    { id: 'lot-cost', label: 'Median lot cost', value: medianLotCost, unit: '$', formatted: fmt(medianLotCost, '$') },
  ];

  // ═══ TRANSPORTATION ═══
  const tripLength = avgTripLength(scenario);
  const dailyVMT = units * PERSONS_PER_UNIT * TRIPS_PER_DAY * tripLength;
  const transitPct = sp.transitProximityPct;
  const roadMilesNeeded = acres / acresPerRoadMile(scenario, density);

  const transportScores = [
    gradeTransitAccess(transitPct),
    gradeVMT(dailyVMT / Math.max(units, 1)),
  ];
  const transportScore = computeDimensionScore(transportScores);

  const transportMetrics: ScorecardMetric[] = [
    { id: 'daily-vmt', label: 'Est. daily VMT increase', value: dailyVMT, unit: 'VMT', formatted: fmt(dailyVMT, 'VMT') },
    { id: 'transit-access', label: '% within ½mi transit', value: transitPct, unit: '%', formatted: fmt(transitPct, '%') },
    { id: 'road-miles', label: 'New road-miles needed', value: roadMilesNeeded, unit: 'mi', formatted: fmt(roadMilesNeeded, 'mi') },
  ];

  // ═══ BUILD RESULT ═══
  const dimensionScores: Record<DimensionId, number> = {
    fiscal: fiscalScore,
    environmental: envScore,
    social: socialScore,
    transportation: transportScore,
  };
  const overallScore = computeOverallScore(dimensionScores);

  const dimensions: ScorecardDimension[] = [
    {
      id: 'fiscal',
      label: 'Fiscal Impact',
      icon: 'DollarSign',
      grade: scoreToGrade(fiscalScore),
      score: fiscalScore,
      metrics: fiscalMetrics,
      summary: costToServeRatio < 1 ? 'Revenue-positive growth pattern' : 'Operating costs exceed revenue',
    },
    {
      id: 'environmental',
      label: 'Environmental',
      icon: 'Leaf',
      grade: scoreToGrade(envScore),
      score: envScore,
      metrics: envMetrics,
      summary: bufferViolations === 0 && wetlandAcres < 1 ? 'Minimal environmental impact' : `${bufferViolations} buffer violation${bufferViolations !== 1 ? 's' : ''}, ${fmt(wetlandAcres, 'ac')} wetland overlap`,
    },
    {
      id: 'social',
      label: 'Social & Housing',
      icon: 'Home',
      grade: scoreToGrade(socialScore),
      score: socialScore,
      metrics: socialMetrics,
      summary: affordPct >= 0.15 ? 'Strong affordable housing contribution' : 'Limited affordability impact',
    },
    {
      id: 'transportation',
      label: 'Transportation',
      icon: 'Car',
      grade: scoreToGrade(transportScore),
      score: transportScore,
      metrics: transportMetrics,
      summary: transitPct > 0.5 ? 'Transit-supportive development pattern' : 'Auto-dependent growth pattern',
    },
  ];

  return {
    dimensions,
    overallGrade: scoreToGrade(overallScore),
    overallScore,
  };
}
