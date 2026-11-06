import { createContext, useContext, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import type { DNode, Props, Tokens } from '../types'
import { Art, type ArtKind } from './art'
import { tokenVars } from './css'
import { placeholdUrl } from './placehold'
import { initReveal } from './reveal'

export { placeholdUrl }

export interface RenderCtx {
  tokens?: Tokens
  editor: boolean
  selectedId?: string | null
  hoverId?: string | null
}
const Ctx = createContext<RenderCtx>({ editor: false })

const PAD: Record<string, number> = { none: 0, s: 1.1, m: 1.8, l: 2.6, xl: 3.6 }

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
    if (n.type !== 'page') out.draggable = true
  }
  return out
}

const ed = (ctx: RenderCtx, prop: string) => (ctx.editor ? { 'data-edit': prop } : {})

/** Backdrop layer for art/photo backdrops; pattern backdrops are pure CSS on the element. */
function BackdropLayer({ p, tokens }: { p: Props; tokens?: Tokens }) {
  if (p.backdrop === 'art') return <div className="d-bd" aria-hidden="true"><Art soft kind={(p.bdArt ?? 'blocks') as ArtKind} seed={p.bdSeed ?? 1} tone={p.bdTone ?? 0} /></div>
  if (p.backdrop === 'photo') return <div className="d-bd" data-kind="photo" aria-hidden="true"><img className="d-photo" src={placeholdUrl({ ratio: '16/9', tone: p.bdTone ?? 0, hideText: true }, tokens, 1600)} alt="" loading="lazy" draggable={false} /></div>
  return null
}
const bdAttrs = (p: Props) => (p.backdrop ? { 'data-backdrop': p.backdrop, 'data-bdside': p.bdSide } : {})
const bdStyle = (p: Props): Record<string, any> => (p.backdrop ? { '--bd-s': p.bdStrength === 'strong' ? 2 : 1 } : {})

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
      const a = useAttrs(n, 'd-sec', { 'data-bg': p.bg, 'data-pad': p.pad === 'none' ? 'none' : undefined, 'data-align': p.align, 'data-width': p.width, 'data-role': p.role, ...bdAttrs(p) }, { '--pad': PAD[p.pad ?? 'm'], '--gap': p.gap, ...bdStyle(p), ...(p.sw ? { '--sw': `${p.sw}px` } : {}) } as CSSProperties)
      return <section {...a}><BackdropLayer p={p} tokens={ctx.tokens} /><div className="d-inner"><Kids n={n} /></div></section>
    }
    case 'box': {
      const dir = p.dir ?? 'col'
      const a = useAttrs(n, 'd-box', {
        'data-dir': dir, 'data-align': p.align, 'data-justify': p.justify, 'data-bg': p.bg, 'data-variant': p.variant,
        'data-pad': p.pad ? 'y' : undefined, 'data-keep': p.keep ? 'true' : undefined, 'data-sticky': p.sticky ? 'true' : undefined, 'data-full': p.full ? 'true' : undefined, ...bdAttrs(p),
      }, { '--tpl': tpl(p.cols), '--gap': p.gap, '--bpad': p.pad, '--ai': p.valign, ...bdStyle(p) } as CSSProperties)
      return <div {...a}><BackdropLayer p={p} tokens={ctx.tokens} /><Kids n={n} /></div>
    }
    case 'heading': {
      const Tag = (`h${p.level ?? 2}`) as 'h1'
      const a = useAttrs(n, 'd-h', { 'data-size': p.size ?? 'l' }, { textAlign: p.align, ...(p.accent ? { color: 'var(--accent-text)' } : {}) })
      return <Tag {...a} {...ed(ctx, 'text')}>{p.text}</Tag>
    }
    case 'text': {
      const a = useAttrs(n, 'd-text', { 'data-size': p.size ?? 'm', 'data-muted': p.muted ? 'true' : undefined, 'data-label': p.label ? 'true' : undefined }, { textAlign: p.align, ...(p.align === 'center' ? { marginInline: 'auto' } : {}) })
      return <p {...a} {...ed(ctx, 'text')}>{p.text}</p>
    }
    case 'button': {
      const a = useAttrs(n, 'd-btn', { 'data-variant': p.variant ?? 'solid', 'data-size': p.size })
      return <a {...a} href="#" onClick={(e) => e.preventDefault()}><span {...ed(ctx, 'label')}>{p.label}</span>{p.arrow ? <span aria-hidden="true">→</span> : null}</a>
    }
    case 'image': {
      const a = useAttrs(n, 'd-img', { 'data-shape': p.shape, 'data-frame': p.frame, 'data-icon': p.icon ? 'true' : undefined }, { '--ratio': String(p.ratio ?? '4/3') })
      return (
        <figure {...a}>
          {p.source === 'placehold' ? (
            <img className="d-photo" src={placeholdUrl(p, ctx.tokens)} alt={p.caption ?? ''} loading="lazy" draggable={false} />
          ) : (
            <Art kind={(p.art ?? 'blocks') as ArtKind} seed={p.seed ?? 1} tone={p.tone ?? 0} />
          )}
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
    case 'logos': {
      const a = useAttrs(n, 'd-logos', {})
      return <ul {...a}>{lines(p.items).map((l, i) => <li key={i}>{l}</li>)}</ul>
    }
    case 'faq': {
      const a = useAttrs(n, 'd-faq', {})
      return (
        <div {...a}>
          {lines(p.items).map((it, i) => {
            const [q, ...rest] = String(it).split('|')
            return <details key={i} open={i === 0 && p.open !== false}><summary>{q.trim()}</summary><div className="d-faq-a">{rest.join('|').trim()}</div></details>
          })}
        </div>
      )
    }
    case 'quote': {
      const a = useAttrs(n, 'd-quote', { 'data-size': p.size, 'data-mark': p.mark ? 'true' : undefined }, { textAlign: p.align })
      return <figure {...a}><blockquote {...ed(ctx, 'text')}>{p.text}</blockquote>{p.who ? <cite {...ed(ctx, 'who')}>{p.who}</cite> : null}</figure>
    }
  }
}

export function DocView({ root, tokens, ctx = { editor: false }, wire = false, still = false }: { root: DNode; tokens: Tokens; ctx?: RenderCtx; wire?: boolean; still?: boolean }) {
  const frame = useRef<HTMLDivElement>(null)
  useEffect(() => (still ? undefined : initReveal(frame.current)), [root, still])
  return (
    <Ctx.Provider value={{ ...ctx, tokens }}>
      <div ref={frame} className={'d-frame' + (wire ? ' wire' : '') + (still ? ' still' : '')}>
        <div className="d-doc" data-sig={tokens.signature} style={tokenVars(tokens) as CSSProperties}>
          <NodeView n={root} />
        </div>
      </div>
    </Ctx.Provider>
  )
}
