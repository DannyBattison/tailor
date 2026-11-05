// Section builders and layout archetypes. Everything here is pure: (ctx) -> nodes.
import type { Rng } from '../lib/rng'
import { mk } from '../lib/tree'
import type { DNode, Kind, Props, Tokens } from '../types'
import type { AppContent, MarketingContent } from './content'
import { ART_KINDS } from '../render/art'

export interface Ctx {
  rng: Rng
  t: Tokens
  c: MarketingContent
  a: AppContent
}

// ---------- node helpers ----------
const H = (text: string, size: string, level = 2, extra: Props = {}) => mk('heading', { text, size, level, ...extra })
const P = (text: string, extra: Props = {}) => mk('text', { text, ...extra })
const B = (label: string, variant = 'solid', extra: Props = {}) => mk('button', { label, variant, ...extra })
const T = (text: string, extra: Props = {}) => mk('tag', { text, ...extra })
const row = (cols: string | number, children: DNode[], extra: Props = {}) => mk('box', { dir: 'row', cols, ...extra }, children)
const col = (children: DNode[], extra: Props = {}) => mk('box', { dir: 'col', ...extra }, children)
const btnRow = (children: DNode[]) => mk('box', { dir: 'row', cols: children.map(() => 'auto').join(' '), gap: 0.6, keep: true, valign: 'center' }, children)
const sec = (build: string, props: Props, children: DNode[]) => mk('section', { build, role: build.split('.')[0], ...props }, children)
const img = (x: Ctx, ratio: string, extra: Props = {}) =>
  mk('image', { art: x.rng.pick(x.c.art.length ? x.c.art : [...ART_KINDS]), seed: x.rng.int(1, 9999), tone: x.rng.weighted<number>([[0, 4], [1, 4], [2, 1.5], [3, 1]]), ratio, ...extra })
const flip = (x: Ctx, a: DNode, b: DNode): [DNode, DNode] => (x.rng.chance(0.5) ? [a, b] : [b, a])

// ---------- backdrops ----------
type BdRole = 'hero' | 'cta' | 'quote' | 'stats' | 'card'
const BD_KEYS = ['backdrop', 'bdStrength', 'bdSide', 'bdArt', 'bdSeed', 'bdTone', 'bdGen', 'bdRole', 'bdFlat']
const BD_WEIGHTS: Record<BdRole, [string, number][]> = {
  hero: [['', 2], ['grid', 1.5], ['dots', 1.5], ['hatch', 1], ['wash', 2.2], ['split', 2.5], ['art', 1.8], ['photo', 1]],
  cta: [['', 1], ['art', 2], ['hatch', 1.5], ['dots', 1.5], ['split', 1]],
  quote: [['', 2], ['wash', 2], ['dots', 1], ['grid', 1]],
  stats: [['', 2], ['dots', 1], ['hatch', 1]],
  card: [['', 5], ['dots', 1], ['hatch', 1], ['wash', 1]],
}

/** Choose a backdrop for a hero/cta/etc. `bg` is the element's own fill; `flat` forbids layouts that already carry an image. */
export function backdropProps(rng: Rng, role: BdRole, bg?: string, flat = false): Props {
  const loud = bg === 'accent' || bg === 'inverse'
  const pool = BD_WEIGHTS[role].filter(([k]) => !(flat && ['art', 'photo', 'split'].includes(k)) && !(loud && ['wash', 'split', 'photo', 'grid'].includes(k)))
  const kind = rng.weighted(pool)
  const out: Props = { bdGen: true, bdRole: role, bdFlat: flat || undefined }
  if (!kind) return out
  out.backdrop = kind
  if (kind === 'split') out.bdSide = rng.pick(['left', 'right'])
  if (kind === 'art') { out.bdArt = rng.pick(['blocks', 'stripes', 'arches', 'dots', 'waves', 'sun', 'rings']); out.bdSeed = rng.int(1, 9999); out.bdTone = loud ? 1 : rng.pick([0, 1]) }
  if (kind === 'photo') out.bdTone = rng.pick([0, 1])
  if (rng.chance(0.25) && kind !== 'photo') out.bdStrength = 'strong'
  return out
}
export const clearBackdrop = (): Props => Object.fromEntries(BD_KEYS.map((k) => [k, undefined]))
const withBd = (x: Ctx, n: DNode, role: BdRole, flat = false): DNode => { n.props = { ...n.props, ...backdropProps(x.rng, role, n.props.bg, flat) }; return n }

