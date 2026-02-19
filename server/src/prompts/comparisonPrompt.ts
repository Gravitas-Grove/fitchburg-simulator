interface ScenarioSummary {
  name: string;
  grade: string;
  score: number;
  fiscal: { grade: string; score: number };
  environmental: { grade: string; score: number };
  social: { grade: string; score: number };
  transportation: { grade: string; score: number };
}

export function buildComparisonPrompt(scenarios: ScenarioSummary[]): string {
  const rows = scenarios
    .map(
      (s) =>
        `| ${s.name} | ${s.grade} (${s.score}) | ${s.fiscal.grade} (${s.fiscal.score}) | ${s.environmental.grade} (${s.environmental.score}) | ${s.social.grade} (${s.social.score}) | ${s.transportation.grade} (${s.transportation.score}) |`
    )
    .join('\n');

  return `Compare these growth scenarios for Fitchburg. Produce a structured analysis with:

### Comparison Matrix
Re-present and analyze this data:

| Scenario | Overall | Fiscal | Environmental | Social | Transport |
|----------|---------|--------|---------------|--------|-----------|
${rows}

### Dimension Rankings
For each dimension, rank the scenarios from best to worst and explain why.

### Pareto Analysis
Identify which scenarios are Pareto-optimal (not dominated in all dimensions by another). Which scenarios offer the best tradeoff profiles?

### Recommendation Framework
Don't pick a winner — instead, map scenarios to decision-maker priorities:
- If fiscal efficiency is the top priority → recommend which
- If environmental protection is paramount → recommend which
- If housing production matters most → recommend which
- If balanced approach is desired → recommend which

Be specific with numbers. Reference Fitchburg geography and the 2009 adopted criteria.`;
}
