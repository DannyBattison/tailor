import { makeRng, stageRng } from '../lib/rng'
import { mk, walk } from '../lib/tree'
import type { DNode, Doc, Kind, Locks, Meta, PartSeeds, Props, Signature } from '../types'
import { ALL_ARCHETYPES, SECTIONS, archetypesFor, backdropProps, bandRhythm, clearBackdrop, planFor, type Ctx } from './build'
import { loremApp, loremMarketing } from './lorem'
import { sigOf, tooClose, type Sig } from './guard'
import { MOOD_NAMES } from './moods'
import { MOTION_PARTS, fixSignature, genMotion, genTokens, tokensFromParts } from './tokens'

export interface GenOpts {
  /** base seed: parts that aren't given explicitly are derived from it */
  seed: number
  kind: Kind
  mood: string // '' = pick from the seed (or keep the previous design's mood when a token part is locked)
  parts?: Partial<PartSeeds>
  bgBold?: number
  mode?: 'light' | 'dark'
  locks?: Partial<Locks>
  prev?: Doc
}

/** How many bits each part's seed has. Together with the 12-bit setup block they fill nine words of the design code. */
export const SEED_BITS: PartSeeds = { palette: 11, fonts: 11, shape: 11, layout: 9, text: 8, backdrops: 7, ambient: 4, entrance: 4, interaction: 6, nav: 6 }
export const seedSize = (k: keyof PartSeeds) => 2 ** SEED_BITS[k]
/** Any number, folded into a part's range. */
export const fitSeed = (k: keyof PartSeeds, n: number) => Math.abs(Math.floor(n)) % seedSize(k)
const PART_KEYS = ['palette', 'fonts', 'shape', 'layout', 'text', 'backdrops', 'ambient', 'entrance', 'interaction', 'nav'] as const
/** Independent seeds for every part (each within its own range), derived from one base seed. */
export const partsFromSeed = (n: number): PartSeeds =>
  Object.fromEntries(PART_KEYS.map((k) => [k, stageRng(n, 'part:' + k).int(0, seedSize(k) - 1)])) as unknown as PartSeeds
/** The part seeds behind a design (older saved designs fall back to what they stored, and derive the parts they never had). */
export const partsOf = (d: Doc): PartSeeds => ({ ...partsFromSeed(d.meta.seed), layout: d.meta.layoutSeed, text: d.meta.contentSeed ?? d.meta.layoutSeed, ...d.meta.parts })
/** A design saved before animation (or navigation) had its own part gets the animation its seed now describes. */
export function upgradeDoc(d: Doc): Doc {
  const old = partsOf(d)
  if (!d.meta.edited && PART_KEYS.some((k) => old[k] >= seedSize(k))) { // from before the seed became words: fold its seeds into the new ranges so the design matches its code
    const parts = Object.fromEntries(PART_KEYS.map((k) => [k, fitSeed(k, old[k])])) as unknown as PartSeeds
    return generate({ seed: parts.palette, kind: d.meta.kind, mood: d.meta.mood, parts, bgBold: d.tokens.bgBold, mode: d.tokens.mode })
  }
  const missing = MOTION_PARTS.filter((k) => (k === 'nav' ? !d.tokens.navLink : !d.tokens.ambient))
  if (!missing.length) return d
  const parts = partsOf(d)
  return { ...d, meta: { ...d.meta, parts }, tokens: { ...d.tokens, ...Object.assign({}, ...missing.map((k) => genMotion(k, parts[k], d.meta.mood))) } }
}
export const archetypeFor = (kind: Kind, layoutSeed: number) => stageRng(layoutSeed, 'archetype').pick(archetypesFor(kind)).id
export const moodFor = (seed: number) => stageRng(seed, 'mood').pick(MOOD_NAMES)

export function contentFor(seed: number) {
  return { c: loremMarketing(seed), a: loremApp(seed) }
}

const mapAll = (n: DNode, fn: (n: DNode) => DNode): DNode => fn({ ...n, children: n.children.map((c) => mapAll(c, fn)) })

