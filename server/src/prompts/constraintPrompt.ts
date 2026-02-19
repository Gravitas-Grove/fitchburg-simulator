interface ConstraintContext {
  scenarioName: string;
  growthRate: number;
  wetlandAcres: number;
  floodplainAcres: number;
  bufferViolations: number;
  primeAgAcres: number;
  gravitySeweredPct: number;
  transitPct: number;
  adoptedCriteria: {
    growthRatePass: boolean;
    streamBufferStatus: string;
    wetlandBufferStatus: string;
    railCorridorPreference: string;
    agPreservation: string;
    gravitySewerPreference: string;
  };
}

export function buildConstraintPrompt(ctx: ConstraintContext): string {
  const violations: string[] = [];

  if (!ctx.adoptedCriteria.growthRatePass) {
    violations.push(`Growth rate (${ctx.growthRate} ac/yr) EXCEEDS adopted limit of 75 ac/yr`);
  }
  if (ctx.adoptedCriteria.streamBufferStatus === 'fail') {
    violations.push(`${ctx.bufferViolations} stream buffer violations (75' minimum per WI NR 115)`);
  }
  if (ctx.adoptedCriteria.wetlandBufferStatus === 'fail') {
    violations.push(`Wetland encroachment: ${ctx.wetlandAcres} acres impacted (75' buffer required within USA, 300' outside)`);
  }
  if (ctx.floodplainAcres > 0) {
    violations.push(`${ctx.floodplainAcres} acres of FEMA 100-year floodplain encroachment`);
  }
  if (ctx.primeAgAcres > 500) {
    violations.push(`${ctx.primeAgAcres} acres of Class 1 prime agricultural soil conversion (high impact)`);
  }

  const violationBlock = violations.length > 0
    ? `ACTIVE VIOLATIONS:\n${violations.map((v, i) => `${i + 1}. ${v}`).join('\n')}`
    : 'No active constraint violations detected.';

  return `Analyze constraint compliance for the "${ctx.scenarioName}" scenario.

${violationBlock}

ADOPTED CRITERIA STATUS:
| Criterion | Status | Detail |
|-----------|--------|--------|
| Growth rate ≤75 ac/yr | ${ctx.adoptedCriteria.growthRatePass ? 'PASS' : 'FAIL'} | ${ctx.growthRate} ac/yr |
| Stream buffers (75') | ${ctx.adoptedCriteria.streamBufferStatus.toUpperCase()} | ${ctx.bufferViolations} violations |
| Wetland buffers | ${ctx.adoptedCriteria.wetlandBufferStatus.toUpperCase()} | ${ctx.wetlandAcres} ac overlap |
| Rail corridor preference | ${ctx.adoptedCriteria.railCorridorPreference.toUpperCase()} | Transit proximity: ${(ctx.transitPct * 100).toFixed(0)}% |
| Ag preservation | ${ctx.adoptedCriteria.agPreservation.toUpperCase()} | ${ctx.primeAgAcres} ac prime soil |
| Gravity sewer | ${ctx.adoptedCriteria.gravitySewerPreference.toUpperCase()} | ${(ctx.gravitySeweredPct * 100).toFixed(0)}% gravity-fed |

For each violation or warning:
1. Explain the regulatory/planning basis
2. Quantify the severity
3. Suggest specific remediation actions (polygon adjustments, density changes, mitigation measures)

For passing criteria, briefly confirm compliance and note any margins.`;
}
