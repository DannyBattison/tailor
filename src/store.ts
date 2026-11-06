import { useSyncExternalStore } from 'react'
import { generateGuarded, upgradeDoc } from './gen/generate'
import { loadSigs, pushSig, sigOf } from './gen/guard'
import type { Doc, Kind, Locks } from './types'

export type Viewport = 'desktop' | 'tablet' | 'mobile'
export interface UI {
  selectedId: string | null
  wire: boolean
  viewport: Viewport
  leftTab: 'generate' | 'critique'
  rightTab: 'node' | 'design'
  kind: Kind
  mood: string
  /** what's typed in the design-code box; null = show the current design's code */
  codeInput: string | null
  locks: Locks
  variants: Doc[] | null
  busy: string
  toast: string
  menu: '' | 'export'
  /** which sidebar drawer is open on narrow screens */
  drawer: '' | 'left' | 'right'
  /** bumped to restart the canvas page and play its entrance again */
  replay: number
}
export interface State { doc: Doc; past: Doc[]; future: Doc[]; ui: UI }

const LS_DOC = 'hm.doc'
const LS_UI = 'hm.ui'

const defaultUI = (): UI => ({
  selectedId: null, wire: false, viewport: 'desktop', leftTab: 'generate', rightTab: 'design', kind: 'marketing', mood: '',
  codeInput: null, locks: { palette: false, fonts: false, shape: false, layout: false, copy: false, ambient: false, entrance: false, interaction: false },
  variants: null, busy: '', toast: '', menu: '', drawer: '', replay: 0,
})

function load(): State {
  const ui = defaultUI()
  try {
    const u = JSON.parse(localStorage.getItem(LS_UI) ?? 'null')
    if (u) Object.assign(ui, u, { locks: { ...ui.locks, ...u.locks } }, { variants: null, busy: '', toast: '', selectedId: null, menu: '', drawer: '', codeInput: null, replay: 0 })
    if (ui.leftTab !== 'critique') ui.leftTab = 'generate' // saved by a build that still had the Add and Layers tabs
    localStorage.removeItem('hm.key') // earlier builds could store an API key here; there is no AI integration any more
    const d = JSON.parse(localStorage.getItem(LS_DOC) ?? 'null') as Doc | null
    if (d?.root && d.tokens) return { doc: upgradeDoc(d), past: [], future: [], ui }
  } catch { /* fall through */ }
  const doc = generateGuarded({ seed: Math.floor(Math.random() * 2 ** 31), kind: ui.kind, mood: ui.mood }, loadSigs())
  pushSig(sigOf(doc))
  return { doc, past: [], future: [], ui }
}

let state: State = load()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
let saveTimer: ReturnType<typeof setTimeout> | undefined
function persist() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(LS_DOC, JSON.stringify(state.doc))
      const { variants: _v, busy: _b, toast: _t, selectedId: _s, menu: _m, drawer: _d, codeInput: _c, replay: _r, ...rest } = state.ui
      localStorage.setItem(LS_UI, JSON.stringify(rest))
    } catch { /* quota */ }
  }, 250)
}
const set = (next: State) => { state = next; emit(); persist() }

export const getState = () => state
export const useStore = () => useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l) } }, () => state)

let lastKey = ''
let lastAt = 0
/** Replace the document, pushing history. Same `key` within 900ms coalesces into one undo step (sliders, typing). */
export function commit(doc: Doc, key = '', generated = false) {
  // anything that isn't a re-roll is a hand edit: the design code can no longer recreate the result exactly
  if (!generated && !doc.meta.edited) doc = { ...doc, meta: { ...doc.meta, edited: true } }
  const now = Date.now()
  const merge = key && key === lastKey && now - lastAt < 900
  lastKey = key
  lastAt = now
  set({ ...state, doc, past: merge ? state.past : [...state.past, state.doc].slice(-100), future: [] })
}
export const mutate = (fn: (d: Doc) => Doc, key = '', generated = false) => commit(fn(state.doc), key, generated)
export function undo() {
  const prev = state.past[state.past.length - 1]
  if (!prev) return
  lastKey = ''
  set({ ...state, doc: prev, past: state.past.slice(0, -1), future: [state.doc, ...state.future] })
}
export function redo() {
  const next = state.future[0]
  if (!next) return
  lastKey = ''
  set({ ...state, doc: next, past: [...state.past, state.doc], future: state.future.slice(1) })
}
export const setUI = (patch: Partial<UI>) => set({ ...state, ui: { ...state.ui, ...patch } })
export function toast(msg: string) {
  setUI({ toast: msg })
  setTimeout(() => { if (state.ui.toast === msg) setUI({ toast: '' }) }, 3500)
}
/** Load a brand-new document (keeps undo history so a bad roll can be undone). */
export function replaceDoc(doc: Doc, record = true) {
  if (record) pushSig(sigOf(doc))
  commit(doc, '', true)
  setUI({ selectedId: null, codeInput: null, variants: null })
}
