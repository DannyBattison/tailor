import { stageRng } from '../lib/rng'
import type { Locks, Tokens } from '../types'
import { FONT_PAIRS } from './fonts'
import { MOODS } from './moods'
import { genPalette } from './palette'

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

/** Signature moves imply shape constraints (hard shadow needs a border, ruled needs rules). */
export function fixSignature(t: Tokens): Tokens {
  if (t.signature === 'hardShadow') return { ...t, shadow: 'hard', border: Math.max(2, t.border) }
  if (t.signature === 'ruled') return { ...t, border: Math.max(1.5, t.border) }
  return t
}

/** Generate tokens; locked parts are copied from `prev`. Shape, rhythm and signature are locked independently. */
export function genTokens(seed: number, mood: string, prev?: Tokens, locks?: Partial<Locks>): Tokens {
  const keep = (k: keyof Locks) => !!prev && !!locks?.[k]
  const pal = keep('palette') ? { palette: prev!.palette, hue: prev!.hue, paletteStrategy: prev!.paletteStrategy } : genPaletteTokens(seed, mood)
  const fontId = keep('fonts') ? prev!.fontId : genFontId(seed, mood)
  const g = genShape(seed, mood)
  const t: Tokens = {
    ...pal, fontId,
    radius: keep('shape') ? prev!.radius : g.radius,
    border: keep('shape') ? prev!.border : g.border,
    shadow: keep('shape') ? prev!.shadow : g.shadow,
    density: keep('rhythm') ? prev!.density : g.density,
    scale: keep('rhythm') ? prev!.scale : g.scale,
    headingCase: keep('rhythm') ? prev!.headingCase : g.headingCase,
    tracking: keep('rhythm') ? prev!.tracking : g.tracking,
    signature: keep('signature') ? prev!.signature : g.signature,
  }
  return fixSignature(t)
}
