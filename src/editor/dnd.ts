import { find, findParent, isContainer, type DropPos } from '../lib/tree'
import type { DNode } from '../types'

export type Dragging = { kind: 'move'; id: string } | { kind: 'new'; type: string } | null
export const drag: { current: Dragging } = { current: null }

export interface DropTarget { id: string; pos: DropPos }

const isRow = (n: DNode | undefined) => !!n && n.type === 'box' && (n.props.dir === 'row' || n.props.dir === 'grid')

/**
 * Decide where a drop lands from pointer position and the parent's main axis.
 * Containers: edges (outer quarter, along the parent's axis) mean before/after, the middle means inside.
 * Leaves: before/after by pointer relative to the midpoint on the parent's axis.
 */
export function dropFor(root: DNode, stage: HTMLElement, e: { clientX: number; clientY: number; target: EventTarget | null }): DropTarget | null {
  const el = (e.target as Element | null)?.closest?.('[data-id]') as HTMLElement | null
  if (!el || !stage.contains(el)) return { id: root.id, pos: 'inside' }
  const id = el.dataset.id!
  const node = find(root, id)
  if (!node) return null
  if (drag.current?.kind === 'move' && drag.current.id === id) return null
  const loc = findParent(root, id)
  const rect = el.getBoundingClientRect()
  if (node.type === 'page') return { id, pos: 'inside' }
  const horizontal = isRow(loc?.parent)
  const frac = horizontal ? (e.clientX - rect.left) / rect.width : (e.clientY - rect.top) / rect.height
  if (isContainer(node)) {
    if (!node.children.length) return { id, pos: 'inside' }
    // pointer is over the container's own padding/gap: choose the nearest child gap instead
    if (e.target === el || (e.target as Element).classList?.contains('d-inner')) {
      const kids = node.children.map((c) => ({ c, el: stage.querySelector(`[data-id="${c.id}"]`) as HTMLElement | null })).filter((k) => k.el)
      let best: { id: string; pos: DropPos; d: number } | null = null
      const rowish = node.type === 'box' && isRow(node)
      for (const k of kids) {
        const r = k.el!.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        const d = Math.hypot(e.clientX - cx, e.clientY - cy)
        const after = rowish ? e.clientX > cx : e.clientY > cy
        if (!best || d < best.d) best = { id: k.c.id, pos: after ? 'after' : 'before', d }
      }
      if (best) return { id: best.id, pos: best.pos }
      return { id, pos: 'inside' }
    }
    if (frac < 0.18) return { id, pos: 'before' }
    if (frac > 0.82) return { id, pos: 'after' }
    return { id, pos: 'inside' }
  }
  return { id, pos: frac < 0.5 ? 'before' : 'after' }
}
