import { clampGamut, contrast, ensureContrast, hexToOklch, mix, textOn, toHex, type Lch } from '../lib/color'
import type { Rng } from '../lib/rng'
import type { Palette } from '../types'

/** Blue→purple band that reads as "default AI gradient" — avoided unless explicitly chosen. */
export const BANNED_HUE: [number, number] = [250, 320]
export const isBannedHue = (h: number) => h >= BANNED_HUE[0] && h <= BANNED_HUE[1]

/** Move a hue out of the banned band (towards the nearest edge). */
export function safeHue(h: number): number {
  h = ((h % 360) + 360) % 360
  if (!isBannedHue(h)) return h
  return h < 285 ? BANNED_HUE[0] - 12 : BANNED_HUE[1] + 14
}

export type Strategy = 'tonal' | 'complement' | 'earth' | 'dark' | 'pop' | 'paper'

export interface PaletteSpec {
  bg: Lch
  surfaceShift: number
  ink: Lch
  accent: Lch
  accent2: Lch
  dark: boolean
}

/** Turn loose colour intent into a contrast-checked palette. */
export function buildPalette(spec: PaletteSpec): Palette {
  const bg = toHex(clampGamut(spec.bg))
  const dark = spec.dark
  const surfaceL = dark ? spec.bg.l + 0.05 : spec.bg.l + spec.surfaceShift
  const surface = toHex(clampGamut({ l: surfaceL, c: spec.bg.c * (1 + Math.abs(spec.surfaceShift) * 4), h: spec.bg.h }))
  const ink = toHex(ensureContrast(clampGamut(spec.ink), bg, 9))
  const mutedBase = hexToOklch(mix(ink, bg, 0.38))
  const muted = toHex(ensureContrast(mutedBase, bg, 4.8))
  const line = toHex(clampGamut({ l: dark ? spec.bg.l + 0.16 : spec.bg.l - 0.14, c: Math.max(0.02, spec.bg.c), h: spec.bg.h }))
  const accentFit = ensureContrast(clampGamut(spec.accent), bg, 3)
  const accent = toHex(accentFit)
  const accent2 = toHex(ensureContrast(clampGamut(spec.accent2), bg, 3))
  const accentText = toHex(ensureContrast(accentFit, bg, 4.6))
  const onAccent = textOn(accent, spec.ink.h)
  const inverse = dark
    ? toHex(clampGamut({ l: 0.94, c: 0.03, h: spec.bg.h }))
    : toHex(clampGamut({ l: 0.2, c: Math.max(0.025, spec.ink.c), h: spec.ink.h }))
  const onInverse = textOn(inverse, spec.ink.h)
  return { bg, surface, ink, muted, line, accent, accent2, onAccent, accentText, inverse, onInverse }
}

export function paletteIssues(p: Palette): string[] {
  const out: string[] = []
  const chk = (a: string, b: string, min: number, label: string) => {
    const c = contrast(a, b)
    if (c < min) out.push(`${label} ${c.toFixed(2)}:1 (needs ${min}:1)`)
  }
  chk(p.ink, p.bg, 7, 'Ink on background')
  chk(p.muted, p.bg, 4.5, 'Muted text on background')
  chk(p.onAccent, p.accent, 4.5, 'Text on accent')
  chk(p.accentText, p.bg, 4.5, 'Accent text on background')
  chk(p.onInverse, p.inverse, 7, 'Text on inverse')
  chk(p.ink, p.surface, 7, 'Ink on surface')
  chk(p.accent, p.bg, 3, 'Accent on background')
  return out
}

export interface PaletteOpts {
  strategy?: Strategy
  hueRange?: [number, number]
  darkChance?: number
}

