import { loremBits } from '../gen/lorem'
import { mk } from '../lib/tree'
import type { DNode, NodeType } from '../types'

export interface Field {
  key: string
  label: string
  type: 'select' | 'text' | 'number' | 'toggle' | 'lines' | 'long'
  options?: [string, string][]
  min?: number
  max?: number
  step?: number
}
const o = (...v: string[]): [string, string][] => [['', 'Default'], ...v.map((x) => [x, x] as [string, string])]
const align: Field = { key: 'align', label: 'Align', type: 'select', options: o('start', 'center', 'end') }
const SIZES = ['xxl', 'xl', 'l', 'm', 's']
const BG = o('surface', 'accent', 'inverse')

export const SCHEMA: Partial<Record<NodeType, Field[]>> = {
  section: [
    { key: 'bg', label: 'Background', type: 'select', options: BG },
    { key: 'pad', label: 'Padding', type: 'select', options: [['none', 'none'], ['s', 's'], ['m', 'm'], ['l', 'l'], ['xl', 'xl']] },
    align,
    { key: 'width', label: 'Width', type: 'select', options: o('full') },
    { key: 'gap', label: 'Gap', type: 'number', min: 0, max: 4, step: 0.2 },
    { key: 'backdrop', label: 'Backdrop', type: 'select', options: o('grid', 'dots', 'hatch', 'wash', 'split', 'noise', 'art', 'photo') },
    { key: 'bdStrength', label: 'Backdrop strength', type: 'select', options: o('strong') },
    { key: 'bdSide', label: 'Split side', type: 'select', options: o('right') },
  ],
  box: [
    { key: 'dir', label: 'Direction', type: 'select', options: [['col', 'column'], ['row', 'row'], ['grid', 'grid']] },
    { key: 'cols', label: 'Columns', type: 'text' },
    { key: 'gap', label: 'Gap', type: 'number', min: 0, max: 4, step: 0.2 },
    { key: 'pad', label: 'Padding', type: 'number', min: 0, max: 4, step: 0.2 },
    { key: 'variant', label: 'Variant', type: 'select', options: o('card', 'outline', 'rule-top', 'rule-left') },
    { key: 'bg', label: 'Fill', type: 'select', options: BG },
    align,
    { key: 'valign', label: 'Vertical', type: 'select', options: o('start', 'center', 'end', 'stretch') },
    { key: 'keep', label: 'Keep columns on mobile', type: 'toggle' },
    { key: 'backdrop', label: 'Backdrop', type: 'select', options: o('grid', 'dots', 'hatch', 'wash', 'split', 'noise', 'art', 'photo') },
    { key: 'bdStrength', label: 'Backdrop strength', type: 'select', options: o('strong') },
    { key: 'bdSide', label: 'Split side', type: 'select', options: o('right') },
  ],
  heading: [
    { key: 'text', label: 'Text', type: 'long' },
    { key: 'size', label: 'Size', type: 'select', options: SIZES.map((s) => [s, s]) },
    { key: 'level', label: 'Level', type: 'select', options: [['1', 'h1'], ['2', 'h2'], ['3', 'h3']] },
    align,
    { key: 'accent', label: 'Accent colour', type: 'toggle' },
  ],
  text: [
    { key: 'text', label: 'Text', type: 'long' },
    { key: 'size', label: 'Size', type: 'select', options: [['s', 's'], ['m', 'm'], ['l', 'l']] },
    { key: 'muted', label: 'Muted', type: 'toggle' },
    align,
    { key: 'maxw', label: 'Max width (ch)', type: 'number', min: 20, max: 100, step: 2 },
  ],
  button: [
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'variant', label: 'Variant', type: 'select', options: [['solid', 'solid'], ['outline', 'outline'], ['ink', 'ink'], ['ghost', 'ghost']] },
    { key: 'size', label: 'Size', type: 'select', options: o('s', 'l') },
    { key: 'arrow', label: 'Arrow', type: 'toggle' },
  ],
  image: [
    { key: 'source', label: 'Source', type: 'select', options: [['', 'Generated art'], ['placehold', 'placehold.co']] },
    { key: 'art', label: 'Art', type: 'select', options: ['blocks', 'stripes', 'arches', 'dots', 'waves', 'sun', 'rings'].map((s) => [s, s]) },
    { key: 'ratio', label: 'Ratio', type: 'select', options: ['1/1', '4/3', '3/4', '4/5', '5/4', '16/9', '21/9', '3/1'].map((s) => [s, s]) },
    { key: 'shape', label: 'Shape', type: 'select', options: o('arch', 'pill', 'circle') },
    { key: 'seed', label: 'Art seed', type: 'number', min: 1, max: 9999, step: 1 },
    { key: 'tone', label: 'Tone', type: 'number', min: 0, max: 3, step: 1 },
    { key: 'caption', label: 'Caption', type: 'text' },
  ],
  nav: [
    { key: 'brand', label: 'Brand', type: 'text' },
    { key: 'links', label: 'Links (one per line)', type: 'lines' },
    { key: 'cta', label: 'Button', type: 'text' },
    { key: 'variant', label: 'Variant', type: 'select', options: [['bar', 'bar'], ['centered', 'centered'], ['stacked', 'stacked']] },
    { key: 'border', label: 'Rule below', type: 'toggle' },
  ],
  tag: [
    { key: 'text', label: 'Text', type: 'text' },
    { key: 'variant', label: 'Variant', type: 'select', options: o('solid', 'plain', 'accent') },
  ],
  stat: [
    { key: 'value', label: 'Value', type: 'text' },
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'size', label: 'Size', type: 'select', options: o('s', 'l') },
  ],
  table: [
    { key: 'cols', label: 'Columns (one per line)', type: 'lines' },
    { key: 'rows', label: 'Rows (cells split by |)', type: 'lines' },
    { key: 'zebra', label: 'Zebra rows', type: 'toggle' },
  ],
  list: [
    { key: 'items', label: 'Items (title | meta)', type: 'lines' },
    { key: 'variant', label: 'Variant', type: 'select', options: [['ruled', 'ruled'], ['index', 'index'], ['numbered', 'numbered'], ['bullets', 'bullets']] },
  ],
  divider: [{ key: 'variant', label: 'Variant', type: 'select', options: [['thin', 'thin'], ['heavy', 'heavy'], ['dotted', 'dotted']] }],
  input: [
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'kind', label: 'Kind', type: 'select', options: [['text', 'text'], ['textarea', 'textarea'], ['select', 'select'], ['toggle', 'toggle']] },
    { key: 'value', label: 'Value', type: 'text' },
    { key: 'on', label: 'On (toggle)', type: 'toggle' },
  ],
  marquee: [
    { key: 'items', label: 'Items (one per line)', type: 'lines' },
    { key: 'bg', label: 'Fill', type: 'select', options: o('ink', 'accent2') },
  ],
  quote: [
    { key: 'text', label: 'Quote', type: 'long' },
    { key: 'who', label: 'Attribution', type: 'text' },
    { key: 'size', label: 'Size', type: 'select', options: o('s', 'xl') },
    { key: 'mark', label: 'Quote mark', type: 'toggle' },
  ],
}

