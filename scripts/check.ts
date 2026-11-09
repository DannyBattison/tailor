// Sanity checks run via `npm test` (tsx): generation is deterministic, varied, contrast-safe, renders to HTML.
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { generate } from '../src/gen/generate'
import { fontKey } from '../src/gen/fonts'
import { paletteIssues, isBannedHue, DEFAULT_BG_BOLD } from '../src/gen/palette'
import { DocView } from '../src/render/Doc'
import { critique } from '../src/gen/critique'

let fail = 0
const ok = (c: boolean, m: string) => { if (!c) { fail++; console.log('FAIL', m) } }

const archs = new Set<string>(); const fonts = new Set<string>(); const hues = new Set<number>(); const sigs = new Set<string>()
let bannedHue = 0, contrastFails = 0
for (const kind of ['marketing', 'app'] as const) {
  for (let s = 1; s <= 40; s++) {
    const d = generate({ seed: s * 31, kind, mood: '' })
    const again = generate({ seed: s * 31, kind, mood: '' })
    ok(JSON.stringify(d.tokens) === JSON.stringify(again.tokens), 'tokens deterministic ' + s)
    ok(JSON.stringify(strip(d.root)) === JSON.stringify(strip(again.root)), 'tree deterministic ' + s)
    const html = renderToStaticMarkup(createElement(DocView, { root: d.root, tokens: d.tokens }))
    ok(html.length > 800, 'renders html')
    archs.add(d.meta.archetype); fonts.add(fontKey(d.tokens.fonts!)); hues.add(Math.round(d.tokens.hue / 30)); sigs.add(d.tokens.signature)
    if (isBannedHue(d.tokens.hue) && d.tokens.palette.accent) bannedHue++
    if (paletteIssues(d.tokens.palette).length) contrastFails++
    const r = critique(d)
    if (r.some((i) => i.id === 'font-banned' && i.level === 'fail')) ok(false, 'banned font used')
  }
}
function strip(n: any): any { return { type: n.type, props: n.props, children: n.children.map(strip) } }
console.log({ archetypes: archs.size, fonts: fonts.size, hueBuckets: hues.size, signatures: sigs.size, bannedHue, contrastFails })
ok(archs.size >= 10, 'all archetypes appear')
ok(fonts.size >= 34, 'fonts vary across 40 seeds: ' + fonts.size)
ok(bannedHue === 0, 'no blue-purple accents')
ok(contrastFails === 0, 'palettes pass contrast')
if (fail) { console.log(fail + ' failures'); process.exit(1) }
console.log('all checks passed')
import { designSystem } from '../src/designSystem'
import { placeholdColors, placeholdUrl } from '../src/render/placehold'
import { contrast as ctr } from '../src/lib/color'
{
  const d = generate({ seed: 7, kind: 'marketing', mood: '' })
  const ds = designSystem(d)
  const bad = !ds.colors.bg || !ds.typography.googleFonts.includes('fonts.googleapis.com') || !ds.rules.length || !ds.layout.sections.length || 'css' in ds
  const size = JSON.stringify(ds, null, 2).length
  if (size > 20000) { console.log('FAIL design system export bloated:', size); process.exit(1) }
  if (bad) { console.log('FAIL design system incomplete'); process.exit(1) }
  const u = placeholdUrl({ ratio: '16/9', tone: 2, caption: 'Hi there' }, d.tokens)
  if (!/^https:\/\/placehold\.co\/1200x675\/[0-9a-f]{6}\/[0-9a-f]{6}\?text=Hi\+there&font=(playfair-display|source-sans-pro)$/.test(u)) { console.log('FAIL placehold url', u); process.exit(1) }
  // every placeholder pair is coloured (not grey) and readable
  for (let sd = 1; sd <= 60; sd++) {
    const dd = generate({ seed: sd * 19, kind: 'marketing', mood: '' })
    for (const tn of [0, 1, 2, 3]) {
      const { bg, fg } = placeholdColors(dd.tokens.palette, tn)
      if (ctr(fg, bg) < 4.4) { console.log('FAIL placehold contrast', sd, tn, bg, fg); process.exit(1) }
    }
  }
  console.log('design system + placehold ok')
}

