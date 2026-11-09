// The design code ("seed"): a short string that recreates a generated design exactly. Base64url, so it is also a safe filename.
//   10 part seeds of 3 characters (palette, fonts, shape, layout, text, backdrops, ambient, entrance, interaction, nav)
//   + a 2-character setup block: 12 bits = mood index (4) · kind (1: marketing/app) · background boldness in 5% steps (5) · mode (2: natural/light/dark)
// Re-rolling a part rewrites only its own block. Older all-digit codes (35 digits before the animation blocks, 50 before nav) still load; generate() derives the missing seeds.
import type { Doc, Kind, PartSeeds } from '../types'
import { MOOD_NAMES } from './moods'
import { generate, partsOf } from './generate'
import { DEFAULT_BG_BOLD } from './palette'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const ORDER: (keyof PartSeeds)[] = ['palette', 'fonts', 'shape', 'layout', 'text', 'backdrops', 'ambient', 'entrance', 'interaction', 'nav']
const PART_CHARS = 3
const SETUP_CHARS = 2
export const CODE_LENGTH = ORDER.length * PART_CHARS + SETUP_CHARS
const LEGACY_LENGTHS = [35, 50] // all digits, 5 per block, the last block being setup

const b64 = (n: number, w: number) => Array.from({ length: w }, (_, i) => ALPHABET[(n >> (6 * (w - 1 - i))) & 63]).join('')
const unb64 = (s: string) => [...s].reduce((n, ch) => n * 64 + ALPHABET.indexOf(ch), 0)

export function designCode(doc: Doc): string {
  const p = partsOf(doc)
  const bold = Math.round((doc.tokens.bgBold ?? DEFAULT_BG_BOLD) * 20)
  const mode = doc.tokens.mode === 'light' ? 1 : doc.tokens.mode === 'dark' ? 2 : 0
  const setup = (MOOD_NAMES.indexOf(doc.meta.mood) << 8) | ((doc.meta.kind === 'app' ? 1 : 0) << 7) | (bold << 2) | mode
  return ORDER.map((k) => b64(p[k], PART_CHARS)).join('') + b64(setup, SETUP_CHARS)
}

const strip = (s: string) => s.replace(/\s+/g, '')
const isBase64 = (c: string) => c.length === CODE_LENGTH && [...c].every((ch) => ALPHABET.includes(ch))
const isLegacy = (c: string) => /^\d+$/.test(c) && LEGACY_LENGTHS.includes(c.length)
export const isCode = (s: string) => { const c = strip(s); return isBase64(c) || isLegacy(c.replace(/-/g, '')) }

/** Recreate a design from its code, or null when the code isn't one. */
export function fromCode(code: string): Doc | null {
  const c = strip(code)
  if (isBase64(c)) {
    const parts = Object.fromEntries(ORDER.map((k, i) => [k, unb64(c.slice(i * PART_CHARS, (i + 1) * PART_CHARS))])) as unknown as PartSeeds
    const setup = unb64(c.slice(ORDER.length * PART_CHARS))
    const mood = MOOD_NAMES[setup >> 8], bold = (setup >> 2) & 31, mode = setup & 3
    if (!mood || bold > 20 || mode > 2 || ORDER.some((k) => parts[k] > 99999)) return null
    return generate({ seed: parts.palette, kind: setup & 128 ? 'app' : 'marketing', mood, parts, bgBold: bold / 20, mode: mode === 1 ? 'light' : mode === 2 ? 'dark' : undefined })
  }
  const d = c.replace(/-/g, '')
  if (!isLegacy(d)) return null
  const n = (i: number) => +d.slice(i * 5, i * 5 + 5)
  const blocks = d.length / 5 - 1
  const parts = Object.fromEntries(ORDER.slice(0, blocks).map((k, i) => [k, n(i)])) as unknown as PartSeeds
  const setup = d.slice(blocks * 5)
  const mood = MOOD_NAMES[+setup[0]]
  const bold = +setup.slice(2, 4)
  if (!mood || bold > 20 || +setup[4] > 2) return null
  const kind: Kind = setup[1] === '1' ? 'app' : 'marketing'
  return generate({ seed: parts.palette, kind, mood, parts, bgBold: bold / 20, mode: setup[4] === '1' ? 'light' : setup[4] === '2' ? 'dark' : undefined })
}