/** Placement props shared by anything that can sit in a grid. */
export const COMMON: Field[] = [
  { key: 'span', label: 'Grid span', type: 'number', min: 1, max: 4, step: 1 },
  { key: 'rowSpan', label: 'Row span', type: 'number', min: 1, max: 3, step: 1 },
  { key: 'minh', label: 'Min height (px)', type: 'number', min: 0, max: 700, step: 10 },
]

export const COLUMN_PRESETS: [string, string][] = [
  ['1:1', '1fr 1fr'], ['1:2', '1fr 2fr'], ['2:1', '2fr 1fr'], ['3:2', '3fr 2fr'], ['1:1:1', '1fr 1fr 1fr'], ['2:1:1', '2fr 1fr 1fr'], ['1:2:1', '1fr 2fr 1fr'], ['sidebar', '240px 1fr'],
]

export const ELEMENTS: { type: string; label: string; make: () => DNode }[] = [
  { type: 'section', label: 'Section', make: () => { const L = loremBits(); return mk('section', { pad: 'm' }, [mk('heading', { text: L.label(3), size: 'l', level: 2 }), mk('text', { text: L.sentence() })]) } },
  { type: 'row', label: 'Row', make: () => { const L = loremBits(); return mk('box', { dir: 'row', cols: '1fr 1fr', gap: 1.2 }, [mk('text', { text: L.sentence() }), mk('text', { text: L.sentence() })]) } },
  { type: 'col', label: 'Column', make: () => mk('box', { dir: 'col', gap: 0.8 }) },
  { type: 'grid', label: 'Grid', make: () => { const L = loremBits(); return mk('box', { dir: 'grid', cols: 3, gap: 1 }, [1, 2, 3].map(() => mk('box', { dir: 'col', variant: 'outline', pad: 1 }, [mk('text', { text: L.short() })]))) } },
  { type: 'card', label: 'Card', make: () => { const L = loremBits(); return mk('box', { dir: 'col', variant: 'card', pad: 1.2, gap: 0.6, bg: 'surface' }, [mk('heading', { text: L.label(3), size: 's', level: 3 }), mk('text', { text: L.short(), muted: true })]) } },
  { type: 'heading', label: 'Heading', make: () => mk('heading', { text: loremBits().label(3), size: 'l', level: 2 }) },
  { type: 'text', label: 'Text', make: () => mk('text', { text: loremBits().sentence() }) },
  { type: 'button', label: 'Button', make: () => mk('button', { label: loremBits().label(2), variant: 'solid' }) },
  { type: 'image', label: 'Image', make: () => mk('image', { art: 'blocks', seed: Math.floor(Math.random() * 9999), ratio: '4/3', tone: 1 }) },
  { type: 'nav', label: 'Nav', make: () => { const L = loremBits(); return mk('nav', { brand: L.label(1), links: [L.label(1), L.label(1), L.label(1)], cta: L.label(2), variant: 'bar' }) } },
  { type: 'tag', label: 'Tag', make: () => mk('tag', { text: loremBits().label(1) }) },
  { type: 'stat', label: 'Stat', make: () => { const L = loremBits(); return mk('stat', { value: L.number(), label: L.phrase(3).toLowerCase() }) } },
  { type: 'table', label: 'Table', make: () => { const L = loremBits(); return mk('table', { cols: [L.label(1), L.label(1), L.label(1)], rows: [0, 1, 2].map(() => `${L.label(1)}|${L.phrase(1)}|${L.number()}`) }) } },
  { type: 'list', label: 'List', make: () => { const L = loremBits(); return mk('list', { variant: 'ruled', items: [0, 1, 2].map(() => `${L.label(2)}|${L.phrase(1)}`) }) } },
  { type: 'divider', label: 'Divider', make: () => mk('divider', { variant: 'thin' }) },
  { type: 'input', label: 'Input', make: () => { const L = loremBits(); return mk('input', { label: L.label(1), kind: 'text', placeholder: L.phrase(2) }) } },
  { type: 'marquee', label: 'Marquee', make: () => { const L = loremBits(); return mk('marquee', { items: [L.label(2), L.label(2), L.label(2)] }) } },
  { type: 'quote', label: 'Quote', make: () => { const L = loremBits(); return mk('quote', { text: L.sentence(), who: `${L.label(2)}, ${L.phrase(1).toLowerCase()}`, mark: true }) } },
]

export const nodeLabel = (n: DNode): string => {
  const p = n.props
  const t = p.text ?? p.label ?? p.brand ?? p.value ?? p.caption
  if (n.type === 'section') return `section · ${String(p.build ?? p.role ?? '').split('.').pop() || 'blank'}`
  if (n.type === 'box') return `${p.dir ?? 'col'}${p.variant ? ' · ' + p.variant : ''}`
  return t ? `${n.type} · ${String(t).slice(0, 22)}` : n.type
}
