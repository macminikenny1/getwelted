/**
 * Leather Database
 * Comprehensive knowledge of leather types, tanning methods, and care properties.
 */

export type TanningMethod =
  | 'chrome_tanned'
  | 'veg_tanned'
  | 'combination_tanned'
  | 'brain_tanned'
  | 'alum_tanned'
  | 'unknown';

export type LeatherSurface =
  | 'smooth_grain'
  | 'pull_up'
  | 'roughout'
  | 'suede'
  | 'nubuck'
  | 'cordovan'
  | 'waxed_flesh';

export interface LeatherProfile {
  id: string;
  displayName: string;
  tannery?: string;
  tanningMethod: TanningMethod;
  surface: LeatherSurface;
  oilContent: 'low' | 'medium' | 'high';
  waterResistance: 'low' | 'medium' | 'high';
  darkeningRisk: 'low' | 'medium' | 'high';
  scratchVisibility: 'low' | 'medium' | 'high';
  selfHealing: boolean;
  description: string;
  careNotes: string[];
}

export const LEATHER_DATABASE: LeatherProfile[] = [
  {
    id: 'chromexcel',
    displayName: 'Chromexcel (CXL)',
    tannery: 'Horween Leather Co.',
    tanningMethod: 'combination_tanned',
    surface: 'pull_up',
    oilContent: 'high',
    waterResistance: 'medium',
    darkeningRisk: 'high',
    scratchVisibility: 'high',
    selfHealing: true,
    description: "Horween's combination-tanned pull-up leather. Hot-stuffed with beef tallow, lanolin, and beeswax. The most popular heritage boot leather — scratches buff out, develops rich pull-up patina.",
    careNotes: [
      'Scratches buff out due to high oil/wax content — use your thumb or a cloth',
      'Over-conditioning is the #1 mistake — it is already heavily stuffed',
      'Neatsfoot oil and Obenauf\'s will darken it permanently',
      'The pull-up color change when flexed is normal and desirable',
      'Avoid silicone-based products — they clog the pores',
    ],
  },
  {
    id: 'seidel_1964',
    displayName: 'Seidel 1964',
    tannery: 'Seidel Tanning Corp. (Milwaukee, est. 1945)',
    tanningMethod: 'combination_tanned',
    surface: 'pull_up',
    oilContent: 'high',
    waterResistance: 'high',
    darkeningRisk: 'high',
    scratchVisibility: 'medium',
    selfHealing: true,
    description: "Combination-tanned (chrome + veg re-tanned) oil leather by Seidel Tanning Corp. Developed with Nick's Boots over two years to replicate vintage work boot leather. Starts pale and darkens dramatically with wear. Considered by many to be the toughest work boot leather available.",
    careNotes: [
      'Starts very light — darkening with wear and minimal product is the intended experience',
      'High oil content from hot-stuffing — over-conditioning will accelerate darkening rapidly',
      'Pull-up effects (color change at flex points) are normal and desirable',
      'Roughout versions accumulate dirt into the nap for a rugged aged look',
      "Obenauf's is excellent for waterproofing without over-softening",
      "Nick's Boot Cream is the brand-recommended product if you want to stay in-family",
    ],
  },
  {
    id: 'seidel_1964_roughout',
    displayName: 'Seidel 1964 Roughout',
    tannery: 'Seidel Tanning Corp. (Milwaukee, est. 1945)',
    tanningMethod: 'combination_tanned',
    surface: 'roughout',
    oilContent: 'high',
    waterResistance: 'high',
    darkeningRisk: 'high',
    scratchVisibility: 'low',
    selfHealing: true,
    description: "Seidel 1964 used flesh-side out. Gets all the toughness and oil content of 1964 with a rugged roughout nap. Starts pale, darkens and flattens dramatically at wear points. One of the most durable roughouts available.",
    careNotes: [
      'Never use smooth leather creams or conditioners — ruins the nap',
      'Use a brass or nylon suede brush to maintain the nap',
      'Very high oil content — needs minimal conditioning',
      "Obenauf's is the right product if weatherproofing is needed",
      'Darkens aggressively with any oil product — use sparingly',
    ],
  },
  {
    id: 'shell_cordovan',
    displayName: 'Shell Cordovan',
    tannery: 'Horween Leather Co.',
    tanningMethod: 'veg_tanned',
    surface: 'cordovan',
    oilContent: 'medium',
    waterResistance: 'medium',
    darkeningRisk: 'low',
    scratchVisibility: 'medium',
    selfHealing: false,
    description: "Not technically leather — it's the fibrous flat muscle (shell) from the hindquarters of a horse. Tanned by Horween over 6 months. No grain, rolls instead of creasing. Develops a mirror-like luster with age.",
    careNotes: [
      'NEVER use neatsfoot oil, mink oil, or Obenauf\'s — damages the fiber structure permanently',
      'Only use cordovan-specific products: Saphir Renovateur, Alden Cordovan Cream',
      'Over-conditioning kills the luster — condition 2-3x per year maximum',
      'Rolling creases are normal — never try to iron or flatten them',
      'High-speed horsehair buffing is the best thing you can do for shell',
    ],
  },
  {
    id: 'roughout',
    displayName: 'Roughout',
    tanningMethod: 'chrome_tanned',
    surface: 'roughout',
    oilContent: 'medium',
    waterResistance: 'medium',
    darkeningRisk: 'high',
    scratchVisibility: 'low',
    selfHealing: false,
    description: 'Full-grain leather used flesh-side out, creating a suede-like nap. Common in work and heritage boots. Highly durable and surprisingly weather-resistant. Patinas by flattening and darkening at wear points.',
    careNotes: [
      'Never use smooth leather conditioners — they flatten the nap permanently',
      'Use a brass or nylon suede brush to maintain the nap',
      "Obenauf's will darken and flatten roughout — only use if that's your intent",
      'A suede eraser removes scuffs without product',
    ],
  },
  {
    id: 'waxed_flesh',
    displayName: 'Waxed Flesh / Waxed Roughout',
    tanningMethod: 'chrome_tanned',
    surface: 'waxed_flesh',
    oilContent: 'high',
    waterResistance: 'high',
    darkeningRisk: 'medium',
    scratchVisibility: 'low',
    selfHealing: true,
    description: "Roughout leather impregnated with wax during tanning. Used by Nick's, White's, and Wesco. Extremely durable and weather-resistant. Scratches and scuffs largely self-heal.",
    careNotes: [
      'The wax content makes it largely self-maintaining',
      'Scratches and scuffs buff out or heal on their own',
      'Needs very little conditioning — the wax does the work',
      "Obenauf's replenishes the wax layer when needed",
    ],
  },
  {
    id: 'cxl_roughout',
    displayName: 'Chromexcel Roughout',
    tannery: 'Horween Leather Co.',
    tanningMethod: 'combination_tanned',
    surface: 'roughout',
    oilContent: 'high',
    waterResistance: 'medium',
    darkeningRisk: 'high',
    scratchVisibility: 'low',
    selfHealing: true,
    description: "Chromexcel used flesh-side out. Gets all the durability and oil content of CXL with a matte roughout look. Develops unique patina as the nap flattens with wear.",
    careNotes: [
      'Has the high oil content of CXL but needs nap-specific tools',
      'Use a suede brush — never smooth leather conditioners initially',
      "Can use light Obenauf's to develop a hybrid smooth/matte look intentionally",
      'Self-healing like standard CXL once the nap flattens with wear',
    ],
  },
  {
    id: 'harness',
    displayName: 'Harness Leather',
    tanningMethod: 'veg_tanned',
    surface: 'smooth_grain',
    oilContent: 'medium',
    waterResistance: 'medium',
    darkeningRisk: 'medium',
    scratchVisibility: 'medium',
    selfHealing: false,
    description: 'Heavy veg-tanned leather, traditionally used for horse harnesses. Firm and structured, develops a rich patina over decades. Used by Red Wing, Whites, and others.',
    careNotes: [
      'Veg tanned leather needs conditioning — it will dry and crack without it',
      'Develops excellent patina over time with proper care',
      'Responds well to neatsfoot oil for darkening and conditioning',
      "Obenauf's is excellent for waterproofing harness leather",
    ],
  },
  {
    id: 'latigo',
    displayName: 'Latigo',
    tanningMethod: 'combination_tanned',
    surface: 'smooth_grain',
    oilContent: 'high',
    waterResistance: 'high',
    darkeningRisk: 'medium',
    scratchVisibility: 'medium',
    selfHealing: false,
    description: 'Combination-tanned leather (chrome + alum + veg) with high oil content and natural water resistance. Used in work boots and quality casual footwear.',
    careNotes: [
      "Already has high oil content — don't over-condition",
      "Naturally water-resistant but benefits from periodic Obenauf's treatment",
      'Develops a rich, consistent patina over time',
    ],
  },
  {
    id: 'veg_natural',
    displayName: 'Natural / Veg Tan',
    tanningMethod: 'veg_tanned',
    surface: 'smooth_grain',
    oilContent: 'low',
    waterResistance: 'low',
    darkeningRisk: 'high',
    scratchVisibility: 'high',
    selfHealing: false,
    description: 'Vegetable-tanned leather in its natural state. Stiff when new, softens dramatically with wear. Darkens significantly with oils and exposure to elements.',
    careNotes: [
      'Most sensitive leather to oils and products — darkens very quickly',
      'Needs conditioning more than chrome-tanned leathers',
      'Will darken dramatically with neatsfoot or mink oil',
      'Water spots easily — treat with waterproofing before first wear',
    ],
  },
  {
    id: 'bison',
    displayName: 'Bison Leather',
    tanningMethod: 'combination_tanned',
    surface: 'smooth_grain',
    oilContent: 'high',
    waterResistance: 'medium',
    darkeningRisk: 'medium',
    scratchVisibility: 'high',
    selfHealing: false,
    description: "North American bison hide — larger grain pattern than cow leather, very thick and highly durable. Popular in premium work and heritage boots. Has a distinctive pebbled texture that becomes more pronounced with age.",
    careNotes: [
      'Larger grain than cow leather — absorbs conditioner more readily',
      'The pebbled grain texture is permanent and desirable — work product into the grain',
      'Conditioner absorbs quickly due to open grain structure — use moderate amounts',
      'Develops a unique patina that highlights the grain pattern over time',
    ],
  },
  {
    id: 'suede',
    displayName: 'Suede',
    tanningMethod: 'chrome_tanned',
    surface: 'suede',
    oilContent: 'low',
    waterResistance: 'low',
    darkeningRisk: 'high',
    scratchVisibility: 'low',
    selfHealing: false,
    description: 'Split leather with a soft nap. Lighter and more supple than roughout. Less durable but popular in casual and chukka styles.',
    careNotes: [
      'Very sensitive to water — treat with waterproof spray before first wear',
      'Never use smooth leather conditioners or oils — ruins the nap',
      'Suede brush and eraser are your main tools',
      'Dry suede completely before brushing — brushing wet suede damages the nap',
    ],
  },
  {
    id: 'nubuck',
    displayName: 'Nubuck',
    tanningMethod: 'chrome_tanned',
    surface: 'nubuck',
    oilContent: 'low',
    waterResistance: 'low',
    darkeningRisk: 'high',
    scratchVisibility: 'medium',
    selfHealing: false,
    description: 'Top-grain leather buffed to create a velvety surface. More durable than suede but similar care requirements.',
    careNotes: [
      'Same nap-care rules as suede — no smooth leather products',
      'More durable than suede but still water-sensitive',
      'Nubuck eraser for scuffs, nubuck brush for maintenance',
    ],
  },
];

