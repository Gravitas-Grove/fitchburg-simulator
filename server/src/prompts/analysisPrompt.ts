interface AnalysisContext {
  scenarioName: string;
  description: string;
  growthRate: number;
  density: string;
  acres: number;
  units: number;
  infraM: number;
  agLand: number;
  agImpact: string;
}

export function buildAnalysisPrompt(ctx: AnalysisContext): string {
  const du = ctx.density === 'low' ? 3 : ctx.density === 'high' ? 7.5 : 5;

  return `Provide a concise scenario analysis in exactly 3 paragraphs (no headers, no bullet points, no markdown).

SCENARIO: ${ctx.scenarioName}
Core logic: ${ctx.description}
Growth rate: ${ctx.growthRate} acres/year (Fitchburg's 2009 adopted limit was 75 ac/yr)
Density: ${du} dwelling units/acre (${ctx.density} density)
Through 2030: ~${ctx.acres} acres consumed, ~${ctx.units.toLocaleString()} new housing units, ~$${ctx.infraM}M infrastructure cost estimate
Prime Soil Class 1 farmland impacted: ${ctx.agLand === 0 ? 'none' : ctx.agLand.toLocaleString() + ' acres'}
Agricultural impact level: ${ctx.agImpact}

Paragraph 1: What this scenario achieves spatially and who benefits — developers, existing residents, farmers, transit users. Paragraph 2: Infrastructure and fiscal implications: infrastructure cost relative to other scenarios, gravity sewer serviceability, police/fire coverage radius, road network stress. Paragraph 3: Environmental, agricultural, and quality-of-life tradeoffs, specifically mentioning Nine Springs, prime ag soils, and watershed impacts. End with one crisp sentence scoring this scenario's alignment with Fitchburg's 2009 adopted criteria (75 ac/yr, stream buffers, rail preference, gravity sewer, ag protection).`;
}
