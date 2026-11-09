// The design code ("seed"): nine plain words that recreate a generated design exactly, e.g. "acorn-brook-cedar-...".
// 10 bits per word = 90 bits, read as one number, most significant first:
//   one spare bit (always 0) · the ten part seeds, each with its own width (see SEED_BITS: palette, fonts, shape, layout, text,
//   backdrops, ambient, entrance, interaction, nav) · 12 setup bits: mood (4) · kind, 0 marketing / 1 app (1) · background boldness in 5% steps (5) · mode, 0 natural / 1 light / 2 dark (2)
// Re-rolling a part changes only the bits that hold its seed. Words are case-insensitive, and may be separated by dashes, spaces or commas.
import type { Doc, PartSeeds } from '../types'
import { MOOD_NAMES } from './moods'
import { SEED_BITS, generate, partsOf } from './generate'
import { DEFAULT_BG_BOLD } from './palette'
import { WORDS, WORD_BITS, wordIndex } from './words'

const ORDER = Object.keys(SEED_BITS) as (keyof PartSeeds)[]
const SETUP_BITS = 12
const TOTAL_BITS = ORDER.reduce((n, k) => n + SEED_BITS[k], SETUP_BITS)
export const CODE_WORDS = Math.ceil(TOTAL_BITS / WORD_BITS)

export function designCode(doc: Doc): string {
  const p = partsOf(doc)
  const bold = Math.round((doc.tokens.bgBold ?? DEFAULT_BG_BOLD) * 20)
  const mode = doc.tokens.mode === 'light' ? 1 : doc.tokens.mode === 'dark' ? 2 : 0
  const setup = (MOOD_NAMES.indexOf(doc.meta.mood) << 8) | ((doc.meta.kind === 'app' ? 1 : 0) << 7) | (bold << 2) | mode
  let n = 0n
  for (const k of ORDER) n = (n << BigInt(SEED_BITS[k])) | BigInt(p[k] % 2 ** SEED_BITS[k])
  n = (n << BigInt(SETUP_BITS)) | BigInt(setup)
  const out: string[] = []
  for (let i = 0; i < CODE_WORDS; i++, n >>= BigInt(WORD_BITS)) out.unshift(WORDS[Number(n & BigInt(2 ** WORD_BITS - 1))])
  return out.join('-')
}

/** The words in a typed code, or null when there aren't exactly the right number of known ones. */
function wordsIn(code: string): number[] | null {
  const parts = code.toLowerCase().split(/[\s,.\-_]+/).filter(Boolean)
  const idx = parts.map(wordIndex)
  return parts.length === CODE_WORDS && idx.every((i) => i !== undefined) ? (idx as number[]) : null
}
export const isCode = (s: string) => !!wordsIn(s)

/** Why a typed code doesn't load, for the user: the first word that isn't in the list, or a count mismatch. */
export function codeProblem(code: string): string {
  const parts = code.toLowerCase().split(/[\s,.\-_]+/).filter(Boolean)
  const bad = parts.find((w) => wordIndex(w) === undefined)
  if (bad) return `"${bad}" is not a seed word`
  return `A seed is ${CODE_WORDS} words, not ${parts.length}`
}

/** Recreate a design from its code, or null when the code isn't one. */
export function fromCode(code: string): Doc | null {
  const idx = wordsIn(code)
  if (!idx) return null
  let n = idx.reduce((acc, i) => (acc << BigInt(WORD_BITS)) | BigInt(i), 0n)
  const take = (bits: number) => { const v = Number(n & ((1n << BigInt(bits)) - 1n)); n >>= BigInt(bits); return v }
  const setup = take(SETUP_BITS)
  const parts = {} as PartSeeds
  for (const k of [...ORDER].reverse()) parts[k] = take(SEED_BITS[k])
  const mood = MOOD_NAMES[setup >> 8], bold = (setup >> 2) & 31, mode = setup & 3
  if (!mood || bold > 20 || mode > 2 || n !== 0n) return null
  return generate({ seed: parts.palette, kind: setup & 128 ? 'app' : 'marketing', mood, parts, bgBold: bold / 20, mode: mode === 1 ? 'light' : mode === 2 ? 'dark' : undefined })
}