// ---------- marketing sections ----------
type Builder = (x: Ctx) => DNode
export const SECTIONS: Record<string, Builder> = {
  'nav.bar': (x) => mk('nav', { brand: x.c.name, links: x.c.nav, cta: x.c.cta.length < 22 ? x.c.cta : undefined, variant: 'bar', border: x.rng.chance(0.6), build: 'nav.bar', role: 'nav' }),
  'nav.centered': (x) => mk('nav', { brand: x.c.name, links: x.c.nav, variant: 'centered', border: x.rng.chance(0.5), build: 'nav.centered', role: 'nav' }),

  'hero.split': (x) => {
    const left = col([T(x.c.eyebrow), H(x.c.headline, 'xl', 1), P(x.c.sub, { size: 'l', muted: true, maxw: 46 }), btnRow([B(x.c.cta, 'solid', { arrow: x.rng.chance(0.5) }), B(x.c.ctaAlt, x.rng.pick(['ghost', 'outline']))])], { gap: 1.1, valign: 'center' })
    const right = img(x, x.rng.pick(['3/4', '4/5', '1/1']), { shape: x.rng.pick(['arch', undefined, undefined, 'arch']), caption: x.rng.chance(0.4) ? x.c.tags[0] : undefined })
    const [a, b] = flip(x, left, right)
    const l = a === left
    const cols = l ? x.rng.pick(['5fr 4fr', '7fr 4fr', '1fr 1fr', '3fr 2fr']) : x.rng.pick(['4fr 5fr', '4fr 7fr', '1fr 1fr', '2fr 3fr'])
    return sec('hero.split', { pad: x.rng.pick(['l', 'xl']), bg: x.rng.pick([undefined, undefined, 'surface']) }, [row(cols, [a, b], { valign: 'center', gap: 2 })])
  },
  'hero.giant': (x) =>
    sec('hero.giant', { pad: 'l', width: 'full' }, [
      T(x.c.eyebrow),
      H(x.c.short, 'xxl', 1),
      row(x.rng.pick(['1fr 2fr', '2fr 1fr', '1fr 1fr']), x.rng.chance(0.5) ? [P(x.c.sub, { size: 'l' }), btnRow([B(x.c.cta, 'solid', { arrow: true }), B(x.c.ctaAlt, 'ghost')])] : [btnRow([B(x.c.cta, 'solid', { arrow: true })]), P(x.c.sub, { size: 'l' })], { gap: 2, valign: 'end' }),
    ]),
  'hero.stack': (x) =>
    sec('hero.stack', { pad: 'l', align: x.rng.pick([undefined, undefined, 'center']) }, [
      T(x.c.eyebrow), H(x.c.headline, 'xl', 1), row(x.rng.pick(['2fr 1fr', '3fr 2fr']), [P(x.c.sub, { size: 'l', muted: true }), btnRow([B(x.c.cta, 'solid'), B(x.c.ctaAlt, 'ghost')])], { gap: 1.5, valign: 'center' }),
      img(x, x.rng.pick(['21/9', '16/7', '3/1'])),
    ]),
  'hero.dense': (x) =>
    sec('hero.dense', { pad: 'm' }, [
      row('2fr 1fr', [col([T(x.c.eyebrow), H(x.c.headline, 'l', 1)], { gap: 0.8 }), col([P(x.c.sub, { muted: true }), btnRow([B(x.c.cta, 'ink')])], { gap: 0.8, variant: 'rule-left' })], { gap: 2, valign: 'end' }),
    ]),

  'features.numbered': (x) => {
    const n = x.rng.int(4, 6)
    return sec('features.numbered', { pad: 'l' }, [
      row(x.rng.pick(['1fr 2fr', '2fr 3fr', '1fr 3fr']), [
        col([H(x.rng.pick(['How it works', 'What you get', 'The details', 'Why us']), 'm'), P(x.c.sub, { muted: true, size: 's' })], { sticky: true, gap: 0.8 }),
        col(x.c.features.slice(0, n).map((f) => row('auto 1fr', [T(String(x.c.features.indexOf(f) + 1).padStart(2, '0'), { variant: 'plain' }), col([H(f.title, 's', 3), P(f.body, { muted: true })], { gap: 0.3 })], { variant: 'rule-top', gap: 1, keep: true })), { gap: 1 }),
      ], { gap: 3 }),
    ])
  },
  'features.twocol': (x) =>
    sec('features.twocol', { pad: 'l' }, [
      H(x.rng.pick(['The detail work', 'What we care about', 'Things worth knowing']), 'l'),
      mk('box', { dir: 'grid', cols: 2, gap: 1.8 }, x.c.features.slice(0, x.rng.pick([4, 6])).map((f) => col([H(f.title, 's', 3), P(f.body, { muted: true })], { variant: 'rule-top', gap: 0.4 }))),
    ]),
  'features.uneven': (x) => {
    const pattern = x.rng.pick([['2fr 1fr 1fr', 3], ['1fr 2fr 1fr', 3], ['3fr 2fr', 2], ['1fr 1fr 2fr', 3]] as [string, number][])
    // one loud card at most; the others stay quiet so the row isn't a rainbow
    const bgs = x.rng.pick<(string | undefined)[]>([['inverse', 'surface', 'surface'], ['accent', 'surface', undefined], ['surface', 'inverse', undefined], [undefined, 'accent', undefined]])
    return sec('features.uneven', { pad: 'l' }, [
      row(x.rng.chance(0.5) ? '1fr 2fr' : '2fr 1fr', [H(x.rng.pick(['Three things we won\'t compromise on', 'What this is about', 'The short version']), 'l'), P(x.c.sub, { muted: true })], { gap: 2, valign: 'end' }),
      row(pattern[0], x.c.features.slice(0, pattern[1]).map((f, i) => col([H(f.title, 's', 3), P(f.body, { muted: i !== 0 && bgs[i] === undefined })], { variant: 'card', bg: bgs[i], pad: 1.2, gap: 0.6, ...(i === 0 ? { minh: 150 } : {}) })), { gap: 1.2, valign: 'stretch' }),
    ])
  },
  'features.bento': (x) => {
    const spans = x.rng.pick([[2, 1, 1], [1, 2, 1], [1, 1, 2]])
    const spans2 = x.rng.pick([[1, 3], [3, 1], [2, 2]])
    const f = x.c.features
    const s = x.c.stats
    const q = x.c.quotes[0]
    const tiles: DNode[] = [
      withBd(x, col([T(f[0].title, { variant: 'accent' }), H(f[0].body, 's', 3)], { variant: 'card', pad: 1.2, gap: 0.8, span: spans[0], bg: 'surface', minh: 150 }), 'card'),
      col([mk('stat', { value: s[0].value, label: s[0].label, size: 'l' })], { variant: 'card', pad: 1.2, span: spans[1], bg: 'accent', justify: 'between', minh: 150 }),
      img(x, '4/3', { span: spans[2], minh: 150 }),
      img(x, '16/9', { span: spans2[0], shape: x.rng.pick([undefined, 'pill']) }),
      col([mk('quote', { text: q.text, who: q.who, size: 's' })], { variant: 'card', pad: 1.2, span: spans2[1], bg: 'inverse', justify: 'center' }),
    ]
    return sec('features.bento', { pad: 'l' }, [row(x.rng.pick(['2fr 1fr', '1fr 1fr']), [H(x.rng.pick(['Everything in one place, sort of', 'A closer look', 'On the shelf']), 'l'), P(f[1].body, { muted: true })], { gap: 2, valign: 'end' }), mk('box', { dir: 'grid', cols: 4, gap: 1 }, tiles)])
  },
  'features.alt': (x) => {
    const rows = x.c.features.slice(0, 3).map((f, i) => {
      const t = col([T(String(i + 1).padStart(2, '0'), { variant: 'plain' }), H(f.title, 'm', 3), P(f.body, { muted: true, size: 'l' })], { gap: 0.8, valign: 'center' })
      const im = img(x, x.rng.pick(['4/3', '1/1', '5/4']), { shape: x.rng.pick([undefined, 'arch']) })
      const [a, b] = i % 2 ? [im, t] : [t, im]
      return row(i % 2 ? '1fr 1fr' : x.rng.pick(['1fr 1fr', '5fr 4fr']), [a, b], { valign: 'center', gap: 2.5 })
    })
    return sec('features.alt', { pad: 'l', gap: 3 }, rows)
  },

  'stats.row': (x) =>
    sec('stats.row', { pad: x.rng.pick(['s', 'm']), bg: x.rng.pick([undefined, 'surface', 'inverse']) }, [
      row(4, x.c.stats.map((s) => col([mk('stat', { value: s.value, label: s.label, size: 'l' })], { variant: 'rule-top' })), { gap: 1.2, keep: false }),
    ]),
  'stats.big': (x) =>
    sec('stats.big', { pad: 'm', bg: x.rng.pick(['accent', 'inverse']) }, [
      row(x.rng.pick(['2fr 1fr 1fr', '1fr 1fr 2fr']), x.c.stats.slice(0, 3).map((s, i) => mk('stat', { value: s.value, label: s.label, size: i === (x.rng.chance(0.5) ? 0 : 2) ? 'l' : 'm' })), { gap: 2, valign: 'end' }),
    ]),

  'quote.big': (x) => {
    const q = x.rng.pick(x.c.quotes)
    return sec('quote.big', { pad: 'xl', bg: x.rng.pick(['inverse', 'surface', 'accent']) }, [mk('quote', { text: q.text, who: q.who, size: 'xl', mark: true, maxw: 40 })])
  },
  'quote.side': (x) => {
    const q = x.rng.pick(x.c.quotes)
    return sec('quote.side', { pad: 'l' }, [row(x.rng.pick(['1fr 3fr', '1fr 2fr']), [col([T('In their words', { variant: 'plain' }), mk('divider', { variant: 'heavy' })], { gap: 0.6 }), mk('quote', { text: q.text, who: q.who, mark: true })], { gap: 2.5 })])
  },
  'quote.pair': (x) =>
    sec('quote.pair', { pad: 'l' }, [row(x.rng.pick(['3fr 2fr', '2fr 3fr']), x.c.quotes.slice(0, 2).map((q, i) => col([mk('quote', { text: q.text, who: q.who, size: i ? 's' : undefined })], { variant: i ? 'outline' : 'rule-left', pad: i ? 1.2 : undefined })), { gap: 2, valign: 'start' })]),

  'cta.band': (x) =>
    sec('cta.band', { pad: 'l', bg: x.rng.pick(['accent', 'inverse']) }, [
      row(x.rng.pick(['2fr 1fr', '3fr 1fr']), [col([H(x.c.closing, 'l'), P(x.c.closingSub)], { gap: 0.6 }), btnRow([B(x.c.cta, x.rng.pick(['ink', 'outline']), { arrow: true })])], { gap: 2, valign: 'center' }),
    ]),
  'cta.split': (x) =>
    sec('cta.split', { pad: 'xl' }, [H(x.c.closing, 'xl'), row('1fr 1fr', [P(x.c.closingSub, { size: 'l', muted: true }), btnRow([B(x.c.cta, 'solid', { arrow: true }), B(x.c.ctaAlt, 'outline')])], { gap: 2, valign: 'center' })]),

  'index.list': (x) =>
    sec('index.list', { pad: 'l' }, [row(x.rng.pick(['1fr 2fr', '1fr 3fr']), [col([H(x.rng.pick(['The full list', 'Currently on', 'Index']), 'm'), P('Updated weekly.', { muted: true, size: 's' })], { gap: 0.6, sticky: true }), mk('list', { variant: 'index', items: x.c.index })], { gap: 3 })]),
  'index.table': (x) =>
    sec('index.table', { pad: 'm' }, [row('1fr 2fr', [H(x.rng.pick(['At a glance', 'In numbers', 'Schedule']), 'm'), mk('table', { cols: x.c.tableCols, rows: x.c.tableRows, zebra: x.rng.chance(0.5) })], { gap: 2 })]),
  'marquee.band': (x) => sec('marquee.band', { pad: 'none', width: 'full' }, [mk('marquee', { items: x.c.marquee, bg: x.rng.pick([undefined, 'ink', 'accent2']) })]),

  'footer.simple': (x) =>
    sec('footer.simple', { pad: 's', bg: x.rng.pick([undefined, 'surface']) }, [
      mk('divider', { variant: 'heavy' }),
      row(x.rng.pick(['2fr 1fr 1fr', '1fr 1fr 2fr', '3fr 2fr']), [col([H(x.c.name, 's', 3), P(x.c.footer, { muted: true, size: 's' })], { gap: 0.4 }), mk('list', { variant: 'bullets', items: x.c.nav }), P('Made by hand, in a few weeks.\nNo cookies.'.replace('\n', ' '), { muted: true, size: 's' })], { gap: 2 }),
    ]),
}

