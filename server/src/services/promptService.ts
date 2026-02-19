export type IntentType = 'chat' | 'analysis' | 'comparison' | 'constraint' | 'stakeholder' | 'whatif';

const INTENT_PATTERNS: { intent: IntentType; patterns: RegExp[] }[] = [
  {
    intent: 'comparison',
    patterns: [
      /compare/i, /versus/i, /\bvs\.?\b/i, /which.*(better|best|worst)/i,
      /rank.*scenario/i, /all.*scenario/i, /side.?by.?side/i,
    ],
  },
  {
    intent: 'analysis',
    patterns: [
      /analyze/i, /analysis/i, /deep.?dive/i, /detailed/i,
      /full.?report/i, /comprehensive/i, /assess/i,
    ],
  },
  {
    intent: 'constraint',
    patterns: [
      /constraint/i, /violation/i, /compliance/i, /buffer/i,
      /wetland.*impact/i, /floodplain/i, /regulat/i, /NR.?115/i,
      /adopted.*criteria/i, /pass.*fail/i,
    ],
  },
  {
    intent: 'stakeholder',
    patterns: [
      /stakeholder/i, /who.*benefit/i, /who.*affected/i, /who.*impact/i,
      /developer.*perspective/i, /farmer.*think/i, /resident.*feel/i,
      /community.*impact/i,
    ],
  },
  {
    intent: 'whatif',
    patterns: [
      /what.?if/i, /what.*happen.*if/i, /suppose/i, /hypothetical/i,
      /sensitivity/i, /change.*density/i, /change.*growth/i,
      /increase.*rate/i, /decrease.*rate/i, /double/i, /half/i,
    ],
  },
];

export function detectIntent(message: string): IntentType {
  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some((p) => p.test(message))) {
      return intent;
    }
  }
  return 'chat';
}
