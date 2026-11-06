import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { fontKey, fontSpec, fontsUrl, loadFont } from '../gen/fonts'
import { cloneFresh, find, moveNode, updateProps } from '../lib/tree'
import { DOC_CSS } from '../render/css'
import { DocView } from '../render/Doc'
import { mutate, setUI, useStore, type Viewport } from '../store'
import { drag, dropFor, type DropTarget } from './dnd'

export const VIEWPORT_W: Record<Viewport, number> = { desktop: 1280, tablet: 820, mobile: 390 }

interface Box { x: number; y: number; w: number; h: number }

export function Canvas() {
  const { doc, ui } = useStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [avail, setAvail] = useState(1000)
  const [hover, setHover] = useState<string | null>(null)
  const [drop, setDrop] = useState<(DropTarget & { box: Box }) | null>(null)
  const [selBox, setSelBox] = useState<Box | null>(null)
  const [stageH, setStageH] = useState(0)
  const editing = useRef<HTMLElement | null>(null)

  const width = VIEWPORT_W[ui.viewport]
  const scale = Math.min(1, (avail - 40) / width)

  const fonts = fontSpec(doc.tokens)
  useEffect(() => { loadFont(fonts) }, [fontKey(fonts)]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const ro = new ResizeObserver(() => setAvail(scrollRef.current?.clientWidth ?? 1000))
    ro.observe(scrollRef.current!)
    return () => ro.disconnect()
  }, [])

  /** rect of a node in stage (unscaled) coordinates */
  const boxOf = useCallback((el: Element | null): Box | null => {
    const st = stageRef.current
    if (!el || !st) return null
    const r = el.getBoundingClientRect()
    const s = st.getBoundingClientRect()
    return { x: (r.left - s.left) / scale, y: (r.top - s.top) / scale, w: r.width / scale, h: r.height / scale }
  }, [scale])

  useLayoutEffect(() => {
    const h = (stageRef.current?.offsetHeight ?? 0) * scale
    setStageH((p) => (Math.abs(p - h) < 1 ? p : h))
    const el = ui.selectedId ? stageRef.current?.querySelector(`[data-id="${ui.selectedId}"]`) ?? null : null
    const b = boxOf(el)
    setSelBox((p) => (p && b && p.x === b.x && p.y === b.y && p.w === b.w && p.h === b.h ? p : b))
  })

  const idOf = (t: EventTarget | null) => ((t as Element | null)?.closest?.('[data-id]') as HTMLElement | null)?.dataset.id ?? null

  function startEdit(e: React.MouseEvent) {
    const t = e.target as Element
    const field = t.closest('[data-edit]') as HTMLElement | null
    const nodeEl = t.closest('[data-id]') as HTMLElement | null
    if (!field || !nodeEl) return
    const id = nodeEl.dataset.id!
    const prop = field.dataset.edit!
    const original = field.textContent ?? ''
    editing.current = field
    nodeEl.draggable = false
    field.setAttribute('contenteditable', 'true')
    field.style.outline = '2px solid #e8590c'
    field.style.cursor = 'text'
    field.focus()
    const sel = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(field)
    sel?.removeAllRanges()
    sel?.addRange(range)
    let done = false
    const finish = (save: boolean) => {
      if (done) return
      done = true
      const next = (field.textContent ?? '').replace(/\s+/g, ' ').trim()
      field.removeAttribute('contenteditable')
      field.style.outline = ''
      field.style.cursor = ''
      nodeEl.draggable = true
      field.textContent = original // hand the DOM back to React untouched
      editing.current = null
      if (save && next && next !== original) mutate((d) => ({ ...d, root: updateProps(d.root, id, { [prop]: next }) }), 'edit-' + id)
    }
    field.addEventListener('blur', () => finish(true), { once: true })
    field.addEventListener('keydown', (ke) => {
      if (ke.key === 'Enter' && !ke.shiftKey) { ke.preventDefault(); finish(true) }
      if (ke.key === 'Escape') { ke.preventDefault(); finish(false) }
      ke.stopPropagation()
    })
  }

  function onDragStart(e: React.DragEvent) {
    // dragging inside the selected node moves the selection (so containers are draggable, not just their leaves)
    let id = idOf(e.target)
    const sel = ui.selectedId
    if (sel && sel !== id && (e.target as Element).closest(`[data-id="${sel}"]`)) id = sel
    if (!id || id === doc.root.id) { e.preventDefault(); return }
    drag.current = { kind: 'move', id }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
    setUI({ selectedId: id })
  }

  function onDragOver(e: React.DragEvent) {
    if (!drag.current) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const d = dropFor(doc.root, stageRef.current!, e)
    if (!d) { setDrop(null); return }
    const moving = find(doc.root, drag.current.id)
    if (moving && find(moving, d.id)) { setDrop(null); return }
    const b = boxOf(stageRef.current!.querySelector(`[data-id="${d.id}"]`))
    if (!b) { setDrop(null); return }
    setDrop((p) => (p && p.id === d.id && p.pos === d.pos && p.box.x === b.x && p.box.y === b.y ? p : { ...d, box: b }))
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const d = drop
    const dr = drag.current
    drag.current = null
    setDrop(null)
    if (!d || !dr) return
    mutate((doc0) => ({ ...doc0, root: moveNode(doc0.root, dr.id, d.id, d.pos) }), 'move')
  }

  return (
    <div className="canvas-scroll" ref={scrollRef} onClick={(e) => { if (e.target === e.currentTarget) setUI({ selectedId: null }) }}>
      <link rel="stylesheet" href={fontsUrl(fonts)} />
      <style>{DOC_CSS}</style>
      <div className="stage-wrap" style={{ width: width * scale, height: stageH || undefined }}>
        <div
          ref={stageRef}
          className="stage"
          style={{ width, transform: `scale(${scale})`, transformOrigin: 'top left' }}
          data-testid="stage"
          onClick={(e) => {
            if (editing.current?.contains(e.target as Node)) return
            setUI({ selectedId: idOf(e.target) === doc.root.id ? null : idOf(e.target) })
          }}
          onDoubleClick={startEdit}
          onMouseOver={(e) => setHover(idOf(e.target))}
          onMouseLeave={() => setHover(null)}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragLeave={(e) => { if (!stageRef.current?.contains(e.relatedTarget as Node)) setDrop(null) }}
          onDrop={onDrop}
          onDragEnd={() => { drag.current = null; setDrop(null) }}
        >
          <DocView root={doc.root} tokens={doc.tokens} wire={ui.wire} ctx={{ editor: true, selectedId: ui.selectedId, hoverId: hover }} />
          {selBox && <div className="sel-chip" style={{ left: selBox.x, top: Math.max(0, selBox.y - 22) }}>{find(doc.root, ui.selectedId ?? '')?.type}</div>}
          {drop && <DropIndicator d={drop} root={doc.root} />}
        </div>
      </div>
    </div>
  )
}

function findParentOf(root: ReturnType<typeof cloneFresh>, id: string): ReturnType<typeof cloneFresh> | null {
  for (const c of root.children) {
    if (c.id === id) return root
    const f = findParentOf(c, id)
    if (f) return f
  }
  return null
}

function DropIndicator({ d, root }: { d: DropTarget & { box: Box }; root: ReturnType<typeof cloneFresh> }) {
  const b = d.box
  const parent = findParentOf(root, d.id)
  const horizontal = parent?.type === 'box' && (parent.props.dir === 'row' || parent.props.dir === 'grid')
  const T = 4
  let style: React.CSSProperties
  if (d.pos === 'inside') style = { left: b.x, top: b.y, width: b.w, height: b.h, outline: '3px solid #e8590c', background: 'rgba(232,89,12,.10)' }
  else if (horizontal) style = { left: (d.pos === 'before' ? b.x : b.x + b.w) - T / 2, top: b.y, width: T, height: b.h, background: '#e8590c' }
  else style = { left: b.x, top: (d.pos === 'before' ? b.y : b.y + b.h) - T / 2, width: b.w, height: T, background: '#e8590c' }
  return <div className="drop-ind" data-pos={d.pos} style={style} />
}
