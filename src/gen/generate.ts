import { makeRng, stageRng } from '../lib/rng'
import { find, mk, walk } from '../lib/tree'
import type { DNode, Doc, Kind, Locks, Meta } from '../types'
import { ALL_ARCHETYPES, SECTIONS, archetypesFor, roleOf, variantsOf, type Ctx } from './build'
import { APPS, MARKETING, type AppContent, type MarketingContent } from './content'
import { sigOf, tooClose, type Sig } from './guard'
import { MOOD_NAMES, inferFromText } from './moods'
import { genTokens } from './tokens'

export interface GenOpts {
  seed: number
  kind: Kind
  mood: string // '' = infer from brief / seed
  brief: string
  archetype?: string
  locks?: Partial<Locks>
  prev?: Doc
  override?: Record<string, any>
  siteKind?: string
}

function mergeArr<T>(base: T[], over: any): T[] {
  if (!Array.isArray(over)) return base
  return base.map((b, i) => (over[i] && typeof over[i] === 'object' && typeof b === 'object' ? { ...b, ...over[i] } : over[i] ?? b)) as T[]
}
function mergeContent<T extends object>(base: T, over?: Record<string, any>): T {
  if (!over) return base
  const out: any = { ...base }
  for (const [k, v] of Object.entries(over)) {
    if (v == null || v === '') continue
    out[k] = Array.isArray(v) ? mergeArr((base as any)[k] ?? [], v) : v
  }
  return out
}

export function contentFor(kind: Kind, siteKind: string, seed: number, override?: Record<string, any>) {
  const rng = stageRng(seed, 'content')
  const mc: MarketingContent = MARKETING.find((m) => m.id === siteKind) ?? rng.pick(MARKETING)
  const ac: AppContent = APPS.find((m) => m.id === siteKind) ?? rng.pick(APPS)
  return { c: mergeContent(mc, kind === 'marketing' ? override : undefined), a: mergeContent(ac, kind === 'app' ? override : undefined), siteKind: kind === 'marketing' ? mc.id : ac.id }
}

export function generate(o: GenOpts): Doc {
  const locks = o.locks ?? {}
  const prev = o.prev
  const inf = inferFromText(o.brief, o.kind)
  const mood = o.mood || inf.mood || makeRng(o.seed).pick(MOOD_NAMES)
  const siteKind = o.siteKind || (inf.kind === o.kind ? inf.siteKind : '') || ''
  const tokens = genTokens(o.seed, mood, prev?.tokens, locks)
  const layoutSeed = locks.layout && prev ? prev.meta.layoutSeed : o.seed
  const pool = archetypesFor(o.kind)
  const archetype = o.archetype ?? (locks.layout && prev && pool.some((a) => a.id === prev.meta.archetype) ? prev.meta.archetype : stageRng(o.seed, 'archetype').pick(pool).id)
  const arch = ALL_ARCHETYPES.find((a) => a.id === archetype) ?? pool[0]
  const cont = contentFor(o.kind, siteKind || (locks.layout && prev ? prev.meta.siteKind : ''), layoutSeed, o.override ?? (locks.layout ? prev?.meta.override : undefined))
  const x: Ctx = { rng: stageRng(layoutSeed, 'layout:' + arch.id), t: tokens, c: cont.c, a: cont.a }
  const children = postProcess(arch.build(x), x)
  const meta: Meta = { seed: o.seed, kind: o.kind, mood, archetype: arch.id, layoutSeed, siteKind: cont.siteKind, brief: o.brief, name: o.kind === 'app' ? cont.a.name : cont.c.name, override: o.override ?? (locks.layout ? prev?.meta.override : undefined) }
  return { root: mk('page', {}, children), tokens, meta }
}

/** Apply the design's one signature move at the tree level (CSS handles the rest). */
function postProcess(nodes: DNode[], x: Ctx): DNode[] {
  const sig = x.t.signature
  const out = nodes.slice()
  const page = mk('page', {}, out)
  if (sig === 'marquee' && x.c && !hasType(page, 'marquee')) {
    const at = out.findIndex((n) => n.type === 'section' || n.type === 'box')
    const band = SECTIONS['marquee.band'](x)
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
    if (pick) pick.props = { ...pick.props, bg: 'inverse' }
  }
  return out
}

const hasType = (n: DNode, t: string): boolean => n.type === t || n.children.some((c) => hasType(c, t))

/** Generate, rejecting results that are too close to recent designs. */
export function generateGuarded(o: GenOpts, history: Sig[], avoid: Sig[] = []): Doc {
  let doc = generate(o)
  for (let i = 1; i <= 14 && tooClose(sigOf(doc), [...history, ...avoid]); i++) {
    doc = generate({ ...o, seed: o.seed + i * 7919 })
  }
  return doc
}

export function generateVariants(o: GenOpts, history: Sig[]): Doc[] {
  const archs = makeRng(o.seed).shuffle(archetypesFor(o.kind)).slice(0, 4)
  const out: Doc[] = []
  archs.forEach((a, i) => {
    const doc = generateGuarded({ ...o, archetype: a.id, seed: o.seed + i * 104729, locks: { ...o.locks, layout: false } }, history, out.map(sigOf))
    out.push(doc)
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
  const cont = contentFor(doc.meta.kind, doc.meta.siteKind, doc.meta.layoutSeed, doc.meta.override)
  const x: Ctx = { rng, t: doc.tokens, c: cont.c, a: cont.a }
  const next = SECTIONS[pickKey](x)
  if (old.props.bg === 'inverse' && next.type === 'section') next.props.bg = 'inverse'
  return next
}
