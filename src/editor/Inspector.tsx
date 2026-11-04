import { useState } from 'react'
import { aiReady } from '../ai'
import { aiRewriteSection, deleteSelected, duplicateSelected, nudgeSelected, setProps } from '../actions'
import { find, findParent, nearestSection } from '../lib/tree'
import { setUI, useStore } from '../store'
import type { DNode } from '../types'
import { COLUMN_PRESETS, COMMON, SCHEMA, type Field } from './schema'

function FieldInput({ f, node }: { f: Field; node: DNode }) {
  const v = node.props[f.key]
  const set = (val: any) => setProps(node.id, { [f.key]: val })
  switch (f.type) {
    case 'select':
      return (
        <select value={v === undefined ? '' : String(v)} onChange={(e) => set(f.key === 'level' ? +e.target.value : e.target.value || undefined)}>
          {f.options!.map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}
        </select>
      )
    case 'toggle':
      return <input type="checkbox" checked={!!v} onChange={(e) => set(e.target.checked || undefined)} />
    case 'number':
      return (
        <span className="num">
          <input type="range" min={f.min} max={f.max} step={f.step} value={v ?? f.min ?? 0} onChange={(e) => set(+e.target.value)} />
          <input type="number" min={f.min} max={f.max} step={f.step} value={v ?? ''} placeholder="auto" onChange={(e) => set(e.target.value === '' ? undefined : +e.target.value)} />
        </span>
      )
    case 'lines':
      return <textarea rows={4} value={Array.isArray(v) ? v.map((x) => (Array.isArray(x) ? x.join('|') : x)).join('\n') : v ?? ''} onChange={(e) => set(e.target.value.split('\n'))} />
    case 'long':
      return <textarea rows={3} value={v ?? ''} onChange={(e) => set(e.target.value)} />
    default:
      return <input type="text" value={v ?? ''} onChange={(e) => set(f.key === 'cols' && /^\d+$/.test(e.target.value) ? +e.target.value : e.target.value || undefined)} />
  }
}

export function Inspector() {
  const { doc, ui } = useStore()
  const [instr, setInstr] = useState('')
  const node = ui.selectedId ? find(doc.root, ui.selectedId) : null
  if (!node) return <div className="panel-body"><p className="hint">Click anything on the canvas to inspect it. Double-click text to edit it in place.</p></div>
  const loc = findParent(doc.root, node.id)
  const fields = [...(SCHEMA[node.type] ?? []), ...(loc?.parent.type === 'box' && loc.parent.props.dir === 'grid' || node.props.span ? COMMON : COMMON.slice(2))]
  const sec = nearestSection(doc.root, node.id)
  return (
    <div className="panel-body">
      <div className="row2 head">
        <b className="ntype">{node.type}</b>
        <span className="btns">
          <button title="Move earlier" onClick={() => nudgeSelected(-1)}>↑</button>
          <button title="Move later" onClick={() => nudgeSelected(1)}>↓</button>
          <button title="Select parent" onClick={() => loc && setUI({ selectedId: loc.parent.type === 'page' ? null : loc.parent.id })}>⇱</button>
          <button title="Duplicate (Ctrl+D)" onClick={duplicateSelected}>Dup</button>
          <button title="Delete (Del)" className="danger" onClick={deleteSelected}>Del</button>
        </span>
      </div>
      {node.type === 'box' && (
        <>
          <label className="lbl">Column presets</label>
          <div className="chips">
            {COLUMN_PRESETS.map(([l, v]) => <button key={l} className={String(node.props.cols) === v ? 'on' : ''} onClick={() => setProps(node.id, { dir: 'row', cols: v })}>{l}</button>)}
            {[2, 3, 4].map((n) => <button key={n} className={node.props.cols === n ? 'on' : ''} onClick={() => setProps(node.id, { dir: 'grid', cols: n })}>grid {n}</button>)}
          </div>
        </>
      )}
      {fields.map((f) => (
        <div className={'field' + (f.type === 'toggle' ? ' inline' : '')} key={f.key}>
          <label>{f.label}</label>
          <FieldInput f={f} node={node} />
        </div>
      ))}
      {sec && (
        <div className="scoped">
          <label className="lbl">Section: {String(sec.props.build ?? 'custom')} <span className="hint">· re-roll it from the Generate tab</span></label>
          <div className="row2">
            <input placeholder="make it more… (e.g. blunt, warmer)" value={instr} onChange={(e) => setInstr(e.target.value)} />
            <button disabled={!aiReady({ provider: ui.provider, key: ui.apiKey, model: ui.model }, ui.cli) || !!ui.busy} onClick={() => aiRewriteSection(instr ? `Make it more ${instr}.` : 'Rewrite the copy so it is more specific and less generic.')}>Rewrite</button>
          </div>
          {!aiReady({ provider: ui.provider, key: ui.apiKey, model: ui.model }, ui.cli) && <p className="hint">Rewriting copy needs an AI provider (top bar). Everything else works without.</p>}
        </div>
      )}
    </div>
  )
}