export function identifyLeather(
  leatherType: string | null,
  brand?: string | null,
  model?: string | null
): LeatherProfile {
  if (!leatherType) return getGeneralProfile();

  const t = leatherType.toLowerCase();
  const b = (brand ?? '').toLowerCase();

  if (t.includes('shell') || t.includes('cordovan')) {
    return LEATHER_DATABASE.find(l => l.id === 'shell_cordovan')!;
  }
  if ((t.includes('1964') || t.includes('seidel')) && (t.includes('roughout') || t.includes('rough out'))) {
    return LEATHER_DATABASE.find(l => l.id === 'seidel_1964_roughout')!;
  }
  if (t.includes('1964') || t.includes('seidel')) {
    return LEATHER_DATABASE.find(l => l.id === 'seidel_1964')!;
  }
  if ((t.includes('chromexcel') || t.includes('cxl')) && t.includes('roughout')) {
    return LEATHER_DATABASE.find(l => l.id === 'cxl_roughout')!;
  }
  if (t.includes('chromexcel') || t.includes('cxl') || t.includes('chrome excel')) {
    return LEATHER_DATABASE.find(l => l.id === 'chromexcel')!;
  }
  if ((t.includes('waxed') && (t.includes('flesh') || t.includes('roughout'))) ||
      ((b.includes('nick') || b.includes('white') || b.includes('wesco')) && t.includes('roughout'))) {
    return LEATHER_DATABASE.find(l => l.id === 'waxed_flesh')!;
  }
  if (t.includes('roughout') || t.includes('rough out')) {
    return LEATHER_DATABASE.find(l => l.id === 'roughout')!;
  }
  if (t.includes('suede')) {
    return LEATHER_DATABASE.find(l => l.id === 'suede')!;
  }
  if (t.includes('nubuck')) {
    return LEATHER_DATABASE.find(l => l.id === 'nubuck')!;
  }
  if (t.includes('latigo')) {
    return LEATHER_DATABASE.find(l => l.id === 'latigo')!;
  }
  if (t.includes('bison') || t.includes('buffalo')) {
    return LEATHER_DATABASE.find(l => l.id === 'bison')!;
  }
  if (t.includes('harness') || t.includes('waxed')) {
    return LEATHER_DATABASE.find(l => l.id === 'harness')!;
  }
  if (t.includes('natural') || t.includes('veg tan') || t.includes('vegetable') || t.includes('undyed')) {
    return LEATHER_DATABASE.find(l => l.id === 'veg_natural')!;
  }
  if (b.includes('nick') || b.includes('white') || b.includes('wesco')) {
    return LEATHER_DATABASE.find(l => l.id === 'waxed_flesh')!;
  }

  return getGeneralProfile();
}

function getGeneralProfile(): LeatherProfile {
  return {
    id: 'general',
    displayName: 'Smooth Leather',
    tanningMethod: 'unknown',
    surface: 'smooth_grain',
    oilContent: 'medium',
    waterResistance: 'medium',
    darkeningRisk: 'medium',
    scratchVisibility: 'medium',
    selfHealing: false,
    description: 'Smooth finished leather. General care principles apply.',
    careNotes: [
      'Condition regularly to prevent drying and cracking',
      'Test any product on a hidden area first',
      'Always clean before conditioning',
    ],
  };
}