// design code: any sequence of re-rolls is recreated exactly from its code
import { CODE_LENGTH, designCode, fromCode, isCode } from '../src/gen/code'
import { wordsFor } from '../src/gen/words'
import { archetypeFor, partsOf, withSignature } from '../src/gen/generate'
import * as RR from '../src/gen/reroll'
import { makeRng } from '../src/lib/rng'
const fingerprint = (d: ReturnType<typeof generate>) => {
  const sorted = (o: any) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : 1)))
  const strip = (n: any): any => ({ t: n.type, p: sorted(n.props), c: n.children.map(strip) }) // ids are random, everything else must match
  return JSON.stringify({ tokens: d.tokens, root: strip(d.root), mood: d.meta.mood, kind: d.meta.kind })
}
{
  const rng = makeRng(4242)
  let bad = 0
  const block = (code: string, i: number) => code.slice(i * 3, i * 3 + 3)
  for (let i = 0; i < 80; i++) {
    const kind = i % 4 === 3 ? 'app' : 'marketing'
    let d = generate({ seed: 100 + i * 37, kind, mood: i % 3 === 0 ? rng.pick(['calm', 'bold', 'editorial', 'retro']) : '' })
    if (designCode(d).length !== CODE_LENGTH) { bad++; console.log('FAIL code length', designCode(d)) }
    const steps: string[] = []
    for (let k = 0; k < rng.int(1, 6); k++) {
      const seed = rng.int(0, 99999)
      const op = rng.pick(['palette', 'fonts', 'shape', 'layout', 'text', 'backdrops', 'ambient', 'entrance', 'interaction', 'nav'] as const)
      steps.push(op)
      const before = designCode(d)
      d = op === 'layout' ? RR.rerollLayout(d, seed) : op === 'text' ? RR.rerollText(d, seed) : op === 'backdrops' ? RR.rerollBackdrops(d, seed) : op === 'ambient' || op === 'entrance' || op === 'interaction' || op === 'nav' ? RR.rerollMotion(d, op, seed) : RR.rerollToken(d, op, seed)
      // only the re-rolled part's own block changes
      const idx = ['palette', 'fonts', 'shape', 'layout', 'text', 'backdrops', 'ambient', 'entrance', 'interaction', 'nav'].indexOf(op)
      const after = designCode(d)
      for (let b2 = 0; b2 < 11; b2++) if (b2 !== idx && block(before, b2) !== block(after, b2)) { bad++; console.log('FAIL', op, 'changed block', b2) }
    }
    const code = designCode(d)
    const back = fromCode(code)
    if (!back || fingerprint(back) !== fingerprint(d)) { bad++; if (bad < 4) console.log('FAIL code round trip', code, steps) }
    if (d.meta.edited) { bad++; console.log('FAIL re-rolls must not mark the design edited', steps) }
  }
  // each part's re-roll leaves the other parts alone
  const base = generate({ seed: 31, kind: 'marketing', mood: '' })
  const pal = RR.rerollToken(base, 'palette', 9)
  if (JSON.stringify(pal.tokens.fonts) !== JSON.stringify(base.tokens.fonts)) { bad++; console.log('FAIL palette reroll touched fonts') }
  const lay = RR.rerollLayout(base, 12345)
  if (JSON.stringify(lay.tokens) !== JSON.stringify(base.tokens) || lay.meta.archetype === base.meta.archetype || partsOf(lay).text !== partsOf(base).text) { bad++; console.log('FAIL layout reroll semantics') }
  if (archetypeFor('marketing', partsOf(lay).layout) !== lay.meta.archetype) { bad++; console.log('FAIL archetype not derived from layout seed') }
  // signature swap is reversible
  const band = withSignature(base, 'marquee')
  const gone = !JSON.stringify(withSignature(band, 'grain').root).includes('sigBand')
  if (!JSON.stringify(band.root).includes('marquee') || !gone) { bad++; console.log('FAIL signature swap') }
  // garbage and wrong-length codes are rejected; dashes/spaces are tolerated
  if (fromCode('not-a-code') || fromCode('123') || fromCode('9'.repeat(CODE_LENGTH))) { bad++; console.log('FAIL invalid codes accepted') }
  const spaced = designCode(base).replace(/(.{3})/g, '$1 ')
  if (!fromCode(spaced)) { bad++; console.log('FAIL spaced code rejected') }
  if (designCode(base).length !== 32 || !/^[A-Za-z0-9_-]+$/.test(designCode(base))) { bad++; console.log('FAIL seed is not a 32 character base64url string', designCode(base)) }
  if (isCode('9'.repeat(CODE_LENGTH + 1)) || fromCode(designCode(base).slice(0, -1))) { bad++; console.log('FAIL wrong-length code accepted') }
  // three-word handle: stable per seed, and different seeds mostly differ
  const hs = new Set<string>()
  for (let i = 0; i < 200; i++) { const w = wordsFor(designCode(generate({ seed: i * 7 + 1, kind: 'marketing', mood: '' }))); if (!/^[a-z]+-[a-z]+-[a-z]+$/.test(w)) { bad++; console.log('FAIL words', w) } hs.add(w) }
  if (hs.size < 190) { bad++; console.log('FAIL words collide', hs.size) }
  if (bad) process.exit(1)
  console.log('design code ok')
}