/** Backdrops for every hero/band/tile that takes one (post-order, so a seed always lands the same). */
export function applyBackdrops(root: DNode, seed: number): DNode {
  const rng = makeRng(seed)
  let hero: Props | undefined
  return mapAll(root, (n) => {
    if (!n.props.bdGen) return n
    const role = n.props.bdRole
    const base = { ...n.props, ...clearBackdrop(), bdGen: true, bdRole: role, bdFlat: n.props.bdFlat }
    // one backdrop family per page: the hero chooses, the closing call may echo it, everything else stays plain
    if (role === 'hero') { hero = backdropProps(rng, 'hero', n.props.bg, !!n.props.bdFlat); return { ...n, props: { ...base, ...hero } } }
    if (role === 'cta' && hero?.backdrop && rng.chance(0.6)) {
      const k = hero.backdrop as string
      const loud = n.props.bg === 'accent' || n.props.bg === 'inverse'
      const ok = !(loud && ['wash', 'split', 'photo', 'grid'].includes(k)) && !(n.props.bg === 'accent' && k === 'aurora') && !(n.props.bdFlat && ['art', 'photo', 'split'].includes(k))
      if (ok) return { ...n, props: { ...base, ...hero, bdRole: role, bdFlat: n.props.bdFlat, bdSeed: rng.int(1, 9999) } }
    }
    return { ...n, props: base }
  })
}

export function generate(o: GenOpts): Doc {
  const locks = o.locks ?? {}
  const prev = o.prev
  const same = prev && prev.meta.kind === o.kind ? prev : undefined // layout and text only carry over within a kind
  const pp = prev ? partsOf(prev) : undefined
  const parts: PartSeeds = partsFromSeed(o.seed)
  if (pp) {
    if (locks.palette) parts.palette = pp.palette
    if (locks.fonts) parts.fonts = pp.fonts
    if (locks.shape) parts.shape = pp.shape
    if (same && locks.layout) { parts.layout = pp.layout; parts.backdrops = pp.backdrops }
    if (same && locks.copy) parts.text = pp.text
    for (const k of MOTION_PARTS) if (locks[k]) parts[k] = pp[k]
  }
  Object.assign(parts, o.parts)
  const mood = o.mood || (prev && (locks.palette || locks.fonts || locks.shape) ? prev.meta.mood : moodFor(o.seed))
  const bgBold = o.bgBold ?? prev?.tokens.bgBold
  const mode = o.mode ?? prev?.tokens.mode
  const fromParts = tokensFromParts(parts, mood, { bgBold, mode, kind: o.kind })
  const tokens = genTokens(parts, mood, { bgBold, mode, kind: o.kind, prev: prev?.tokens, locks })
  const archetype = archetypeFor(o.kind, parts.layout)
  const arch = ALL_ARCHETYPES.find((a) => a.id === archetype)!
  const cont = contentFor(parts.text)
  const x: Ctx = { plan: planFor(parts.layout), rng: stageRng(parts.layout, 'layout:' + arch.id), t: tokens, c: cont.c, a: cont.a }
  const built = mk('page', {}, arch.build(x))
  bandRhythm(built)
  const root = applyBackdrops(mk('page', {}, postProcess(built.children, x, parts.layout)), parts.backdrops)
  const meta: Meta = {
    seed: o.seed, kind: o.kind, mood, archetype, layoutSeed: parts.layout, contentSeed: parts.text, parts,
    name: o.kind === 'app' ? cont.a.name : cont.c.name,
    // a locked group carried over from a hand-edited design no longer matches its seed
    edited: JSON.stringify(tokens) !== JSON.stringify(fromParts) ? true : undefined,
  }
  return { root, tokens, meta }
}

