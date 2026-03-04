/**
 * Care Advisor - Knowledge base for leather boot maintenance
 * Generates personalized care routines based on leather type + user goals
 */

import { identifyLeather, type LeatherProfile } from './leatherDatabase';

export type CareGoal =
  | 'patina'      // Build character & patina — let it age beautifully
  | 'pristine'    // Keep looking new — minimize marks, maintain color
  | 'darken'      // Deepen the color — richer, darker tone
  | 'protect'     // Weather protection — repel water & elements
  | 'restore';    // Restore dry/neglected leather

export interface CareGoalOption {
  id: CareGoal;
  label: string;
  description: string;
  emoji: string;
}

export const CARE_GOALS: CareGoalOption[] = [
  { id: 'patina',   emoji: '🌿', label: 'Build Character',     description: 'Let it age naturally — develop rich patina over time' },
  { id: 'pristine', emoji: '✨', label: 'Keep It Pristine',    description: 'Minimize marks, maintain original color & look' },
  { id: 'darken',   emoji: '🟤', label: 'Deepen the Color',    description: 'Richer, darker tone — feed the leather heavily' },
  { id: 'protect',  emoji: '🌧️', label: 'Weather Protection',  description: 'Repel water, mud & elements for daily wear' },
  { id: 'restore',  emoji: '🔧', label: 'Restore & Revive',    description: 'Bring life back to dry, neglected, or stiff leather' },
];

export interface CareStep {
  step: number;
  title: string;
  detail: string;
  frequency: string;
  products: string[];
}

export interface CareRoutine {
  summary: string;
  warning?: string;
  steps: CareStep[];
  proTip: string;
}

// Map leather profile surface/id to routine category key
function getRoutineCategory(profile: LeatherProfile): string {
  if (profile.id === 'shell_cordovan') return 'shell';
  // Nap leathers — never recommend creams or smooth leather conditioners
  if (profile.surface === 'roughout' || profile.surface === 'waxed_flesh' ||
      profile.surface === 'suede' || profile.surface === 'nubuck') return 'roughout';
  // Seidel 1964 roughout gets roughout routines; smooth 1964 gets CXL routines
  if (profile.id === 'seidel_1964_roughout') return 'roughout';
  if (profile.id === 'seidel_1964' || profile.id === 'chromexcel' || profile.id === 'cxl_roughout') return 'cxl';
  if (profile.id === 'harness' || profile.id === 'latigo' || profile.id === 'veg_natural') return 'waxed';
  return 'general';
}

type RoutineMap = Record<string, Record<string, CareRoutine>>;

