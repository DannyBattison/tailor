import { makeRng, stageRng } from '../lib/rng'
import { find, mk, walk } from '../lib/tree'
import type { DNode, Doc, Kind, Locks, Meta, PartSeeds, Signature } from '../types'
import { ART_KINDS } from '../render/art'
import { ALL_ARCHETYPES, SECTIONS, archetypesFor, backdropProps, clearBackdrop, roleOf, variantsOf, type Ctx } from './build'
import { loremApp, loremMarketing } from './lorem'
import { sigOf, tooClose, type Sig } from './guard'
import { MOOD_NAMES } from './moods'
import { fixSignature, genTokens, tokensFromParts } from './tokens'

export interface GenOpts {
  /** base seed: the default for every part that isn't given one */
  seed: number
  kind: Kind
  mood: string // '' = pick from the seed (or keep the previous design's mood when a token part is locked)
  parts?: Partial<PartSeeds>
  bgBold?: number
  mode?: 'light' | 'dark'
  locks?: Partial<Locks>
  prev?: Doc
}

export const baseParts = (n: number): PartSeeds => ({ palette: n, fonts: n, shape: n, layout: n, text: n, backdrops: 0, images: 0 })
/** The part seeds behind a design (older saved designs fall back to what they stored). */
export const partsOf = (d: Doc): PartSeeds => d.meta.parts ?? { ...baseParts(d.meta.seed), layout: d.meta.layoutSeed, text: d.meta.contentSeed ?? d.meta.layoutSeed }
export const archetypeFor = (kind: Kind, layoutSeed: number) => stageRng(layoutSeed, 'archetype').pick(archetypesFor(kind)).id
export const moodFor = (seed: number) => makeRng(seed).pick(MOOD_NAMES)

export function contentFor(seed: number) {
  return { c: loremMarketing(seed), a: loremApp(seed) }
}

const mapAll = (n: DNode, fn: (n: DNode) => DNode): DNode => fn({ ...n, children: n.children.map((c) => mapAll(c, fn)) })

/** New backdrops for every hero/band/tile that was given one at generation (post-order, so a seed always lands the same). */
export function applyBackdrops(root: DNode, seed: number): DNode {
  const rng = makeRng(seed)
  return mapAll(root, (n) => (n.props.bdGen ? { ...n, props: { ...n.props, ...clearBackdrop(), ...backdropProps(rng, n.props.bdRole, n.props.bg, !!n.props.bdFlat) } } : n))
}

/** New art motif, seed and tone for every generated-art image. */
export function applyImages(root: DNode, seed: number): DNode {
  const rng = makeRng(seed)
  return mapAll(root, (n) => (n.type === 'image' ? { ...n, props: { ...n.props, art: rng.pick(ART_KINDS), seed: rng.int(1, 9999), tone: rng.int(0, 3) } } : n))
}

export function generate(o: GenOpts): Doc {
  const locks = o.locks ?? {}
  const prev = o.prev
  const same = prev && prev.meta.kind === o.kind ? prev : undefined // layout and text only carry over within a kind
  const pp = prev ? partsOf(prev) : undefined
  const parts: PartSeeds = baseParts(o.seed)
  if (pp) {
    if (locks.palette) parts.palette = pp.palette
    if (locks.fonts) parts.fonts = pp.fonts
    if (locks.shape) parts.shape = pp.shape
    if (same && locks.layout) { parts.layout = pp.layout; parts.backdrops = pp.backdrops; parts.images = pp.images }
    if (same && locks.copy) parts.text = pp.text
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
  const x: Ctx = { rng: stageRng(parts.layout, 'layout:' + arch.id), t: tokens, c: cont.c, a: cont.a }
  let root = mk('page', {}, postProcess(arch.build(x), x, parts.layout))
  if (parts.backdrops) root = applyBackdrops(root, parts.backdrops)
  if (parts.images) root = applyImages(root, parts.images)
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
    walk(page, (n) => {
      if (n.type === 'section' && !['nav', 'footer', 'marquee'].includes(n.props.role) && !String(n.props.build).startsWith('hero') && n.props.bg !== 'inverse' && !String(n.props.build).startsWith('app.topbar')) cands.push(n)
    })
    const pick = cands.length ? cands[Math.floor(cands.length / 2)] : null
    if (pick) pick.props = { ...pick.props, bg: 'inverse', sigInverted: true }
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
      if (archetypeFor(o.kind, seed) !== a.id) continue
      const doc = generate({ ...o, seed, locks: undefined, prev: undefined })
      if (!tooClose(sigOf(doc), [...history, ...out.map(sigOf)]) || k > 300) pick = doc
    }
    out.push(pick ?? generate({ ...o, seed: o.seed + i, locks: undefined, prev: undefined }))
  })
  return out
}

/** Re-roll just one section: same tokens and content, different structural variant. */
export function regenSection(doc: Doc, sectionId: string, seed: number): DNode | null {
  const old = find(doc.root, sectionId)
  if (!old || old.type !== 'section') return null
  const build = String(old.props.build ?? '')
  if (!SECTIONS[build]) return null
  const alts = variantsOf(roleOf(build))
  const rng = makeRng(seed)
  const pickKey = alts.length > 1 ? rng.pick(alts.filter((k) => k !== build)) : build
  const cont = contentFor(doc.meta.contentSeed ?? doc.meta.layoutSeed)
  const x: Ctx = { rng, t: doc.tokens, c: cont.c, a: cont.a }
  const next = SECTIONS[pickKey](x)
  if (old.props.bg === 'inverse' && next.type === 'section') next.props.bg = 'inverse'
  return next
}

/** Swap the signature move without rebuilding: updates tokens and adds/removes the marquee band or inverted section. */
export function withSignature(doc: Doc, sig: Signature): Doc {
  if (doc.meta.kind === 'app' && sig === 'marquee') sig = 'hardShadow'
  const tokens = fixSignature({ ...doc.tokens, signature: sig })
  const strip = (n: DNode): DNode => {
    const props = { ...n.props }
    if (props.sigInverted) { delete props.bg; delete props.sigInverted }
    return { ...n, props, children: n.children.filter((c) => !c.props.sigBand).map(strip) }
  }
  const clean = strip(doc.root)
  const cont = contentFor(doc.meta.contentSeed ?? doc.meta.layoutSeed)
  const x: Ctx = { rng: makeRng(0), t: tokens, c: cont.c, a: cont.a }
  let root: DNode = { ...clean, children: postProcess(clean.children, x, doc.meta.layoutSeed) }
  const bd = partsOf(doc).backdrops
  if (bd) root = applyBackdrops(root, bd) // backdrops depend on each band's fill, so redo them after the signature changes it
  return { ...doc, tokens, root }
}
