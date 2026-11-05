import * as R from './gen/reroll'
import { fromCode } from './gen/code'
import { generateGuarded, generateVariants, regenSection } from './gen/generate'
import { loadSigs } from './gen/guard'
import { paletteOf } from './gen/palette'
import { duplicateNode, findParent, mapNode, nearestSection, removeNode, updateProps } from './lib/tree'
import { getState, mutate, replaceDoc, setUI, toast } from './store'
import type { Doc } from './types'

const rand = () => Math.floor(Math.random() * 99999) + 1

function opts(seed: number) {
  const { ui, doc } = getState()
  return { seed, kind: ui.kind, mood: ui.mood, locks: ui.locks, prev: doc }
}

/** Full relaunch: a new seed and a new design. Locked parts (palette, fonts, shape, layout, text) are kept. */
export function newDesign() {
  const doc = generateGuarded(opts(rand()), loadSigs())
  replaceDoc(doc)
}

/** Recreate a design from a design code (a plain seed, or the long form that spells out every part). */
export function loadCode(code: string) {
  const doc = fromCode(code, getState().ui.kind)
  if (!doc) return toast('That is not a valid design code')
  setUI({ kind: doc.meta.kind })
  replaceDoc(doc)
}

export function makeVariants() {
  const { ui } = getState()
  const base = rand()
  setUI({ variants: generateVariants({ seed: base, kind: ui.kind, mood: ui.mood }, loadSigs()) })
}

export function pickVariant(d: Doc) {
  replaceDoc(d)
}

export type Part = R.TokenPart

/** Re-rolls: each gives one part a new seed, so the design code always describes the result. */
export function rerollLayout() { mutate((d) => R.rerollLayout(d, rand()), '', true); setUI({ selectedId: null }) }
export function rerollPart(part: Part) { mutate((d) => R.rerollToken(d, part, rand()), '', true) }
export function rerollText() { mutate((d) => R.rerollText(d, rand()), '', true); setUI({ selectedId: null }) }
export function rerollImages() { mutate((d) => R.rerollImages(d, rand()), '', true) }
export function rerollBackdrops() { mutate((d) => R.rerollBackdrops(d, rand()), '', true) }

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
  mutate((d) => (d.tokens.spec ? { ...d, tokens: { ...d.tokens, mode, palette: paletteOf(d.tokens.spec, d.tokens.bgBold, mode) } } : d), 'mode', true)
}

