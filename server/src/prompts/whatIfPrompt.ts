interface WhatIfContext {
  scenarioName: string;
  currentGrowthRate: number;
  currentDensity: string;
  currentUnits: number;
  currentInfraM: number;
  currentGrade: string;
  question: string;
}

export function buildWhatIfPrompt(ctx: WhatIfContext): string {
  return `The user is asking a "what if" question about the "${ctx.scenarioName}" scenario.

CURRENT PARAMETERS:
- Growth rate: ${ctx.currentGrowthRate} ac/yr
- Density: ${ctx.currentDensity} (${ctx.currentDensity === 'low' ? '3' : ctx.currentDensity === 'high' ? '7.5' : '5'} DU/ac)
- Projected units: ${ctx.currentUnits.toLocaleString()}
- Infrastructure cost: $${ctx.currentInfraM}M
- Overall grade: ${ctx.currentGrade}

USER QUESTION: "${ctx.question}"

Provide a sensitivity analysis:
1. Identify which parameter(s) the user is asking about changing
2. Show the impact using a before/after comparison table
3. Explain how the grade and key metrics would shift
4. Note any threshold crossings (e.g., exceeding the 75 ac/yr adopted limit)
5. Recommend the optimal parameter range if applicable

Use specific numbers. Show tables where helpful. Keep it concise but data-rich.`;
}
