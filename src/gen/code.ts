// The design code: a short string that recreates a generated design exactly.
//  - a fresh design is just its seed ("48213")
//  - once parts have been re-rolled (or mood/boldness/mode set) it spells out every part:
//    kind-mood-palette-fonts-shape-layout-text-backdrops-images-boldness-mode
import type { Doc, Kind } from '../types'
import { DEFAULT_BG_BOLD } from './palette'
import { MOODS } from './moods'
import { baseParts, generate, moodFor, partsOf } from './generate'

const b36 = (n: number) => n.toString(36)

export function designCode(doc: Doc): string {
  const p = partsOf(doc)
  const bold = Math.round((doc.tokens.bgBold ?? DEFAULT_BG_BOLD) * 100)
  const plain = p.palette === p.fonts && p.fonts === p.shape && p.shape === p.layout && p.layout === p.text && !p.backdrops && !p.images
  if (plain && doc.meta.mood === moodFor(p.palette) && bold === DEFAULT_BG_BOLD * 100 && !doc.tokens.mode) return String(p.palette)
  return [doc.meta.kind[0], doc.meta.mood, b36(p.palette), b36(p.fonts), b36(p.shape), b36(p.layout), b36(p.text), b36(p.backdrops), b36(p.images), bold, doc.tokens.mode?.[0] ?? 'n'].join('-')
}

/** Recreate a design from a code. `kind` is only used for plain seeds, which don't say which kind they are. */
export function fromCode(code: string, kind: Kind): Doc | null {
  const c = code.trim()
  if (/^\d+$/.test(c)) return generate({ seed: +c, kind, mood: '' })
  const m = c.match(/^([ma])-([a-z]+)-([0-9a-z]+)-([0-9a-z]+)-([0-9a-z]+)-([0-9a-z]+)-([0-9a-z]+)-([0-9a-z]+)-([0-9a-z]+)-(\d{1,3})-([nld])$/)
  if (!m || !MOODS[m[2]]) return null
  const n = (i: number) => parseInt(m[i], 36)
  const parts = { palette: n(3), fonts: n(4), shape: n(5), layout: n(6), text: n(7), backdrops: n(8), images: n(9) }
  if (Object.values(parts).some((v) => !Number.isFinite(v))) return null
  return generate({
    seed: parts.palette || baseParts(1).palette, kind: m[1] === 'a' ? 'app' : 'marketing', mood: m[2], parts,
    bgBold: +m[10] / 100, mode: m[11] === 'l' ? 'light' : m[11] === 'd' ? 'dark' : undefined,
  })
}
