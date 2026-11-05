// Fonts: any free Google font. The seed picks a heading and a body face (curated pairings some of the time,
// otherwise rule-based pairings from the whole catalogue); the user can type their own two.
import type { Tokens } from '../types'
import { stageRng } from '../lib/rng'
import type { BodyFace, FontCat, FontSpec, HeadingFace } from '../types'
import rows from './googleFonts.json'

export interface GFont { family: string; cat: FontCat; rank: number; weights: number[] }

const CATS: FontCat[] = ['serif', 'sans', 'display', 'script', 'mono']
export const GOOGLE_FONTS: GFont[] = (rows as [string, number, number, number[]][]).map(([family, c, rank, weights]) => ({ family, cat: CATS[c], rank, weights }))
const BY_NAME = new Map(GOOGLE_FONTS.map((f) => [f.family.toLowerCase(), f]))

export const findFont = (name: string): GFont | undefined => BY_NAME.get(name.trim().toLowerCase())

/** Autocomplete: names that start with the query first, then names that contain it, most popular first. */
export function searchFonts(q: string, limit = 8): GFont[] {
  const s = q.trim().toLowerCase()
  if (!s) return GOOGLE_FONTS.slice(0, limit)
  const starts: GFont[] = []
  const has: GFont[] = []
  for (const f of GOOGLE_FONTS) {
    const n = f.family.toLowerCase()
    if (n.startsWith(s)) starts.push(f)
    else if (n.includes(s)) has.push(f)
    if (starts.length >= limit) break
  }
  return [...starts, ...has].slice(0, limit)
}

/** Faces that read as default-looking AI-site type; never picked by the generator. */
export const BANNED_FONTS = ['inter', 'roboto', 'system-ui', 'arial', 'helvetica', 'open sans', 'lato', 'poppins', 'montserrat', 'sans-serif-default', 'google sans']

const nearest = (weights: number[], target: number) => weights.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a))

export function headingFace(g: GFont): HeadingFace {
  return { family: g.family, cat: g.cat, weight: nearest(g.weights, 700) }
}
export function bodyFace(g: GFont): BodyFace {
  const regular = nearest(g.weights, 400)
  const strong = nearest(g.weights, 600)
  return { family: g.family, cat: g.cat, weights: [...new Set([regular, strong >= 500 ? strong : regular])].sort((a, b) => a - b) }
}

// ---------- curated pairings (sensible by hand) ----------
interface Pair { id: string; h: string; b: string; moods: string[] }
export const CURATED: Pair[] = [
  { id: 'fraunces-hanken', h: 'Fraunces', b: 'Hanken Grotesk', moods: ['warm', 'editorial', 'playful', 'organic'] },
  { id: 'instrument', h: 'Instrument Serif', b: 'Instrument Sans', moods: ['editorial', 'luxe', 'calm'] },
  { id: 'bricolage', h: 'Bricolage Grotesque', b: 'Hanken Grotesk', moods: ['playful', 'bold', 'warm'] },
  { id: 'newsreader-work', h: 'Newsreader', b: 'Work Sans', moods: ['calm', 'editorial', 'organic'] },
  { id: 'dmserif-dmsans', h: 'DM Serif Display', b: 'DM Sans', moods: ['warm', 'luxe', 'editorial'] },
  { id: 'plex', h: 'IBM Plex Serif', b: 'IBM Plex Sans', moods: ['technical', 'editorial', 'calm'] },
  { id: 'unbounded-manrope', h: 'Unbounded', b: 'Manrope', moods: ['bold', 'playful', 'technical'] },
  { id: 'syne-epilogue', h: 'Syne', b: 'Epilogue', moods: ['bold', 'brutal', 'playful'] },
  { id: 'gloock-schibsted', h: 'Gloock', b: 'Schibsted Grotesk', moods: ['luxe', 'editorial', 'warm'] },
  { id: 'epilogue-newsreader', h: 'Epilogue', b: 'Newsreader', moods: ['brutal', 'editorial', 'bold'] },
  { id: 'spacegrotesk-plexmono', h: 'Space Grotesk', b: 'IBM Plex Mono', moods: ['technical', 'brutal', 'retro'] },
  { id: 'youngserif-public', h: 'Young Serif', b: 'Public Sans', moods: ['warm', 'organic', 'calm', 'playful'] },
  { id: 'anton-spectral', h: 'Anton', b: 'Spectral', moods: ['brutal', 'bold', 'retro'] },
  { id: 'cormorant-work', h: 'Cormorant Garamond', b: 'Work Sans', moods: ['luxe', 'calm', 'editorial'] },
  { id: 'archivo-spectral', h: 'Archivo', b: 'Spectral', moods: ['editorial', 'bold', 'technical'] },
  { id: 'caslon-dmsans', h: 'Libre Caslon Text', b: 'DM Sans', moods: ['retro', 'editorial', 'luxe'] },
  { id: 'spacemono-syne', h: 'Space Mono', b: 'Syne', moods: ['retro', 'technical', 'brutal', 'playful'] },
  { id: 'jetbrains-newsreader', h: 'JetBrains Mono', b: 'Newsreader', moods: ['technical', 'brutal', 'calm'] },
  { id: 'sora-lora', h: 'Sora', b: 'Lora', moods: ['calm', 'organic', 'technical'] },
]

const specOfPair = (p: Pair): FontSpec => ({ heading: headingFace(findFont(p.h)!), body: bodyFace(findFont(p.b)!) })

