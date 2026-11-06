import { designCode } from './gen/code'
import { paletteOf } from './gen/palette'
import { DOC_CSS, tokenVars, typeStep } from './render/css'
import { fontSpec, fontsUrl, fontStacks } from './gen/fonts'
import { contrast, hexToOklch } from './lib/color'
import { placeholdColors, placeholdUrl } from './render/placehold'
import { walk } from './lib/tree'
import { makeRng } from './lib/rng'
import { SECTIONS, type Ctx } from './gen/build'
import { PLACEHOLDER_APP, PLACEHOLDER_MARKETING } from './gen/content'
import type { DNode, Doc } from './types'

const SIGNATURES: Record<string, string> = {
  hardShadow: 'Cards and buttons carry a hard offset shadow in the ink colour and a visible border; no blur anywhere.',
  oversized: 'Hero headings are set far larger than normal and tightly leaded; let them dominate and crowd the layout.',
  ruled: 'Heavy rules separate sections and underline headings; lists are ruled like a ledger.',
  grain: 'A subtle film-grain overlay sits over the whole page; surfaces are flat colour, never gradients.',
  tilted: 'Tags, buttons and alternate cards are rotated by 1–3 degrees; keep it playful, never more than 3°.',
  inverted: 'One mid-page section is fully inverted (dark on light, or light on dark) as a hard break.',
  marquee: 'A full-bleed scrolling text band in accent colour sits under the hero.',
}

