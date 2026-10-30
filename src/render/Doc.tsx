import { createContext, useContext, type CSSProperties, type ReactNode } from 'react'
import type { DNode, Tokens } from '../types'
import { Art, type ArtKind } from './art'
import { tokenVars } from './css'

export interface RenderCtx {
  editor: boolean
  selectedId?: string | null
  hoverId?: string | null
}
const Ctx = createContext<RenderCtx>({ editor: false })

const PAD: Record<string, number> = { none: 0, s: 1.4, m: 2.4, l: 3.6, xl: 5.2 }

function tpl(cols: unknown): string | undefined {
  if (typeof cols === 'number') return `repeat(${cols}, minmax(0,1fr))`
  if (typeof cols === 'string' && cols.trim()) return cols.replace(/(^|\s)(\d+(?:\.\d+)?)(?=\s|$)/g, '$1$2fr')
  return undefined
}

function useAttrs(n: DNode, cls: string, extra: Record<string, any> = {}, style: Record<string, any> = {}) {
  const ctx = useContext(Ctx)
  const p = n.props
  const st: Record<string, any> = { ...style }
  if (p.span) st.gridColumn = `span ${p.span}`
  if (p.rowSpan) st.gridRow = `span ${p.rowSpan}`
  if (p.minh) st.minHeight = `${p.minh}px`
  if (p.selfAlign) st.alignSelf = p.selfAlign
  if (p.maxw) st['--maxw'] = `${p.maxw}ch`
  const out: Record<string, any> = {
    className: cls + (ctx.editor && ctx.selectedId === n.id ? ' is-sel' : '') + (ctx.editor && ctx.hoverId === n.id ? ' is-hover' : ''),
    style: st,
    ...extra,
  }
  if (ctx.editor) {
    out['data-id'] = n.id
    out['data-type'] = n.type
  }
  return out
}

const ed = (ctx: RenderCtx, prop: string) => (ctx.editor ? { 'data-edit': prop } : {})

function Kids({ n }: { n: DNode }) {
  return <>{n.children.map((c) => <NodeView key={c.id} n={c} />)}</>
}

function lines(v: unknown): string[] {
  return Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n') : []
}

