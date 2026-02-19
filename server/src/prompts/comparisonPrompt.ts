export function buildComparisonPrompt(scenario1: string, scenario2: string): string {
  return `Compare the "${scenario1}" and "${scenario2}" growth scenarios for Fitchburg. In 2-3 paragraphs, cover:
1. How they differ in spatial footprint and land use impact
2. Infrastructure cost and fiscal efficiency comparison
3. Which better aligns with Fitchburg's 2009 adopted growth criteria

Be specific about tradeoffs. Don't declare a winner — present the tradeoffs so decision-makers can weigh their own priorities.`;
}