// background boldness: quiet by default, bolder when asked, contrast always holds
import { applyBgBold, buildPalette, paletteIssues as issues2 } from '../src/gen/palette'
import { hexToOklch } from '../src/lib/color'
{
  let fails = 0
  for (let s = 1; s <= 60; s++) {
    const d = generate({ seed: s * 17, kind: 'marketing', mood: '' })
    if (!d.tokens.spec) { console.log('FAIL spec missing'); process.exit(1) }
    const quiet = buildPalette(applyBgBold(d.tokens.spec, 0))
    const bold = buildPalette(applyBgBold(d.tokens.spec, 1))
    if (hexToOklch(quiet.bg).c > 0.03) fails++
    if (issues2(quiet).length || issues2(bold).length) fails++
    if (hexToOklch(d.tokens.palette.bg).c > 0.04) fails++ // default is quiet
  }
  if (fails) { console.log('FAIL bg boldness', fails); process.exit(1) }
  console.log('bg boldness ok')
}

// light/dark: both versions of every palette stay legible and keep their hue
import { paletteOf } from '../src/gen/palette'
import { luminance } from '../src/lib/color'
{
  let fails = 0
  for (let s = 1; s <= 80; s++) {
    const d = generate({ seed: s * 13, kind: 'marketing', mood: '' })
    for (const mode of ['light', 'dark'] as const) {
      const p = paletteOf(d.tokens.spec!, 0.2, mode)
      if (issues2(p).length) fails++
      if ((luminance(p.bg) < 0.2) !== (mode === 'dark')) fails++
    }
  }
  if (fails) { console.log('FAIL light/dark', fails); process.exit(1) }
  console.log('light/dark ok')
}

// coherence: every marketing page is the same kind of site, with one visual vocabulary
{
  const { walk } = await import('../src/lib/tree')
  const need = ['nav', 'hero', 'logos', 'steps', 'pricing', 'faq', 'cta', 'footer']
  let bad = 0
  const fail = (m: string, seed: number) => { bad++; if (bad < 12) console.log('FAIL coherence', m, seed) }
  for (let sd = 1; sd <= 120; sd++) {
    const d = generate({ seed: sd * 53, kind: 'marketing', mood: '' })
    const roles: string[] = []; const h2: string[] = []; const bds = new Set<string>(); const secs: any[] = []
    walk(d.root, (n) => {
      if (n.props.role) roles.push(n.props.role)
      if (n.type === 'section' && n.props.role !== 'nav') secs.push(n)
      if (n.type === 'heading' && n.props.level !== 3 && n.props.level !== 1) h2.push(String(n.props.text))
      if (n.props.backdrop) bds.add(n.props.backdrop)
    })
    for (const r of need) if (!roles.includes(r)) fail('missing ' + r + ' in ' + d.meta.archetype, sd * 53)
    if (!roles.includes('features') && !roles.includes('index')) fail('no features/index in ' + d.meta.archetype, sd * 53)
    if (new Set(h2).size !== h2.length) fail('duplicate heading ' + d.meta.archetype, sd * 53)
    if (bds.size > 1) fail('backdrops ' + [...bds].join(','), sd * 53)
    secs.forEach((n, i) => { if (i && n.props.bg && n.props.bg === secs[i - 1].props.bg) fail(`adjacent fill ${n.props.bg} (${n.props.build})`, sd * 53) })
    const icons = new Set<string>(); walk(d.root, (n) => { if (n.type === 'image' && n.props.icon) icons.add(String(n.props.shape)) })
    if (icons.size > 1) fail('mixed icon shapes', sd * 53)
  }
  if (bad) { console.log(bad + ' coherence failures'); process.exit(1) }
  console.log('coherence ok')
}