export function genPalette(rng: Rng, o: PaletteOpts = {}): { palette: Palette; hue: number; strategy: Strategy } {
  const strategy: Strategy =
    o.strategy ??
    rng.weighted<Strategy>([
      ['tonal', 2], ['complement', 3], ['earth', 2], ['dark', (o.darkChance ?? 0.2) * 10], ['pop', 2], ['paper', 3],
    ])
  const [lo, hi] = o.hueRange ?? [0, 360]
  const hue = safeHue(rng.range(lo, hi))
  const off = safeHue(hue + rng.pick([150, 165, 180, 195, 210, 35, -40, 120]))
  const inkH = rng.chance(0.5) ? hue : off
  let spec: PaletteSpec
  switch (strategy) {
    case 'tonal':
      spec = {
        bg: { l: rng.range(0.94, 0.975), c: rng.range(0.02, 0.05), h: hue }, surfaceShift: -rng.range(0.03, 0.06),
        ink: { l: 0.2, c: 0.04, h: hue }, accent: { l: rng.range(0.5, 0.62), c: rng.range(0.15, 0.22), h: hue },
        accent2: { l: rng.range(0.72, 0.84), c: rng.range(0.1, 0.16), h: safeHue(hue + rng.pick([-25, 30, 45])) }, dark: false,
      }
      break
    case 'complement':
      spec = {
        bg: { l: rng.range(0.93, 0.97), c: rng.range(0.015, 0.035), h: hue }, surfaceShift: rng.pick([-0.04, 0.03]),
        ink: { l: 0.22, c: 0.035, h: inkH }, accent: { l: rng.range(0.55, 0.66), c: rng.range(0.17, 0.24), h: hue },
        accent2: { l: rng.range(0.6, 0.78), c: rng.range(0.14, 0.2), h: off }, dark: false,
      }
      break
    case 'earth': {
      const eh = rng.range(40, 100)
      spec = {
        bg: { l: rng.range(0.9, 0.95), c: rng.range(0.03, 0.055), h: eh }, surfaceShift: -rng.range(0.04, 0.07),
        ink: { l: 0.24, c: 0.04, h: eh - 10 }, accent: { l: rng.range(0.5, 0.58), c: rng.range(0.15, 0.2), h: safeHue(rng.pick([28, 40, 140, 190, 350])) },
        accent2: { l: rng.range(0.55, 0.7), c: rng.range(0.06, 0.1), h: safeHue(eh + rng.pick([-40, 60, 100])) }, dark: false,
      }
      break
    }
    case 'dark':
      spec = {
        bg: { l: rng.range(0.15, 0.22), c: rng.range(0.015, 0.04), h: hue }, surfaceShift: 0.05,
        ink: { l: 0.95, c: 0.02, h: hue }, accent: { l: rng.range(0.74, 0.86), c: rng.range(0.14, 0.2), h: safeHue(hue + rng.pick([0, 40, 180])) },
        accent2: { l: rng.range(0.65, 0.78), c: rng.range(0.1, 0.16), h: off }, dark: true,
      }
      break
    case 'pop':
      spec = {
        bg: { l: rng.range(0.82, 0.9), c: rng.range(0.1, 0.16), h: hue }, surfaceShift: 0.07,
        ink: { l: 0.17, c: 0.04, h: hue }, accent: { l: rng.range(0.42, 0.52), c: rng.range(0.14, 0.2), h: off },
        accent2: { l: rng.range(0.4, 0.5), c: rng.range(0.12, 0.17), h: safeHue(hue + 20) }, dark: false,
      }
      break
    default: // paper
      spec = {
        bg: { l: rng.range(0.955, 0.985), c: rng.range(0.008, 0.02), h: rng.pick([60, 85, 100, 20, 150]) }, surfaceShift: -0.035,
        ink: { l: 0.16, c: 0.02, h: inkH }, accent: { l: rng.range(0.5, 0.6), c: rng.range(0.19, 0.25), h: hue },
        accent2: { l: rng.range(0.78, 0.88), c: rng.range(0.12, 0.17), h: off }, dark: false,
      }
  }
  const palette = buildPalette(spec)
  return { palette, hue: hexToOklch(palette.accent).h, strategy }
}

/** Palette from sampled image colours (see imagePalette.ts). */
export function paletteFromSwatches(sw: { hex: string; share: number }[]): Palette {
  const lch = sw.map((s) => ({ ...hexToOklch(s.hex), share: s.share }))
  const chroma = lch.slice().sort((a, b) => b.c * Math.sqrt(b.share) - a.c * Math.sqrt(a.share))
  const lightest = lch.slice().sort((a, b) => b.l - a.l)[0]
  const darkest = lch.slice().sort((a, b) => a.l - b.l)[0]
  const accent = chroma[0]
  const second = chroma.find((c) => Math.abs(c.h - accent.h) > 30 && c.c > 0.05) ?? chroma[1] ?? accent
  const dark = lightest.l < 0.6
  return buildPalette({
    bg: dark ? { l: Math.max(0.16, darkest.l * 0.8), c: Math.min(0.04, darkest.c), h: darkest.h } : { l: 0.955, c: Math.min(0.035, Math.max(0.012, lightest.c)), h: lightest.c > 0.01 ? lightest.h : accent.h },
    surfaceShift: -0.04,
    ink: dark ? { l: 0.95, c: 0.02, h: lightest.h } : { l: 0.2, c: Math.min(0.04, darkest.c + 0.01), h: darkest.c > 0.01 ? darkest.h : accent.h },
    accent: { l: accent.l, c: Math.max(0.1, accent.c), h: accent.h },
    accent2: { l: second.l, c: Math.max(0.08, second.c), h: second.h },
    dark,
  })
}
