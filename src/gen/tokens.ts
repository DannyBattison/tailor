import { stageRng } from '../lib/rng'
import type { Locks, PartSeeds, Tokens } from '../types'
import { fontSpec, genFonts } from './fonts'
import { MOODS } from './moods'
import { DEFAULT_BG_BOLD, genPalette } from './palette'

export function genPaletteTokens(seed: number, mood: string, bgBold = DEFAULT_BG_BOLD, mode?: 'light' | 'dark') {
  const rng = stageRng(seed, 'palette')
  const m = MOODS[mood] ?? MOODS.editorial
  const strategy = rng.weighted(m.strategies)
  const range = rng.pick(m.hues)
  const { palette, hue, spec } = genPalette(rng, { strategy, hueRange: range, bgBold, mode })
  return { palette, hue, spec, bgBold, mode, paletteStrategy: strategy as string }
}

/** Mood ranges stay the bias, but stretched 40% of the way to the global range so re-rolls move visibly. */
const widen = ([lo, hi]: [number, number], [glo, ghi]: [number, number]): [number, number] => [lo + (glo - lo) * 0.4, hi + (ghi - hi) * 0.4]

export function genShape(seed: number, mood: string) {
  const rng = stageRng(seed, 'shape')
  const m = MOODS[mood] ?? MOODS.editorial
  const signature = rng.pick(m.signatures)
  // the mood's shadows are favoured 3:1, but any shadow can come up, so a re-roll isn't stuck on one
  let shadow = rng.weighted((['none', 'soft', 'hard'] as const).map((k) => [k, m.shadow.includes(k) ? 3 : 1] as const))
  let border = rng.pick(m.border)
  if (signature === 'hardShadow') { shadow = 'hard'; border = Math.max(2, border) }
  if (signature === 'ruled') border = Math.max(1.5, border)
  return {
    radius: rng.pick(m.radius),
    border,
    shadow,
    density: +rng.range(...widen(m.density, [0.8, 1.3])).toFixed(2),
    scale: +rng.range(...widen(m.scale, [1.15, 1.65])).toFixed(3),
    headingCase: rng.pick(m.cases),
    tracking: +rng.range(...widen(m.tracking, [-0.05, 0.08])).toFixed(3),
    signature,
    // drawn last so every other shape value is the same as before motion existed
    motion: signature === 'hardShadow' || m.shadow.length === 1 && m.shadow[0] === 'hard' ? rng.weighted([['snappy', 3], ['smooth', 1], ['springy', 1]] as const) : rng.weighted([['smooth', 3], ['snappy', 1.5], ['springy', 2]] as const),
  }
}

/** Signature moves imply shape constraints (hard shadow needs a border, ruled needs rules). */
export function fixSignature(t: Tokens): Tokens {
  if (t.signature === 'hardShadow') return { ...t, shadow: 'hard', border: Math.max(2, t.border) }
  if (t.signature === 'ruled') return { ...t, border: Math.max(1.5, t.border) }
  return t
}

const PALETTE_KEYS = ['palette', 'hue', 'spec', 'bgBold', 'mode', 'paletteStrategy'] as const
const SHAPE_KEYS = ['radius', 'border', 'shadow', 'density', 'scale', 'headingCase', 'tracking', 'signature', 'motion'] as const

/** Palette group of tokens (colours + how they were derived). */
export const paletteGroup = (t: Tokens) => Object.fromEntries(PALETTE_KEYS.map((k) => [k, t[k]])) as Pick<Tokens, (typeof PALETTE_KEYS)[number]>
/** Shape group of tokens: everything in the Shape & rhythm section, signature included. */
export const shapeGroup = (t: Tokens) => Object.fromEntries(SHAPE_KEYS.map((k) => [k, t[k]])) as Pick<Tokens, (typeof SHAPE_KEYS)[number]>

export interface TokenOpts { bgBold?: number; mode?: 'light' | 'dark'; kind?: 'marketing' | 'app' }

/** Tokens straight from part seeds: the same seeds always give the same tokens. */
export function tokensFromParts(parts: PartSeeds, mood: string, o: TokenOpts = {}): Tokens {
  const t: Tokens = {
    ...genPaletteTokens(parts.palette, mood, o.bgBold ?? DEFAULT_BG_BOLD, o.mode),
    fonts: genFonts(parts.fonts, mood),
    ...genShape(parts.shape, mood),
  }
  const fixed = fixSignature(t)
  if (o.kind === 'app' && fixed.signature === 'marquee') return fixSignature({ ...fixed, signature: 'hardShadow' }) // marquee copy is marketing-only
  return fixed
}

/** Same, then copy locked groups from `prev` exactly (so hand-edited colours or fonts survive a lock). */
export function genTokens(parts: PartSeeds, mood: string, o: TokenOpts & { prev?: Tokens; locks?: Partial<Locks> } = {}): Tokens {
  const t = tokensFromParts(parts, mood, o)
  const { prev, locks } = o
  if (!prev || !locks) return t
  return fixSignature({
    ...t,
    ...(locks.palette ? paletteGroup(prev) : {}),
    ...(locks.fonts ? { fonts: fontSpec(prev), fontId: undefined } : {}),
    ...(locks.shape ? shapeGroup(prev) : {}),
  })
}
