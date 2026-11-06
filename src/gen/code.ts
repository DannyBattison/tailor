// The design code ("seed"): a fixed-width string that recreates a generated design exactly.
//   9 part seeds of 5 digits (palette, fonts, shape, layout, text, backdrops, ambient, entrance, interaction)
//   + 1 setup block of 5 digits:  M K BB m  = mood index, kind (0 marketing / 1 app), background boldness in 5% steps, mode (0 natural / 1 light / 2 dark)
// Re-rolling a part rewrites only its own block. Codes from before the animation blocks (6 parts) still load; generate() derives the missing seeds.
import type { Doc, Kind, PartSeeds } from '../types'
import { MOOD_NAMES } from './moods'
import { generate, partsOf } from './generate'
import { DEFAULT_BG_BOLD } from './palette'

const pad = (n: number, w = 5) => String(n).padStart(w, '0')
const ORDER: (keyof PartSeeds)[] = ['palette', 'fonts', 'shape', 'layout', 'text', 'backdrops', 'ambient', 'entrance', 'interaction']
export const CODE_LENGTH = (ORDER.length + 1) * 5
const LEGACY_LENGTH = 35

export function designCode(doc: Doc): string {
  const p = partsOf(doc)
  const bold = Math.round((doc.tokens.bgBold ?? DEFAULT_BG_BOLD) * 20)
  const mode = doc.tokens.mode === 'light' ? 1 : doc.tokens.mode === 'dark' ? 2 : 0
  const setup = `${MOOD_NAMES.indexOf(doc.meta.mood)}${doc.meta.kind === 'app' ? 1 : 0}${pad(bold, 2)}${mode}`
  return ORDER.map((k) => pad(p[k])).join('') + setup
}

export const isCode = (s: string) => new RegExp(`^(\\d{${CODE_LENGTH}}|\\d{${LEGACY_LENGTH}})$`).test(s.replace(/[\s-]/g, ''))

/** Recreate a design from its code, or null when the code isn't one. */
export function fromCode(code: string): Doc | null {
  const c = code.replace(/[\s-]/g, '')
  if (!isCode(c)) return null
  const n = (i: number) => +c.slice(i * 5, i * 5 + 5)
  const blocks = c.length / 5 - 1
  const parts = Object.fromEntries(ORDER.slice(0, blocks).map((k, i) => [k, n(i)])) as unknown as PartSeeds
  const setup = c.slice(blocks * 5)
  const mood = MOOD_NAMES[+setup[0]]
  const bold = +setup.slice(2, 4)
  if (!mood || bold > 20 || +setup[4] > 2) return null
  const kind: Kind = setup[1] === '1' ? 'app' : 'marketing'
  return generate({ seed: parts.palette, kind, mood, parts, bgBold: bold / 20, mode: setup[4] === '1' ? 'light' : setup[4] === '2' ? 'dark' : undefined })
}
