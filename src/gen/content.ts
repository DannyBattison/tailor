// Shapes of the sample content a layout consumes. The text itself is lorem ipsum (see lorem.ts).
export interface MarketingContent {
  id: string
  /** section headings and a one-line note, so builders never hard-code English */
  heads: string[]
  note: string
  name: string
  nav: string[]
  cta: string
  ctaAlt: string
  eyebrow: string
  headline: string
  short: string
  sub: string
  features: { title: string; body: string }[]
  stats: { value: string; label: string }[]
  quotes: { text: string; who: string }[]
  index: string[]
  tableCols: string[]
  tableRows: string[]
  marquee: string[]
  tags: string[]
  closing: string
  closingSub: string
  footer: string
  art: ('blocks' | 'stripes' | 'arches' | 'dots' | 'waves' | 'sun' | 'rings')[]
}

export interface AppContent {
  id: string
  heads: string[]
  note: string
  name: string
  nav: string[]
  user: string
  title: string
  sub: string
  primary: string
  kpis: { value: string; label: string }[]
  tableCols: string[]
  tableRows: string[]
  side: string[]
  columns: { title: string; cards: { title: string; tag: string; meta: string }[] }[]
  threads: { from: string; subject: string; preview: string; time: string }[]
  settings: { group: string; fields: { label: string; kind: 'text' | 'select' | 'toggle' | 'textarea'; value?: string; on?: boolean }[] }[]
}

/** Neutral stand-in copy used to show section *structure* in the design-system export (never real content). */
const feat = (n: number) => ({ title: `Feature ${n} title`, body: 'One or two sentences describing the feature.' })
export const PLACEHOLDER_MARKETING: MarketingContent = {
  id: 'placeholder', heads: ['Section heading', 'Section heading', 'Section heading', 'Section heading', 'Label', 'Section heading'], note: 'A short supporting note.', name: 'Brand name', nav: ['Page one', 'Page two', 'Page three', 'Page four'], cta: 'Primary action', ctaAlt: 'Secondary action',
  eyebrow: 'Eyebrow label', headline: 'Page headline goes here', short: 'Short headline', sub: 'One or two sentences of supporting copy that explain the page.',
  features: [1, 2, 3, 4, 5, 6].map(feat),
  stats: [1, 2, 3, 4].map((n) => ({ value: `${n}0`, label: `Stat ${n} label` })),
  quotes: [1, 2, 3].map((n) => ({ text: `A short quote from a customer or user (${n}).`, who: 'Name, role' })),
  index: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `List item ${n}|Detail`),
  tableCols: ['Column A', 'Column B', 'Column C', 'Column D'], tableRows: ['Cell|Cell|Cell|Cell', 'Cell|Cell|Cell|Cell', 'Cell|Cell|Cell|Cell'],
  marquee: ['Keyword one', 'Keyword two', 'Keyword three', 'Keyword four'], tags: ['Label', 'Label', 'Label', 'Label'],
  closing: 'Closing call to action', closingSub: 'One line that tells the reader what happens next.', footer: 'Address or legal line',
  art: ['blocks', 'arches', 'rings', 'stripes'],
}
export const PLACEHOLDER_APP: AppContent = {
  id: 'placeholder', heads: ['Label', 'Label', 'Label', 'Label', 'Label', 'Label'], note: 'A short supporting note.', name: 'App name', nav: ['Section one', 'Section two', 'Section three', 'Section four', 'Section five'], user: 'User name', title: 'View title', sub: 'One line describing this view.', primary: 'Primary action',
  kpis: [1, 2, 3, 4].map((n) => ({ value: `${n}0`, label: `Metric ${n}` })),
  tableCols: ['Column A', 'Column B', 'Column C', 'Column D'], tableRows: ['Cell|Cell|Cell|Cell', 'Cell|Cell|Cell|Cell', 'Cell|Cell|Cell|Cell'],
  side: ['Task one|Today', 'Task two|Today', 'Task three|Soon', 'Task four|Later'],
  columns: ['Column one', 'Column two', 'Column three', 'Column four'].map((title) => ({ title, cards: [1, 2].map((n) => ({ title: `Card ${n}`, tag: 'Tag', meta: 'Meta' })) })),
  threads: [1, 2, 3, 4, 5].map((n) => ({ from: `Sender ${n}`, subject: `Subject ${n}`, preview: 'A line of preview text.', time: '09:00' })),
  settings: [{ group: 'Group one', fields: [{ label: 'Text field', kind: 'text', value: 'Value' }, { label: 'Select field', kind: 'select', value: 'Option' }, { label: 'Notes', kind: 'textarea', value: 'Longer text' }] }, { group: 'Group two', fields: [{ label: 'Toggle one', kind: 'toggle', on: true }, { label: 'Toggle two', kind: 'toggle', on: false }] }],
}
