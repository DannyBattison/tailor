import { fontSpec } from '../gen/fonts'
import { contrast, ensureContrast, hexToOklch, mix, textOn, toHex } from '../lib/color'
import type { Palette, Props, Tokens } from '../types'

/** Nudge `fg` until it reads on `bg`; if it can't get there, fall back to plain black/white-ish text. */
const fit = (fg: string, bg: string, min = 4.5) => {
  const out = toHex(ensureContrast(hexToOklch(fg), bg, min))
  return contrast(out, bg) >= min - 0.05 ? out : textOn(bg, hexToOklch(bg).h)
}

/**
 * Colour pairs for placehold.co that belong to the theme: a real colour field with a text colour
 * taken from the same family (not stock black/white), always contrast-checked.
 *  0 tinted paper · 1 accent-2 field · 2 accent field · 3 deep field
 */
export function placeholdColors(pal: Palette, tone = 0): { bg: string; fg: string } {
  switch (((tone % 4) + 4) % 4) {
    case 0: {
      const bg = mix(pal.surface, pal.accent, 0.22)
      return { bg, fg: fit(pal.accentText, bg) }
    }
    case 1:
      return { bg: pal.accent2, fg: fit(mix(pal.accent, pal.ink, 0.35), pal.accent2) }
    case 2:
      return { bg: pal.accent, fg: fit(mix(pal.onAccent, pal.accent2, 0.3), pal.accent) }
    default: {
      const bg = mix(pal.accent, pal.inverse, 0.55)
      return { bg, fg: fit(mix(pal.onInverse, pal.accent2, 0.35), bg) }
    }
  }
}

/** https://placehold.co URL in palette colours, sized from the node's ratio, lettered in the theme's serif/sans. */
export function placeholdUrl(p: Props, t?: Tokens, w = 1200): string {
  const [rw, rh] = String(p.ratio ?? '4/3').split('/').map(Number)
  const h = Math.round((w * (rh || 3)) / (rw || 4))
  const pal = t?.palette
  const { bg, fg } = pal ? placeholdColors(pal, p.tone ?? 0) : { bg: '#d9d4c7', fg: '#3a362e' }
  const text = p.caption || `${rw || 4}:${rh || 3}`
  const font = t && fontSpec(t).heading.cat === 'serif' ? 'playfair-display' : 'source-sans-pro'
  // hideText: draw the label in the background colour so only a flat stand-in remains
  const ink = p.hideText ? bg : fg
  return `https://placehold.co/${w}x${h}/${bg.slice(1)}/${ink.slice(1)}?text=${encodeURIComponent(text).replace(/%20/g, '+')}&font=${font}`
}
