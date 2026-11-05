import { useState } from 'react'
import { find, findParent, insertNode, isContainer, moveNode, type DropPos } from '../lib/tree'
import { mutate, setUI, useStore } from '../store'
import type { DNode } from '../types'
import { drag } from './dnd'
import { ELEMENTS, nodeLabel } from './schema'

export function Elements() {
  const { doc, ui } = useStore()
  const add = (type: string) => {
    const el = ELEMENTS.find((e) => e.type === type)!
    const node = el.make()
    const sel = ui.selectedId ? find(doc.root, ui.selectedId) : null
    mutate((d) => {
      if (sel && isContainer(sel) && sel.id !== d.root.id) return { ...d, root: insertNode(d.root, sel.id, sel.children.length, node) }
      const loc = sel ? findParent(d.root, sel.id) : null
      if (loc) return { ...d, root: insertNode(d.root, loc.parent.id, loc.index + 1, node) }
      return { ...d, root: insertNode(d.root, d.root.id, d.root.children.length, node) }
    })
    setUI({ selectedId: node.id, drawer: '' })
  }
  return (
    <div className="panel-body">
      <p className="hint">Drag onto the canvas, or click to add after/inside the selection.</p>
      <div className="elements">
        {ELEMENTS.map((e) => (
          <button key={e.type} className="el" draggable onDragStart={(ev) => { drag.current = { kind: 'new', type: e.type }; ev.dataTransfer.setData('text/plain', e.type); ev.dataTransfer.effectAllowed = 'copy' }} onDragEnd={() => { drag.current = null }} onClick={() => add(e.type)}>
            {e.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Layers() {
  const { doc, ui } = useStore()
  const [over, setOver] = useState<{ id: string; pos: DropPos } | null>(null)
  const [closed, setClosed] = useState<Set<string>>(new Set())

  const row = (n: DNode, depth: number): JSX.Element => {
    const open = !closed.has(n.id)
    const has = n.children.length > 0
    return (
      <div key={n.id}>
        <div
          className={'layer' + (ui.selectedId === n.id ? ' sel' : '') + (over?.id === n.id ? ' over-' + over.pos : '')}
          style={{ paddingLeft: 6 + depth * 12 }}
          draggable={n.type !== 'page'}
          onClick={() => setUI({ selectedId: n.type === 'page' ? null : n.id })}
          onDragStart={(e) => { drag.current = { kind: 'move', id: n.id }; e.dataTransfer.setData('text/plain', n.id) }}
          onDragEnd={() => { drag.current = null; setOver(null) }}
          onDragOver={(e) => {
            if (!drag.current) return
            e.preventDefault()
            const r = e.currentTarget.getBoundingClientRect()
            const f = (e.clientY - r.top) / r.height
            const pos: DropPos = isContainer(n) && f > 0.25 && f < 0.75 ? 'inside' : n.type === 'page' ? 'inside' : f < 0.5 ? 'before' : 'after'
            setOver({ id: n.id, pos })
          }}
          onDrop={(e) => {
            e.preventDefault()
            const dr = drag.current
            if (dr?.kind === 'move' && over) mutate((d) => ({ ...d, root: moveNode(d.root, dr.id, over.id, over.pos) }), 'move')
            drag.current = null
            setOver(null)
          }}
        >
          <span className="twisty" onClick={(e) => { e.stopPropagation(); const c = new Set(closed); if (open) c.add(n.id); else c.delete(n.id); setClosed(c) }}>{has ? (open ? '▾' : '▸') : ' '}</span>
          <span className="ltype">{nodeLabel(n)}</span>
        </div>
        {open && n.children.map((c) => row(c, depth + 1))}
      </div>
    )
  }
  return <div className="panel-body layers" onDragLeave={() => setOver(null)}>{row(doc.root, 0)}</div>
}
