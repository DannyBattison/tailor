import { useRef } from 'react'
import { aiReady } from '../ai'
import { aiGenerate, applySeed, makeVariants, newDesign, newDocFromScratch, pickVariant, regenSelectedSection, rerollBackdrops, rerollCopy, rerollImages, rerollLayout, rerollPart, type Part } from '../actions'
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
  const ready = aiReady({ provider: ui.provider, key: ui.apiKey, model: ui.model }, ui.cli)
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
    { label: 'Shape', hint: 'radius, border, shadow', lock: 'shape', run: part('shape') },
    { label: 'Rhythm', hint: 'density, scale, case', lock: 'rhythm', run: part('rhythm') },
    { label: 'Signature', hint: doc.tokens.signature, lock: 'signature', run: part('signature') },
    { label: 'Layout', hint: archetypesFor(doc.meta.kind).find((a) => a.id === doc.meta.archetype)?.name ?? '', lock: 'layout', run: rerollLayout },
    { label: 'Copy', hint: 'another business', lock: 'copy', run: rerollCopy },
    { label: 'Backdrops', hint: 'hero and band backgrounds', run: rerollBackdrops },
    { label: 'Images', hint: 'new art', run: rerollImages },
    { label: 'Section', hint: inSection ? 'the selected one' : 'select something first', run: regenSelectedSection, disabled: !inSection },
  ]

  return (
    <div className="panel-body">
      <label className="lbl">Brief</label>
      <div className="seg">
        {(['marketing', 'app'] as const).map((k) => (
          <button key={k} className={ui.kind === k ? 'on' : ''} onClick={() => newDocFromScratch(k)}>{k === 'marketing' ? 'Marketing site' : 'App UI'}</button>
        ))}
      </div>
      <select value={ui.mood} onChange={(e) => setUI({ mood: e.target.value })} title="Mood">
        <option value="">Mood: auto (from brief, else random)</option>
        {MOOD_NAMES.map((m) => <option key={m} value={m}>Mood: {m}</option>)}
      </select>
      <textarea rows={3} value={ui.brief} placeholder="e.g. a small coffee roaster in Hobart, warm, a bit nerdy" onChange={(e) => setUI({ brief: e.target.value })} />
      <p className="hint">Keywords pick a mood and a copy set. With AI set up, it writes the copy from your brief. Colour, type, shape and layout are never up to the model.</p>
      <button disabled={!!ui.busy} onClick={() => (ready ? aiGenerate() : setUI({ menu: 'key' }))}>{ready ? 'Write copy with AI' : 'Set up AI to write copy…'}</button>

      <label className="lbl">New design</label>
      <div className="row2">
        <button className="primary" onClick={newDesign} title="Full relaunch: new seed, honours the locks below">New design</button>
        <button onClick={makeVariants}>4 variants</button>
      </div>
      <div className="row2 seedrow">
        <span className="seedlabel">Seed</span>
        <input type="number" value={ui.seed} onChange={(e) => setUI({ seed: Math.max(1, +e.target.value || 1) })} />
        <button onClick={() => applySeed(ui.seed)} disabled={ui.seed === doc.meta.seed} title="Rebuild the design for this seed">Load</button>
      </div>
      <p className="hint">The seed only changes when you start a new design. Re-rolls below change one part and keep it.</p>

      <label className="lbl">Re-roll one part</label>
      <div className="parts">
        {rows.map((r) => {
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
        })}
      </div>
      <p className="hint">Lock a part to keep it through New design.</p>
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
