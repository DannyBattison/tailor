// Pure re-roll transforms. Each one gives a part a new seed and rebuilds only that part, so the design
// code (see code.ts) always describes the result exactly.
import type { Doc, PartSeeds } from '../types'
import { SEED_MAX, applyBackdrops, archetypeFor, generate, partsOf, withSignature } from './generate'
import { paletteGroup, shapeGroup, tokensFromParts } from './tokens'

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

const KEEP_TOKENS = { palette: true, fonts: true, shape: true }

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

export function rerollBackdrops(doc: Doc, seed: number): Doc {
  const next = withParts(doc, { backdrops: seed })
  return { ...next, root: applyBackdrops(doc.root, seed) }
}
