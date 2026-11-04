import { useRef } from 'react'
import { walk, updateProps } from '../lib/tree'
import { FONT_PAIRS, getFont } from '../gen/fonts'
import { withSignature } from '../gen/generate'
import { paletteIssues } from '../gen/palette'
import { paletteFromImage } from '../imagePalette'
import { contrast, hexToOklch } from '../lib/color'
import { mutate, toast, useStore } from '../store'
import type { Palette, Signature, Tokens } from '../types'

const SWATCHES: [keyof Palette, string][] = [['bg', 'Background'], ['surface', 'Surface'], ['ink', 'Ink'], ['muted', 'Muted'], ['line', 'Line'], ['accent', 'Accent'], ['accent2', 'Accent 2'], ['inverse', 'Inverse']]
const SIGS: Signature[] = ['hardShadow', 'oversized', 'ruled', 'grain', 'tilted', 'inverted', 'marquee']

export function Design() {
  const { doc } = useStore()
  const t = doc.tokens
  const file = useRef<HTMLInputElement>(null)
  const set = (patch: Partial<Tokens>, key: string) => mutate((d) => ({ ...d, tokens: { ...d.tokens, ...patch } }), 'tok-' + key)
  const setColor = (k: keyof Palette, hex: string) => {
    const p = { ...t.palette, [k]: hex }
    // keep the dependent text colours legible when the user edits fills
    const fixOn = (bg: string) => (contrast('#111111', bg) >= contrast('#ffffff', bg) ? '#111111' : '#ffffff')
    if (k === 'accent') { p.onAccent = fixOn(hex); p.accentText = contrast(hex, p.bg) >= 4.5 ? hex : p.ink }
    if (k === 'inverse') p.onInverse = fixOn(hex)
    mutate((d) => ({ ...d, tokens: { ...d.tokens, palette: p, hue: k === 'accent' ? hexToOklch(hex).h : d.tokens.hue, paletteStrategy: 'manual' } }), 'pal-' + k)
  }
  const setImages = (source?: string) => mutate((d) => {
    let root = d.root
    const ids: string[] = []
    walk(root, (n) => { if (n.type === 'image') ids.push(n.id) })
    for (const id of ids) root = updateProps(root, id, { source })
    return { ...d, root }
  })
  const issues = paletteIssues(t.palette)
  const slider = (label: string, key: keyof Tokens, min: number, max: number, step: number, fmt: (v: number) => string = String) => (
    <div className="field">
      <label>{label} <em>{fmt(t[key] as number)}</em></label>
      <input type="range" min={min} max={max} step={step} value={t[key] as number} onChange={(e) => set({ [key]: +e.target.value } as Partial<Tokens>, String(key))} />
    </div>
  )
  return (
    <div className="panel-body">
      <p className="hint">Fine-tune by hand here. To re-roll anything, use the Generate tab.</p>
      <label className="lbl">Palette <em>{t.paletteStrategy}</em></label>
      <div className="swatches">
        {SWATCHES.map(([k, l]) => (
          <label key={k} className="swatch" title={`${l} ${t.palette[k]}`}>
            <input type="color" value={t.palette[k]} onChange={(e) => setColor(k, e.target.value)} />
            <span style={{ background: t.palette[k] }} /><small>{l}</small>
          </label>
        ))}
      </div>
      {issues.map((i) => <p key={i} className="warn">⚠ {i}</p>)}
      <button onClick={() => file.current?.click()}>Palette from image…</button>
      <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => {
        const f = e.target.files?.[0]; e.target.value = ''
        if (!f) return
        try { const r = await paletteFromImage(f); mutate((d) => ({ ...d, tokens: { ...d.tokens, palette: r.palette, hue: r.hue, paletteStrategy: 'image' } })) } catch (er) { toast((er as Error).message) }
      }} />

      <label className="lbl">Images</label>
      <div className="row2">
        <button onClick={() => setImages(undefined)}>Generated art</button>
        <button onClick={() => setImages('placehold')}>placehold.co</button>
      </div>
      <p className="hint">Switches every image. placehold.co images use your palette and need a network connection; wireframe mode still shows crossed boxes.</p>

      <label className="lbl">Fonts</label>
      <select value={t.fontId} onChange={(e) => set({ fontId: e.target.value }, 'font')}>
        {FONT_PAIRS.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
      <p className="meta">{getFont(t.fontId).tags.join(' · ')}</p>

      <label className="lbl">Shape &amp; rhythm</label>
      {slider('Roundness', 'radius', 0, 40, 1, (v) => (v >= 40 ? 'pill' : v + 'px'))}
      {slider('Border', 'border', 0, 3, 0.5, (v) => v + 'px')}
      {slider('Density', 'density', 0.8, 1.3, 0.05)}
      {slider('Type scale', 'scale', 1.15, 1.7, 0.01)}
      {slider('Heading tracking', 'tracking', -0.06, 0.1, 0.005, (v) => v + 'em')}
      <div className="field"><label>Shadow</label>
        <select value={t.shadow} onChange={(e) => set({ shadow: e.target.value as Tokens['shadow'] }, 'shadow')}><option>none</option><option>soft</option><option>hard</option></select></div>
      <div className="field"><label>Heading case</label>
        <select value={t.headingCase} onChange={(e) => set({ headingCase: e.target.value as Tokens['headingCase'] }, 'case')}><option value="none">as written</option><option value="uppercase">UPPERCASE</option><option value="lowercase">lowercase</option></select></div>
      <div className="field"><label>Signature move</label>
        <select value={t.signature} onChange={(e) => mutate((d) => withSignature(d, e.target.value as Signature))}>{SIGS.map((s) => <option key={s}>{s}</option>)}</select></div>
    </div>
  )
}
