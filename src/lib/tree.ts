import type { DNode, NodeType, Props } from '../types'

let counter = 0
export const uid = () => 'n' + Date.now().toString(36).slice(-4) + (counter++).toString(36) + Math.floor(Math.random() * 1296).toString(36)

export const mk = (type: NodeType, props: Props = {}, children: DNode[] = []): DNode => ({
  id: uid(),
  type,
  props,
  children,
})

export const CONTAINERS: NodeType[] = ['page', 'section', 'box']
export const isContainer = (n: DNode) => CONTAINERS.includes(n.type)

export function find(root: DNode, id: string): DNode | null {
  if (root.id === id) return root
  for (const c of root.children) {
    const f = find(c, id)
    if (f) return f
  }
  return null
}

export function findParent(root: DNode, id: string): { parent: DNode; index: number } | null {
  for (let i = 0; i < root.children.length; i++) {
    const c = root.children[i]
    if (c.id === id) return { parent: root, index: i }
    const f = findParent(c, id)
    if (f) return f
  }
  return null
}

export function pathTo(root: DNode, id: string): DNode[] {
  if (root.id === id) return [root]
  for (const c of root.children) {
    const p = pathTo(c, id)
    if (p.length) return [root, ...p]
  }
  return []
}

export function contains(node: DNode, id: string): boolean {
  return !!find(node, id)
}

/** Immutable map over the tree: `fn` may return a replacement node. */
export function mapNode(root: DNode, id: string, fn: (n: DNode) => DNode): DNode {
  if (root.id === id) return fn(root)
  let changed = false
  const children = root.children.map((c) => {
    const n = mapNode(c, id, fn)
    if (n !== c) changed = true
    return n
  })
  return changed ? { ...root, children } : root
}

export function updateProps(root: DNode, id: string, props: Props): DNode {
  return mapNode(root, id, (n) => {
    const next = { ...n.props }
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === '') delete next[k]
      else next[k] = v
    }
    return { ...n, props: next }
  })
}

export function removeNode(root: DNode, id: string): DNode {
  if (root.id === id) return root
  const children = root.children.filter((c) => c.id !== id).map((c) => removeNode(c, id))
  return { ...root, children }
}

export function insertNode(root: DNode, parentId: string, index: number, node: DNode): DNode {
  return mapNode(root, parentId, (p) => {
    const children = p.children.slice()
    children.splice(Math.max(0, Math.min(index, children.length)), 0, node)
    return { ...p, children }
  })
}

export function cloneFresh(n: DNode): DNode {
  return { ...n, id: uid(), props: JSON.parse(JSON.stringify(n.props)), children: n.children.map(cloneFresh) }
}

export type DropPos = 'before' | 'after' | 'inside'

/** Move node `id` relative to `targetId`. Returns same root when the move is illegal. */
export function moveNode(root: DNode, id: string, targetId: string, pos: DropPos): DNode {
  if (id === targetId || root.id === id) return root
  const moving = find(root, id)
  if (!moving || contains(moving, targetId)) return root
  const target = find(root, targetId)
  if (!target) return root
  if (pos === 'inside' && !isContainer(target)) return root
  if (target.id === root.id && pos !== 'inside') return root
  const without = removeNode(root, id)
  if (pos === 'inside') return insertNode(without, targetId, target.children.length, moving)
  const loc = findParent(without, targetId)
  if (!loc) return root
  if (moving.type === 'section' && loc.parent.type !== 'page') return root
  return insertNode(without, loc.parent.id, loc.index + (pos === 'after' ? 1 : 0), moving)
}

export function duplicateNode(root: DNode, id: string): { root: DNode; newId: string } {
  const loc = findParent(root, id)
  if (!loc) return { root, newId: id }
  const copy = cloneFresh(loc.parent.children[loc.index])
  return { root: insertNode(root, loc.parent.id, loc.index + 1, copy), newId: copy.id }
}

export function walk(n: DNode, fn: (n: DNode, parent: DNode | null) => void, parent: DNode | null = null) {
  fn(n, parent)
  n.children.forEach((c) => walk(c, fn, n))
}

export function nearestSection(root: DNode, id: string): DNode | null {
  const p = pathTo(root, id)
  for (let i = p.length - 1; i >= 0; i--) if (p[i].type === 'section') return p[i]
  return null
}

/** Text-bearing props in a subtree, used for AI rewriting. */
export const TEXT_PROPS: Partial<Record<NodeType, string[]>> = {
  heading: ['text'], text: ['text'], button: ['label'], tag: ['text'], quote: ['text', 'who'],
  stat: ['value', 'label'], nav: ['brand', 'cta'], input: ['label'], image: ['caption'],
}
export function collectTexts(n: DNode): { id: string; prop: string; text: string }[] {
  const out: { id: string; prop: string; text: string }[] = []
  walk(n, (x) => {
    for (const p of TEXT_PROPS[x.type] ?? []) if (typeof x.props[p] === 'string' && x.props[p]) out.push({ id: x.id, prop: p, text: x.props[p] })
  })
  return out
}
