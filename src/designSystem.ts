import { designCode } from './gen/code'
import { paletteOf } from './gen/palette'
import { tokenVars, typeStep } from './render/css'
import { fontSpec, fontsUrl, fontStacks } from './gen/fonts'
import { contrast } from './lib/color'
import { walk } from './lib/tree'
import { SECTIONS } from './gen/build'
import type { AmbientMotion, Doc, EntranceMotion, HoverMotion, NavBarStyle, NavLinkMotion } from './types'

const SIGNATURES: Record<string, string> = {
  hardShadow: 'Cards and buttons carry a hard offset shadow in the ink colour and a visible border; no blur anywhere.',
  oversized: 'Hero headings are set far larger than normal and tightly leaded; let them dominate and crowd the layout.',
  ruled: 'Heavy rules separate sections and underline headings; lists are ruled like a ledger.',
  grain: 'A subtle film-grain overlay sits over the whole page; surfaces are flat colour, never gradients.',
  tilted: 'Tags, buttons and alternate cards are rotated by 1–3 degrees; keep it playful, never more than 3°.',
  inverted: 'One mid-page section is fully inverted (dark on light, or light on dark) as a hard break.',
  marquee: 'A full-bleed scrolling text band in accent colour sits under the hero.',
}

const PATTERN_NOTES: Record<string, string> = {
  'nav.bar': 'Brand left, links centred or right, one primary button. Optional rule below.',
  'nav.centered': 'Brand and links stacked and centred; no button.',
  'hero.split': 'Two-column hero: eyebrow, headline, lead, two actions beside a tall image. Column ratio and order vary.',
  'hero.giant': 'Poster hero: oversized headline across the full width, lead and action in an asymmetric row beneath.',
  'hero.stack': 'Left-aligned headline and lead, actions on the right, then a wide banner image.',
  'hero.dense': 'Compact editorial hero: headline left, ruled lead and action right. For index-style pages.',
  'features.numbered': 'Sticky heading column beside a numbered, ruled list of features.',
  'features.twocol': 'Heading over a two-column grid of ruled items.',
  'features.uneven': 'Row of cards in deliberately unequal widths; at most one loud fill.',
  'features.bento': 'Four-column bento grid of mixed tiles (feature, stat, image, quote) with varied spans.',
  'features.alt': 'Alternating image/text rows.',
  'stats.row': 'Four ruled stats in a row.',
  'stats.big': 'Three stats on an accent or inverse band, one emphasised.',
  'quote.big': 'Large pull quote on a filled band.',
  'quote.side': 'Small label column beside a quote.',
  'quote.pair': 'Two quotes: one ruled, one outlined.',
  'cta.band': 'Filled band: closing line and button on one row.',
  'cta.split': 'Oversized closing line over a two-column lead and actions.',
  'logos.strip': 'Small label and a row of wordmark logos, muted until hovered. Sits directly under the hero as social proof.',
  'features.cards': 'Centred or left intro, then a three-column grid of cards each led by a small art icon.',
  'steps.row': 'How it works: heading and lead, then three numbered steps, ruled or boxed.',
  'pricing.cards': 'Three plan cards (name, price, blurb, check list, button); the middle one is filled and carries a badge.',
  'faq.list': 'Accordion of questions with plus/cross toggles, beside a sticky intro or centred in a narrow column. First item open.',
  'footer.cols': 'Brand, address and email signup beside three link columns; hairline; copyright and legal links.',
  'index.list': 'Sticky heading beside a large ruled index list.',
  'index.table': 'Heading beside a striped data table.',
  'marquee.band': 'Full-bleed scrolling text band.',
  'footer.simple': 'Heavy rule, brand and address, link list, small print.',
  'app.topbar': 'View title, subtitle, search field and primary action.',
  'app.kpis': 'Row of metric cards, first emphasised.',
  'app.kpis2': 'Row of ruled metrics.',
  'app.table': 'Card with a data table beside an "up next" list.',
  'app.table2': 'Full-width striped table.',
}

/** The section patterns available to this kind of design, each with a one-line note on what it is. */
function patternLibrary(doc: Doc) {
  const wanted = Object.keys(SECTIONS).filter((k) => (doc.meta.kind === 'app' ? k.startsWith('app.') || k.startsWith('nav.') : !k.startsWith('app.')))
  return Object.fromEntries(wanted.map((key) => [key, PATTERN_NOTES[key] ?? '']))
}