for (const key of Object.keys(SECTIONS)) {
  const role = key.split('.')[0]
  if (!['hero', 'cta', 'quote', 'stats'].includes(key.split('.')[0])) continue
  const build = SECTIONS[key]
  SECTIONS[key] = (x) => withBd(x, build(x), role as BdRole, key === 'hero.split' || key === 'hero.dense')
}

export const roleOf = (build: string) => (build.startsWith('app.') ? build.replace(/\d$/, '') : build.split('.')[0])
export const variantsOf = (role: string) => Object.keys(SECTIONS).filter((k) => roleOf(k) === role)

// ---------- marketing archetypes ----------
export interface Archetype { id: string; name: string; kind: Kind; build: (x: Ctx) => DNode[] }
const S = (k: string, x: Ctx) => SECTIONS[k](x)

export const ARCHETYPES: Archetype[] = [
  { id: 'editorial', name: 'Editorial split', kind: 'marketing', build: (x) => [S('nav.bar', x), S('hero.split', x), S(x.rng.pick(['features.numbered', 'features.twocol']), x), S(x.rng.pick(['quote.side', 'quote.big']), x), x.rng.chance(0.5) ? S('index.list', x) : S('stats.row', x), S('cta.band', x), S('footer.simple', x)] },
  { id: 'poster', name: 'Poster / giant type', kind: 'marketing', build: (x) => [S(x.rng.pick(['nav.centered', 'nav.bar']), x), S('hero.giant', x), S('marquee.band', x), S('features.uneven', x), S('stats.big', x), S(x.rng.pick(['cta.split', 'cta.band']), x), S('footer.simple', x)] },
  { id: 'bento', name: 'Bento grid', kind: 'marketing', build: (x) => [S('nav.bar', x), S('hero.stack', x), S('features.bento', x), S('stats.row', x), S(x.rng.pick(['quote.big', 'quote.pair']), x), S('cta.band', x), S('footer.simple', x)] },
  { id: 'bands', name: 'Stacked bands', kind: 'marketing', build: (x) => [S('nav.centered', x), S('hero.split', x), S('features.alt', x), S('stats.big', x), S('quote.pair', x), S('cta.split', x), S('footer.simple', x)] },
  {
    id: 'sidebar', name: 'Sidebar-first', kind: 'marketing',
    build: (x) => {
      const side = col([mk('nav', { brand: x.c.name, links: x.c.nav, cta: x.c.cta.length < 22 ? x.c.cta : undefined, variant: 'stacked', build: 'nav.stacked', role: 'nav' }), P(x.c.footer, { muted: true, size: 's' })], { variant: x.rng.pick(['rule-left', undefined]), sticky: true, justify: 'between', gap: 2, pad: 1, bg: x.rng.pick([undefined, 'surface']), full: true })
      const main = col([S('hero.stack', x), S(x.rng.pick(['features.twocol', 'features.numbered']), x), S('stats.row', x), S('quote.side', x), S('cta.band', x)], { gap: 0 })
      const [a, b] = x.rng.chance(0.8) ? [side, main] : [main, side]
      const cols = a === side ? x.rng.pick(['240px 1fr', '280px 1fr']) : x.rng.pick(['1fr 240px', '1fr 280px'])
      return [row(cols, [a, b], { keep: true, gap: 0, valign: 'stretch' })]
    },
  },
  { id: 'index', name: 'Dense index / list', kind: 'marketing', build: (x) => [mk('nav', { brand: x.c.name, links: x.c.nav, cta: x.c.ctaAlt.length < 22 ? x.c.ctaAlt : undefined, variant: 'bar', border: true, ctaVariant: 'outline', build: 'nav.bar', role: 'nav' }), S('hero.dense', x), S('index.list', x), S('index.table', x), S('stats.row', x), S('footer.simple', x)] },
]

