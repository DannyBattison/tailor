import { aiBrief, aiReady, aiRewrite, type LlmConfig } from './ai'
import { archetypesFor, backdropProps, clearBackdrop } from './gen/build'
import { makeRng } from './lib/rng'
import { generate, generateGuarded, generateVariants, regenSection, withSignature } from './gen/generate'
import { loadSigs } from './gen/guard'
import { APPS, MARKETING } from './gen/content'
import { paletteOf } from './gen/palette'
import { genTokens } from './gen/tokens'
import { ART_KINDS } from './render/art'
import { walk, collectTexts, duplicateNode, find, findParent, mapNode, nearestSection, removeNode, updateProps } from './lib/tree'
import { getState, mutate, replaceDoc, setUI, toast } from './store'
import type { DNode, Doc, Signature } from './types'

export const llmConfig = (): LlmConfig => { const { ui } = getState(); return { provider: ui.provider, key: ui.apiKey, model: ui.model, cliPath: ui.cliPaths[ui.provider] || undefined } }
const needAi = () => { const { ui } = getState(); if (aiReady(llmConfig(), ui.cli)) return true; setUI({ menu: 'key' }); toast('Pick an AI provider first'); return false }

const rand = () => Math.floor(Math.random() * 99999) + 1

function opts(seed: number) {
  const { ui, doc } = getState()
  return { seed, kind: ui.kind, mood: ui.mood, brief: ui.brief, locks: ui.locks, prev: doc }
}

/** Full relaunch: a new seed and a new design. Locked parts (palette, fonts, shape, layout) are kept. The only action that changes the seed. */
export function newDesign() {
  const doc = generateGuarded(opts(rand()), loadSigs())
  replaceDoc(doc)
}

/** Exact seed → exact design, no guard (so a seed is reproducible). Locks still apply. */
export function applySeed(seed: number) {
  replaceDoc(generate(opts(seed)))
}

export function makeVariants() {
  const { ui } = getState()
  const base = rand()
  setUI({ variants: generateVariants({ seed: base, kind: ui.kind, mood: ui.mood, brief: ui.brief }, loadSigs()) })
}

export function pickVariant(d: Doc) {
  replaceDoc(d)
}

/** Re-roll the structure only: a different archetype and layout, same tokens, same copy. Keeps the seed. */
export function rerollLayout() {
  const { doc } = getState()
  const pool = archetypesFor(doc.meta.kind).filter((a) => a.id !== doc.meta.archetype)
  const next = generate({
    seed: doc.meta.seed, kind: doc.meta.kind, mood: doc.meta.mood, brief: doc.meta.brief, archetype: pool[Math.floor(Math.random() * pool.length)].id,
    layoutSeed: rand(), siteKind: doc.meta.siteKind, override: doc.meta.override, prev: doc, locks: { palette: true, fonts: true, shape: true, rhythm: true, signature: true, layout: false, copy: true },
  })
  mutate(() => next)
  setUI({ selectedId: null })
}

export type Part = 'palette' | 'fonts' | 'shape' | 'rhythm' | 'signature'

/** Re-roll one token family only, keeping everything else, including the seed. */
export function rerollPart(part: Part) {
  const locks = { palette: true, fonts: true, shape: true, rhythm: true, signature: true, [part]: false }
  const { doc } = getState()
  if (part === 'signature') {
    const sigs: Signature[] = ['hardShadow', 'oversized', 'ruled', 'grain', 'tilted', 'inverted', ...(doc.meta.kind === 'marketing' ? ['marquee' as const] : [])]
    const pool = sigs.filter((s) => s !== doc.tokens.signature)
    return mutate((d) => withSignature(d, pool[Math.floor(Math.random() * pool.length)]))
  }
  const seed = rand()
  mutate((d) => ({ ...d, tokens: genTokens(seed, d.meta.mood, d.tokens, locks) }))
}

/** Same layout and tokens, different business/copy from the content bank. */
export function rerollCopy() {
  const { doc } = getState()
  const ids = (doc.meta.kind === 'marketing' ? MARKETING : APPS).map((c) => c.id).filter((id) => id !== doc.meta.siteKind)
  const next = generate({
    seed: doc.meta.seed, kind: doc.meta.kind, mood: doc.meta.mood, brief: doc.meta.brief, archetype: doc.meta.archetype, layoutSeed: doc.meta.layoutSeed,
    contentSeed: rand(), siteKind: ids[Math.floor(Math.random() * ids.length)], prev: doc,
    locks: { palette: true, fonts: true, shape: true, rhythm: true, signature: true, layout: true, copy: false },
  })
  mutate(() => next)
  setUI({ selectedId: null })
}

/** New art for every image: different motif, seed and tone. */
export function rerollImages() {
  mutate((d) => {
    let root = d.root
    const ids: string[] = []
    walk(root, (n) => { if (n.type === 'image') ids.push(n.id) })
    for (const id of ids) root = updateProps(root, id, { art: ART_KINDS[Math.floor(Math.random() * ART_KINDS.length)], seed: rand() % 9999 + 1, tone: Math.floor(Math.random() * 4) })
    return { ...d, root }
  })
}

