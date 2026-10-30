import { aiBrief, aiRewrite } from './ai'
import { generate, generateGuarded, generateVariants, regenSection } from './gen/generate'
import { loadSigs } from './gen/guard'
import { genTokens } from './gen/tokens'
import { collectTexts, duplicateNode, find, findParent, mapNode, nearestSection, removeNode, updateProps } from './lib/tree'
import { getState, mutate, replaceDoc, setUI, toast } from './store'
import type { Doc } from './types'

const rand = () => Math.floor(Math.random() * 99999) + 1

function opts(seed: number) {
  const { ui, doc } = getState()
  return { seed, kind: ui.kind, mood: ui.mood, brief: ui.brief, locks: ui.locks, prev: doc }
}

/** Fresh roll. Locked parts (palette, fonts, shape, layout) are kept from the current design. */
export function reroll() {
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
  setUI({ variants: generateVariants({ seed: base, kind: ui.kind, mood: ui.mood, brief: ui.brief }, loadSigs()), seed: base })
}

export function pickVariant(d: Doc) {
  replaceDoc(d)
}

/** Re-roll one token family only (palette | fonts | shape), keeping everything else. */
export function rerollPart(part: 'palette' | 'fonts' | 'shape') {
  const seed = rand()
  const locks = { palette: part !== 'palette', fonts: part !== 'fonts', shape: part !== 'shape' }
  mutate((d) => ({ ...d, tokens: genTokens(seed, d.meta.mood, d.tokens, locks) }))
}

export function newDocFromScratch(kind: 'marketing' | 'app') {
  setUI({ kind })
  const { ui } = getState()
  replaceDoc(generateGuarded({ seed: rand(), kind, mood: ui.mood, brief: ui.brief, locks: { ...ui.locks, layout: false }, prev: getState().doc }, loadSigs()))
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
  if (!ui.apiKey) return toast('Add an API key first')
  setUI({ busy: 'Writing brief with Claude…' })
  try {
    const r = await aiBrief(ui.apiKey, ui.model, ui.brief, ui.kind)
    const doc = generateGuarded({ ...opts(rand()), mood: r.mood ?? ui.mood, override: r.override, prev: getState().doc }, loadSigs())
    replaceDoc(doc)
    if (r.mood) setUI({ mood: r.mood })
    toast('Copy written by Claude. Design decisions stayed algorithmic.')
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
  if (!ui.apiKey) return toast('Add an API key first')
  setUI({ busy: 'Rewriting section…' })
  try {
    const items = collectTexts(sec)
    const res = await aiRewrite(ui.apiKey, ui.model, items, instruction, `${doc.meta.name} (${doc.meta.siteKind}). ${doc.meta.brief}`)
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