// ---------- rule-based pairing ----------
/** How likely each category is to be the heading face, by mood. */
const HEAD_WEIGHTS: Record<string, Record<FontCat, number>> = {
  calm: { serif: 3, sans: 3, display: 0.5, script: 0.3, mono: 0.3 },
  bold: { serif: 1.5, sans: 3, display: 3, script: 0.1, mono: 0.3 },
  playful: { serif: 1, sans: 2, display: 3, script: 1, mono: 0.2 },
  editorial: { serif: 4, sans: 2, display: 1, script: 0.1, mono: 0.2 },
  technical: { serif: 1, sans: 3, display: 0.5, script: 0, mono: 2 },
  warm: { serif: 3, sans: 2, display: 1.5, script: 0.6, mono: 0.1 },
  luxe: { serif: 4, sans: 1.5, display: 1.5, script: 0.5, mono: 0.1 },
  brutal: { serif: 1, sans: 3, display: 3, script: 0, mono: 1.5 },
  organic: { serif: 3, sans: 2.5, display: 1, script: 0.6, mono: 0.1 },
  retro: { serif: 2.5, sans: 1.5, display: 3, script: 0.6, mono: 1 },
}
const isBanned = (f: GFont) => BANNED_FONTS.includes(f.family.toLowerCase())

/** Sibling of the same superfamily in a different category (IBM Plex Serif + IBM Plex Sans, Noto Serif + Noto Sans). */
function sibling(h: GFont): GFont | undefined {
  const first = h.family.split(' ').slice(0, h.family.startsWith('IBM') || h.family.startsWith('Noto') ? 2 : 1).join(' ')
  const want: FontCat[] = h.cat === 'serif' ? ['sans'] : h.cat === 'sans' ? ['serif'] : []
  return GOOGLE_FONTS.find((f) => f.family !== h.family && f.family.startsWith(first + ' ') && want.includes(f.cat) && !isBanned(f))
}

function genRuleBased(rng: ReturnType<typeof stageRng>, mood: string): FontSpec {
  const w = HEAD_WEIGHTS[mood] ?? HEAD_WEIGHTS.editorial
  const cat = rng.weighted(CATS.map((c) => [c, w[c]] as const))
  const popular = (c: FontCat[], top: number, need400 = false) => GOOGLE_FONTS.filter((f) => c.includes(f.cat) && f.rank <= top && !isBanned(f) && (!need400 || f.weights.includes(400)))
  const pool = popular([cat], rng.chance(0.2) ? 1500 : 650)
  const h = rng.pick(pool.length ? pool : popular(['serif', 'sans'], 650))
  // body: a readable serif or sans, usually of the other kind
  const sib = h.cat === 'serif' || h.cat === 'sans' ? sibling(h) : undefined
  let b: GFont | undefined = sib && rng.chance(0.3) ? sib : undefined
  if (!b) {
    const opposite: FontCat[] = h.cat === 'serif' ? ['sans'] : h.cat === 'sans' ? ['serif'] : rng.chance(0.65) ? ['sans'] : ['serif']
    const bodyCats: FontCat[] = rng.chance(h.cat === 'sans' ? 0.5 : 0.75) ? opposite : ['serif', 'sans']
    const bodies = popular(bodyCats, 450, true).filter((f) => f.family !== h.family)
    b = rng.pick(bodies)
  }
  return { heading: headingFace(h), body: bodyFace(b) }
}

/** Seeded pairing: a curated pair about a third of the time, otherwise any two Google fonts that pair sensibly. */
export function genFonts(seed: number, mood: string): FontSpec {
  const rng = stageRng(seed, 'fonts')
  if (rng.chance(0.35)) {
    const pool = CURATED.filter((p) => p.moods.includes(mood))
    return specOfPair(rng.pick(pool.length ? pool : CURATED))
  }
  return genRuleBased(rng, mood)
}

// ---------- using a spec ----------
/** The fonts for a token set (designs saved before fonts were free-form stored a pair id). */
export function fontSpec(t: Pick<Tokens, 'fonts' | 'fontId'>): FontSpec {
  if (t.fonts) return t.fonts
  return specOfPair(CURATED.find((p) => p.id === t.fontId) ?? CURATED[0])
}

export const fontKey = (f: FontSpec) => `${f.heading.family}|${f.body.family}`

export function fontsUrl(f: FontSpec): string {
  const need = new Map<string, Set<number>>()
  const add = (family: string, ws: number[]) => need.set(family, new Set([...(need.get(family) ?? []), ...ws]))
  add(f.heading.family, [f.heading.weight])
  add(f.body.family, f.body.weights)
  const fam = [...need].map(([n, ws]) => `family=${n.replace(/ /g, '+')}:wght@${[...ws].sort((a, b) => a - b).join(';')}`)
  return `https://fonts.googleapis.com/css2?${fam.join('&')}&display=swap`
}

const FALLBACK: Record<FontCat, string> = {
  serif: "Georgia, 'Times New Roman', serif",
  sans: "'Helvetica Neue', Arial, sans-serif",
  display: "'Helvetica Neue', Arial, sans-serif",
  script: 'cursive',
  mono: 'ui-monospace, Menlo, monospace',
}
export function fontStacks(f: FontSpec) {
  // labels, tags and table heads use the system mono, so a design only ever loads the two chosen fonts
  return {
    display: `'${f.heading.family}', ${FALLBACK[f.heading.cat]}`,
    body: `'${f.body.family}', ${FALLBACK[f.body.cat]}`,
    mono: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
  }
}

const loaded = new Set<string>()
/** Inject the Google Fonts stylesheet for a spec (editor only). */
export function loadFont(f: FontSpec) {
  const url = fontsUrl(f)
  if (typeof document === 'undefined' || loaded.has(url)) return
  loaded.add(url)
  const l = document.createElement('link')
  l.rel = 'stylesheet'
  l.href = url
  document.head.appendChild(l)
}
