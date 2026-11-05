// Sample text for the specimen page: seeded lorem ipsum, so a seed always reproduces the same page.
import { LoremIpsum } from 'lorem-ipsum'
import { stageRng } from '../lib/rng'
import type { AppContent, MarketingContent } from './content'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function makeLorem(seed: number) {
  const rng = stageRng(seed, 'lorem')
  const gen = new LoremIpsum({ random: rng.next, wordsPerSentence: { min: 9, max: 16 } })
  const words = (min: number, max = min) => gen.generateWords(rng.int(min, max))
  return {
    rng,
    /** "Dolor amet" */ label: (min = 1, max = min) => words(min, max).split(' ').map(cap).join(' '),
    /** "Dolor amet sit." */ line: (min: number, max = min) => cap(words(min, max)) + '.',
    /** "Dolor amet sit" */ phrase: (min: number, max = min) => cap(words(min, max)),
    /** one full sentence */ sentence: () => gen.generateSentences(1),
    /** a short sentence */ short: () => cap(words(8, 12)) + '.',
    number: () => rng.pick(['12', '48', '120', '2,400', '96%', '3.2k', '$18', '7', '24/7', '1,040']),
    person: () => `${cap(words(1))} ${cap(words(1))}`,
    time: () => rng.pick(['09:12', '10:40', '13:05', 'Yesterday', 'Mon', 'Tue']),
  }
}

export function loremMarketing(seed: number): MarketingContent {
  const L = makeLorem(seed)
  const nav = Array.from({ length: 4 }, () => L.label(1))
  return {
    id: 'lorem', heads: Array.from({ length: 6 }, () => L.label(2, 4)), note: L.short(), name: L.label(1, 2), nav, cta: L.label(2), ctaAlt: L.label(2, 3),
    eyebrow: L.label(2, 3), headline: L.line(5, 8), short: L.label(2) + '.', sub: L.sentence(),
    features: Array.from({ length: 6 }, () => ({ title: L.label(2, 3), body: L.short() })),
    stats: Array.from({ length: 4 }, () => ({ value: L.number(), label: L.phrase(2, 3).toLowerCase() })),
    quotes: Array.from({ length: 3 }, () => ({ text: L.sentence(), who: `${L.person()}, ${L.phrase(1).toLowerCase()}` })),
    index: Array.from({ length: 8 }, () => `${L.label(2, 3)}|${L.phrase(1, 2)} · ${L.number()}`),
    tableCols: Array.from({ length: 4 }, () => L.label(1)),
    tableRows: Array.from({ length: 4 }, () => `${L.label(1, 2)}|${L.phrase(1)}|${L.number()}|${L.number()}`),
    marquee: Array.from({ length: 4 }, () => L.label(2)),
    tags: Array.from({ length: 4 }, () => L.label(1, 2)),
    closing: L.line(5, 8), closingSub: L.sentence(), footer: `${L.label(2)} · ${L.phrase(1)}`,
    art: L.rng.shuffle(['blocks', 'arches', 'rings', 'stripes', 'dots', 'waves', 'sun'] as const).slice(0, 4),
  }
}

export function loremApp(seed: number): AppContent {
  const L = makeLorem(seed)
  return {
    id: 'lorem', heads: Array.from({ length: 6 }, () => L.label(1, 2)), note: L.short(), name: L.label(1), nav: Array.from({ length: 5 }, () => L.label(1)), user: L.person(), title: L.label(2, 3), sub: L.short(), primary: L.label(2),
    kpis: Array.from({ length: 4 }, () => ({ value: L.number(), label: L.phrase(1, 2).toLowerCase() })),
    tableCols: Array.from({ length: 4 }, () => L.label(1)),
    tableRows: Array.from({ length: 5 }, () => `${L.label(2)}|${L.label(1, 2)}|${L.person()}|${L.time()}`),
    side: Array.from({ length: 4 }, () => `${L.phrase(3, 4)}|${L.time()}`),
    columns: Array.from({ length: 4 }, () => ({ title: L.label(1), cards: Array.from({ length: L.rng.int(2, 3) }, () => ({ title: L.phrase(3, 4), tag: L.label(1), meta: L.phrase(1, 2) })) })),
    threads: Array.from({ length: 6 }, () => ({ from: L.person(), subject: L.phrase(3, 5), preview: L.short(), time: L.time() })),
    settings: [
      { group: L.label(1, 2), fields: [{ label: L.label(2), kind: 'text', value: L.label(2) }, { label: L.label(1), kind: 'select', value: L.label(1) }, { label: L.label(1), kind: 'textarea', value: L.short() }] },
      { group: L.label(1, 2), fields: [{ label: L.phrase(3), kind: 'toggle', on: true }, { label: L.phrase(3), kind: 'toggle', on: false }, { label: L.phrase(3), kind: 'toggle', on: true }] },
    ],
  }
}

/** Unseeded lorem for elements the user drags in (a fresh bit of text every time). */
export function loremBits() {
  const gen = new LoremIpsum({ wordsPerSentence: { min: 8, max: 14 } })
  const w = (n: number) => gen.generateWords(n)
  return {
    label: (n = 1) => w(n).split(' ').map(cap).join(' '),
    phrase: (n: number) => cap(w(n)),
    sentence: () => gen.generateSentences(1),
    short: () => cap(w(9)) + '.',
    number: () => String(Math.floor(Math.random() * 900) + 10),
  }
}
