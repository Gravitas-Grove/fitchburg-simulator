interface StakeholderContext {
  scenarioName: string;
  description: string;
  overallGrade: string;
  units: number;
  affordablePct: number;
  agAcres: number;
  transitPct: number;
  infraCostPerUnit: number;
  costToServe: number;
}

export function buildStakeholderPrompt(ctx: StakeholderContext): string {
  return `Analyze the "${ctx.scenarioName}" scenario from the perspective of 6 key stakeholder groups. For each group, assess impact as Positive/Mixed/Negative and explain why.

SCENARIO DATA:
- Overall grade: ${ctx.overallGrade}
- ${ctx.units.toLocaleString()} new housing units
- ${(ctx.affordablePct * 100).toFixed(0)}% affordable (≤80% AMI)
- ${ctx.agAcres.toLocaleString()} acres prime ag land impacted
- ${(ctx.transitPct * 100).toFixed(0)}% within ½mi of transit
- $${Math.round(ctx.infraCostPerUnit).toLocaleString()}/unit infrastructure cost
- ${ctx.costToServe.toFixed(2)} cost-to-serve ratio

Use this format:

### Developers
**Impact: [Positive/Mixed/Negative]**
[2-3 sentences on lot availability, infrastructure cost, market appeal]

### Existing Residents
**Impact: [Positive/Mixed/Negative]**
[2-3 sentences on tax burden, service levels, neighborhood character]

### Farmers
**Impact: [Positive/Mixed/Negative]**
[2-3 sentences on land conversion pressure, right-to-farm, property tax]

### Transit Users
**Impact: [Positive/Mixed/Negative]**
[2-3 sentences on transit accessibility, ridership potential, VMT]

### Environmental Advocates
**Impact: [Positive/Mixed/Negative]**
[2-3 sentences on wetlands, water quality, impervious surface, green space]

### Fiscal Conservatives
**Impact: [Positive/Mixed/Negative]**
[2-3 sentences on cost-to-serve, debt capacity, tax rate implications]

Be specific to Fitchburg — reference real geography and the 2009 adopted criteria.`;
}