function outline(n: DNode, depth = 0, maxDepth = 3): any {
  const o: any = { type: n.type }
  if (n.props.build) o.build = n.props.build
  const label = n.props.text ?? n.props.label ?? n.props.brand
  if (label) o.text = String(label).slice(0, 60)
  if (n.props.dir) o.dir = n.props.dir
  if (n.props.cols) o.columns = n.props.cols
  if (n.props.bg) o.fill = n.props.bg
  if (n.props.variant) o.variant = n.props.variant
  if (n.props.backdrop) o.backdrop = n.props.backdrop
  if (n.props.span) o.span = n.props.span
  if (n.children.length && depth < maxDepth) o.children = n.children.map((c) => outline(c, depth + 1, maxDepth))
  else if (n.children.length) o.children = `${n.children.length} nodes`
  return o
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

/** Section patterns rendered with neutral placeholder copy so only structure and styling are described. */
function patternLibrary(doc: Doc) {
  const cont = { c: PLACEHOLDER_MARKETING, a: PLACEHOLDER_APP }
  const wanted = Object.keys(SECTIONS).filter((k) => (doc.meta.kind === 'app' ? k.startsWith('app.') || k.startsWith('nav.') : !k.startsWith('app.')))
  return wanted.map((key) => {
    const x: Ctx = { rng: makeRng(doc.meta.layoutSeed + key.length * 131), t: doc.tokens, ...cont }
    const tree = SECTIONS[key](x)
    return { key, use: PATTERN_NOTES[key] ?? '', structure: outline(tree, 0, 3) }
  })
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
export function designSystem(doc: Doc) {
  const t = doc.tokens
  const f = fontSpec(t)
  const stacks = fontStacks(f)
  const pal = t.palette
  const roles: Record<string, string> = {
    bg: 'Page background', surface: 'Cards, alternate sections, table stripes', ink: 'Body text and borders',
    muted: 'Secondary text', line: 'Hairline dividers', accent: 'Buttons and highlights (fills only; do not use for text on bg)',
    accent2: 'Secondary highlight, tags, marquee', onAccent: 'Text placed on accent', accentText: 'Accent when used as text/link colour on bg (AA contrast)',
    inverse: 'Inverted section background', onInverse: 'Text on inverse',
  }
  const colors = Object.fromEntries(Object.entries(pal).map(([k, hex]) => {
    const l = hexToOklch(hex)
    return [k, { hex, oklch: `oklch(${l.l.toFixed(3)} ${l.c.toFixed(3)} ${Math.round(l.h)})`, role: roles[k] }]
  }))
  const pair = (fg: keyof typeof pal, bg: keyof typeof pal) => ({ fg, bg, ratio: +contrast(pal[fg], pal[bg]).toFixed(2) })
  const sizes = Object.fromEntries([['small', 0, 0.85], ['body', 0, 1], ['large', 1, 1], ['h3', 2, 1], ['h2', 3, 1], ['h1', 4, 1], ['display', 6, 1]].map(([name, n, mul]) => {
    const s = typeStep(t, n as number)
    return [name, { desktop_px: +(s.max * (mul as number)).toFixed(1), mobile_px: +(s.min * (mul as number)).toFixed(1), css: s.css }]
  }))
  const pageKinds: string[] = []
  walk(doc.root, (n) => { if (n.type === 'section' && n.props.build && !pageKinds.includes(n.props.build)) pageKinds.push(n.props.build) })
  const images = (() => { let w: any; walk(doc.root, (n) => { if (!w && n.type === 'image') w = n }); return w })()
  return {
    format: 'tailor-design-system/1',
    name: doc.meta.name,
    kind: doc.meta.kind,
    mood: doc.meta.mood,
    designCode: designCode(doc),
    colors,
    backgroundBoldness: doc.tokens.bgBold ?? null,
    mode: doc.tokens.mode ?? (doc.tokens.spec?.dark ? 'dark' : 'light'),
    alternateMode: doc.tokens.spec ? (() => { const cur = doc.tokens.mode ?? (doc.tokens.spec!.dark ? 'dark' : 'light'); const other = cur === 'dark' ? 'light' : 'dark'; return { mode: other, colors: paletteOf(doc.tokens.spec!, doc.tokens.bgBold, other) } })() : null,
    contrast: [pair('ink', 'bg'), pair('muted', 'bg'), pair('onAccent', 'accent'), pair('accentText', 'bg'), pair('onInverse', 'inverse')],
    typography: {
      display: { family: f.heading.family, weight: f.heading.weight, category: f.heading.cat, stack: stacks.display, case: t.headingCase, letterSpacing: `${t.tracking}em`, lineHeight: 1.04 },
      body: { family: f.body.family, weights: f.body.weights, category: f.body.cat, stack: stacks.body, lineHeight: 1.55 },
      mono: { stack: stacks.mono, use: 'tags, labels, table headers, captions (uppercase, 0.06–0.08em tracking). System monospace: the design loads only its two Google fonts.' },
      googleFonts: fontsUrl(f),
      scaleRatio: t.scale,
      sizes,
      sizing: 'Fluid: clamp(min, a + b*cqw, max) against the container width (container-type: inline-size), not the viewport.',
    },
    shape: {
      radius_px: t.radius, borderWidth_px: t.border,
      shadow: t.shadow === 'hard' ? { kind: 'hard', css: tokenVars(t)['--shadow'] } : { kind: t.shadow, css: tokenVars(t)['--shadow'] },
      density: t.density, spacingUnit: tokenVars(t)['--space'],
    },
    motion: {
      style: t.motion ?? 'smooth', easing: tokenVars(t)['--ease'], duration: tokenVars(t)['--dur'],
      rules: [
        'Every interactive element transitions (buttons lift and press, cards rise with a larger shadow, nav links underline, list titles slide, images zoom slowly, table rows tint).',
        'The hero plays in on load, staggered; later sections rise and fade in as they scroll into view (scroll-driven animation, no JS).',
        'Backdrops move: aurora blobs and washes drift, grids and dots pan, art floats. All are slow (20s+), low contrast and sit behind content.',
        'Animate only transform, translate, opacity and background-position. Always honour prefers-reduced-motion.',
      ],
    },
    signature: { name: t.signature, rule: SIGNATURES[t.signature] },
    layout: {
      archetype: doc.meta.archetype,
      sections: pageKinds,
      breakpoints: 'Container queries on the page frame: <=900px stacks rows and halves grids; <=560px single column and hides nav links.',
      outline: doc.root.children.map((c) => outline(c)),
    },
    images: {
      default: 'Generated SVG art drawn only with palette variables (blocks, stripes, arches, dots, waves, sun, rings). Never grey boxes.',
      placeholder: images ? { note: 'placehold.co stand-ins use palette colour pairs (never grey) and the theme serif/sans. URL shape: https://placehold.co/WxH/BG/FG?text=Label&font=playfair-display|source-sans-pro', pairs: [0, 1, 2, 3].map((n) => placeholdColors(t.palette, n)), example: placeholdUrl({ ...images.props, source: 'placehold' }, t) } : undefined,
    },
    howToUse: 'This is a design system, not a page. The preview shows one sample page; build every page of the site from the patterns below, in this order of preference: reuse a pattern, vary its content, only then invent. Write real copy yourself: any text in the structures is placeholder.',
    patterns: patternLibrary(doc),
    pages: doc.meta.kind === 'app' ? APP_PAGES : MARKETING_PAGES,
    components: {
      button: { variants: ['solid (accent)', 'outline', 'ink', 'ghost (underlined link)'], sizes: ['s', 'm', 'l'], radius: `${t.radius}px`, border: `${Math.max(1.5, t.border)}px ink`, shadow: t.shadow },
      tag: { variants: ['accent2 (default)', 'solid', 'plain', 'accent'], style: 'mono, uppercase, 0.08em tracking' },
      card: { variants: ['card (border + shadow)', 'outline', 'rule-top', 'rule-left'], radius: `${Math.min(t.radius, 22)}px (large boxes never go fully round)` },
      input: { variants: ['text', 'textarea', 'select', 'toggle'], style: 'mono uppercase label above a bordered control' },
      list: { variants: ['ruled', 'index', 'numbered', 'bullets', 'links', 'checks'] },
      faq: { style: 'details/summary accordion, display-font questions, plus icon rotating to a cross' },
      logos: { style: 'wordmarks with a small geometric glyph, muted until hover' },
      table: { options: ['zebra'], style: 'mono uppercase header with a heavy rule under it' },
      backdrops: { options: ['none', 'grid', 'dots', 'hatch', 'wash', 'aurora', 'split', 'noise', 'art', 'photo'], rule: 'Backdrops are quiet texture or colour fields behind heroes, bands and a single tile; never behind dense text.' },
    },
    cssVariables: tokenVars(t),
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
    css: { note: 'Stylesheet used by the editor and the HTML export. Apply cssVariables to the root element .d-doc inside a .d-frame wrapper.', base: DOC_CSS.trim() },
  }
}

/** Prompt copy: same data, with the stylesheet minified so it fits comfortably in a chat. */
const compact = (ds: ReturnType<typeof designSystem>) => ({ ...ds, css: { ...ds.css, base: ds.css.base.replace(/\s*([{};:,>])\s*/g, '$1').replace(/\s+/g, ' ') } })

export function designSystemPrompt(doc: Doc): string {
  return `You are building a complete multi-page ${doc.meta.kind === 'app' ? 'app UI' : 'website'} for a project that already has a design system. Below is that system as JSON. It is a design system, not a page: any copy in it is placeholder, so write the real copy for the project yourself.

How to work:
1. Decide the pages the project needs (see "pages" for typical recipes) and build every one of them in the same system.
2. Compose each page from the "patterns" library (section structures with column ratios, variants and fills). Reuse and vary patterns; don't invent new section layouts unless none fits. Keep the nav and footer identical across pages.
3. Follow the tokens exactly: colour roles, fonts, fluid type scale, radius, borders, shadows, density and the signature move. Respect every item in "rules" and the "components" vocabulary.
4. For HTML output, put the cssVariables on a root element and either use the supplied base CSS (class names d-*) or reproduce its look. Use the placeholder image URLs pattern for images until real ones exist.
5. Do not add generic gradients, stock icons, emoji or filler copy.

\`\`\`json\n${JSON.stringify(compact(designSystem(doc)), null, 1)}\n\`\`\`\n`
}