// export-for-AI: pattern library carries no sample copy and the prompt stays small
import { designSystem as dsx, designSystemPrompt } from '../src/designSystem'
{
  for (const kind of ['marketing', 'app'] as const) {
    const d = generate({ seed: 21, kind, mood: '' })
    const ds = dsx(d)
    const blob = JSON.stringify(ds.patterns)
    const real = kind === 'marketing' ? d.meta.name : d.meta.name
    if (!Object.keys(ds.patterns).length || !ds.pages.length || blob.includes(real)) { console.log('FAIL export patterns', kind); process.exit(1) }
    const kb = designSystemPrompt(d).length / 1024
    if (kb > 20) { console.log('FAIL prompt too big', kind, kb); process.exit(1) }
  }
  console.log('export for AI ok')
}

// fonts: any two free Google fonts, sensibly paired, valid to request, never default-looking
import { BANNED_FONTS, findFont, fontsUrl, genFonts, searchFonts } from '../src/gen/fonts'
import { MOOD_NAMES } from '../src/gen/moods'
{
  let bad = 0
  const heads = new Set<string>(), bodies = new Set<string>(), cats: Record<string, number> = {}
  for (let sd = 0; sd < 1500; sd++) {
    const mood = MOOD_NAMES[sd % MOOD_NAMES.length]
    const f = genFonts(sd * 7 + 3, mood)
    const h = findFont(f.heading.family), b = findFont(f.body.family)
    if (!h || !b) { bad++; console.log('FAIL unknown family', f); continue }
    if (BANNED_FONTS.includes(h.family.toLowerCase()) || BANNED_FONTS.includes(b.family.toLowerCase())) { bad++; console.log('FAIL banned font', f.heading.family, f.body.family) }
    if (!h.weights.includes(f.heading.weight) || !f.body.weights.every((w) => b.weights.includes(w))) { bad++; console.log('FAIL weights not offered', f) }
    if (h.family === b.family) { bad++; console.log('FAIL same font twice', h.family) }
    if (!['serif', 'sans', 'mono'].includes(b.cat)) { bad++; console.log('FAIL body face is', b.cat, b.family) }
    if (!/^https:\/\/fonts\.googleapis\.com\/css2\?(family=[A-Za-z0-9+]+:wght@[0-9;]+&?){1,2}&display=swap$/.test(fontsUrl(f))) { bad++; console.log('FAIL url', fontsUrl(f)) }
    heads.add(h.family); bodies.add(b.family); cats[h.cat] = (cats[h.cat] ?? 0) + 1
  }
  // the whole catalogue is reachable, not a short list
  if (heads.size < 300 || bodies.size < 100) { bad++; console.log('FAIL fonts too repetitive', heads.size, bodies.size) }
  // serif headings usually get a sans body and vice versa (sensible contrast)
  let contrast = 0, total = 0
  for (let sd = 0; sd < 600; sd++) { const f = genFonts(sd, 'editorial'); if (f.heading.cat === 'serif' || f.heading.cat === 'sans') { total++; if (f.heading.cat !== f.body.cat) contrast++ } }
  if (contrast / total < 0.6) { bad++; console.log('FAIL pairing contrast too low', contrast, total) }
  // autocomplete: prefix matches come first
  const hits = searchFonts('fraun')
  if (hits[0]?.family !== 'Fraunces' || findFont(' fraunces ')?.family !== 'Fraunces' || findFont('Comic Neue Fake')) { bad++; console.log('FAIL search', hits.map((x) => x.family)) }
  if (bad) process.exit(1)
  console.log('fonts ok', { heads: heads.size, bodies: bodies.size, cats })
}

