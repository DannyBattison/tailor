import * as R from './gen/reroll'
import { fromCode } from './gen/code'
import { generateGuarded, generateVariants } from './gen/generate'
import { loadSigs } from './gen/guard'
import { paletteOf } from './gen/palette'
import { duplicateNode, findParent, mapNode, removeNode, updateProps } from './lib/tree'
import { getState, mutate, replaceDoc, setUI, toast } from './store'
import type { Doc } from './types'

/** a fresh base seed (parts are derived from it) */
const rand = () => Math.floor(Math.random() * 2 ** 31)
/** a fresh 5-digit part seed */
const rand5 = () => Math.floor(Math.random() * 100000)

function opts(seed: number) {
  const { ui, doc } = getState()
  return { seed, kind: ui.kind, mood: ui.mood, locks: ui.locks, prev: doc }
}

/** Full relaunch: a new seed and a new design. Locked parts (palette, fonts, shape, layout, text) are kept. */
export function newDesign() {
  const doc = generateGuarded(opts(rand()), loadSigs())
  replaceDoc(doc)
}

/** Recreate a design from its code. */
export function loadCode(code: string) {
  const doc = fromCode(code)
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
export function rerollLayout() { mutate((d) => R.rerollLayout(d, rand5()), '', true); setUI({ selectedId: null }) }
export function rerollPart(part: Part) { mutate((d) => R.rerollToken(d, part, rand5()), '', true) }
export function rerollText() { mutate((d) => R.rerollText(d, rand5()), '', true); setUI({ selectedId: null }) }
export function rerollBackdrops() { mutate((d) => R.rerollBackdrops(d, rand5()), '', true) }

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

/** Light/dark for the design itself (not the editor chrome). Needs a generated palette to derive from. */
export function setMode(mode: 'light' | 'dark') {
  mutate((d) => (d.tokens.spec ? { ...d, tokens: { ...d.tokens, mode, palette: paletteOf(d.tokens.spec, d.tokens.bgBold, mode) } } : d), 'mode', true)
}

