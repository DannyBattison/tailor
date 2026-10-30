import { hexToOklch } from '../lib/color'
import { collectTexts, walk } from '../lib/tree'
import type { DNode, Doc } from '../types'
import { BANNED_PHRASES, EMOJI_RE } from './content'
import { BANNED_FONTS, getFont } from './fonts'
import { isBannedHue, paletteIssues } from './palette'

export interface Issue { id: string; level: 'fail' | 'warn' | 'pass'; title: string; detail: string; nodeId?: string }

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

  const f = getFont(t.fontId)
  const bad = [f.display, f.body].filter((n) => BANNED_FONTS.includes(n.toLowerCase()))
  out.push(bad.length ? { id: 'font-banned', level: 'fail', title: 'Banned font', detail: `${bad.join(', ')} is a default-looking face.` } : { id: 'font-ok', level: 'pass', title: 'Fonts', detail: `${f.display} with ${f.body}: curated pairing.` })

  const hot = [t.palette.accent, t.palette.accent2].map(hexToOklch).filter((c) => c.c > 0.1 && isBannedHue(c.h))
  out.push(hot.length ? { id: 'hue-banned', level: 'fail', title: 'Blue-to-purple accent', detail: 'The AI-default hue band (250–320°) is in use. Choose another hue unless it is deliberate.' } : { id: 'hue-ok', level: 'pass', title: 'Hue', detail: `Accent hue ${Math.round(hexToOklch(t.palette.accent).h)}° sits outside the blue→purple default.` })

  const grey = [t.palette.bg, t.palette.ink, t.palette.surface].filter((h) => hexToOklch(h).c < 0.004)
  if (grey.length) out.push({ id: 'pure-grey', level: 'warn', title: 'Pure grey neutrals', detail: 'Neutrals carry no tint. Tint greys towards the dominant hue.' })

  // three equal cards
  walk(root, (n) => {
    if (n.type !== 'box' || n.children.length < 3 || n.children.length > 4) return
    const same = n.children.every((c) => c.type === 'box' && c.props.variant === 'card') && new Set(n.children.map(shape)).size === 1
    if (same && equalCols(n.props.cols, n.children.length) && !n.children.some((c) => c.props.bg || c.props.span))
      out.push({ id: 'cards-' + n.id, level: 'fail', title: 'Three equal cards', detail: 'Identical cards in equal columns is the template look. Vary width, fill or content.', nodeId: n.id })
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

  // copy clichés and emoji
  let copyHits = 0
  collectTexts(root).forEach((x) => {
    if (BANNED_PHRASES.some((r) => r.test(x.text)) || EMOJI_RE.test(x.text)) {
      copyHits++
      out.push({ id: 'copy-' + x.id, level: 'warn', title: 'Generic copy or emoji', detail: `"${x.text.slice(0, 60)}"`, nodeId: x.id })
    }
  })
  if (!copyHits) out.push({ id: 'copy-ok', level: 'pass', title: 'Copy', detail: 'No stock phrases or emoji icons.' })

  // sameness: one signature move
  out.push({ id: 'sig', level: 'pass', title: 'Signature move', detail: `Committed to "${t.signature}".` })
  return out
}
