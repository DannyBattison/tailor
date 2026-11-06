import { useRef } from 'react'
import { loadCode, makeVariants, newDesign, newDocFromScratch, pickVariant, rerollBackdrops, rerollLayout, rerollPart, rerollText, type Part } from '../actions'
import { archetypesFor } from '../gen/build'
import { designCode } from '../gen/code'
import { copyText } from '../export'
import { fontSpec, loadFont } from '../gen/fonts'
import { MOOD_NAMES } from '../gen/moods'
import { paletteFromImage } from '../imagePalette'
import { DocView } from '../render/Doc'
import { mutate, setUI, toast, useStore } from '../store'
import type { Locks } from '../types'

interface Row { label: string; hint: string; lock?: keyof Locks; run: () => void; disabled?: boolean; extra?: { label: string; run: () => void } }

export function Generate() {
  const { ui, doc } = useStore()
  const file = useRef<HTMLInputElement>(null)
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
        <span style={{ flex: 1 }} />
        <button onClick={() => loadCode(shown)} disabled={!dirty} title="Rebuild the design from this seed">Load</button>
        <button onClick={async () => { await copyText(code); toast('Seed copied') }} title="Copy this design's seed">Copy</button>
      </div>
      <textarea className="seedbox" rows={2} spellCheck={false} value={shown} onChange={(e) => setUI({ codeInput: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (dirty) loadCode(shown) } }} title="Six 5-digit blocks (palette, fonts, shape, layout, text, backdrops) and a setup block. Recreates this design exactly." />
      <p className="hint">The seed is seven 5-digit blocks: palette, fonts, shape, layout, text, backdrops, then setup (mood, product, boldness, mode). Re-rolling a part rewrites only its block, and loading a seed rebuilds the design exactly. Lock a part to keep it through New design.</p>
      <div className="parts">{rows.map(rowView)}</div>
      {doc.meta.edited && <p className="warn">Edited by hand since it was generated (tree edits, sliders, swatches). The seed rebuilds the generated design only; export the page tree JSON to keep your edits.</p>}

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
