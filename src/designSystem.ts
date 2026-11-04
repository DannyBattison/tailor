import { DOC_CSS, tokenVars, typeStep } from './render/css'
import { fontsUrl, fontStacks, getFont } from './gen/fonts'
import { contrast, hexToOklch } from './lib/color'
import { placeholdUrl } from './render/Doc'
import { walk } from './lib/tree'
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

function outline(n: DNode, depth = 0): any {
  const o: any = { type: n.type }
  if (n.props.build) o.build = n.props.build
  const label = n.props.text ?? n.props.label ?? n.props.brand
  if (label) o.text = String(label).slice(0, 60)
  if (n.props.dir) o.dir = n.props.dir
  if (n.props.cols) o.columns = n.props.cols
  if (n.props.bg) o.fill = n.props.bg
  if (n.props.variant) o.variant = n.props.variant
  if (n.children.length && depth < 3) o.children = n.children.map((c) => outline(c, depth + 1))
  else if (n.children.length) o.children = `${n.children.length} nodes`
  return o
}

/** A self-contained description of the design, meant to be handed to another AI or developer. */
export function designSystem(doc: Doc) {
  const t = doc.tokens
  const f = getFont(t.fontId)
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
    format: 'handmade-design-system/1',
    name: doc.meta.name,
    kind: doc.meta.kind,
    mood: doc.meta.mood,
    seed: doc.meta.seed,
    colors,
    contrast: [pair('ink', 'bg'), pair('muted', 'bg'), pair('onAccent', 'accent'), pair('accentText', 'bg'), pair('onInverse', 'inverse')],
    typography: {
      display: { family: f.display, weight: f.displayWeight, stack: stacks.display, case: t.headingCase, letterSpacing: `${t.tracking}em`, lineHeight: 1.04 },
      body: { family: f.body, stack: stacks.body, lineHeight: 1.55 },
      mono: { stack: stacks.mono, use: 'tags, labels, table headers, captions (uppercase, 0.06–0.08em tracking)' },
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
    signature: { name: t.signature, rule: SIGNATURES[t.signature] },
    layout: {
      archetype: doc.meta.archetype,
      sections: pageKinds,
      breakpoints: 'Container queries on the page frame: <=900px stacks rows and halves grids; <=560px single column and hides nav links.',
      outline: doc.root.children.map((c) => outline(c)),
    },
    images: {
      default: 'Generated SVG art drawn only with palette variables (blocks, stripes, arches, dots, waves, sun, rings). Never grey boxes.',
      placeholder: images ? `https://placehold.co/WxH/${pal.surface.slice(1)}/${pal.ink.slice(1)}?text=Label (example: ${placeholdUrl({ ...images.props, source: 'placehold' }, t)})` : undefined,
    },
    cssVariables: tokenVars(t),
    rules: [
      'Use only the colours above. Never introduce purple/blue gradients, pure grey (#808080-style) or pure black/white.',
      'Use only the listed fonts; never fall back to Inter, Roboto, Arial or system-ui as a design choice.',
      `Corner radius is ${t.radius >= 40 ? 'pill' : t.radius + 'px'} everywhere; borders are ${t.border}px; shadow is ${t.shadow}.`,
      'Keep text contrast at or above the ratios listed; use accentText, not accent, for coloured text.',
      'Do not build three identical cards in equal columns. Vary width, fill, or content.',
      'Do not centre everything; left-align most copy and centre sparingly.',
      'No emoji as icons. Copy is specific and concrete, with no stock phrases ("unlock the power of", "seamless").',
      `Commit to the signature move: ${SIGNATURES[t.signature]}`,
    ],
    css: { note: 'Stylesheet used by the editor and the HTML export. Apply cssVariables to the root element .d-doc inside a .d-frame wrapper.', base: DOC_CSS.trim() },
  }
}

export function designSystemPrompt(doc: Doc): string {
  return `You are building UI for "${doc.meta.name}". Below is its design system as JSON. Follow it strictly: use the colour roles, fonts, type scale, radius, borders, shadows, spacing and signature move exactly as given, respect the "rules", and match the layout archetype ("${doc.meta.archetype}") when composing pages. If you generate HTML, reuse the cssVariables on the root element and the supplied base CSS (class names d-*) or reproduce its look in your own CSS. Do not add generic gradients, stock icons or filler copy.\n\n\`\`\`json\n${JSON.stringify(designSystem(doc), null, 2)}\n\`\`\`\n`
}
