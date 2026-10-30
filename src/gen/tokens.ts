import { stageRng } from '../lib/rng'
import type { Locks, Tokens } from '../types'
import { FONT_PAIRS } from './fonts'
import { MOODS } from './moods'
import { genPalette } from './palette'

export type TokenParts = Pick<Tokens, 'palette' | 'paletteStrategy' | 'hue'> & Pick<Tokens, 'fontId'> &
  Pick<Tokens, 'radius' | 'border' | 'shadow' | 'density' | 'scale' | 'headingCase' | 'tracking' | 'signature'>

export function genPaletteTokens(seed: number, mood: string) {
  const rng = stageRng(seed, 'palette')
  const m = MOODS[mood] ?? MOODS.editorial
  const strategy = rng.weighted(m.strategies)
  const range = rng.pick(m.hues)
  const { palette, hue } = genPalette(rng, { strategy, hueRange: range })
  return { palette, hue, paletteStrategy: strategy as string }
}

export function genFontId(seed: number, mood: string): string {
  const rng = stageRng(seed, 'fonts')
  const pool = FONT_PAIRS.filter((f) => f.tags.includes(mood))
  return rng.pick(pool.length ? pool : FONT_PAIRS).id
}

export function genShape(seed: number, mood: string) {
  const rng = stageRng(seed, 'shape')
  const m = MOODS[mood] ?? MOODS.editorial
  const signature = rng.pick(m.signatures)
  let shadow = rng.pick(m.shadow)
  let border = rng.pick(m.border)
  if (signature === 'hardShadow') { shadow = 'hard'; border = Math.max(2, border) }
  if (signature === 'ruled') border = Math.max(1.5, border)
  return {
    radius: rng.pick(m.radius),
    border,
    shadow,
    density: +rng.range(...m.density).toFixed(2),
    scale: +rng.range(...m.scale).toFixed(3),
    headingCase: rng.pick(m.cases),
    tracking: +rng.range(...m.tracking).toFixed(3),
    signature,
  }
}

/** Generate tokens; locked parts are copied from `prev`. */
export function genTokens(seed: number, mood: string, prev?: Tokens, locks?: Partial<Locks>): Tokens {
  const pal = prev && locks?.palette ? { palette: prev.palette, hue: prev.hue, paletteStrategy: prev.paletteStrategy } : genPaletteTokens(seed, mood)
  const fontId = prev && locks?.fonts ? prev.fontId : genFontId(seed, mood)
  const shape = prev && locks?.shape
    ? { radius: prev.radius, border: prev.border, shadow: prev.shadow, density: prev.density, scale: prev.scale, headingCase: prev.headingCase, tracking: prev.tracking, signature: prev.signature }
    : genShape(seed, mood)
  return { ...pal, fontId, ...shape }
}
