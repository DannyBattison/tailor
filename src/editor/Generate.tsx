import { useRef } from 'react'
import { applySeed, makeVariants, newDesign, newDocFromScratch, pickVariant, regenSelectedSection, rerollBackdrops, rerollImages, rerollLayout, rerollPart, rerollText, type Part } from '../actions'
import { archetypesFor } from '../gen/build'
import { getFont, loadFont } from '../gen/fonts'
import { MOOD_NAMES } from '../gen/moods'
import { paletteFromImage } from '../imagePalette'
import { nearestSection } from '../lib/tree'
import { DocView } from '../render/Doc'
import { mutate, setUI, toast, useStore } from '../store'
import type { Locks } from '../types'

interface Row { label: string; hint: string; lock?: keyof Locks; run: () => void; disabled?: boolean; extra?: { label: string; run: () => void } }

export function Generate() {
  const { ui, doc } = useStore()
  const file = useRef<HTMLInputElement>(null)
  const inSection = !!(ui.selectedId && nearestSection(doc.root, ui.selectedId))
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
    { label: 'Images', hint: 'new art', run: rerollImages },
    { label: 'Section', hint: inSection ? 'the selected one' : 'select something first', run: regenSelectedSection, disabled: !inSection },
  ]

  const rowView = (r: Row) => {
    const locked = r.lock ? !!ui.locks[r.lock] : false
    return (
      <div key={r.label} className={'part' + (locked ? ' locked' : '')}>
        {r.lock ? (
          <button className={'lockbtn' + (locked ? ' on' : '')} onClick={() => lock(r.lock!)} aria-pressed={locked} title={locked ? 'Locked: kept by New design, and can\'t be re-rolled' : 'Free: New design will change it'}>{locked ? '🔒︎' : '○'}</button>
        ) : <span className="lockbtn none" />}
        <span className="plabel"><b>{r.label}</b><small>{r.hint}</small></span>
        {r.extra && <button className="mini" onClick={r.extra.run}>{r.extra.label}</button>}
        <button className="mini" disabled={locked || r.disabled} onClick={r.run} title={locked ? 'Unlock to re-roll' : 'Re-roll ' + r.label.toLowerCase()}>↻ Re-roll</button>
      </div>
    )
  }

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
        <input type="number" value={ui.seed} onChange={(e) => setUI({ seed: Math.max(1, +e.target.value || 1) })} />
        <button onClick={() => applySeed(ui.seed)} disabled={ui.seed === doc.meta.seed} title="Rebuild the design for this seed">Load</button>
      </div>
      <p className="hint">The seed only changes when you start a new design. Lock a part to keep it through New design; re-roll a part to change just that.</p>
      <div className="parts">{rows.map(rowView)}</div>

      <p className="hint">The page on the canvas is a specimen with lorem ipsum text. The export is the design system; your AI writes the real copy.</p>
      <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { onImage(e.target.files?.[0]); e.target.value = '' }} />

      <p className="meta">Now: <b>{doc.meta.name}</b> · mood {doc.meta.mood} · seed {doc.meta.seed}</p>
      {ui.variants && (
        <>
          <label className="lbl">Pick a direction</label>
          <div className="variants">
            {ui.variants.map((v, i) => {
              loadFont(getFont(v.tokens.fontId))
              const name = archetypesFor(v.meta.kind).find((a) => a.id === v.meta.archetype)?.name
              return (
                <button key={i} className="variant" onClick={() => pickVariant(v)} title={`${name} · seed ${v.meta.seed}`}>
                  <div className="thumb"><div style={{ width: 1280, transform: 'scale(0.125)', transformOrigin: 'top left', pointerEvents: 'none' }}><DocView root={v.root} tokens={v.tokens} /></div></div>
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
