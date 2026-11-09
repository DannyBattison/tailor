import { hexToOklch } from '../lib/color'
import { walk } from '../lib/tree'
import type { DNode, Doc } from '../types'
import { BANNED_FONTS, fontSpec } from './fonts'
import { isBannedHue, paletteIssues } from './palette'

export interface Issue { id: string; level: 'fail' | 'warn' | 'pass'; title: string; detail: string }

const equalCols = (cols: unknown, n: number) => {
  if (cols == null || cols === '') return true
  if (typeof cols === 'number') return true
  const parts = String(cols).trim().split(/\s+/)
  return parts.length >= n ? parts.every((p) => p === parts[0]) : parts.length === 1 || parts.every((p) => p === parts[0])
}
const shape = (n: DNode): string => n.type + '(' + n.children.map(shape).join(',') + ')'

/** Automated genericness check. */
export function critique(doc: Doc): Issue[] {
  const out: Issue[] = []
  const { tokens: t, root } = doc

  const ci = paletteIssues(t.palette)
  if (ci.length) ci.forEach((c, i) => out.push({ id: 'contrast-' + i, level: 'fail', title: 'Contrast too low', detail: c }))
  else out.push({ id: 'contrast', level: 'pass', title: 'Contrast', detail: 'Ink, muted, accent and inverse text all meet WCAG AA or better.' })

  const f = fontSpec(t)
  const bad = [f.heading.family, f.body.family].filter((n) => BANNED_FONTS.includes(n.toLowerCase()))
  out.push(bad.length ? { id: 'font-banned', level: 'fail', title: 'Banned font', detail: `${bad.join(', ')} is a default-looking face.` } : { id: 'font-ok', level: 'pass', title: 'Fonts', detail: `${f.heading.family} with ${f.body.family}.` })

  const hot = [t.palette.accent, t.palette.accent2].map(hexToOklch).filter((c) => c.c > 0.1 && isBannedHue(c.h))
  out.push(hot.length ? { id: 'hue-banned', level: 'fail', title: 'Blue-to-purple accent', detail: 'The AI-default hue band (250–338°) is in use. Choose another hue unless it is deliberate.' } : { id: 'hue-ok', level: 'pass', title: 'Hue', detail: `Accent hue ${Math.round(hexToOklch(t.palette.accent).h)}° sits outside the blue→purple default.` })

  const a1 = hexToOklch(t.palette.accent)
  const a2 = hexToOklch(t.palette.accent2)
  const dh = Math.min(Math.abs(a1.h - a2.h), 360 - Math.abs(a1.h - a2.h))
  if (a2.c > 0.1 && dh > 60) out.push({ id: 'rainbow', level: 'warn', title: 'Competing accents', detail: 'Two strong colours from unrelated hues. Keep the second colour a muted tint of, or neighbour to, the first.' })

  const grey = [t.palette.bg, t.palette.ink, t.palette.surface].filter((h) => hexToOklch(h).c < 0.004)
  if (grey.length) out.push({ id: 'pure-grey', level: 'warn', title: 'Pure grey neutrals', detail: 'Neutrals carry no tint. Tint greys towards the dominant hue.' })

  // three equal cards
  walk(root, (n) => {
    if (n.type !== 'box' || n.children.length < 3 || n.children.length > 4) return
    const same = n.children.every((c) => c.type === 'box' && c.props.variant === 'card') && new Set(n.children.map(shape)).size === 1
    if (same && equalCols(n.props.cols, n.children.length) && !n.children.some((c) => c.props.bg || c.props.span))
      out.push({ id: 'cards-' + n.id, level: 'fail', title: 'Three equal cards', detail: 'Identical cards in equal columns is the template look. Vary width, fill or content.' })
  })

  // everything centred
  let total = 0
  let centred = 0
  const visit = (n: DNode, inherited: string | undefined) => {
    const al = n.props.align ?? inherited
    if (n.type === 'heading' || n.type === 'text' || n.type === 'quote') { total++; if (al === 'center') centred++ }
    n.children.forEach((c) => visit(c, n.type === 'section' || n.type === 'box' ? n.props.align ?? inherited : inherited))
  }
  visit(root, undefined)
  out.push(total >= 4 && centred / total > 0.6 ? { id: 'centred', level: 'warn', title: 'Everything is centred', detail: `${centred} of ${total} text blocks are centred. Left-align some for tension.` } : { id: 'centred-ok', level: 'pass', title: 'Alignment', detail: `${centred} of ${total} text blocks centred.` })

  ux(doc, out)

  // sameness: one signature move
  out.push({ id: 'sig', level: 'pass', title: 'Signature move', detail: `Committed to "${t.signature}".` })
  return out
}

const links = (v: unknown) => String(v ?? '').split('\n').map((l) => l.trim()).filter(Boolean)
const MOVING_AMBIENT = ['drift', 'breathe', 'sweep', 'stutter']

