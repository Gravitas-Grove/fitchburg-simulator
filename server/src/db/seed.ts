import { initDb, getDb } from './index.js';
import { scenarios } from './schema.js';

// Same polygon generators as the client
function circle(lat: number, lng: number, r: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    pts.push([lng + r * 0.75 * Math.cos(a), lat + r * Math.sin(a)]);
  }
  return pts;
}

function railPoly(w: number): [number, number][] {
  return [
    [-89.548,43.025-w],[-89.540,43.040-w],[-89.520,43.055-w],
    [-89.500,43.065-w],[-89.478,43.070-w],[-89.455,43.068-w],
    [-89.430,43.055-w],[-89.410,43.038-w],[-89.398,43.015-w],
    [-89.398,43.015+w],[-89.410,43.038+w],[-89.430,43.055+w],
    [-89.455,43.068+w],[-89.478,43.070+w],[-89.500,43.065+w],
    [-89.520,43.055+w],[-89.540,43.040+w],[-89.548,43.025+w],
    [-89.548,43.025-w],
  ];
}

function scaleFromCenter(poly: [number, number][], center: [number, number], scale: number): [number, number][] {
  return poly.map(([lng, lat]) => [
    center[1] + (lng - center[1]) * scale,
    center[0] + (lat - center[0]) * scale,
  ]);
}

function utilitySewer(s: number): [number, number][] {
  const base: [number, number][] = [
    [-89.555,43.005],[-89.548,42.965],[-89.528,42.948],[-89.500,42.940],
    [-89.468,42.945],[-89.440,42.958],[-89.418,42.978],[-89.405,43.005],
    [-89.410,43.030],[-89.430,43.048],[-89.460,43.058],[-89.492,43.058],
    [-89.522,43.048],[-89.545,43.030],[-89.555,43.005],
  ];
  return scaleFromCenter(base, [43.005, -89.480], s);
}

function agPreserve(s: number): [number, number][] {
  const base: [number, number][] = [
    [-89.542,43.042],[-89.528,43.058],[-89.508,43.068],[-89.482,43.072],
    [-89.458,43.068],[-89.435,43.055],[-89.415,43.038],[-89.405,43.015],
    [-89.408,42.992],[-89.425,42.978],[-89.452,42.972],[-89.485,42.975],
    [-89.515,42.982],[-89.538,42.998],[-89.548,43.020],[-89.542,43.042],
  ];
  return scaleFromCenter(base, [43.022, -89.477], s);
}

function infillPoly(s: number): [number, number][] {
  const base: [number, number][] = [
    [-89.522,43.044],[-89.508,43.052],[-89.488,43.054],[-89.468,43.050],
    [-89.450,43.040],[-89.440,43.022],[-89.444,43.003],[-89.458,42.994],
    [-89.480,42.990],[-89.502,42.993],[-89.518,43.003],[-89.527,43.022],
    [-89.522,43.044],
  ];
  return scaleFromCenter(base, [43.022, -89.483], s);
}

function resourcePoly(s: number): [number, number][] {
  const base: [number, number][] = [
    [-89.552,43.052],[-89.530,43.065],[-89.505,43.070],[-89.475,43.068],
    [-89.448,43.055],[-89.422,43.038],[-89.408,43.010],[-89.412,42.982],
    [-89.435,42.962],[-89.465,42.955],[-89.498,42.958],[-89.528,42.972],
    [-89.548,42.995],[-89.556,43.025],[-89.552,43.052],
  ];
  return scaleFromCenter(base, [43.015, -89.480], s);
}

const SEED_SCENARIOS = [
  {
    id: 'fuda-lateral', name: 'FUDA Lateral Growth', subtitle: 'Extends from existing city edge',
    color: '#e87a2a', icon: '→',
    poly2030: [[-89.546,42.943],[-89.414,42.943],[-89.414,42.976],[-89.546,42.976],[-89.546,42.943]],
    poly2060: [[-89.555,42.900],[-89.400,42.900],[-89.400,42.976],[-89.555,42.976],[-89.555,42.900]],
    infraMult: 1.2, agAcres: 820, agImpact: 'high',
    description: 'Lateral expansion outward from the existing Urban Service Area in all directions. Follows path of least resistance but consumes significant agricultural land on the southern fringe near the active farm operations south of McKee Road.',
  },
  {
    id: 'concentric', name: 'Concentric Growth', subtitle: 'From Fish Hatchery & Lacy center',
    color: '#9b59b6', icon: '◎',
    poly2030: circle(43.003, -89.520, 0.021), poly2060: circle(43.003, -89.520, 0.040),
    infraMult: 1.1, agAcres: 540, agImpact: 'medium',
    description: "Radial growth centered at Fish Hatchery Road and Lacy Road intersection — Fitchburg's geographic and commercial core.",
  },
  {
    id: 'rail-corridor', name: 'Rail Corridor / TOD', subtitle: 'Transit-oriented, along rail line',
    color: '#e05050', icon: '▬',
    poly2030: railPoly(0.012), poly2060: railPoly(0.022),
    infraMult: 0.85, agAcres: 180, agImpact: 'low',
    description: "Development concentrated within ~1 mile of the rail corridor running northeast toward Madison.",
  },
  {
    id: 'utility-service', name: 'Utility Service / Gravity Sewer', subtitle: 'Lowest infrastructure cost zones',
    color: '#27ae60', icon: '⌀',
    poly2030: utilitySewer(0.85), poly2060: utilitySewer(1.0),
    infraMult: 0.75, agAcres: 410, agImpact: 'medium',
    description: "Growth restricted to areas serviceable by gravity sewer, avoiding expensive lift stations.",
  },
  {
    id: 'ag-preservation', name: 'Agricultural Preservation', subtitle: 'Avoids Soil Class 1 prime farmland',
    color: '#7aad4a', icon: '◌',
    poly2030: agPreserve(0.85), poly2060: agPreserve(1.0),
    infraMult: 1.3, agAcres: 95, agImpact: 'very low',
    description: 'Development steered away from prime agricultural soils (Class 1).',
  },
  {
    id: 'infill', name: 'Redevelopment / Infill', subtitle: 'Inward focus, existing footprint',
    color: '#e8a830', icon: '▣',
    poly2030: infillPoly(0.85), poly2060: infillPoly(1.0),
    infraMult: 0.6, agAcres: 0, agImpact: 'none',
    description: 'Focuses on redevelopment of underutilized parcels and infill development within the existing Urban Service Area.',
  },
  {
    id: 'resource-based', name: 'Resource Based', subtitle: 'Respects watershed boundaries',
    color: '#1abc9c', icon: '〜',
    poly2030: resourcePoly(0.85), poly2060: resourcePoly(1.0),
    infraMult: 1.05, agAcres: 260, agImpact: 'medium-low',
    description: "Growth shaped around the Nine Springs, Badger Mill Creek, Swan Creek, and Murphy's Creek watershed boundaries.",
  },
];

async function seed() {
  await initDb();
  const db = getDb();

  for (const s of SEED_SCENARIOS) {
    db.insert(scenarios).values({
      id: s.id,
      name: s.name,
      subtitle: s.subtitle,
      description: s.description,
      color: s.color,
      icon: s.icon,
      isBuiltIn: true,
      poly2030: s.poly2030 as [number, number][],
      poly2060: s.poly2060 as [number, number][],
      infraMult: s.infraMult,
      agAcres: s.agAcres,
      agImpact: s.agImpact,
    }).onConflictDoNothing().run();
  }

  console.log('[seed] Seeded 7 built-in scenarios');
}

seed().catch(console.error);