// ---------- app sections ----------
const sidebar = (x: Ctx) =>
  col([
    mk('nav', { brand: x.a.name, links: x.a.nav, variant: 'stacked' }),
    col([mk('divider', { variant: 'thin' }), P(x.a.user, { size: 's' }), P('Workspace settings', { size: 's', muted: true })], { gap: 0.4 }),
  ], { justify: 'between', gap: 2, pad: 1, bg: x.rng.pick(['surface', 'inverse', undefined]), variant: x.rng.pick(['rule-left', undefined]), full: true })

const APP: Record<string, Builder> = {
  'app.topbar': (x) => sec('app.topbar', { pad: 's' }, [row('1fr auto', [col([H(x.a.title, 'l', 1), P(x.a.sub, { muted: true })], { gap: 0.3 }), btnRow([mk('input', { label: 'Search', kind: 'text', placeholder: 'Find anything' }), B(x.a.primary, 'solid')])], { gap: 1.5, valign: 'end', keep: true })]),
  'app.kpis': (x) => {
    const lead = x.rng.chance(0.5)
    return sec('app.kpis', { pad: 's' }, [row(lead ? '2fr 1fr 1fr 1fr' : 4, x.a.kpis.map((k, i) => col([mk('stat', { value: k.value, label: k.label, size: lead && i === 0 ? 'l' : 'm' })], { variant: 'card', pad: 1, bg: lead && i === 0 ? 'accent' : x.rng.pick([undefined, 'surface']) })), { gap: 0.8 })])
  },
  'app.kpis2': (x) => sec('app.kpis2', { pad: 's' }, [row(4, x.a.kpis.map((k) => col([mk('stat', { value: k.value, label: k.label, size: 's' })], { variant: 'rule-top', pad: 0 })), { gap: 1.2 })]),
  'app.table': (x) => {
    const main = col([row('1fr auto', [H('Recent', 's', 3), T(x.a.tableRows.length + ' items', { variant: 'plain' })], { keep: true }), mk('table', { cols: x.a.tableCols, rows: x.a.tableRows, zebra: x.rng.chance(0.5) })], { variant: 'card', pad: 1, gap: 0.6 })
    const side = col([H('Up next', 's', 3), mk('list', { variant: x.rng.pick(['ruled', 'numbered']), items: x.a.side })], { gap: 0.6, variant: x.rng.pick(['outline', 'rule-left']), pad: 1 })
    const [a, b] = flip(x, main, side)
    return sec('app.table', { pad: 's' }, [row(a === main ? x.rng.pick(['2fr 1fr', '3fr 1fr', '5fr 2fr']) : x.rng.pick(['1fr 2fr', '2fr 5fr']), [a, b], { gap: 1, valign: 'start' })])
  },
  'app.table2': (x) => sec('app.table2', { pad: 's' }, [mk('table', { cols: x.a.tableCols, rows: x.a.tableRows, zebra: true })]),
}
export const APP_SECTIONS = APP
Object.assign(SECTIONS, APP)

