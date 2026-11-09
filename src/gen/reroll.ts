// Pure re-roll transforms. Each one gives a part a new seed and rebuilds only that part, so the design
// code (see code.ts) always describes the result exactly.
import type { Doc, PartSeeds, Tokens } from '../types'
import { SEED_MAX, applyBackdrops, archetypeFor, generate, partsOf, withSignature } from './generate'
import { MOTION_FIELDS, genMotion, motionGroup, paletteGroup, shapeGroup, tokensFromParts, type MotionPart } from './tokens'

const withParts = (doc: Doc, patch: Partial<PartSeeds>): Doc => ({ ...doc, meta: { ...doc.meta, parts: { ...partsOf(doc), ...patch } } })

export type TokenPart = 'palette' | 'fonts' | 'shape'

/** New palette, fonts, or shape (everything in Shape & rhythm, signature included). Other parts, and hand edits to them, are untouched. */
export function rerollToken(doc: Doc, part: TokenPart, seed: number): Doc {
  const next = withParts(doc, { [part]: seed })
  const fresh = tokensFromParts(partsOf(next), doc.meta.mood, { bgBold: doc.tokens.bgBold, mode: doc.tokens.mode, kind: doc.meta.kind })
  if (part === 'palette') return { ...next, tokens: { ...next.tokens, ...paletteGroup(fresh) } }
  if (part === 'fonts') return { ...next, tokens: { ...next.tokens, fonts: fresh.fonts, fontId: undefined } }
  // the signature move also edits the tree (marquee band, inverted section)
  return withSignature({ ...next, tokens: { ...next.tokens, ...shapeGroup(fresh) } }, fresh.signature)
}

const KEEP_TOKENS = { palette: true, fonts: true, shape: true, ambient: true, entrance: true, interaction: true, nav: true }

/** A different archetype and arrangement; tokens and text stay. */
export function rerollLayout(doc: Doc, seed: number): Doc {
  let layout = seed
  while (archetypeFor(doc.meta.kind, layout) === doc.meta.archetype) layout = (layout + 7919) % (SEED_MAX + 1) // never "re-roll" into the same archetype
  return generate({ seed: doc.meta.seed, kind: doc.meta.kind, mood: doc.meta.mood, parts: { ...partsOf(doc), layout }, prev: doc, locks: { ...KEEP_TOKENS, copy: true } })
}

/** New lorem ipsum; layout and tokens stay. */
export function rerollText(doc: Doc, seed: number): Doc {
  return generate({ seed: doc.meta.seed, kind: doc.meta.kind, mood: doc.meta.mood, parts: { ...partsOf(doc), text: seed }, prev: doc, locks: { ...KEEP_TOKENS, layout: true } })
}

/** New background, entrance or interaction animation. Always lands on a different style, so a re-roll is never a no-op. */
export function rerollMotion(doc: Doc, part: MotionPart, seed: number): Doc {
  const now = JSON.stringify(motionGroup(doc.tokens, part))
  let s = seed
  while (JSON.stringify(genMotion(part, s, doc.meta.mood)) === now) s = (s + 7919) % (SEED_MAX + 1)
  return { ...withParts(doc, { [part]: s }), tokens: { ...doc.tokens, ...genMotion(part, s, doc.meta.mood) } }
}

/**
 * Re-roll one setting inside an animation part (say the hover style, leaving its timing alone). A part's seed fixes all of its
 * settings at once, so this looks for a nearby seed that changes only the wanted one; the design code stays exact.
 * Falls back to a whole-part re-roll when no seed does it.
 */
export function rerollMotionField(doc: Doc, part: MotionPart, field: keyof Tokens, seed: number): Doc {
  const now = motionGroup(doc.tokens, part) as Record<string, unknown>
  const rest = MOTION_FIELDS[part].filter((k) => k !== field)
  let s = seed
  for (let i = 0; i < 400; i++, s = (s + 7919) % (SEED_MAX + 1)) {
    const g = genMotion(part, s, doc.meta.mood) as Record<string, unknown>
    if (g[field] !== now[field] && rest.every((k) => g[k] === now[k])) return { ...withParts(doc, { [part]: s }), tokens: { ...doc.tokens, ...g } }
  }
  return rerollMotion(doc, part, seed)
}

/** Every animation part at once (locked ones are skipped by the caller). */
export const rerollAnimation = (doc: Doc, parts: MotionPart[], seeds: number[]): Doc => parts.reduce((d, p, i) => rerollMotion(d, p, seeds[i]), doc)

export function rerollBackdrops(doc: Doc, seed: number): Doc {
  const next = withParts(doc, { backdrops: seed })
  return { ...next, root: applyBackdrops(doc.root, seed) }
}
