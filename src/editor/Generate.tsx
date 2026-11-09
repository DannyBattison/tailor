import { useRef, useState } from 'react'
import { loadCode, makeVariants, newDesign, newDocFromScratch, pickVariant, replayEntrance, rerollAnimation, rerollBackdrops, rerollLayout, rerollLook, rerollMotion, rerollMotionField, rerollPart, rerollText, type MotionPart, type Part } from '../actions'
import { archetypesFor } from '../gen/build'
import { designCode } from '../gen/code'
import { copyText } from '../export'
import { fontSpec, loadFont } from '../gen/fonts'
import { MOOD_NAMES } from '../gen/moods'
import { paletteFromImage } from '../imagePalette'
import { walk } from '../lib/tree'
import { DocView } from '../render/Doc'
import { mutate, setUI, toast, useStore } from '../store'
import type { DNode, Locks, Tokens } from '../types'

/** Background animation needs something behind the content to move: a backdrop or the hero's generated art. The marquee moves regardless. */
function hasAmbientTarget(root: DNode) {
  let found = false
  walk(root, (n) => {
    if (n.props.backdrop && n.props.backdrop !== 'noise') found = true
    if (n.type === 'section' && n.props.role === 'hero') walk(n, (c) => { if (c.type === 'image' && !c.props.frame && !c.props.icon && !c.props.source) found = true })
  })
  return found
}

/** One setting inside a part, re-rollable on its own (drill-down). */
interface Field { label: string; value: string; run: () => void }
interface Row { label: string; hint: string; lock?: keyof Locks; run: () => void; disabled?: boolean; extra?: { label: string; run: () => void }; fields?: Field[] }