/** Apply the design's one signature move at the tree level (CSS handles the rest). */
function postProcess(nodes: DNode[], x0: Ctx, layoutSeed: number): DNode[] {
  const sig = x0.t.signature
  const x: Ctx = { ...x0, rng: stageRng(layoutSeed, 'sig:' + sig) } // its own stream, so swapping the signature later gives the same result as generating it
  const out = nodes.slice()
  const page = mk('page', {}, out)
  if (sig === 'marquee' && x.c && !hasType(page, 'marquee')) {
    const at = out.findIndex((n) => n.type === 'section' || n.type === 'box')
    const band = SECTIONS['marquee.band'](x)
    band.props.sigBand = true
    if (x.t.signature === 'marquee' && out[0]?.type === 'box') {
      // sidebar layouts: place the band inside the main column instead
      const main = out[0].children[out[0].children.length - 1]
      if (main?.type === 'box') main.children.splice(1, 0, band)
    } else out.splice(Math.max(1, at + 1), 0, band)
  }
  if (sig === 'inverted') {
    const cands: DNode[] = []
    const order: DNode[] = []
    walk(page, (n) => { if (n.type === 'section' && n.props.role !== 'nav') order.push(n) })
    const calm = (n: DNode) => { const i = order.indexOf(n); return order[i - 1]?.props.bg !== 'inverse' && order[i + 1]?.props.bg !== 'inverse' } // never two inverse bands in a row
    walk(page, (n) => {
      if (n.type === 'section' && calm(n) && !['nav', 'footer', 'marquee'].includes(n.props.role) && !String(n.props.build).startsWith('hero') && n.props.bg !== 'inverse' && !String(n.props.build).startsWith('app.topbar')) cands.push(n)
    })
    const pick = cands.length ? cands[Math.floor(cands.length / 2)] : null
    if (pick) pick.props = { ...pick.props, bg: 'inverse', sigInverted: true, sigBg: pick.props.bg ?? '' } // remember the fill it replaces so the signature can be swapped back out
  }
  return out
}

const hasType = (n: DNode, t: string): boolean => n.type === t || n.children.some((c) => hasType(c, t))

/** Generate, rejecting results that are too close to recent designs. */
export function generateGuarded(o: GenOpts, history: Sig[], avoid: Sig[] = []): Doc {
  let doc = generate(o)
  for (let i = 1; i <= 14 && tooClose(sigOf(doc), [...history, ...avoid]); i++) {
    doc = generate({ ...o, seed: o.seed + i * 7919, parts: undefined })
  }
  return doc
}

export function generateVariants(o: GenOpts, history: Sig[]): Doc[] {
  const archs = makeRng(o.seed).shuffle(archetypesFor(o.kind)).slice(0, 4)
  const out: Doc[] = []
  archs.forEach((a, i) => {
    // find a plain seed whose layout is the wanted archetype, so every variant is just "a number" as a code
    let pick: Doc | null = null
    for (let k = 0; k < 400 && !pick; k++) {
      const seed = o.seed + i * 104729 + k * 7919
      if (archetypeFor(o.kind, partsFromSeed(seed).layout) !== a.id) continue
      const doc = generate({ ...o, seed, locks: undefined, prev: undefined })
      if (!tooClose(sigOf(doc), [...history, ...out.map(sigOf)]) || k > 300) pick = doc
    }
    out.push(pick ?? generate({ ...o, seed: o.seed + i, locks: undefined, prev: undefined }))
  })
  return out
}

/** Swap the signature move without rebuilding: updates tokens and adds/removes the marquee band or inverted section. */
export function withSignature(doc: Doc, sig: Signature): Doc {
  if (doc.meta.kind === 'app' && sig === 'marquee') sig = 'hardShadow'
  const tokens = fixSignature({ ...doc.tokens, signature: sig })
  const strip = (n: DNode): DNode => {
    const props = { ...n.props }
    if (props.sigInverted) {
      if (props.sigBg) props.bg = props.sigBg
      else delete props.bg
      delete props.sigInverted
      delete props.sigBg
    }
    return { ...n, props, children: n.children.filter((c) => !c.props.sigBand).map(strip) }
  }
  const clean = strip(doc.root)
  const cont = contentFor(doc.meta.contentSeed ?? doc.meta.layoutSeed)
  const x: Ctx = { plan: planFor(doc.meta.layoutSeed), rng: makeRng(0), t: tokens, c: cont.c, a: cont.a }
  let root: DNode = { ...clean, children: postProcess(clean.children, x, doc.meta.layoutSeed) }
  root = applyBackdrops(root, partsOf(doc).backdrops) // backdrops depend on each band's fill, so redo them after the signature changes it
  return { ...doc, tokens, root }
}
