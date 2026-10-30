import type { FontPair } from '../types'

const P = (
  id: string, name: string, display: string, body: string, gf: string[], tags: string[],
  displayWeight: number, displayFallback: 'serif' | 'sans-serif', bodyFallback: 'serif' | 'sans-serif',
  extra: Partial<FontPair> = {},
): FontPair => ({ id, name, display, body, gf, tags, displayWeight, displayFallback, bodyFallback, ...extra })

export const FONT_PAIRS: FontPair[] = [
  P('fraunces-hanken', 'Fraunces / Hanken Grotesk', 'Fraunces', 'Hanken Grotesk', ['Fraunces:wght@400;600;800', 'Hanken Grotesk:wght@400;500;700'], ['warm', 'editorial', 'playful', 'organic'], 700, 'serif', 'sans-serif'),
  P('instrument', 'Instrument Serif / Instrument Sans', 'Instrument Serif', 'Instrument Sans', ['Instrument Serif:ital@0;1', 'Instrument Sans:wght@400;500;600'], ['editorial', 'luxe', 'calm'], 400, 'serif', 'sans-serif'),
  P('bricolage', 'Bricolage Grotesque', 'Bricolage Grotesque', 'Bricolage Grotesque', ['Bricolage Grotesque:wght@400;500;800'], ['playful', 'bold', 'warm'], 800, 'sans-serif', 'sans-serif'),
  P('newsreader-work', 'Newsreader / Work Sans', 'Newsreader', 'Work Sans', ['Newsreader:wght@400;600;800', 'Work Sans:wght@400;500;600'], ['calm', 'editorial', 'organic'], 600, 'serif', 'sans-serif'),
  P('dmserif-dmsans', 'DM Serif Display / DM Sans', 'DM Serif Display', 'DM Sans', ['DM Serif Display', 'DM Sans:wght@400;500;700'], ['warm', 'luxe', 'editorial'], 400, 'serif', 'sans-serif'),
  P('plex', 'IBM Plex Serif / Sans / Mono', 'IBM Plex Serif', 'IBM Plex Sans', ['IBM Plex Serif:wght@500;700', 'IBM Plex Sans:wght@400;500;600', 'IBM Plex Mono:wght@400;500'], ['technical', 'editorial', 'calm'], 700, 'serif', 'sans-serif', { mono: 'IBM Plex Mono' }),
  P('unbounded-manrope', 'Unbounded / Manrope', 'Unbounded', 'Manrope', ['Unbounded:wght@500;800', 'Manrope:wght@400;500;700'], ['bold', 'playful', 'technical'], 800, 'sans-serif', 'sans-serif', { caps: true }),
  P('syne-epilogue', 'Syne / Epilogue', 'Syne', 'Epilogue', ['Syne:wght@500;800', 'Epilogue:wght@400;500;700'], ['bold', 'brutal', 'playful'], 800, 'sans-serif', 'sans-serif', { caps: true }),
  P('gloock-schibsted', 'Gloock / Schibsted Grotesk', 'Gloock', 'Schibsted Grotesk', ['Gloock', 'Schibsted Grotesk:wght@400;500;700'], ['luxe', 'editorial', 'warm'], 400, 'serif', 'sans-serif'),
  P('epilogue-newsreader', 'Epilogue / Newsreader', 'Epilogue', 'Newsreader', ['Epilogue:wght@500;800', 'Newsreader:wght@400;500'], ['brutal', 'editorial', 'bold'], 800, 'sans-serif', 'serif'),
  P('spacegrotesk-plexmono', 'Space Grotesk / IBM Plex Mono', 'Space Grotesk', 'IBM Plex Mono', ['Space Grotesk:wght@500;700', 'IBM Plex Mono:wght@400;500'], ['technical', 'brutal', 'retro'], 700, 'sans-serif', 'sans-serif', { mono: 'IBM Plex Mono' }),
  P('youngserif-public', 'Young Serif / Public Sans', 'Young Serif', 'Public Sans', ['Young Serif', 'Public Sans:wght@400;500;700'], ['warm', 'organic', 'calm', 'playful'], 400, 'serif', 'sans-serif'),
  P('anton-spectral', 'Anton / Spectral', 'Anton', 'Spectral', ['Anton', 'Spectral:wght@400;500;700'], ['brutal', 'bold', 'retro'], 400, 'sans-serif', 'serif', { caps: true }),
  P('cormorant-work', 'Cormorant Garamond / Work Sans', 'Cormorant Garamond', 'Work Sans', ['Cormorant Garamond:wght@500;700', 'Work Sans:wght@400;500;600'], ['luxe', 'calm', 'editorial'], 600, 'serif', 'sans-serif'),
  P('archivo-spectral', 'Archivo / Spectral', 'Archivo', 'Spectral', ['Archivo:wght@500;800', 'Spectral:wght@400;500;700'], ['editorial', 'bold', 'technical'], 800, 'sans-serif', 'serif'),
  P('caslon-dmsans', 'Libre Caslon Text / DM Sans', 'Libre Caslon Text', 'DM Sans', ['Libre Caslon Text:wght@400;700', 'DM Sans:wght@400;500;700'], ['retro', 'editorial', 'luxe'], 700, 'serif', 'sans-serif'),
  P('spacemono-syne', 'Space Mono / Syne', 'Space Mono', 'Syne', ['Space Mono:wght@400;700', 'Syne:wght@400;500;700'], ['retro', 'technical', 'brutal', 'playful'], 700, 'sans-serif', 'sans-serif', { mono: 'Space Mono' }),
  P('jetbrains-newsreader', 'JetBrains Mono / Newsreader', 'JetBrains Mono', 'Newsreader', ['JetBrains Mono:wght@500;800', 'Newsreader:wght@400;500;600'], ['technical', 'brutal', 'calm'], 800, 'sans-serif', 'serif', { mono: 'JetBrains Mono' }),
  P('sora-lora', 'Sora / Lora', 'Sora', 'Lora', ['Sora:wght@500;700', 'Lora:wght@400;500;600'], ['calm', 'organic', 'technical'], 700, 'sans-serif', 'serif'),
]

export const BANNED_FONTS = ['inter', 'roboto', 'system-ui', 'arial', 'helvetica', 'open sans', 'lato', 'poppins', 'montserrat', 'sans-serif-default']

export const getFont = (id: string) => FONT_PAIRS.find((f) => f.id === id) ?? FONT_PAIRS[0]

export function fontsUrl(f: FontPair): string {
  return 'https://fonts.googleapis.com/css2?' + f.gf.map((x) => 'family=' + x.replace(/ /g, '+')).join('&') + '&display=swap'
}

export function fontStacks(f: FontPair) {
  const q = (n: string) => `'${n}'`
  const display = `${q(f.display)}, ${f.displayFallback === 'serif' ? "Georgia, 'Times New Roman', serif" : "'Helvetica Neue', Arial, sans-serif"}`
  const body = `${q(f.body)}, ${f.bodyFallback === 'serif' ? "Georgia, 'Times New Roman', serif" : "'Helvetica Neue', Arial, sans-serif"}`
  const mono = `${q(f.mono ?? 'IBM Plex Mono')}, ui-monospace, Menlo, monospace`
  return { display, body, mono }
}

const loaded = new Set<string>()
/** Inject a Google Fonts stylesheet for the pair (editor only). */
export function loadFont(f: FontPair) {
  if (typeof document === 'undefined' || loaded.has(f.id)) return
  loaded.add(f.id)
  const l = document.createElement('link')
  l.rel = 'stylesheet'
  l.href = fontsUrl(f)
  document.head.appendChild(l)
}