export function newDocFromScratch(kind: 'marketing' | 'app') {
  setUI({ kind })
  const { ui } = getState()
  replaceDoc(generateGuarded({ seed: rand(), kind, mood: ui.mood, brief: ui.brief, locks: { ...ui.locks, layout: false, copy: false }, prev: getState().doc }, loadSigs()))
}

export function deleteSelected() {
  const { ui, doc } = getState()
  if (!ui.selectedId || ui.selectedId === doc.root.id) return
  const loc = findParent(doc.root, ui.selectedId)
  mutate((d) => ({ ...d, root: removeNode(d.root, ui.selectedId!) }))
  setUI({ selectedId: loc?.parent.type === 'page' ? null : loc?.parent.id ?? null })
}

export function duplicateSelected() {
  const { ui, doc } = getState()
  if (!ui.selectedId || ui.selectedId === doc.root.id) return
  const r = duplicateNode(doc.root, ui.selectedId)
  mutate((d) => ({ ...d, root: r.root }))
  setUI({ selectedId: r.newId })
}

export function nudgeSelected(dir: -1 | 1) {
  const { ui, doc } = getState()
  const loc = ui.selectedId ? findParent(doc.root, ui.selectedId) : null
  if (!loc) return
  const j = loc.index + dir
  if (j < 0 || j >= loc.parent.children.length) return
  mutate((d) => ({
    ...d,
    root: mapNode(d.root, loc.parent.id, (p) => {
      const c = p.children.slice()
      ;[c[loc.index], c[j]] = [c[j], c[loc.index]]
      return { ...p, children: c }
    }),
  }))
}

export function setProps(id: string, props: Record<string, any>, key?: string) {
  mutate((d) => ({ ...d, root: updateProps(d.root, id, props) }), key ?? 'p-' + id + Object.keys(props).join())
}

/** Scoped regeneration: re-roll only the section containing the selection. */
export function regenSelectedSection() {
  const { ui, doc } = getState()
  const sec = ui.selectedId ? nearestSection(doc.root, ui.selectedId) : null
  if (!sec) return toast('Select something inside a section first')
  const next = regenSection(doc, sec.id, rand())
  if (!next) return toast('This section was edited by hand and has no generator to re-run')
  mutate((d) => ({ ...d, root: mapNode(d.root, sec.id, () => ({ ...next, id: sec.id })) }))
  setUI({ selectedId: sec.id })
}

export async function aiGenerate() {
  const { ui } = getState()
  if (!needAi()) return
  setUI({ busy: 'Writing copy…' })
  try {
    const r = await aiBrief(llmConfig(), ui.brief, ui.kind)
    const doc = generateGuarded({ ...opts(rand()), mood: r.mood ?? ui.mood, override: r.override, prev: getState().doc }, loadSigs())
    replaceDoc(doc)
    if (r.mood) setUI({ mood: r.mood })
    toast('Copy written. Design decisions stayed algorithmic.')
  } catch (e) {
    toast((e as Error).message)
  } finally {
    setUI({ busy: '' })
  }
}

export async function aiRewriteSection(instruction: string) {
  const { ui, doc } = getState()
  const sec = ui.selectedId ? nearestSection(doc.root, ui.selectedId) : null
  if (!sec) return toast('Select something inside a section first')
  if (!needAi()) return
  setUI({ busy: 'Rewriting section…' })
  try {
    const items = collectTexts(sec)
    const res = await aiRewrite(llmConfig(), items, instruction, `${doc.meta.name} (${doc.meta.siteKind}). ${doc.meta.brief}`)
    mutate((d) => {
      let root = d.root
      for (const r of res) if (find(root, r.id)) root = updateProps(root, r.id, { [r.prop]: r.text })
      return { ...d, root }
    })
    toast(`Rewrote ${res.length} strings`)
  } catch (e) {
    toast((e as Error).message)
  } finally {
    setUI({ busy: '' })
  }
}

/** Light/dark for the design itself (not the editor chrome). Needs a generated palette to derive from. */
export function setMode(mode: 'light' | 'dark') {
  mutate((d) => (d.tokens.spec ? { ...d, tokens: { ...d.tokens, mode, palette: paletteOf(d.tokens.spec, d.tokens.bgBold, mode) } } : d), 'mode')
}

/** New backdrops for every hero, band and tile that was given one at generation time (including ones that got none). */
export function rerollBackdrops() {
  const rng = makeRng(rand())
  mutate((d) => {
    let root = d.root
    const targets: DNode[] = []
    walk(root, (n) => { if (n.props.bdGen) targets.push(n) })
    for (const n of targets) root = updateProps(root, n.id, { ...clearBackdrop(), ...backdropProps(rng, n.props.bdRole, n.props.bg, !!n.props.bdFlat) })
    return { ...d, root }
  })
}