/** Usability checks: readability, hierarchy, calls to action, navigation, touch size and how much is moving at once. */
function ux(doc: Doc, out: Issue[]) {
  const { tokens: t, root, meta } = doc
  const f = fontSpec(t)
  const push = (i: Issue) => out.push(i)

  // type: body and headings must stay legible
  if (f.body.cat === 'script' || f.body.cat === 'display') push({ id: 'body-face', level: 'warn', title: 'Body font is decorative', detail: `${f.body.family} is a ${f.body.cat} face. Paragraphs, labels and forms need a plain serif, sans or mono; keep the character in headings.` })
  if (f.heading.cat === 'script' && t.headingCase === 'uppercase') push({ id: 'script-caps', level: 'warn', title: 'Uppercase script headings', detail: 'Script faces fall apart in capitals. Use normal case, or a different heading face.' })
  if (t.headingCase === 'uppercase' && t.tracking < 0) push({ id: 'caps-tight', level: 'warn', title: 'Tight capitals', detail: 'Uppercase headings need neutral or open letter-spacing; negative tracking makes capitals collide.' })
  if (t.tracking < -0.04) push({ id: 'tracking-tight', level: 'warn', title: 'Very tight headings', detail: 'Letter-spacing this negative hurts scanning at small heading sizes. Ease it off.' })
  if (t.density < 0.9) push({ id: 'touch', level: 'warn', title: 'Small touch targets', detail: 'Tight density shrinks buttons and form controls below a comfortable tap size (about 44px). Raise density a little.' })

  // structure
  const heads: number[] = []
  const secs: DNode[] = []
  let navLinks = 0
  walk(root, (n) => {
    if (n.type === 'heading') heads.push(n.props.level ?? 2)
    if (n.type === 'section') secs.push(n)
    if (n.type === 'nav') navLinks = Math.max(navLinks, links(n.props.links).length)
  })
  const h1 = heads.filter((l) => l === 1).length
  const skipped = heads.some((l, i) => i > 0 && l > heads[i - 1] + 1)
  if (meta.kind === 'marketing') {
    if (h1 !== 1) push({ id: 'h1', level: 'warn', title: h1 ? 'More than one main heading' : 'No main heading', detail: 'A page needs exactly one h1 so people and screen readers know what it is about.' })
    else if (skipped) push({ id: 'heading-skip', level: 'warn', title: 'Heading levels skip', detail: 'Headings jump a level (h2 to h4). Keep the outline sequential for scanning and assistive tech.' })
    else push({ id: 'headings', level: 'pass', title: 'Heading outline', detail: 'One h1 and no skipped levels.' })
  }

  if (navLinks > 6) push({ id: 'nav-count', level: 'warn', title: 'Crowded navigation', detail: `${navLinks} nav links. Past five or six people stop reading them; group or cut.` })

  // calls to action
  const solid = (s: DNode) => { let c = 0; walk(s, (n) => { if (n.type === 'button' && (n.props.variant ?? 'solid') === 'solid') c++ }); return c }
  const rival = secs.filter((s) => s.props.role !== 'nav' && s.props.role !== 'pricing' && !String(s.props.role).startsWith('app') && solid(s) > 1)
  if (rival.length) push({ id: 'cta-compete', level: 'warn', title: 'Competing primary buttons', detail: `${rival.length} section${rival.length > 1 ? 's have' : ' has'} more than one filled button. Make one primary and style the rest outline or ghost.` })
  if (meta.kind === 'marketing') {
    const hero = secs.find((s) => s.props.role === 'hero')
    if (hero) {
      let btn = false
      walk(hero, (n) => { if (n.type === 'button') btn = true })
      if (!btn) push({ id: 'hero-cta', level: 'warn', title: 'Hero has no action', detail: 'Visitors land here with nothing to click. Add a primary button above the fold.' })
    }
  }

  // motion: how much moves at once, and whether hover is the only cue
  let marquee = t.signature === 'marquee'
  walk(root, (n) => { if (n.type === 'marquee') marquee = true })
  const ambient = t.ambient ?? 'drift'
  const entrance = t.entrance ?? 'none'
  const load = (MOVING_AMBIENT.includes(ambient) ? 1 : 0) + (marquee ? 1 : 0) + (entrance === 'wipe' || entrance === 'slide' ? 1 : 0) + (t.hover === 'tilt' || t.hover === 'grow' ? 1 : 0)
  if (ambient === 'stutter' && marquee) push({ id: 'motion-clash', level: 'warn', title: 'Two things jerking at once', detail: 'A stepped background and a scrolling band compete for the eye and make the text behind harder to read. Keep one still.' })
  else if (load >= 3) push({ id: 'motion-load', level: 'warn', title: 'A lot is moving', detail: 'Background, ticker, entrance and hover all animate. Quiet at least one so the content leads.' })
  else push({ id: 'motion-ok', level: 'pass', title: 'Motion', detail: 'Animation stays secondary to content, and it switches off for visitors who ask for reduced motion.' })
  if (t.motion === 'springy' && (t.hover === 'tilt' || t.hover === 'grow')) push({ id: 'spring-wobble', level: 'warn', title: 'Bouncy hover on text', detail: 'A springy overshoot plus tilt or grow makes cards with text wobble and blur. Use a smooth or snappy feel, or lift/sink.' })
  if (t.navBar === 'glass' && t.palette.bg && hexToOklch(t.palette.bg).c > 0.12) push({ id: 'glass-bar', level: 'warn', title: 'Translucent bar over a saturated page', detail: 'Links on a see-through bar lose contrast as bold colour scrolls under it. Use a solid bar.' })
  if (t.navLink === 'dim') push({ id: 'dim-links', level: 'warn', title: 'Dimming nav hover', detail: 'Fading every other link to 35% drops them under AA while the pointer rests there, and does nothing on touch. Pair it with another cue or pick a different style.' })
}