const MARKETING_PAGES = [
  { page: 'Home', sections: ['nav', 'hero.*', 'logos.strip', 'features.*', 'steps.row', 'stats.*', 'quote.*', 'pricing.cards', 'faq.list', 'cta.*', 'footer.cols'] },
  { page: 'About', sections: ['nav', 'hero.stack|hero.dense', 'features.alt|features.numbered', 'quote.side|quote.pair', 'stats.row', 'cta.band', 'footer.cols'] },
  { page: 'Pricing', sections: ['nav', 'hero.dense', 'pricing.cards', 'index.table (comparison)', 'faq.list', 'cta.band', 'footer.cols'] },
  { page: 'Services / Features', sections: ['nav', 'hero.stack', 'features.bento|features.twocol', 'features.alt', 'cta.split', 'footer.cols'] },
  { page: 'Blog / Journal index', sections: ['nav', 'hero.dense', 'index.list (posts)', 'footer.cols'] },
  { page: 'Article', sections: ['nav', 'hero.dense (title, date)', 'quote.side', 'cta.band', 'footer.cols'] },
  { page: 'Contact', sections: ['nav', 'hero.dense', 'features.twocol (ways to reach us)', 'index.table (opening hours)', 'footer.cols'] },
]
const APP_PAGES = [
  { page: 'Overview', sections: ['app.topbar', 'app.kpis|app.kpis2', 'app.table'] },
  { page: 'List view', sections: ['app.topbar', 'app.table2'] },
  { page: 'Detail', sections: ['app.topbar', 'app.kpis2', 'app.table'] },
  { page: 'Settings', sections: ['settings archetype layout: sidebar nav + grouped form rows'] },
]

/** A self-contained description of the design, meant to be handed to another AI or developer. */
const AMBIENT_RULES: Record<AmbientMotion, string> = {
  still: 'Nothing moves on its own. Backdrops are static; only a marquee keeps sliding.',
  drift: 'Slow travel (20s+): colour fields wander, grids and hatching pan, art floats.',
  breathe: 'Things pulse in place on a 7-8s cycle, fading and swelling without travelling.',
  sweep: 'The same travel as a slow drift at about three times the speed, so it is clearly noticed.',
  stutter: 'Stop-motion: travel moves in visible steps rather than easing, like hand-cut animation.',
}
const ENTRANCE_RULES: Record<EntranceMotion, string> = {
  none: 'Content is simply there. No entrance animation at all.',
  rise: 'Fade in while rising 30px.',
  fade: 'Opacity only, unhurried.',
  zoom: 'Fade in while settling from 93% scale.',
  slide: 'Fade in while sliding 40px from the left, quick and tightly staggered.',
  wipe: 'Revealed top to bottom by a clip-path wipe, with no fade.',
}
const NAV_LINK_RULES: Record<NavLinkMotion, string> = {
  underline: 'A 1.5px underline grows from the left under the hovered link.',
  marker: 'A translucent accent highlighter bar sweeps in behind the lower half of the link.',
  pill: 'The link gets an ink pill with inverted text on hover; radius follows the design radius.',
  dim: 'Hovering the links dims every other link to 35%.',
  shift: 'The link nudges sideways and turns the accent text colour.',
}
const NAV_BAR_RULES: Record<NavBarStyle, string> = {
  glass: 'Sticky at the top, translucent page-coloured fill with a backdrop blur.',
  solid: 'Sticky at the top, opaque page-coloured fill with a ruled bottom edge; no blur.',
  static: 'Not sticky: the bar scrolls away with the page and sits on the page colour.',
}
const HOVER_RULES: Record<HoverMotion, string> = {
  lift: 'Buttons and cards rise and their shadow grows; list titles nudge along; images zoom slowly.',
  sink: 'Buttons and cards press in and their shadow shrinks, as if being pushed.',
  grow: 'Buttons and cards scale up slightly with no travel; images zoom further.',
  tilt: 'Buttons and cards rise and rotate a degree or so.',
  glow: 'Nothing moves: buttons and cards gain an accent ring and halo.',
}

