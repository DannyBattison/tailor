// OKLCH colour maths with sRGB gamut clamping and WCAG contrast.
export interface Lch {
  l: number
  c: number
  h: number
}

const toLin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const toGam = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)

export function oklchToLinear({ l, c, h }: Lch): [number, number, number] {
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.291485548 * b
  const L = l_ ** 3
  const M = m_ ** 3
  const S = s_ ** 3
  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ]
}

const inGamut = (rgb: number[]) => rgb.every((v) => v >= -0.0005 && v <= 1.0005)

/** Reduce chroma until the colour fits sRGB (keeps L and H). */
export function clampGamut(col: Lch): Lch {
  const l = Math.min(1, Math.max(0, col.l))
  if (inGamut(oklchToLinear({ ...col, l }))) return { ...col, l }
  let lo = 0
  let hi = col.c
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2
    if (inGamut(oklchToLinear({ l, c: mid, h: col.h }))) lo = mid
    else hi = mid
  }
  return { l, c: lo, h: col.h }
}

export function oklchToRgb(col: Lch): [number, number, number] {
  const g = clampGamut(col)
  return oklchToLinear(g).map((v) => Math.round(Math.min(1, Math.max(0, toGam(v))) * 255)) as [number, number, number]
}

export function toHex(col: Lch): string {
  return '#' + oklchToRgb(col).map((v) => v.toString(16).padStart(2, '0')).join('')
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)]
}

export function rgbToOklch(r: number, g: number, b: number): Lch {
  const [lr, lg, lb] = [r, g, b].map((v) => toLin(v / 255))
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const c = Math.hypot(a, bb)
  let h = (Math.atan2(bb, a) * 180) / Math.PI
  if (h < 0) h += 360
  return { l: L, c, h: c < 1e-4 ? 0 : h }
}

export const hexToOklch = (hex: string) => rgbToOklch(...hexToRgb(hex))

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => toLin(v / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Move L of `fg` away from `bg` until `min` contrast is reached. */
export function ensureContrast(fg: Lch, bg: string, min: number): Lch {
  const bgDark = luminance(bg) < 0.4
  let cur = { ...fg }
  for (let i = 0; i < 60; i++) {
    if (contrast(toHex(cur), bg) >= min) return cur
    cur = { ...cur, l: cur.l + (bgDark ? 0.015 : -0.015) }
    if (cur.l >= 1 || cur.l <= 0) break
  }
  // last resort: near-black / near-white tinted
  return { l: bgDark ? 0.97 : 0.15, c: Math.min(fg.c, 0.02), h: fg.h }
}

/** Best of two candidates for text on a given background. */
export function textOn(bg: string, hue: number): string {
  const dark = toHex({ l: 0.18, c: 0.02, h: hue })
  const light = toHex({ l: 0.975, c: 0.012, h: hue })
  return contrast(dark, bg) >= contrast(light, bg) ? dark : light
}

export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  const f = (x: number, y: number) => Math.round(x + (y - x) * t)
  return '#' + [f(r1, r2), f(g1, g2), f(b1, b2)].map((v) => v.toString(16).padStart(2, '0')).join('')
}