export function Generate() {
  const { ui, doc } = useStore()
  const file = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState<string>('')
  const code = designCode(doc)
  const shown = ui.codeInput ?? code
  const dirty = ui.codeInput !== null && ui.codeInput.trim() !== code
  const lock = (k: keyof Locks) => setUI({ locks: { ...ui.locks, [k]: !ui.locks[k] } })

  async function onImage(f?: File) {
    if (!f) return
    try {
      const r = await paletteFromImage(f, doc.tokens.bgBold, doc.tokens.mode)
      mutate((d) => ({ ...d, tokens: { ...d.tokens, palette: r.palette, spec: r.spec, hue: r.hue, paletteStrategy: 'image' } }))
      setUI({ locks: { ...ui.locks, palette: true } })
      toast('Palette taken from your image, contrast-corrected. Palette is now locked.')
    } catch (e) {
      toast((e as Error).message)
    }
  }

  const part = (p: Part) => () => rerollPart(p)
  const rows: Row[] = [
    { label: 'Palette', hint: 'colours', lock: 'palette', run: part('palette'), extra: { label: 'From image…', run: () => file.current?.click() } },
    { label: 'Fonts', hint: 'type pairing', lock: 'fonts', run: part('fonts') },
    { label: 'Shape', hint: 'sliders, shadow, case, signature', lock: 'shape', run: part('shape') },
    { label: 'Layout', hint: archetypesFor(doc.meta.kind).find((a) => a.id === doc.meta.archetype)?.name ?? '', lock: 'layout', run: rerollLayout },
    { label: 'Text', hint: 'new lorem ipsum', lock: 'copy', run: rerollText },
    { label: 'Backdrops', hint: 'hero and band backgrounds', run: rerollBackdrops },
  ]

  const t = doc.tokens
  const isApp = doc.meta.kind === 'app' // app screens have no backdrops or sections for these to act on
  const motion = (p: MotionPart) => () => rerollMotion(p)
  const field = (p: MotionPart, label: string, k: keyof Tokens, fallback: string): Field => ({ label, value: String(t[k] ?? fallback), run: () => rerollMotionField(p, k) })
  const motionRows: Row[] = [
    { label: 'Background', hint: (t.ambient ?? 'drift') + (isApp ? ' · app UIs have no backdrops' : hasAmbientTarget(doc.root) ? ' · behind the content' : ' · no backdrop on this page'), lock: 'ambient', run: motion('ambient'), disabled: isApp },
    { label: 'Entrance', hint: (t.entrance ?? 'rise') + (isApp ? ' · app UIs have no entrances' : ' · on arrival'), lock: 'entrance', run: motion('entrance'), disabled: isApp, extra: isApp ? undefined : { label: 'Replay', run: replayEntrance } },
    { label: 'Interaction', hint: `${t.hover ?? 'lift'}, ${t.motion ?? 'smooth'} · buttons and cards`, lock: 'interaction', run: motion('interaction'), fields: [field('interaction', 'Hover', 'hover', 'lift'), field('interaction', 'Feel', 'motion', 'smooth')] },
    { label: 'Navigation', hint: `${t.navLink ?? 'underline'}, ${t.navBar ?? 'glass'} · links and top bar`, lock: 'nav', run: motion('nav'), fields: [field('nav', 'Links', 'navLink', 'underline'), field('nav', 'Top bar', 'navBar', 'glass')] },
  ]

  const rowView = (r: Row) => {
    const locked = r.lock ? !!ui.locks[r.lock] : false
    const drill = open === r.label && r.fields
    return (
      <div key={r.label} className="partwrap">
      <div className={'part' + (locked ? ' locked' : '')}>
        {r.lock ? (
          <button className={'lockbtn' + (locked ? ' on' : '')} onClick={() => lock(r.lock!)} aria-pressed={locked} title={locked ? 'Locked: kept by New design, and can\'t be re-rolled' : 'Free: New design will change it'}>{locked ? '🔒︎' : '○'}</button>
        ) : <span className="lockbtn none" />}
        <span className="plabel"><b>{r.label}</b><small>{r.hint}</small></span>
        {r.fields && <button className="mini ghost" aria-expanded={!!drill} onClick={() => setOpen(drill ? '' : r.label)} title={`Re-roll one setting of ${r.label.toLowerCase()} at a time`}>{drill ? '▾' : '▸'}</button>}
        {r.extra && <button className="mini" onClick={r.extra.run}>{r.extra.label}</button>}
        <button className="mini" disabled={locked || r.disabled} onClick={r.run} title={locked ? 'Unlock to re-roll' : 'Re-roll ' + r.label.toLowerCase()}>↻ Re-roll</button>
      </div>
      {drill && (
        <div className="fields">
          {r.fields!.map((f) => (
            <div key={f.label} className="field"><span><small>{f.label}</small> <b>{f.value}</b></span><button className="mini" disabled={locked || r.disabled} onClick={f.run} title={`Re-roll ${f.label.toLowerCase()} only`}>↻</button></div>
          ))}
        </div>
      )}
      </div>
    )
  }
  const groupHead = (label: string, run: () => void, title: string) => (
    <div className="grouphead"><label className="lbl">{label}</label><button className="mini" onClick={run} title={title}>↻ Re-roll all</button></div>
  )

  return (
    <div className="panel-body">
      <label className="lbl">Product</label>
      <div className="seg">
        {(['marketing', 'app'] as const).map((k) => (
          <button key={k} className={ui.kind === k ? 'on' : ''} onClick={() => newDocFromScratch(k)}>{k === 'marketing' ? 'Marketing site' : 'App UI'}</button>
        ))}
      </div>
      <select value={ui.mood} onChange={(e) => setUI({ mood: e.target.value })} title="Mood steers colour, type and shape">
        <option value="">Mood: random</option>
        {MOOD_NAMES.map((m) => <option key={m} value={m}>Mood: {m}</option>)}
      </select>

      <label className="lbl">Design system</label>
      <div className="row2">
        <button className="primary" onClick={newDesign} title="Full relaunch: new seed, honours the locks below">New design</button>
        <button onClick={makeVariants}>4 variants</button>
      </div>
      <div className="row2 seedrow">
        <span className="seedlabel">Seed</span>
        <span style={{ flex: 1 }} />
        <button onClick={() => loadCode(shown)} disabled={!dirty} title="Rebuild the design from this seed">Load</button>
        <button onClick={async () => { await copyText(code); toast('Seed copied') }} title="Copy this design's seed">Copy</button>
      </div>
      <textarea className="seedbox" rows={3} spellCheck={false} value={shown} onChange={(e) => setUI({ codeInput: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (dirty) loadCode(shown) } }} title="Nine words that recreate this design exactly. Type or paste any seed here and press Load." />
      <p className="hint">The seed is nine words that hold every part below plus mood, product, boldness and mode. Re-rolling a part changes only the bits that hold it; loading a seed rebuilds the design exactly. Lock a part to keep it through New design.</p>
      {groupHead('Look', rerollLook, 'Re-roll palette, fonts and shape together (locked ones stay)')}
      <div className="parts">{rows.slice(0, 3).map(rowView)}</div>
      <label className="lbl">Structure</label>
      <div className="parts">{rows.slice(3).map(rowView)}</div>
      {groupHead('Animation', rerollAnimation, 'Re-roll every animation part together (locked ones stay). Open a part with ▸ to re-roll its settings one at a time')}
      <div className="parts">{motionRows.map(rowView)}</div>
      {doc.meta.edited && <p className="warn">Hand-tuned since it was generated. The export includes your tweaks, but the seed only rebuilds the generated design.</p>}

      <p className="hint">The page on the canvas is a specimen with lorem ipsum text. The export is the design system; your AI writes the real copy.</p>
      <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { onImage(e.target.files?.[0]); e.target.value = '' }} />

      <p className="meta">Now: <b>{doc.meta.name}</b> · mood {doc.meta.mood}</p>
      {ui.variants && (
        <>
          <label className="lbl">Pick a direction</label>
          <div className="variants">
            {ui.variants.map((v, i) => {
              loadFont(fontSpec(v.tokens))
              const name = archetypesFor(v.meta.kind).find((a) => a.id === v.meta.archetype)?.name
              return (
                <button key={i} className="variant" onClick={() => pickVariant(v)} title={`${name} · seed ${designCode(v)}`}>
                  <div className="thumb"><div style={{ width: 1280, transform: 'scale(0.125)', transformOrigin: 'top left', pointerEvents: 'none' }}><DocView root={v.root} tokens={v.tokens} still /></div></div>
                  <span>{name}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
