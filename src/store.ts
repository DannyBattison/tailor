import { useSyncExternalStore } from 'react'
import type { CliMap, Provider } from './ai'
import { generateGuarded } from './gen/generate'
import { loadSigs, pushSig, sigOf } from './gen/guard'
import type { Doc, Kind, Locks } from './types'

export type Viewport = 'desktop' | 'tablet' | 'mobile'
export interface UI {
  selectedId: string | null
  wire: boolean
  viewport: Viewport
  leftTab: 'generate' | 'elements' | 'layers' | 'critique'
  rightTab: 'node' | 'design'
  kind: Kind
  mood: string
  brief: string
  seed: number
  locks: Locks
  variants: Doc[] | null
  apiKey: string
  rememberKey: boolean
  model: string
  provider: Provider
  cli: CliMap
  cliPaths: Record<string, string>
  busy: string
  toast: string
  menu: '' | 'export' | 'key'
}
export interface State { doc: Doc; past: Doc[]; future: Doc[]; ui: UI }

const LS_DOC = 'hm.doc'
const LS_UI = 'hm.ui'
const LS_KEY = 'hm.key'

const defaultUI = (): UI => ({
  selectedId: null, wire: false, viewport: 'desktop', leftTab: 'generate', rightTab: 'design', kind: 'marketing', mood: '', brief: '',
  seed: Math.floor(Math.random() * 99999) + 1, locks: { palette: false, fonts: false, shape: false, layout: false },
  variants: null, apiKey: '', rememberKey: false, model: 'claude-sonnet-5-5', provider: 'api', cli: {}, cliPaths: {}, busy: '', toast: '', menu: '',
})

function load(): State {
  const ui = defaultUI()
  try {
    const u = JSON.parse(localStorage.getItem(LS_UI) ?? 'null')
    if (u) Object.assign(ui, u, { variants: null, busy: '', toast: '', selectedId: null, menu: '', cli: {} })
    const k = localStorage.getItem(LS_KEY)
    if (k) { ui.apiKey = k; ui.rememberKey = true }
    const d = JSON.parse(localStorage.getItem(LS_DOC) ?? 'null') as Doc | null
    if (d?.root && d.tokens) return { doc: d, past: [], future: [], ui }
  } catch { /* fall through */ }
  const doc = generateGuarded({ seed: ui.seed, kind: ui.kind, mood: ui.mood, brief: ui.brief }, loadSigs())
  ui.seed = doc.meta.seed
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
      const { variants: _v, busy: _b, toast: _t, apiKey: _k, selectedId: _s, menu: _m, cli: _c, ...rest } = state.ui
      localStorage.setItem(LS_UI, JSON.stringify(rest))
      if (state.ui.rememberKey && state.ui.apiKey) localStorage.setItem(LS_KEY, state.ui.apiKey)
      else localStorage.removeItem(LS_KEY)
    } catch { /* quota */ }
  }, 250)
}
const set = (next: State) => { state = next; emit(); persist() }

export const getState = () => state
export const useStore = () => useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l) } }, () => state)

let lastKey = ''
let lastAt = 0
/** Replace the document, pushing history. Same `key` within 900ms coalesces into one undo step (sliders, typing). */
export function commit(doc: Doc, key = '') {
  const now = Date.now()
  const merge = key && key === lastKey && now - lastAt < 900
  lastKey = key
  lastAt = now
  set({ ...state, doc, past: merge ? state.past : [...state.past, state.doc].slice(-100), future: [] })
}
export const mutate = (fn: (d: Doc) => Doc, key = '') => commit(fn(state.doc), key)
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
  commit(doc)
  setUI({ selectedId: null, seed: doc.meta.seed, variants: null })
}
