// Regenerates src/gen/googleFonts.json from Google's public font metadata (no API key needed).
//   node scripts/gen-fonts.mjs            fetch https://fonts.google.com/metadata/fonts
//   node scripts/gen-fonts.mjs file.json  use a saved copy
// Output rows: [family, category, popularity rank (1 = most used), weights]; category 0 serif 1 sans 2 display 3 script 4 mono.
import { readFileSync, writeFileSync } from 'node:fs'

const CAT = { Serif: 0, 'Sans Serif': 1, Display: 2, Handwriting: 3, Monospace: 4 }
const src = process.argv[2]
const raw = src ? readFileSync(src, 'utf8') : await (await fetch('https://fonts.google.com/metadata/fonts')).text()
const list = JSON.parse(raw.slice(raw.indexOf('{'))).familyMetadataList

const rows = list
  .filter((f) => f.subsets.includes('latin') && !f.isBrandFont && (!f.primaryScript || f.primaryScript === 'Latn') && f.category in CAT)
  .map((f) => [f.family, CAT[f.category], f.popularity, Object.keys(f.fonts).filter((k) => !k.endsWith('i')).map(Number).sort((a, b) => a - b)])
  .filter((r) => r[3].length)
  .sort((a, b) => a[2] - b[2])

writeFileSync(new URL('../src/gen/googleFonts.json', import.meta.url), JSON.stringify(rows))
console.log(rows.length, 'families written')
