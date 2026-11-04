// Sanity checks run via `npm test` (tsx): generation is deterministic, varied, contrast-safe, renders to HTML.
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { generate } from '../src/gen/generate'
import { paletteIssues, isBannedHue } from '../src/gen/palette'
import { DocView } from '../src/render/Doc'
import { critique } from '../src/gen/critique'

let fail = 0
const ok = (c: boolean, m: string) => { if (!c) { fail++; console.log('FAIL', m) } }

const archs = new Set<string>(); const fonts = new Set<string>(); const hues = new Set<number>(); const sigs = new Set<string>()
let bannedHue = 0, contrastFails = 0
for (const kind of ['marketing', 'app'] as const) {
  for (let s = 1; s <= 40; s++) {
    const d = generate({ seed: s * 31, kind, mood: '', brief: '' })
    const again = generate({ seed: s * 31, kind, mood: '', brief: '' })
    ok(JSON.stringify(d.tokens) === JSON.stringify(again.tokens), 'tokens deterministic ' + s)
    ok(JSON.stringify(strip(d.root)) === JSON.stringify(strip(again.root)), 'tree deterministic ' + s)
    const html = renderToStaticMarkup(createElement(DocView, { root: d.root, tokens: d.tokens }))
    ok(html.length > 800, 'renders html')
    archs.add(d.meta.archetype); fonts.add(d.tokens.fontId); hues.add(Math.round(d.tokens.hue / 30)); sigs.add(d.tokens.signature)
    if (isBannedHue(d.tokens.hue) && d.tokens.palette.accent) bannedHue++
    if (paletteIssues(d.tokens.palette).length) contrastFails++
    const r = critique(d)
    if (r.some((i) => i.id === 'font-banned' && i.level === 'fail')) ok(false, 'banned font used')
  }
}
function strip(n: any): any { return { type: n.type, props: n.props, children: n.children.map(strip) } }
console.log({ archetypes: archs.size, fonts: fonts.size, hueBuckets: hues.size, signatures: sigs.size, bannedHue, contrastFails })
ok(archs.size >= 10, 'all archetypes appear')
ok(bannedHue === 0, 'no blue-purple accents')
ok(contrastFails === 0, 'palettes pass contrast')
if (fail) { console.log(fail + ' failures'); process.exit(1) }
console.log('all checks passed')
import { designSystem } from '../src/designSystem'
import { placeholdUrl } from '../src/render/Doc'
{
  const d = generate({ seed: 7, kind: 'marketing', mood: '', brief: '' })
  const ds = designSystem(d)
  const bad = !ds.colors.bg.hex || !ds.typography.googleFonts.includes('fonts.googleapis.com') || !ds.rules.length || !ds.layout.outline.length
  if (bad) { console.log('FAIL design system incomplete'); process.exit(1) }
  const u = placeholdUrl({ ratio: '16/9', tone: 2, caption: 'Hi there' }, d.tokens)
  if (!/^https:\/\/placehold\.co\/1200x675\/[0-9a-f]{6}\/[0-9a-f]{6}\?text=Hi\+there$/.test(u)) { console.log('FAIL placehold url', u); process.exit(1) }
  console.log('design system + placehold ok')
}
