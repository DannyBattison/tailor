import { hexToOklch } from './lib/color'
import { DEFAULT_BG_BOLD, paletteOf, specFromSwatches } from './gen/palette'
import type { Palette, PaletteSpec } from './types'

/** Canvas quantisation: bucket pixels at 4 bits/channel, merge near buckets, return top swatches. */
export async function extractSwatches(file: File | Blob, count = 6): Promise<{ hex: string; share: number }[]> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = () => rej(new Error('Could not read image'))
      i.src = url
    })
    const W = 96
    const H = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * W))
    const cv = document.createElement('canvas')
    cv.width = W
    cv.height = H
    const ctx = cv.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(img, 0, 0, W, H)
    const data = ctx.getImageData(0, 0, W, H).data
    const buckets = new Map<number, { r: number; g: number; b: number; n: number }>()
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue
      const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4)
      const b = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 }
      b.r += data[i]; b.g += data[i + 1]; b.b += data[i + 2]; b.n++
      buckets.set(key, b)
    }
    const total = [...buckets.values()].reduce((s, b) => s + b.n, 0) || 1
    const cols = [...buckets.values()].map((b) => ({ r: b.r / b.n, g: b.g / b.n, b: b.b / b.n, n: b.n })).sort((a, b) => b.n - a.n)
    const picked: typeof cols = []
    for (const c of cols) {
      const near = picked.find((p) => Math.hypot(p.r - c.r, p.g - c.g, p.b - c.b) < 48)
      if (near) near.n += c.n
      else picked.push({ ...c })
      if (picked.length > 24) break
    }
    return picked.sort((a, b) => b.n - a.n).slice(0, count).map((c) => ({ hex: '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join(''), share: c.n / total }))
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function paletteFromImage(file: File | Blob, bgBold = DEFAULT_BG_BOLD, mode?: 'light' | 'dark'): Promise<{ palette: Palette; spec: PaletteSpec; swatches: string[]; hue: number }> {
  const sw = await extractSwatches(file)
  const spec = specFromSwatches(sw)
  const palette = paletteOf(spec, bgBold, mode)
  return { palette, spec, swatches: sw.map((s) => s.hex), hue: hexToOklch(palette.accent).h }
}
