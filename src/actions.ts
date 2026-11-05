import { archetypesFor, backdropProps, clearBackdrop } from './gen/build'
import { makeRng } from './lib/rng'
import { generate, generateGuarded, generateVariants, regenSection, withSignature } from './gen/generate'
import { loadSigs } from './gen/guard'
import { paletteOf } from './gen/palette'
import { genTokens } from './gen/tokens'
import { ART_KINDS } from './render/art'
import { walk, duplicateNode, findParent, mapNode, nearestSection, removeNode, updateProps } from './lib/tree'
import { getState, mutate, replaceDoc, setUI, toast } from './store'
import type { DNode, Doc } from './types'

const rand = () => Math.floor(Math.random() * 99999) + 1

function opts(seed: number) {
  const { ui, doc } = getState()
  return { seed, kind: ui.kind, mood: ui.mood, locks: ui.locks, prev: doc }
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
  setUI({ variants: generateVariants({ seed: base, kind: ui.kind, mood: ui.mood }, loadSigs()) })
}

export function pickVariant(d: Doc) {
  replaceDoc(d)
}

/** Re-roll the structure only: a different archetype and layout, same tokens, same copy. Keeps the seed. */
export function rerollLayout() {
  const { doc } = getState()
  const pool = archetypesFor(doc.meta.kind).filter((a) => a.id !== doc.meta.archetype)
  const next = generate({
    seed: doc.meta.seed, kind: doc.meta.kind, mood: doc.meta.mood, archetype: pool[Math.floor(Math.random() * pool.length)].id,
    layoutSeed: rand(), prev: doc, locks: { palette: true, fonts: true, shape: true, layout: false, copy: true },
  })
  mutate(() => next)
  setUI({ selectedId: null })
}

export type Part = 'palette' | 'fonts' | 'shape'

/** Re-roll one token family only, keeping everything else, including the seed. 'shape' covers the whole Shape & rhythm section. */
export function rerollPart(part: Part) {
  const locks = { palette: true, fonts: true, shape: true, [part]: false }
  const seed = rand()
  mutate((d) => {
    const t = genTokens(seed, d.meta.mood, d.tokens, locks)
    // the signature move also changes the tree (marquee band, inverted section), so route it through withSignature
    return part === 'shape' ? withSignature({ ...d, tokens: { ...t, signature: d.tokens.signature } }, t.signature) : { ...d, tokens: t }
  })
}

/** Same layout and tokens, new lorem ipsum. */
export function rerollText() {
  const { doc } = getState()
  const next = generate({
    seed: doc.meta.seed, kind: doc.meta.kind, mood: doc.meta.mood, archetype: doc.meta.archetype, layoutSeed: doc.meta.layoutSeed,
    contentSeed: rand(), prev: doc, locks: { palette: true, fonts: true, shape: true, layout: true, copy: false },
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
  replaceDoc(generateGuarded({ seed: rand(), kind, mood: ui.mood, locks: { ...ui.locks, layout: false, copy: false }, prev: getState().doc }, loadSigs()))
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