/** Variables an agent should set on the root. The hover/entrance/background plumbing is spelled out in `motion` instead. */
const KEY_VARS = (v: Record<string, string>) => Object.fromEntries(Object.entries(v).filter(([k]) => !/^--(hover-|bgm-|in-|rv-|lift$|nudge|press|shadow-h$|shadow-float$)/.test(k)))

export function designSystem(doc: Doc) {
  const t = doc.tokens
  const f = fontSpec(t)
  const stacks = fontStacks(f)
  const pal = t.palette
  const vars = tokenVars(t)
  const mode = t.mode ?? (t.spec?.dark ? 'dark' : 'light')
  const roles: Record<string, string> = {
    bg: 'Page background', surface: 'Cards, alternate sections, table stripes', ink: 'Body text and borders',
    muted: 'Secondary text', line: 'Hairline dividers', accent: 'Buttons and highlights (fills only; do not use for text on bg)',
    accent2: 'Secondary highlight, tags, marquee', onAccent: 'Text placed on accent', accentText: 'Accent as text/link colour on bg (AA contrast)',
    inverse: 'Inverted section background', onInverse: 'Text on inverse',
  }
  const pair = (fg: keyof typeof pal, bg: keyof typeof pal) => `${fg} on ${bg} ${contrast(pal[fg], pal[bg]).toFixed(1)}:1`
  const sizes = Object.fromEntries([['small', 0, 0.85], ['body', 0, 1], ['large', 1, 1], ['h3', 2, 1], ['h2', 3, 1], ['h1', 4, 1], ['display', 6, 1]].map(([name, n, mul]) => {
    const s = typeStep(t, n as number)
    return [name, [+(s.max * (mul as number)).toFixed(1), +(s.min * (mul as number)).toFixed(1)]]
  }))
  const pageKinds: string[] = []
  walk(doc.root, (n) => { if (n.type === 'section' && n.props.build && !pageKinds.includes(n.props.build)) pageKinds.push(n.props.build) })
  const isApp = doc.meta.kind === 'app'
  return {
    format: 'tailor-design-system/2',
    seed: designCode(doc),
    kind: doc.meta.kind,
    mood: doc.meta.mood,
    mode,
    colors: { ...pal, roles },
    ...(t.spec ? (() => { const other = mode === 'dark' ? 'light' : 'dark'; return { alternateMode: { mode: other, colors: paletteOf(t.spec!, t.bgBold, other) } } })() : {}),
    contrast: [pair('ink', 'bg'), pair('muted', 'bg'), pair('onAccent', 'accent'), pair('accentText', 'bg'), pair('onInverse', 'inverse')],
    typography: {
      display: { family: f.heading.family, weight: f.heading.weight, stack: stacks.display, case: t.headingCase, letterSpacing: `${t.tracking}em`, lineHeight: 1.04 },
      body: { family: f.body.family, weights: f.body.weights, stack: stacks.body, lineHeight: 1.55 },
      mono: { stack: stacks.mono, use: 'tags, labels, table headers, captions: uppercase, 0.06–0.08em tracking. System monospace.' },
      googleFonts: fontsUrl(f),
      sizesPx: { note: '[desktop, mobile]; scale fluidly between them (see --fs-* variables)', ...sizes },
    },
    shape: { radius_px: t.radius, borderWidth_px: t.border, shadow: t.shadow, density: t.density },
    motion: {
      timing: { feel: t.motion ?? 'smooth', ease: vars['--ease'], duration: vars['--dur'] },
      // app screens have no backdrops or sections for these two to act on
      ...(isApp ? {} : {
        background: { style: t.ambient ?? 'drift', rule: AMBIENT_RULES[t.ambient ?? 'drift'], appliesTo: 'backdrops, hero image, marquee' },
        entrance: { style: t.entrance ?? 'rise', rule: ENTRANCE_RULES[t.entrance ?? 'rise'], appliesTo: 'hero on load, staggered; later blocks once as they scroll into view' },
      }),
      interaction: { style: t.hover ?? 'lift', rule: HOVER_RULES[t.hover ?? 'lift'], appliesTo: 'buttons and cards; list titles nudge, table rows tint, FAQ items open' },
      navigation: { links: t.navLink ?? 'underline', linkRule: NAV_LINK_RULES[t.navLink ?? 'underline'], bar: t.navBar ?? 'glass', barRule: NAV_BAR_RULES[t.navBar ?? 'glass'] },
      rules: ['Use these styles everywhere; add no others.', 'Always honour prefers-reduced-motion.'],
    },
    signature: { name: t.signature, rule: SIGNATURES[t.signature] },
    layout: { archetype: doc.meta.archetype, sections: pageKinds, breakpoints: 'Container queries on the page frame: <=900px stacks rows and halves grids; <=560px single column and hides nav links.' },
    images: 'Generated SVG art drawn only with palette variables (blocks, stripes, arches, dots, waves, sun, rings), never grey boxes. For stand-ins use placehold.co with palette colour pairs: https://placehold.co/WxH/BG/FG?text=Label',
    howToUse: 'This is a design system, not a page. Build every page from the patterns below: reuse a pattern, vary its content, only then invent. Write real copy yourself.',
    patterns: patternLibrary(doc),
    pages: isApp ? APP_PAGES : MARKETING_PAGES,
    components: {
      button: { variants: ['solid (accent)', 'outline', 'ink', 'ghost (underlined link)'], sizes: ['s', 'm', 'l'], radius: `${t.radius}px`, border: `${Math.max(1.5, t.border)}px ink` },
      tag: { variants: ['accent2 (default)', 'solid', 'plain', 'accent'], style: 'mono, uppercase, 0.08em tracking' },
      card: { variants: ['card (border + shadow)', 'outline', 'rule-top', 'rule-left'], radius: `${Math.min(t.radius, 22)}px (large boxes never go fully round)` },
      input: { variants: ['text', 'textarea', 'select', 'toggle'], style: 'mono uppercase label above a bordered control' },
      list: { variants: ['ruled', 'index', 'numbered', 'bullets', 'links', 'checks'] },
      faq: 'details/summary accordion, display-font questions, plus icon rotating to a cross',
      logos: 'wordmarks with a small geometric glyph, muted until hover',
      table: 'mono uppercase header with a heavy rule under it; optional zebra',
      backdrops: ['none', 'grid', 'dots', 'hatch', 'wash', 'aurora', 'split', 'noise', 'art', 'photo'].join(' | ') + ': quiet texture or colour fields behind heroes, bands and a single tile; never behind dense text',
    },
    cssVariables: { note: 'Set on the root element. Fluid sizes use clamp() against the container width (container-type: inline-size), not the viewport. Build your own CSS from these; no stylesheet is supplied.', ...KEY_VARS(vars) },
    rules: [
      'Use only the colours above. Never introduce purple/blue gradients, pure grey (#808080-style) or pure black/white.',
      'Use only the listed fonts; never fall back to Inter, Roboto, Arial or system-ui as a design choice.',
      `Corner radius is ${t.radius >= 40 ? 'pill' : t.radius + 'px'} everywhere; borders are ${t.border}px; shadow is ${t.shadow}.`,
      'Keep text contrast at or above the ratios listed; use accentText, not accent, for coloured text.',
      'Do not build three identical cards in equal columns (pricing is the one exception, and even there the middle plan is filled). Vary width, fill, or content.',
      'Do not centre everything; left-align most copy and centre sparingly.',
      'No emoji as icons. Copy is specific and concrete, with no stock phrases ("unlock the power of", "seamless").',
      `Commit to the signature move: ${SIGNATURES[t.signature]}`,
    ],
  }
}

export function designSystemPrompt(doc: Doc): string {
  return `You are building a complete multi-page ${doc.meta.kind === 'app' ? 'app UI' : 'website'} for a project that already has a design system. Below is that system as JSON (seed ${designCode(doc)}). It is a design system, not a page: any copy in it is placeholder, so write the real copy for the project yourself.

How to work:
1. Decide the pages the project needs (see "pages" for typical recipes) and build every one of them in the same system.
2. Compose each page from the "patterns" list (a one-line description of each section type). Reuse and vary patterns; don't invent new section layouts unless none fits. Keep the nav and footer identical across pages.
3. Follow the tokens exactly: colours, fonts, type sizes, radius, borders, shadow, density, motion and the signature move. Respect every item in "rules" and the "components" vocabulary.
4. For HTML output, put "cssVariables" on a root element and write the CSS from them; there is no base stylesheet. Use the placehold.co pattern for images until real ones exist.
5. Do not add generic gradients, stock icons, emoji or filler copy.

\`\`\`json\n${JSON.stringify(designSystem(doc), null, 1)}\n\`\`\`\n`
}
