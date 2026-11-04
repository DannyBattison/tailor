import { clampGamut, contrast, ensureContrast, hexToOklch, mix, textOn, toHex } from '../lib/color'
import type { Rng } from '../lib/rng'
import type { Palette, PaletteSpec } from '../types'

/** Blue→purple band that reads as "default AI gradient" — avoided unless explicitly chosen. */
export const BANNED_HUE: [number, number] = [250, 338]
export const isBannedHue = (h: number) => h >= BANNED_HUE[0] && h <= BANNED_HUE[1]

/** Move a hue out of the banned band (towards the nearest edge). */
export function safeHue(h: number): number {
  h = ((h % 360) + 360) % 360
  if (!isBannedHue(h)) return h
  return h < 294 ? BANNED_HUE[0] - 12 : BANNED_HUE[1] + 10
}

export type Strategy = 'tonal' | 'complement' | 'earth' | 'dark' | 'pop' | 'paper'

export type { PaletteSpec }

export const DEFAULT_BG_BOLD = 0.2

/** Fade the background from quiet (near-neutral, barely tinted) up to the spec's full colour. */
export function applyBgBold(spec: PaletteSpec, bold: number): PaletteSpec {
  const t = Math.min(1, Math.max(0, bold))
  const quietL = spec.dark ? 0.17 : 0.975
  return { ...spec, bg: { h: spec.bg.h, c: 0.008 + (spec.bg.c - 0.008) * t, l: quietL + (spec.bg.l - quietL) * t } }
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
  // push the accent until text on it reaches 4.5:1 (darker on light pages, lighter on dark ones)
  let fit = accentFit
  for (let i = 0; i < 40 && contrast(textOn(toHex(fit), spec.ink.h), toHex(fit)) < 4.6; i++) fit = clampGamut({ ...fit, l: fit.l + (dark ? 0.02 : -0.02) })
  const accent = toHex(fit)
  // accent2 is a supporting tone (tags, marquee, art): it must carry ink text, not fight the accent
  const accent2 = toHex(ensureContrast(clampGamut(spec.accent2), ink, 4.6))
  const accentText = toHex(ensureContrast(fit, bg, 4.6))
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
  chk(p.ink, p.accent2, 4.5, 'Ink on accent 2')
  return out
}

export interface PaletteOpts {
  strategy?: Strategy
  hueRange?: [number, number]
  darkChance?: number
  bgBold?: number
}

export function genPalette(rng: Rng, o: PaletteOpts = {}): { palette: Palette; hue: number; strategy: Strategy; spec: PaletteSpec } {
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
        ink: { l: 0.2, c: 0.04, h: hue }, accent: { l: rng.range(0.5, 0.62), c: rng.range(0.12, 0.17), h: hue },
        accent2: { l: rng.range(0.82, 0.9), c: rng.range(0.05, 0.09), h: safeHue(hue + rng.pick([-20, 0, 25])) }, dark: false,
      }
      break
    case 'complement':
      spec = {
        bg: { l: rng.range(0.93, 0.97), c: rng.range(0.015, 0.035), h: hue }, surfaceShift: rng.pick([-0.04, 0.03]),
        ink: { l: 0.22, c: 0.035, h: inkH }, accent: { l: rng.range(0.48, 0.58), c: rng.range(0.13, 0.19), h: hue },
        accent2: { l: rng.range(0.8, 0.88), c: rng.range(0.06, 0.1), h: off }, dark: false,
      }
      break
    case 'earth': {
      const eh = rng.range(40, 100)
      spec = {
        bg: { l: rng.range(0.9, 0.95), c: rng.range(0.03, 0.055), h: eh }, surfaceShift: -rng.range(0.04, 0.07),
        ink: { l: 0.24, c: 0.04, h: eh - 10 }, accent: { l: rng.range(0.5, 0.58), c: rng.range(0.15, 0.2), h: safeHue(rng.pick([28, 40, 140, 190, 350])) },
        accent2: { l: rng.range(0.78, 0.86), c: rng.range(0.05, 0.08), h: safeHue(eh + rng.pick([-20, 25, 40])) }, dark: false,
      }
      break
    }
    case 'dark':
      spec = {
        bg: { l: rng.range(0.15, 0.22), c: rng.range(0.015, 0.04), h: hue }, surfaceShift: 0.05,
        ink: { l: 0.95, c: 0.02, h: hue }, accent: { l: rng.range(0.7, 0.8), c: rng.range(0.09, 0.14), h: safeHue(hue + rng.pick([0, 40, 180])) },
        accent2: { l: rng.range(0.3, 0.4), c: rng.range(0.05, 0.09), h: safeHue(hue + rng.pick([-20, 0, 20])) }, dark: true,
      }
      break
    case 'pop':
      spec = {
        bg: { l: rng.range(0.9, 0.94), c: rng.range(0.025, 0.05), h: hue }, surfaceShift: 0.05,
        ink: { l: 0.17, c: 0.04, h: hue }, accent: { l: rng.range(0.42, 0.52), c: rng.range(0.13, 0.17), h: off },
        accent2: { l: rng.range(0.9, 0.95), c: rng.range(0.05, 0.09), h: safeHue(hue + rng.pick([-15, 15])) }, dark: false,
      }
      break
    default: // paper
      spec = {
        bg: { l: rng.range(0.955, 0.985), c: rng.range(0.008, 0.02), h: rng.pick([60, 85, 100, 20, 150]) }, surfaceShift: -0.035,
        ink: { l: 0.16, c: 0.02, h: inkH }, accent: { l: rng.range(0.46, 0.56), c: rng.range(0.14, 0.2), h: hue },
        accent2: { l: rng.range(0.86, 0.92), c: rng.range(0.06, 0.1), h: safeHue(hue + rng.pick([-20, 20])) }, dark: false,
      }
  }
  const palette = buildPalette(applyBgBold(spec, o.bgBold ?? DEFAULT_BG_BOLD))
  return { palette, hue: hexToOklch(palette.accent).h, strategy, spec }
}

/** Palette from sampled image colours (see imagePalette.ts). */
export function specFromSwatches(sw: { hex: string; share: number }[]): PaletteSpec {
  const lch = sw.map((s) => ({ ...hexToOklch(s.hex), share: s.share }))
  const chroma = lch.slice().sort((a, b) => b.c * Math.sqrt(b.share) - a.c * Math.sqrt(a.share))
  const lightest = lch.slice().sort((a, b) => b.l - a.l)[0]
  const darkest = lch.slice().sort((a, b) => a.l - b.l)[0]
  const accent = chroma[0]
  const second = chroma.find((c) => Math.abs(c.h - accent.h) > 30 && c.c > 0.05) ?? chroma[1] ?? accent
  const dark = lightest.l < 0.6
  return {
    bg: dark ? { l: Math.max(0.16, darkest.l * 0.8), c: Math.min(0.04, darkest.c), h: darkest.h } : { l: 0.955, c: Math.min(0.035, Math.max(0.012, lightest.c)), h: lightest.c > 0.01 ? lightest.h : accent.h },
    surfaceShift: -0.04,
    ink: dark ? { l: 0.95, c: 0.02, h: lightest.h } : { l: 0.2, c: Math.min(0.04, darkest.c + 0.01), h: darkest.c > 0.01 ? darkest.h : accent.h },
    accent: { l: accent.l, c: Math.max(0.1, accent.c), h: accent.h },
    accent2: { l: second.l, c: Math.max(0.08, second.c), h: second.h },
    dark,
  }
}