const ROUTINES: RoutineMap = {

  cxl: {
    patina: {
      summary: 'Chromexcel is a pull-up leather — it wants to age. Minimal intervention lets the natural oils and beeswax do their thing.',
      steps: [
        { step: 1, title: 'Brush off dirt', detail: 'Use a horsehair brush after every wear. CXL attracts scuffs that buff right out.', frequency: 'After every wear', products: ['Horsehair brush'] },
        { step: 2, title: 'Condition lightly', detail: 'CXL is already heavily oiled by Horween. Condition only when the leather looks dry or loses its pull-up effect.', frequency: 'Every 3–6 months', products: ['Bick 4', 'Venetian Shoe Cream'] },
        { step: 3, title: 'Let it live', detail: 'Wear them hard. Every crease, scuff, and toe tap adds character. Resist the urge to over-condition.', frequency: 'Always', products: [] },
      ],
      proTip: 'The pull-up effect (lighter color where leather flexes) is CXL\'s signature. Buffing with your thumb warms the oils and evens it out — or leave it for character.',
    },
    pristine: {
      summary: 'CXL wants to patina — fighting it takes more work, but it\'s doable with the right products.',
      steps: [
        { step: 1, title: 'Brush after every wear', detail: 'Horsehair brush removes surface dirt before it sets.', frequency: 'After every wear', products: ['Horsehair brush'] },
        { step: 2, title: 'Condition with color-neutral product', detail: 'Bick 4 conditions without darkening. Avoid oils like neatsfoot — they darken CXL significantly.', frequency: 'Monthly', products: ['Bick 4'] },
        { step: 3, title: 'Buff scratches immediately', detail: 'CXL scratches buff out with a cloth or your thumb — do it while fresh.', frequency: 'As needed', products: ['Soft cloth'] },
      ],
      proTip: 'Never use Obenauf\'s or mink oil on CXL if you want to maintain color — they\'ll darken it noticeably and permanently.',
      warning: 'CXL is a pull-up leather — it will naturally develop some patina with wear no matter what. If you truly want zero aging, consider a wax-coated or corrected-grain leather instead.',
    },
    darken: {
      summary: 'CXL darkens beautifully and permanently with the right products. Once dark, it won\'t go back — commit to it.',
      steps: [
        { step: 1, title: 'Clean thoroughly', detail: 'Start fresh. Remove all old conditioner and surface dirt.', frequency: 'Once before starting', products: ['Leather cleaner', 'Horsehair brush'] },
        { step: 2, title: 'Apply neatsfoot oil', detail: 'Pure neatsfoot oil penetrates deep and darkens CXL dramatically. Apply thin coats, let absorb fully between coats.', frequency: 'Apply 2–3 coats over a week', products: ['Pure Neatsfoot Oil'] },
        { step: 3, title: 'Seal with Obenauf\'s', detail: 'Obenauf\'s Heavy Duty LP locks in the oil and adds a deep, dark finish with great weather protection.', frequency: 'Every 2–3 months after', products: ['Obenauf\'s Heavy Duty LP'] },
      ],
      proTip: 'Do a test patch on the heel first — CXL darkens unevenly sometimes. Build up gradually rather than one heavy coat.',
    },
    protect: {
      summary: 'CXL has natural weather resistance but can use a boost for heavy rain or outdoor use.',
      steps: [
        { step: 1, title: 'Clean and dry', detail: 'Never waterproof dirty leather. Clean first and let dry completely.', frequency: 'Before each treatment', products: ['Horsehair brush', 'Damp cloth'] },
        { step: 2, title: 'Apply Obenauf\'s', detail: 'Obenauf\'s Heavy Duty LP is the gold standard for waterproofing work-style boots. Warm it between your fingers first.', frequency: 'Every 2–3 months or before wet weather', products: ['Obenauf\'s Heavy Duty LP'] },
        { step: 3, title: 'Buff to finish', detail: 'Buff with a clean horsehair brush once absorbed to even out the finish.', frequency: 'After each treatment', products: ['Horsehair brush'] },
      ],
      proTip: 'Obenauf\'s will darken CXL slightly. If you want waterproofing without darkening, use a wax-based spray instead.',
      warning: 'Obenauf\'s darkens leather. If you\'re also trying to keep CXL pristine, use Bick 4 + a spray waterproofer instead.',
    },
    restore: {
      summary: 'Dry CXL loses its pull-up effect and looks flat. The fix is deep conditioning — CXL responds extremely well.',
      steps: [
        { step: 1, title: 'Clean thoroughly', detail: 'Remove old product buildup with a leather cleaner or saddle soap.', frequency: 'Once', products: ['Leather cleaner', 'Saddle soap'] },
        { step: 2, title: 'Deep condition with Leather Honey', detail: 'Leather Honey penetrates deep and is great for neglected leather. It will darken the boot significantly.', frequency: 'Apply generously, let sit overnight', products: ['Leather Honey'] },
        { step: 3, title: 'Follow with Venetian Cream', detail: 'Once absorbed, apply Venetian Shoe Cream to add surface nourishment and a healthy sheen.', frequency: '24 hours after step 2', products: ['Venetian Shoe Cream'] },
        { step: 4, title: 'Establish regular routine', detail: 'Condition every 1–2 months going forward to prevent it getting to this point again.', frequency: 'Ongoing', products: ['Bick 4'] },
      ],
      proTip: 'Severely dry CXL may look blotchy after the first treatment. A second coat usually evens it out as the leather rehydrates.',
    },
  },

  shell: {
    patina: {
      summary: 'Shell cordovan develops a unique rolling crease patina — very different from cow leather. It glows with age.',
      steps: [
        { step: 1, title: 'Brush after every wear', detail: 'Shell loves a brush. A quick horsehair brush session keeps the surface alive and builds the characteristic glow.', frequency: 'After every wear', products: ['Horsehair brush'] },
        { step: 2, title: 'Condition sparingly', detail: 'Shell has its own oils and over-conditioning is the #1 mistake. Use Saphir Renovateur 2–3x per year maximum.', frequency: 'Every 3–4 months', products: ['Saphir Renovateur', 'Alden Shell Cordovan Cream'] },
        { step: 3, title: 'Polish for glow', detail: 'Saphir Cordovan Wax Polish builds the mirror-like depth shell is known for.', frequency: 'Monthly', products: ['Saphir Cordovan Wax Polish'] },
      ],
      proTip: 'Shell cordovan "rolls" instead of creasing. Never try to iron out rolls — they\'re the signature of the leather.',
      warning: 'Never use Obenauf\'s, mink oil, or neatsfoot on shell cordovan — it can permanently damage the fiber structure.',
    },
    pristine: {
      summary: 'Shell naturally keeps a cleaner look than cow leather. Your job is to maintain the shine and protect the surface.',
      steps: [
        { step: 1, title: 'Brush religiously', detail: 'Daily brushing is the single best thing you can do for shell. It removes surface marks and builds luster.', frequency: 'After every wear', products: ['Horsehair brush'] },
        { step: 2, title: 'Buff out scuffs immediately', detail: 'Small scuffs on shell buff out with a cloth or fingers. Address them immediately before they set.', frequency: 'As needed', products: ['Soft cloth'] },
        { step: 3, title: 'Light wax polish', detail: 'Saphir Cordovan Wax Polish maintains the surface and adds protective layer.', frequency: 'Monthly', products: ['Saphir Cordovan Wax Polish'] },
        { step: 4, title: 'Condition 2x per year only', detail: 'Less is more with shell. Over-conditioning softens the fiber and kills the luster.', frequency: 'Twice per year', products: ['Alden Shell Cordovan Cream'] },
      ],
      proTip: 'Shell is one of the easiest leathers to maintain for a clean look — it just needs brushing and the occasional polish.',
    },
    darken: {
      summary: 'Shell darkens subtly with conditioning and polish but doesn\'t change dramatically — that\'s part of its character.',
      steps: [
        { step: 1, title: 'Apply Saphir Renovateur', detail: 'This conditions and adds depth. Darker shades of shell will deepen slightly with repeated use.', frequency: 'Monthly', products: ['Saphir Renovateur'] },
        { step: 2, title: 'Use a tinted cordovan polish', detail: 'Saphir Cordovan Wax in a darker shade will gradually deepen the color over time.', frequency: 'Monthly', products: ['Saphir Cordovan Wax Polish (color-matched)'] },
      ],
      proTip: 'Shell doesn\'t darken dramatically like CXL. If you want a significantly darker look, a professional cordovan dye is the route — but that\'s a one-way door.',
      warning: 'Never use regular oils (neatsfoot, mink) on shell cordovan trying to darken it — it will damage the leather permanently.',
    },
    protect: {
      summary: 'Shell is naturally somewhat water-resistant but benefits from protection on the welt and edges.',
      steps: [
        { step: 1, title: 'Focus on edges and welt', detail: 'Shell repels light rain well. The weak points are the welt seam and edges — treat those specifically.', frequency: 'Every 2–3 months', products: ['Saphir Renovateur'] },
        { step: 2, title: 'Apply cordovan cream', detail: 'Alden or Saphir cordovan cream adds a protective barrier appropriate for shell.', frequency: 'Monthly', products: ['Alden Shell Cordovan Cream'] },
      ],
      proTip: 'Avoid waterproofing sprays with silicone on shell — they can dull the finish. Stick to cream conditioners.',
      warning: 'Shell cordovan is not suited for heavy rain or mud. In genuinely wet conditions, reach for a different pair.',
    },
    restore: {
      summary: 'Dry shell loses its luster and the surface can become cloudy. Revival takes patience but shell responds beautifully.',
      steps: [
        { step: 1, title: 'Buff vigorously', detail: 'Start with just a horsehair brush and serious elbow grease. You\'d be surprised what friction alone can revive.', frequency: 'First step always', products: ['Horsehair brush'] },
        { step: 2, title: 'Apply Saphir Renovateur', detail: 'Work it in with fingers — body heat helps it penetrate. Let sit 30 minutes.', frequency: 'Once', products: ['Saphir Renovateur'] },
        { step: 3, title: 'Polish with cordovan wax', detail: 'Build the shine back up with Saphir Cordovan Wax, applied in thin coats.', frequency: 'After conditioning', products: ['Saphir Cordovan Wax Polish'] },
        { step: 4, title: 'Final buff', detail: 'High-speed horsehair buff to bring out the characteristic shell glow.', frequency: 'Final step', products: ['Horsehair brush'] },
      ],
      proTip: 'If the shell looks "waxy" or cloudy (bloom), that\'s dried conditioner on the surface. Buff it hard — it usually clears right up.',
    },
  },

  roughout: {
    patina: {
      summary: 'Roughout patinas differently — the nap flattens and darkens with wear, especially at flex points. Embrace it.',
      steps: [
        { step: 1, title: 'Brush regularly', detail: 'A stiff brass or nylon brush raises the nap and keeps roughout looking alive.', frequency: 'Weekly', products: ['Brass/nylon suede brush'] },
        { step: 2, title: 'Minimal conditioning', detail: 'If the leather feels dry, a very light application of Obenauf\'s or a roughout-safe conditioner is fine.', frequency: 'Every 6 months', products: ['Obenauf\'s Heavy Duty LP'] },
      ],
      proTip: 'The flattened, darkened areas where roughout flexes are the patina — resist brushing them aggressively if you want to keep that look.',
    },
    pristine: {
      summary: 'Keeping roughout looking fresh is about protecting the nap and keeping it raised.',
      steps: [
        { step: 1, title: 'Brush after every wear', detail: 'Always brush in one direction to keep the nap uniform and clean-looking.', frequency: 'After every wear', products: ['Brass/nylon suede brush'] },
        { step: 2, title: 'Use a suede eraser', detail: 'For scuffs or marks, a suede eraser removes surface blemishes without product.', frequency: 'As needed', products: ['Suede eraser'] },
        { step: 3, title: 'Protective spray', detail: 'Tarrago or Crep Protect spray seals the nap and repels water without changing the texture.', frequency: 'Every 2–3 months', products: ['Tarrago Nano Protector', 'Crep Protect'] },
      ],
      proTip: 'Never use smooth leather conditioners on roughout — they flatten the nap permanently and leave greasy spots.',
      warning: 'Roughout will always flatten somewhat with wear. This is normal and part of the leather\'s character.',
    },
    protect: {
      summary: 'Roughout is surprisingly durable but benefits greatly from a protective spray for wet conditions.',
      steps: [
        { step: 1, title: 'Clean with suede brush', detail: 'Remove dirt before any treatment.', frequency: 'Before each treatment', products: ['Brass/nylon suede brush'] },
        { step: 2, title: 'Apply waterproof spray', detail: 'Tarrago Nano Protector is the best option — it protects without changing the texture or color.', frequency: 'Every 2–3 months', products: ['Tarrago Nano Protector'] },
      ],
      proTip: 'If you\'re wearing roughout boots in heavy mud or standing water regularly, Obenauf\'s applied lightly will provide superior protection but will darken and flatten the nap.',
    },
    darken: {
      summary: 'Roughout darkens significantly and permanently with oils. The nap flattens too — know what you\'re committing to.',
      steps: [
        { step: 1, title: 'Apply Obenauf\'s Heavy Duty LP', detail: 'Work it into the roughout with fingers. It will darken and slightly flatten the nap, creating a unique look.', frequency: 'Initial treatment', products: ['Obenauf\'s Heavy Duty LP'] },
        { step: 2, title: 'Let absorb fully', detail: 'Let sit 24 hours before wearing. The leather will look very dark at first and lighten slightly as it dries.', frequency: 'After each application', products: [] },
      ],
      proTip: 'Some people deliberately "wax" their roughout with Obenauf\'s for a hybrid smooth/matte look. It\'s polarizing but intentional — do a test area first.',
      warning: 'Darkening roughout is permanent. The nap won\'t come back to its original texture after heavy oiling.',
    },
    restore: {
      summary: 'Dry roughout gets stiff and loses its texture. The fix is simple.',
      steps: [
        { step: 1, title: 'Brush out dried dirt', detail: 'Use a stiff brush to remove caked dirt before any conditioning.', frequency: 'First step', products: ['Brass/nylon suede brush'] },
        { step: 2, title: 'Condition with Obenauf\'s', detail: 'Work a small amount into the leather. Roughout absorbs product well when dry.', frequency: 'Once, then as needed', products: ['Obenauf\'s Heavy Duty LP'] },
        { step: 3, title: 'Brush to restore nap', detail: 'Once conditioner is absorbed (24h), brush vigorously to raise the nap.', frequency: 'After conditioning', products: ['Brass/nylon suede brush'] },
      ],
      proTip: 'Severely dried roughout may benefit from a light steam before conditioning — hold over a boiling kettle briefly to soften fibers, then condition immediately.',
    },
  },

  waxed: {
    patina: {
      summary: 'Harness and waxed leathers develop incredible depth with age — the wax builds up into a rich, uneven patina that\'s highly sought after.',
      steps: [
        { step: 1, title: 'Brush regularly', detail: 'Regular brushing works old product into the leather and builds depth.', frequency: 'Weekly', products: ['Horsehair brush'] },
        { step: 2, title: 'Condition with matching wax', detail: 'Red Wing Boot Cream or similar matches the wax content. Apply sparingly.', frequency: 'Every 2–3 months', products: ['Red Wing All Natural Boot Cream', 'Venetian Shoe Cream'] },
        { step: 3, title: 'Let wear marks accumulate', detail: 'Toe kicks, flex creases, and edge wear all add character to waxed leather. Don\'t buff them away.', frequency: 'Always', products: [] },
      ],
      proTip: 'Waxed leathers like Harness reward heavy use. The more you wear them, the better they look.',
    },
    pristine: {
      summary: 'Waxed leathers are low maintenance for a clean look — the wax coating is your friend.',
      steps: [
        { step: 1, title: 'Wipe down regularly', detail: 'A damp cloth removes surface dirt without disturbing the wax layer.', frequency: 'After every wear in dirty conditions', products: ['Damp cloth'] },
        { step: 2, title: 'Condition with Bick 4', detail: 'Keeps the leather supple without changing color or adding excessive shine.', frequency: 'Every 2 months', products: ['Bick 4'] },
        { step: 3, title: 'Rewax periodically', detail: 'Red Wing Boot Cream or neutral wax maintains the protective layer.', frequency: 'Every 3–4 months', products: ['Neutral boot cream'] },
      ],
      proTip: 'Harness leather is one of the more forgiving leathers to keep looking clean — the thick wax coating resists marks naturally.',
    },
    darken: {
      summary: 'Waxed leathers respond well to darkening with the right products.',
      steps: [
        { step: 1, title: 'Clean first', detail: 'Remove old product buildup to ensure even absorption.', frequency: 'Once before starting', products: ['Leather cleaner'] },
        { step: 2, title: 'Apply neatsfoot oil', detail: 'Pure neatsfoot penetrates and darkens waxed leathers noticeably.', frequency: 'Apply 1–2 coats', products: ['Pure Neatsfoot Oil'] },
        { step: 3, title: 'Follow with Obenauf\'s', detail: 'Seals the oil in and adds its own dark, rich color.', frequency: 'After oil absorbs', products: ['Obenauf\'s Heavy Duty LP'] },
      ],
      proTip: 'Waxed leathers darken very evenly — you\'ll get a consistent result without blotchy areas.',
    },
    protect: {
      summary: 'Waxed leather is naturally water-resistant. Maintaining that protection just means keeping the wax layer fresh.',
      steps: [
        { step: 1, title: 'Apply Obenauf\'s Heavy Duty LP', detail: 'This is the best waterproofing product for waxed/harness leathers. It replenishes the wax layer.', frequency: 'Every 2–3 months', products: ['Obenauf\'s Heavy Duty LP'] },
        { step: 2, title: 'Buff to seal', detail: 'Buff with a horsehair brush once absorbed to close the surface.', frequency: 'After application', products: ['Horsehair brush'] },
      ],
      proTip: 'If water stops beading on your waxed leather, it\'s time for a new coat of Obenauf\'s. That\'s your signal.',
    },
    restore: {
      summary: 'Waxed leathers get stiff and dry when the wax depletes. Easy to fix.',
      steps: [
        { step: 1, title: 'Clean with saddle soap', detail: 'Remove dirt and old product completely.', frequency: 'Once', products: ['Saddle soap'] },
        { step: 2, title: 'Deep condition with Leather Honey', detail: 'Penetrates deeply and restores suppleness. Will darken the leather.', frequency: 'Apply generously, let sit overnight', products: ['Leather Honey'] },
        { step: 3, title: 'Rewax with Obenauf\'s', detail: 'Rebuilds the protective wax layer after conditioning.', frequency: '24h after step 2', products: ['Obenauf\'s Heavy Duty LP'] },
      ],
      proTip: 'Severely dried harness leather can crack at flex points. If you see early cracking, address it immediately with this routine before it worsens.',
    },
  },

  general: {
    patina: {
      summary: 'Most smooth leathers develop beautiful patina with wear and minimal intervention.',
      steps: [
        { step: 1, title: 'Brush after every wear', detail: 'Removes surface dirt that can damage leather over time.', frequency: 'After every wear', products: ['Horsehair brush'] },
        { step: 2, title: 'Condition regularly', detail: 'Venetian Shoe Cream is a safe, versatile conditioner for most leather types.', frequency: 'Every 2–3 months', products: ['Venetian Shoe Cream'] },
        { step: 3, title: 'Polish occasionally', detail: 'A neutral wax polish adds shine and a light protective layer.', frequency: 'Monthly', products: ['Neutral wax polish'] },
      ],
      proTip: 'The best patina comes from consistent, light maintenance — not occasional heavy treatments.',
    },
    pristine: {
      summary: 'Keep leather looking fresh with regular light maintenance.',
      steps: [
        { step: 1, title: 'Brush after every wear', detail: 'Horsehair brush removes surface dirt and scuffs.', frequency: 'After every wear', products: ['Horsehair brush'] },
        { step: 2, title: 'Condition with Bick 4', detail: 'Bick 4 conditions without darkening — ideal for maintaining original color.', frequency: 'Monthly', products: ['Bick 4'] },
        { step: 3, title: 'Polish with neutral cream', detail: 'Venetian Shoe Cream adds shine and a thin protective layer.', frequency: 'Monthly', products: ['Venetian Shoe Cream'] },
      ],
      proTip: 'Regular light maintenance beats occasional heavy treatment every time.',
    },
    darken: {
      summary: 'Most smooth leathers respond well to darkening with oils.',
      steps: [
        { step: 1, title: 'Clean thoroughly', detail: 'Start with clean leather for even absorption.', frequency: 'Once before starting', products: ['Leather cleaner'] },
        { step: 2, title: 'Apply neatsfoot oil', detail: 'Pure neatsfoot oil darkens most smooth leathers. Apply in thin coats.', frequency: '2–3 coats over a week', products: ['Pure Neatsfoot Oil'] },
        { step: 3, title: 'Seal with conditioner', detail: 'Venetian Shoe Cream seals the oil and adds a healthy sheen.', frequency: 'After oil absorbs', products: ['Venetian Shoe Cream'] },
      ],
      proTip: 'Always test on a hidden area first — every leather responds differently to oil.',
    },
    protect: {
      summary: 'Good waterproofing protects the leather and extends its life significantly.',
      steps: [
        { step: 1, title: 'Clean and dry', detail: 'Always start with clean, dry leather.', frequency: 'Before treatment', products: ['Horsehair brush', 'Damp cloth'] },
        { step: 2, title: 'Apply Obenauf\'s Heavy Duty LP', detail: 'The go-to waterproofer for most leather boots. Warm between fingers before applying.', frequency: 'Every 2–3 months', products: ['Obenauf\'s Heavy Duty LP'] },
        { step: 3, title: 'Buff to finish', detail: 'Horsehair brush once absorbed.', frequency: 'After treatment', products: ['Horsehair brush'] },
      ],
      proTip: 'Don\'t wait until you\'re heading into a storm — waterproof before you need it.',
    },
    restore: {
      summary: 'Dry, neglected leather needs deep conditioning before anything else.',
      steps: [
        { step: 1, title: 'Clean thoroughly', detail: 'Remove dirt and old product with a leather cleaner or saddle soap.', frequency: 'Once', products: ['Saddle soap', 'Leather cleaner'] },
        { step: 2, title: 'Deep condition', detail: 'Leather Honey for seriously neglected boots. Venetian Shoe Cream for moderately dry leather.', frequency: 'Apply generously, let absorb overnight', products: ['Leather Honey', 'Venetian Shoe Cream'] },
        { step: 3, title: 'Maintain going forward', detail: 'Establish a regular conditioning schedule to prevent this happening again.', frequency: 'Every 2 months', products: ['Bick 4'] },
      ],
      proTip: 'Restored leather often looks blotchy at first. A second light conditioning pass usually evens it out.',
    },
  },
};

export function getCareRoutine(
  leatherType: string | null,
  goal: CareGoal,
  brand?: string | null,
  model?: string | null,
  isRoughout?: boolean
): CareRoutine {
  const profile = identifyLeather(leatherType, brand, model);
  const category = isRoughout ? 'roughout' : getRoutineCategory(profile);
  return ROUTINES[category]?.[goal] ?? ROUTINES['general'][goal];
}

export function getLeatherProfile(
  leatherType: string | null,
  brand?: string | null,
  model?: string | null
): LeatherProfile {
  return identifyLeather(leatherType, brand, model);
}