// shape re-rolls can land on every shadow (not stuck on hard)
{
  const seen = new Set<string>()
  for (let i = 0; i < 300; i++) seen.add(RR.rerollToken(generate({ seed: i * 13 + 1, kind: 'marketing', mood: MOOD_NAMES[i % 10] }), 'shape', i * 31 + 5).tokens.shadow)
  if (seen.size < 3) { console.log('FAIL shadow variety', [...seen]); process.exit(1) }
  console.log('shadow variety ok')
}

// animation: three independent parts, each re-rollable and lockable, and none of them owned by Shape
import { AMBIENTS, ENTRANCES, FEELS, HOVERS, NAV_BARS, NAV_LINKS, MOTION_FIELDS, motionGroup, MOTION_PARTS } from '../src/gen/tokens'
import { upgradeDoc } from '../src/gen/generate'
import { tokenVars, DOC_CSS } from '../src/render/css'
{
  let bad = 0
  const fail = (m: string) => { bad++; if (bad < 12) console.log('FAIL animation', m) }
  const seen: Record<string, Set<string>> = { ambient: new Set(), entrance: new Set(), hover: new Set(), motion: new Set(), navLink: new Set(), navBar: new Set() }
  for (let i = 0; i < 400; i++) {
    const d = generate({ seed: i * 29 + 3, kind: i % 3 === 2 ? 'app' : 'marketing', mood: MOOD_NAMES[i % MOOD_NAMES.length] })
    for (const k of Object.keys(seen)) seen[k].add(String((d.tokens as any)[k]))
    const part = MOTION_PARTS[i % 4]
    const next = RR.rerollMotion(d, part, i * 13)
    if (JSON.stringify(motionGroup(next.tokens, part)) === JSON.stringify(motionGroup(d.tokens, part))) fail('re-roll landed on the same style ' + part)
    for (const other of MOTION_PARTS) if (other !== part && JSON.stringify(motionGroup(next.tokens, other)) !== JSON.stringify(motionGroup(d.tokens, other))) fail(part + ' re-roll touched ' + other)
    const { ambient: _a, entrance: _e, hover: _h, motion: _m, navLink: _nl, navBar: _nb, ...rest } = next.tokens
    const { ambient: _a2, entrance: _e2, hover: _h2, motion: _m2, navLink: _nl2, navBar: _nb2, ...rest2 } = d.tokens
    if (JSON.stringify(rest) !== JSON.stringify(rest2) || JSON.stringify(next.root) !== JSON.stringify(d.root)) fail(part + ' re-roll touched something other than animation')
    // a single-setting re-roll changes that setting and nothing else
    const fp = MOTION_PARTS[(i + 1) % 4], fk = MOTION_FIELDS[fp][i % MOTION_FIELDS[fp].length]
    const one = RR.rerollMotionField(d, fp, fk, i * 11 + 1)
    const o1 = motionGroup(one.tokens, fp) as any, o0 = motionGroup(d.tokens, fp) as any
    if (MOTION_FIELDS[fp].length > 1 && MOTION_FIELDS[fp].some((k) => k !== fk && o1[k as string] !== o0[k as string])) fail('field re-roll changed a sibling setting ' + fk)
    if (JSON.stringify(o1) === JSON.stringify(o0)) fail('field re-roll was a no-op ' + fk)
    const refound = fromCode(designCode(one))!
    if (JSON.stringify(motionGroup(refound.tokens, fp)) !== JSON.stringify(o1)) fail('field re-roll not recreated by its seed ' + fk)
    const sh = RR.rerollToken(d, 'shape', i * 17)
    for (const p of MOTION_PARTS) if (JSON.stringify(motionGroup(sh.tokens, p)) !== JSON.stringify(motionGroup(d.tokens, p))) fail('shape re-roll touched ' + p)
    // a locked part survives New design, hand edits included
    const edited = { ...d, tokens: { ...d.tokens, entrance: 'wipe' as const } }
    const kept = generate({ seed: i * 31 + 7, kind: d.meta.kind, mood: d.meta.mood, prev: edited, locks: { entrance: true } })
    if (kept.tokens.entrance !== 'wipe' || partsOf(kept).entrance !== partsOf(d).entrance) fail('entrance lock')
    for (const [v, val] of Object.entries(tokenVars(d.tokens))) if (val === undefined || String(val).includes('undefined')) fail('css var ' + v)
  }
  const all = { ambient: AMBIENTS, entrance: ENTRANCES, hover: HOVERS, motion: FEELS, navLink: NAV_LINKS, navBar: NAV_BARS } as Record<string, string[]>
  for (const k of Object.keys(all)) for (const s of all[k]) if (!seen[k].has(s)) fail(k + ' never rolls ' + s)
  // every var the stylesheet reads from the animation tokens is one tokenVars writes
  const vars = tokenVars(generate({ seed: 5, kind: 'marketing', mood: '' }).tokens)
  for (const m of DOC_CSS.matchAll(/var\((--(?:bgm|in|hover|nudge|rv-hide)[a-z-]*)/g)) if (!(m[1] in vars)) fail('unset css var ' + m[1])
  // seeds and saved designs from before the animation blocks keep working
  const base = generate({ seed: 77, kind: 'marketing', mood: '' })
  // old all-digit seeds: 5 digits per block, then setup (mood, kind, boldness, mode)
  const bp = partsOf(base)
  const digits = (keys: (keyof typeof bp)[]) => keys.map((k) => String(bp[k]).padStart(5, '0')).join('') + MOOD_NAMES.indexOf(base.meta.mood) + '0' + String(Math.round((base.tokens.bgBold ?? DEFAULT_BG_BOLD) * 20)).padStart(2, '0') + '0'
  const old = digits(['palette', 'fonts', 'shape', 'layout', 'text', 'backdrops'])
  const loaded = fromCode(old)
  const mid = fromCode(digits(['palette', 'fonts', 'shape', 'layout', 'text', 'backdrops', 'ambient', 'entrance', 'interaction']))
  if (!mid || JSON.stringify(motionGroup(mid.tokens, 'entrance')) !== JSON.stringify(motionGroup(base.tokens, 'entrance')) || JSON.stringify(mid.tokens.palette) !== JSON.stringify(base.tokens.palette) || mid.meta.archetype !== base.meta.archetype) fail('50-digit seed no longer loads')
  if (!loaded || old.length !== 35) fail('old seed rejected')
  else {
    if (JSON.stringify(loaded.tokens.palette) !== JSON.stringify(base.tokens.palette) || loaded.meta.archetype !== base.meta.archetype) fail('old seed changed the design')
    if (designCode(loaded).length !== CODE_LENGTH || fingerprint(fromCode(designCode(loaded))!) !== fingerprint(loaded)) fail('old seed does not round trip')
  }
  const { ambient: _x, entrance: _y, hover: _z, navLink: _nl3, navBar: _nb3, ...oldTokens } = base.tokens
  const { ambient: _p, entrance: _q, interaction: _r, nav: _n, ...oldParts } = partsOf(base)
  const saved = upgradeDoc({ ...base, tokens: oldTokens, meta: { ...base.meta, parts: oldParts as any } })
  const rebuilt = fromCode(designCode(saved))!
  if (!saved.tokens.ambient || MOTION_PARTS.some((p) => JSON.stringify(motionGroup(rebuilt.tokens, p)) !== JSON.stringify(motionGroup(saved.tokens, p)))) fail('old saved design does not match its seed')
  if (bad) { console.log(bad + ' animation failures'); process.exit(1) }
  console.log('animation ok')
}
