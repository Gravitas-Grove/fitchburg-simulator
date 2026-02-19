interface AnalysisContext {
  scenarioName: string;
  description: string;
  growthRate: number;
  density: string;
  scorecard?: {
    overallGrade: string;
    overallScore: number;
    fiscal: { grade: string; score: number; costToServe: number; infraCostPerUnit: number; taxRevenue: number; debtCapacity: number };
    environmental: { grade: string; score: number; wetlandAcres: number; floodplainAcres: number; bufferViolations: number; imperviousPct: number };
    social: { grade: string; score: number; totalUnits: number; affordableUnits: number; affordablePct: number; jobsHousingRatio: number };
    transportation: { grade: string; score: number; dailyVMT: number; transitPct: number; roadMiles: number };
  };
  acres: number;
  units: number;
  infraM: number;
  agLand: number;
  agImpact: string;
}

export function buildAnalysisPrompt(ctx: AnalysisContext): string {
  const du = ctx.density === 'low' ? 3 : ctx.density === 'high' ? 7.5 : 5;

  let scorecardBlock = '';
  if (ctx.scorecard) {
    const sc = ctx.scorecard;
    scorecardBlock = `
SCORECARD (Overall: ${sc.overallGrade}, ${sc.overallScore}/100):
| Dimension | Grade | Score | Key Metrics |
|-----------|-------|-------|-------------|
| Fiscal | ${sc.fiscal.grade} | ${sc.fiscal.score} | Cost-to-serve: ${sc.fiscal.costToServe.toFixed(2)}, Infra/unit: $${Math.round(sc.fiscal.infraCostPerUnit).toLocaleString()}, Tax rev: $${(sc.fiscal.taxRevenue/1e6).toFixed(1)}M |
| Environmental | ${sc.environmental.grade} | ${sc.environmental.score} | Wetlands: ${sc.environmental.wetlandAcres}ac, Floodplain: ${sc.environmental.floodplainAcres}ac, Buffer violations: ${sc.environmental.bufferViolations} |
| Social & Housing | ${sc.social.grade} | ${sc.social.score} | Units: ${sc.social.totalUnits}, Affordable: ${sc.social.affordableUnits} (${(sc.social.affordablePct*100).toFixed(0)}%), Jobs-housing: ${sc.social.jobsHousingRatio.toFixed(2)} |
| Transportation | ${sc.transportation.grade} | ${sc.transportation.score} | VMT: ${Math.round(sc.transportation.dailyVMT).toLocaleString()}, Transit: ${(sc.transportation.transitPct*100).toFixed(0)}%, Road-miles: ${sc.transportation.roadMiles.toFixed(1)} |
`;
  }

  return `Provide a structured scenario analysis with the following 5 sections using ### headers:

### Executive Summary
2-3 sentence overview with overall grade and key finding.

### Spatial Analysis
How this scenario uses land, which areas of Fitchburg are affected, and how it relates to the Urban Service Area.

### Fiscal Impact
Infrastructure costs, tax revenue implications, cost-to-serve ratio analysis, and comparison to ICMA benchmarks.

### Environmental Assessment
Wetland, floodplain, stream buffer, and impervious surface impacts. Reference WI NR 115 standards where relevant.

### Plan Alignment
Score against each of the 7 adopted model criteria. Flag any failures.

SCENARIO: ${ctx.scenarioName}
Core logic: ${ctx.description}
Growth rate: ${ctx.growthRate} acres/year (adopted limit: 75 ac/yr)
Density: ${du} DU/acre (${ctx.density})
Through 2030: ~${ctx.acres} acres, ~${ctx.units.toLocaleString()} units, ~$${ctx.infraM}M infrastructure
Ag impact: ${ctx.agLand === 0 ? 'none' : ctx.agLand.toLocaleString() + ' acres'} (${ctx.agImpact})
${scorecardBlock}`;
}
