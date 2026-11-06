import type { DNode, NodeType, Props } from '../types'

let counter = 0
export const uid = () => 'n' + Date.now().toString(36).slice(-4) + (counter++).toString(36) + Math.floor(Math.random() * 1296).toString(36)

export const mk = (type: NodeType, props: Props = {}, children: DNode[] = []): DNode => ({
  id: uid(),
  type,
  props,
  children,
})

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

export function walk(n: DNode, fn: (n: DNode, parent: DNode | null) => void, parent: DNode | null = null) {
  fn(n, parent)
  n.children.forEach((c) => walk(c, fn, n))
}
