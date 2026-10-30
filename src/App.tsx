import { useEffect, useRef, useState } from 'react'
import { deleteSelected, duplicateSelected } from './actions'
import { MODELS } from './ai'
import { Canvas } from './editor/Canvas'
import { CritiquePanel } from './editor/CritiquePanel'
import { Design } from './editor/Design'
import { Generate } from './editor/Generate'
import { Inspector } from './editor/Inspector'
import { Elements, Layers } from './editor/Layers'
import { copyText, download, exportHtml, slug } from './export'
import { critique } from './gen/critique'
import { commit, redo, setUI, toast, undo, useStore, type Viewport } from './store'
import type { Doc } from './types'

function TopBar() {
  const s = useStore()
  const { ui, doc } = s
  const [menu, setMenu] = useState<'' | 'export' | 'key'>('')
  const importRef = useRef<HTMLInputElement>(null)
  const name = slug(doc.meta.name)
  const fails = critique(doc).filter((i) => i.level === 'fail').length
  const close = () => setMenu('')
  return (
    <header className="topbar">
      <div className="logo">Handmade<small>design that doesn't look generated</small></div>
      <div className="group">
        <button disabled={!s.past.length} onClick={undo} title="Undo (Ctrl+Z)">Undo</button>
        <button disabled={!s.future.length} onClick={redo} title="Redo (Ctrl+Shift+Z)">Redo</button>
      </div>
      <div className="group seg">
        {(['desktop', 'tablet', 'mobile'] as Viewport[]).map((v) => <button key={v} className={ui.viewport === v ? 'on' : ''} onClick={() => setUI({ viewport: v })}>{v}</button>)}
      </div>
      <label className="toggle"><input type="checkbox" checked={ui.wire} onChange={(e) => setUI({ wire: e.target.checked })} /> Wireframe</label>
      <span className="spacer" />
      {fails > 0 && <button className="badge" onClick={() => setUI({ leftTab: 'critique' })}>{fails} critique fail{fails > 1 ? 's' : ''}</button>}
      <div className="pop">
        <button onClick={() => setMenu(menu === 'key' ? '' : 'key')}>{ui.apiKey ? 'API key set' : 'API key'}</button>
        {menu === 'key' && (
          <div className="popover" onMouseLeave={() => {}}>
            <p className="hint">Optional. Your key stays in this browser and requests go straight to api.anthropic.com. Without it, everything still works using the keyword fallback and the built-in content bank.</p>
            <input type="password" autoComplete="off" placeholder="sk-ant-…" value={ui.apiKey} onChange={(e) => setUI({ apiKey: e.target.value.trim() })} />
            <label className="toggle"><input type="checkbox" checked={ui.rememberKey} onChange={(e) => setUI({ rememberKey: e.target.checked })} /> Remember in localStorage</label>
            <select value={ui.model} onChange={(e) => setUI({ model: e.target.value })}>{MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select>
            <button onClick={close}>Done</button>
          </div>
        )}
      </div>
      <div className="pop">
        <button className="primary" onClick={() => setMenu(menu === 'export' ? '' : 'export')}>Export ▾</button>
        {menu === 'export' && (
          <div className="popover menu">
            <button onClick={() => { download(name + '.html', exportHtml(doc, ui.wire)); close() }}>Download HTML</button>
            <button onClick={async () => { await copyText(exportHtml(doc, ui.wire)); toast('HTML copied'); close() }}>Copy HTML</button>
            <button onClick={() => { download(name + '.json', JSON.stringify(doc, null, 2), 'application/json'); close() }}>Download tree JSON</button>
            <button onClick={async () => { await copyText(JSON.stringify(doc, null, 2)); toast('JSON copied'); close() }}>Copy tree JSON</button>
            <button onClick={() => { importRef.current?.click(); close() }}>Import tree JSON…</button>
          </div>
        )}
      </div>
      <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={async (e) => {
        const f = e.target.files?.[0]; e.target.value = ''
        if (!f) return
        try {
          const d = JSON.parse(await f.text()) as Doc
          if (!d.root || !d.tokens || !d.meta) throw new Error('Not a Handmade tree')
          commit(d); setUI({ selectedId: null, seed: d.meta.seed }); toast('Imported')
        } catch (er) { toast((er as Error).message) }
      }} />
    </header>
  )
}

export default function App() {
  const { ui } = useStore()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo() }
      else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo() }
      else if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateSelected() }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected() }
      else if (e.key === 'Escape') setUI({ selectedId: null })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const tabs: [typeof ui.leftTab, string][] = [['generate', 'Generate'], ['elements', 'Add'], ['layers', 'Layers'], ['critique', 'Critique']]
  return (
    <div className="app">
      <TopBar />
      <aside className="left">
        <nav className="tabs">{tabs.map(([k, l]) => <button key={k} className={ui.leftTab === k ? 'on' : ''} onClick={() => setUI({ leftTab: k })}>{l}</button>)}</nav>
        <div className="scroll">
          {ui.leftTab === 'generate' && <Generate />}
          {ui.leftTab === 'elements' && <Elements />}
          {ui.leftTab === 'layers' && <Layers />}
          {ui.leftTab === 'critique' && <CritiquePanel />}
        </div>
      </aside>
      <main className="center"><Canvas /></main>
      <aside className="right">
        <nav className="tabs">
          <button className={ui.rightTab === 'node' ? 'on' : ''} onClick={() => setUI({ rightTab: 'node' })}>Selection</button>
          <button className={ui.rightTab === 'design' ? 'on' : ''} onClick={() => setUI({ rightTab: 'design' })}>Design tokens</button>
        </nav>
        <div className="scroll">{ui.rightTab === 'node' ? <Inspector /> : <Design />}</div>
      </aside>
      {(ui.busy || ui.toast) && <div className="toast">{ui.busy || ui.toast}</div>}
    </div>
  )
}
