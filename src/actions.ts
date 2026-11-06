import * as R from './gen/reroll'
import { fromCode } from './gen/code'
import { generate, generateGuarded, generateVariants, partsOf } from './gen/generate'
import { loadSigs } from './gen/guard'
import { paletteOf } from './gen/palette'
import { getState, mutate, replaceDoc, setUI, toast } from './store'
import type { MotionPart } from './gen/tokens'
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
export type { MotionPart } from './gen/tokens'

/** Re-rolls: each gives one part a new seed, so the design code always describes the result. */
export function rerollLayout() { mutate((d) => R.rerollLayout(d, rand5()), '', true) }
export function rerollPart(part: Part) { mutate((d) => R.rerollToken(d, part, rand5()), '', true) }
export function rerollText() { mutate((d) => R.rerollText(d, rand5()), '', true) }
export function rerollBackdrops() { mutate((d) => R.rerollBackdrops(d, rand5()), '', true) }
export function rerollMotion(part: MotionPart) { mutate((d) => R.rerollMotion(d, part, rand5()), '', true); if (part === 'entrance') replayEntrance() }

/** Entrances only play once, so restart the canvas page to show one. */
export function replayEntrance() { setUI({ replay: getState().ui.replay + 1 }) }

/** Switch between marketing site and app UI. The design's seed (parts, mood, boldness, mode) carries over; only the kind changes. */
export function newDocFromScratch(kind: 'marketing' | 'app') {
  const { doc } = getState()
  setUI({ kind })
  if (doc.meta.kind === kind) return
  const t = doc.tokens
  replaceDoc(generate({ seed: doc.meta.seed, kind, mood: doc.meta.mood, parts: partsOf(doc), bgBold: t.bgBold, mode: t.mode }))
}

/** Light/dark for the design itself (not the editor chrome). Needs a generated palette to derive from. */
export function setMode(mode: 'light' | 'dark') {
  mutate((d) => (d.tokens.spec ? { ...d, tokens: { ...d.tokens, mode, palette: paletteOf(d.tokens.spec, d.tokens.bgBold, mode) } } : d), 'mode', true)
}

