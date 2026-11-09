// Pure re-roll transforms. Each one gives a part a new seed and rebuilds only that part, so the design
// code (see code.ts) always describes the result exactly.
import type { Doc, PartSeeds, Tokens } from '../types'
import { applyBackdrops, archetypeFor, fitSeed, generate, partsOf, seedSize, withSignature } from './generate'
import { MOTION_FIELDS, genMotion, motionGroup, paletteGroup, shapeGroup, tokensFromParts, type MotionPart } from './tokens'

const withParts = (doc: Doc, patch: Partial<PartSeeds>): Doc => ({ ...doc, meta: { ...doc.meta, parts: { ...partsOf(doc), ...patch } } })
// every re-roll takes any number and folds it into the part's range, so the design code can always hold the result

export type TokenPart = 'palette' | 'fonts' | 'shape'

/** New palette, fonts, or shape (everything in Shape & rhythm, signature included). Other parts, and hand edits to them, are untouched. */
export function rerollToken(doc: Doc, part: TokenPart, n: number): Doc {
  const seed = fitSeed(part, n)
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
  let layout = fitSeed('layout', seed)
  while (archetypeFor(doc.meta.kind, layout) === doc.meta.archetype) layout = (layout + 7919) % seedSize('layout') // never "re-roll" into the same archetype
  return generate({ seed: doc.meta.seed, kind: doc.meta.kind, mood: doc.meta.mood, parts: { ...partsOf(doc), layout }, prev: doc, locks: { ...KEEP_TOKENS, copy: true } })
}

/** New lorem ipsum; layout and tokens stay. */
export function rerollText(doc: Doc, seed: number): Doc {
  return generate({ seed: doc.meta.seed, kind: doc.meta.kind, mood: doc.meta.mood, parts: { ...partsOf(doc), text: fitSeed('text', seed) }, prev: doc, locks: { ...KEEP_TOKENS, layout: true } })
}

/** New background, entrance or interaction animation. Always lands on a different style, so a re-roll is never a no-op. */
export function rerollMotion(doc: Doc, part: MotionPart, seed: number): Doc {
  const now = JSON.stringify(motionGroup(doc.tokens, part))
  let s = fitSeed(part, seed)
  for (let i = 0; i < seedSize(part) && JSON.stringify(genMotion(part, s, doc.meta.mood)) === now; i++) s = (s + 7919) % seedSize(part)
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
  let s = fitSeed(part, seed)
  for (let i = 0; i < Math.min(400, seedSize(part)); i++, s = (s + 7919) % seedSize(part)) {
    const g = genMotion(part, s, doc.meta.mood) as Record<string, unknown>
    if (g[field] !== now[field] && rest.every((k) => g[k] === now[k])) return { ...withParts(doc, { [part]: s }), tokens: { ...doc.tokens, ...g } }
  }
  return rerollMotion(doc, part, seed)
}

/** Every animation part at once (locked ones are skipped by the caller). */
export const rerollAnimation = (doc: Doc, parts: MotionPart[], seeds: number[]): Doc => parts.reduce((d, p, i) => rerollMotion(d, p, seeds[i]), doc)

export function rerollBackdrops(doc: Doc, seed: number): Doc {
  const s = fitSeed('backdrops', seed)
  return { ...withParts(doc, { backdrops: s }), root: applyBackdrops(doc.root, s) }
}
