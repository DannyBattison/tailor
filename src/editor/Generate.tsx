import { useRef } from 'react'
import { aiGenerate, applySeed, makeVariants, newDocFromScratch, pickVariant, reroll } from '../actions'
import { MOOD_NAMES } from '../gen/moods'
import { paletteFromImage } from '../imagePalette'
import { DocView } from '../render/Doc'
import { mutate, setUI, toast, useStore } from '../store'
import { loadFont, getFont } from '../gen/fonts'
import { archetypesFor } from '../gen/build'

export function Generate() {
  const { ui, doc } = useStore()
  const file = useRef<HTMLInputElement>(null)
  const lock = (k: keyof typeof ui.locks) => setUI({ locks: { ...ui.locks, [k]: !ui.locks[k] } })

  async function onImage(f?: File) {
    if (!f) return
    try {
      const r = await paletteFromImage(f)
      mutate((d) => ({ ...d, tokens: { ...d.tokens, palette: r.palette, hue: r.hue, paletteStrategy: 'image' } }))
      setUI({ locks: { ...ui.locks, palette: true } })
      toast('Palette taken from your image, contrast-corrected. Palette lock is on.')
    } catch (e) {
      toast((e as Error).message)
    }
  }

  return (
    <div className="panel-body">
      <div className="seg">
        {(['marketing', 'app'] as const).map((k) => (
          <button key={k} className={ui.kind === k ? 'on' : ''} onClick={() => newDocFromScratch(k)}>{k === 'marketing' ? 'Marketing site' : 'App UI'}</button>
        ))}
      </div>
      <label className="lbl">Mood</label>
      <select value={ui.mood} onChange={(e) => setUI({ mood: e.target.value })}>
        <option value="">Auto (from brief, else random)</option>
        {MOOD_NAMES.map((m) => <option key={m}>{m}</option>)}
      </select>
      <label className="lbl">Brief <span className="hint">keywords steer mood and content; no key needed</span></label>
      <textarea rows={3} value={ui.brief} placeholder="e.g. a small coffee roaster in Hobart, warm, a bit nerdy" onChange={(e) => setUI({ brief: e.target.value })} />
      <label className="lbl">Seed</label>
      <div className="row2">
        <input type="number" value={ui.seed} onChange={(e) => setUI({ seed: Math.max(1, +e.target.value || 1) })} />
        <button onClick={() => applySeed(ui.seed)} title="Rebuild exactly this seed">Use seed</button>
      </div>
      <label className="lbl">Locks <span className="hint">re-rolls only change what is unlocked</span></label>
      <div className="locks">
        {(['palette', 'fonts', 'shape', 'layout'] as const).map((k) => (
          <button key={k} className={'lock' + (ui.locks[k] ? ' on' : '')} onClick={() => lock(k)} aria-pressed={ui.locks[k]}>{ui.locks[k] ? 'Locked' : 'Free'} · {k}</button>
        ))}
      </div>
      <div className="row2">
        <button className="primary" onClick={reroll}>Re-roll</button>
        <button onClick={makeVariants}>4 variants</button>
      </div>
      <div className="row2">
        <button onClick={() => file.current?.click()}>Palette from image…</button>
        <button disabled={!ui.apiKey || !!ui.busy} onClick={aiGenerate} title={ui.apiKey ? 'Claude writes the brief and copy; design stays algorithmic' : 'Add an API key (top right) to enable'}>Write copy with Claude</button>
      </div>
      <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { onImage(e.target.files?.[0]); e.target.value = '' }} />
      <p className="meta">Current: <b>{doc.meta.name}</b> · {archetypesFor(doc.meta.kind).find((a) => a.id === doc.meta.archetype)?.name} · mood {doc.meta.mood} · seed {doc.meta.seed}</p>
      {ui.variants && (
        <>
          <label className="lbl">Pick a direction</label>
          <div className="variants">
            {ui.variants.map((v, i) => {
              loadFont(getFont(v.tokens.fontId))
              return (
                <button key={i} className="variant" onClick={() => pickVariant(v)} title={`${archetypesFor(v.meta.kind).find((a) => a.id === v.meta.archetype)?.name} · seed ${v.meta.seed}`}>
                  <div className="thumb"><div style={{ width: 1280, transform: 'scale(0.125)', transformOrigin: 'top left', pointerEvents: 'none' }}><DocView root={v.root} tokens={v.tokens} /></div></div>
                  <span>{archetypesFor(v.meta.kind).find((a) => a.id === v.meta.archetype)?.name}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