export function NodeView({ n }: { n: DNode }): ReactNode {
  const ctx = useContext(Ctx)
  const p = n.props
  switch (n.type) {
    case 'page':
      return <Kids n={n} />
    case 'section': {
      const a = useAttrs(n, 'd-sec', { 'data-bg': p.bg, 'data-pad': p.pad === 'none' ? 'none' : undefined, 'data-align': p.align, 'data-width': p.width }, { '--pad': PAD[p.pad ?? 'm'], '--gap': p.gap, ...(p.sw ? { '--sw': `${p.sw}px` } : {}) } as CSSProperties)
      return <section {...a}><div className="d-inner"><Kids n={n} /></div></section>
    }
    case 'box': {
      const dir = p.dir ?? 'col'
      const a = useAttrs(n, 'd-box', {
        'data-dir': dir, 'data-align': p.align, 'data-justify': p.justify, 'data-bg': p.bg, 'data-variant': p.variant,
        'data-pad': p.pad ? 'y' : undefined, 'data-keep': p.keep ? 'true' : undefined, 'data-sticky': p.sticky ? 'true' : undefined, 'data-full': p.full ? 'true' : undefined,
      }, { '--tpl': tpl(p.cols), '--gap': p.gap, '--bpad': p.pad, '--ai': p.valign } as CSSProperties)
      return <div {...a}><Kids n={n} /></div>
    }
    case 'heading': {
      const Tag = (`h${p.level ?? 2}`) as 'h1'
      const a = useAttrs(n, 'd-h', { 'data-size': p.size ?? 'l' }, { textAlign: p.align, ...(p.accent ? { color: 'var(--accent-text)' } : {}) })
      return <Tag {...a} {...ed(ctx, 'text')}>{p.text}</Tag>
    }
    case 'text': {
      const a = useAttrs(n, 'd-text', { 'data-size': p.size ?? 'm', 'data-muted': p.muted ? 'true' : undefined }, { textAlign: p.align, ...(p.align === 'center' ? { marginInline: 'auto' } : {}) })
      return <p {...a} {...ed(ctx, 'text')}>{p.text}</p>
    }
    case 'button': {
      const a = useAttrs(n, 'd-btn', { 'data-variant': p.variant ?? 'solid', 'data-size': p.size })
      return <a {...a} href="#" onClick={(e) => e.preventDefault()}><span {...ed(ctx, 'label')}>{p.label}</span>{p.arrow ? <span aria-hidden="true">→</span> : null}</a>
    }
    case 'image': {
      const a = useAttrs(n, 'd-img', { 'data-shape': p.shape }, { '--ratio': String(p.ratio ?? '4/3') })
      return (
        <figure {...a}>
          <Art kind={(p.art ?? 'blocks') as ArtKind} seed={p.seed ?? 1} tone={p.tone ?? 0} />
          {p.caption ? <figcaption {...ed(ctx, 'caption')}>{p.caption}</figcaption> : null}
        </figure>
      )
    }
    case 'nav': {
      const a = useAttrs(n, 'd-nav', { 'data-variant': p.variant ?? 'bar', 'data-border': p.border ? 'true' : undefined })
      return (
        <nav {...a}>
          <span className="d-nav-brand" {...ed(ctx, 'brand')}>{p.brand}</span>
          <ul className="d-nav-links">{lines(p.links).map((l, i) => <li key={i}><a href="#" onClick={(e) => e.preventDefault()}>{l}</a></li>)}</ul>
          {p.cta ? <a className="d-btn" data-size="s" data-variant={p.ctaVariant ?? 'solid'} href="#" onClick={(e) => e.preventDefault()}>{p.cta}</a> : null}
        </nav>
      )
    }
    case 'tag': {
      const a = useAttrs(n, 'd-tag', { 'data-variant': p.variant })
      return <span {...a} {...ed(ctx, 'text')}>{p.text}</span>
    }
    case 'stat': {
      const a = useAttrs(n, 'd-stat', { 'data-size': p.size })
      return <div {...a}><span className="d-stat-v" {...ed(ctx, 'value')}>{p.value}</span><span className="d-stat-l" {...ed(ctx, 'label')}>{p.label}</span></div>
    }
    case 'table': {
      const a = useAttrs(n, 'd-table', { 'data-zebra': p.zebra ? 'true' : undefined })
      const rows: string[][] = lines(p.rows).map((r) => (Array.isArray(r) ? r : String(r).split('|').map((s) => s.trim())))
      return (
        <table {...a}>
          <thead><tr>{lines(p.cols).map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
        </table>
      )
    }
    case 'list': {
      const a = useAttrs(n, 'd-list', { 'data-variant': p.variant ?? 'ruled' })
      return (
        <ul {...a}>
          {lines(p.items).map((it, i) => {
            const [t, m] = String(it).split('|').map((s) => s.trim())
            return <li key={i}><span className="d-li-title">{t}</span>{m ? <span className="d-li-meta">{m}</span> : null}</li>
          })}
        </ul>
      )
    }
    case 'divider':
      return <hr {...useAttrs(n, 'd-div', { 'data-variant': p.variant ?? 'thin' })} />
    case 'input': {
      const a = useAttrs(n, 'd-field', {})
      const kind = p.kind ?? 'text'
      return (
        <div {...a}>
          <label {...ed(ctx, 'label')}>{p.label}</label>
          {kind === 'toggle' ? <span className="d-toggle" data-on={p.on ? 'true' : 'false'} /> : (
            <span className="d-control" style={kind === 'textarea' ? { minHeight: '5.5em' } : undefined}>{p.value || p.placeholder || ' '}{kind === 'select' ? ' ▾' : ''}</span>
          )}
        </div>
      )
    }
    case 'marquee': {
      const a = useAttrs(n, 'd-marquee', { 'data-bg': p.bg })
      const items = lines(p.items)
      const track = (hide: boolean) => <span className="d-marquee-track" aria-hidden={hide || undefined}>{[0, 1].map((k) => items.map((t, i) => <span key={k + '-' + i}>{t}</span>))}</span>
      return <div {...a}>{track(false)}{track(true)}</div>
    }
    case 'quote': {
      const a = useAttrs(n, 'd-quote', { 'data-size': p.size, 'data-mark': p.mark ? 'true' : undefined }, { textAlign: p.align })
      return <figure {...a}><blockquote {...ed(ctx, 'text')}>{p.text}</blockquote>{p.who ? <cite {...ed(ctx, 'who')}>{p.who}</cite> : null}</figure>
    }
  }
}

export function DocView({ root, tokens, ctx = { editor: false }, wire = false }: { root: DNode; tokens: Tokens; ctx?: RenderCtx; wire?: boolean }) {
  return (
    <Ctx.Provider value={ctx}>
      <div className={'d-frame' + (wire ? ' wire' : '')}>
        <div className="d-doc" data-sig={tokens.signature} style={tokenVars(tokens) as CSSProperties}>
          <NodeView n={root} />
        </div>
      </div>
    </Ctx.Provider>
  )
}