const card = (x: Ctx, title: string, tag: string, meta: string, extra: Props = {}) => col([row('1fr auto', [P(title, { size: 'm' }), T(tag, { variant: x.rng.pick(['plain', undefined]) })], { gap: 0.6, keep: true, valign: 'start' }), P(meta, { muted: true, size: 's' })], { variant: 'card', pad: 0.8, gap: 0.5, ...extra })

export const APP_ARCHETYPES: Archetype[] = [
  {
    id: 'dashboard', name: 'Dashboard', kind: 'app',
    build: (x) => [row(x.rng.pick(['220px 1fr', '260px 1fr']), [sidebar(x), col([S('app.topbar', x), S(x.rng.pick(['app.kpis', 'app.kpis2']), x), S('app.table', x)], { gap: 0 })], { keep: true, gap: 0, valign: 'stretch' })],
  },
  {
    id: 'inbox', name: 'Split inbox', kind: 'app',
    build: (x) => {
      const t = x.a.threads
      const list = col([row('1fr auto', [H(x.a.title, 's', 1), T(String(t.length))], { keep: true }), ...t.map((m, i) => col([row('1fr auto', [P(m.from, { size: 's' }), P(m.time, { size: 's', muted: true })], { keep: true, gap: 0.5 }), H(m.subject, 's', 3, { size: 's' }), P(m.preview, { size: 's', muted: true })], { gap: 0.2, pad: 0.8, bg: i === 0 ? 'surface' : undefined, variant: i === 0 ? 'rule-left' : 'rule-top' }))], { gap: 0.2, pad: 0.8 })
      const m = t[0]
      const read = col([T(m.from, { variant: 'accent' }), H(m.subject, 'm', 2), P(m.time + ' · to me', { muted: true, size: 's' }), mk('divider', {}), P(m.preview + ' ' + m.preview, { size: 'l' }), btnRow([B('Reply', 'solid'), B('Snooze', 'outline'), B('Archive', 'ghost')]), mk('input', { label: 'Reply', kind: 'textarea', placeholder: 'Write a short answer…' })], { gap: 1, pad: 1.4 })
      return [row(x.rng.pick(['200px 320px 1fr', '180px 380px 1fr', '220px 300px 1fr']), [sidebar(x), list, read], { keep: true, gap: 0, valign: 'stretch' })]
    },
  },
  {
    id: 'kanban', name: 'Kanban columns', kind: 'app',
    build: (x) => {
      const cols = x.a.columns.slice(0, x.rng.pick([3, 4]))
      const board = row(x.rng.chance(0.5) ? cols.length : cols.map((_, i) => (i === 1 ? '1.4fr' : '1fr')).join(' '), cols.map((c) => col([row('1fr auto', [H(c.title, 's', 3), T(String(c.cards.length), { variant: 'solid' })], { keep: true, valign: 'center' }), ...c.cards.map((k) => card(x, k.title, k.tag, k.meta))], { gap: 0.7, pad: 0.8, bg: 'surface', variant: x.rng.pick(['outline', undefined]) })), { gap: 0.8 })
      return [mk('nav', { brand: x.a.name, links: x.a.nav, cta: x.a.primary, variant: 'bar', border: true, build: 'nav.bar', role: 'nav' }), sec('app.topbar', { pad: 's' }, [row('1fr auto', [col([H(x.a.title, 'l', 1), P(x.a.sub, { muted: true })], { gap: 0.3 }), btnRow([T('Filter: mine', { variant: 'plain' }), T('Sort: due', { variant: 'plain' })])], { keep: true, valign: 'end' })]), sec('app.board', { pad: 's', width: 'full' }, [board])]
    },
  },
  {
    id: 'settings', name: 'Settings form', kind: 'app',
    build: (x) => {
      const groups = x.a.settings.map((g) => row(x.rng.pick(['1fr 2fr', '1fr 3fr']), [col([H(g.group, 's', 3), P('Changes apply to everyone in this workspace.', { size: 's', muted: true })], { gap: 0.4 }), col(g.fields.map((f) => mk('input', { label: f.label, kind: f.kind, value: f.value, on: f.on })), { gap: 1, variant: 'card', pad: 1.2 })], { gap: 2 }))
      const left = col([mk('nav', { brand: x.a.name, links: ['Account', ...x.a.settings.map((s) => s.group), 'Billing', 'Danger zone'], variant: 'stacked' })], { pad: 1, sticky: true, variant: 'rule-left' })
      const right = col([sec('app.topbar', { pad: 's' }, [H('Settings', 'l', 1), P(x.a.sub, { muted: true })]), sec('app.settings', { pad: 's', gap: 2 }, [...groups, mk('divider', { variant: 'heavy' }), btnRow([B('Save changes', 'solid'), B('Discard', 'ghost')])])], { gap: 0 })
      return [row(x.rng.pick(['220px 1fr', '260px 1fr']), [left, right], { keep: true, gap: 0 })]
    },
  },
]

export const ALL_ARCHETYPES = [...ARCHETYPES, ...APP_ARCHETYPES]
export const archetypesFor = (kind: Kind) => ALL_ARCHETYPES.filter((a) => a.kind === kind)
