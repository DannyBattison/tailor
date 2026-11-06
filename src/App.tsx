import { useEffect, useRef } from 'react'
import { deleteSelected, duplicateSelected, setMode } from './actions'
import { Canvas } from './editor/Canvas'
import { CritiquePanel } from './editor/CritiquePanel'
import { Design } from './editor/Design'
import { Generate } from './editor/Generate'
import { Inspector } from './editor/Inspector'
import { copyText, download, exportHtml, slug } from './export'
import { critique } from './gen/critique'
import { designSystem, designSystemPrompt } from './designSystem'
import { commit, getState, redo, setUI, toast, undo, useStore, type Viewport } from './store'
import type { Doc } from './types'

function TopBar() {
  const s = useStore()
  const { ui, doc } = s
  const menu = ui.menu
  const setMenu = (m: '' | 'export') => setUI({ menu: m })
  const importRef = useRef<HTMLInputElement>(null)
  const name = slug(doc.meta.name)
  const fails = critique(doc).filter((i) => i.level === 'fail').length
  const close = () => setMenu('')
  return (
    <header className="topbar">
      <div className="logo" aria-label="Tailor"><span className="word">t<span className="ai">ai</span>lor</span><small>design that doesn't look generated</small></div>
      <div className="group">
        <button disabled={!s.past.length} onClick={undo} title="Undo (Ctrl+Z)">Undo</button>
        <button disabled={!s.future.length} onClick={redo} title="Redo (Ctrl+Shift+Z)">Redo</button>
      </div>
      <div className="group seg">
        {(['desktop', 'tablet', 'mobile'] as Viewport[]).map((v) => <button key={v} className={ui.viewport === v ? 'on' : ''} onClick={() => setUI({ viewport: v })}>{v}</button>)}
      </div>
      <div className="group seg" title={doc.tokens.spec ? 'Light or dark version of this palette' : 'Palette was edited by hand; re-roll it to switch modes'}>
        {(['light', 'dark'] as const).map((m) => {
          const cur = doc.tokens.mode ?? (doc.tokens.spec?.dark ? 'dark' : 'light')
          return <button key={m} disabled={!doc.tokens.spec} className={cur === m ? 'on' : ''} onClick={() => setMode(m)}>{m}</button>
        })}
      </div>
      <label className="toggle"><input type="checkbox" checked={ui.wire} onChange={(e) => setUI({ wire: e.target.checked })} /> <span>Wireframe</span></label>
      <span className="spacer" />
      {fails > 0 && <button className="badge" onClick={() => setUI({ leftTab: 'critique' })}>{fails} critique fail{fails > 1 ? 's' : ''}</button>}
      <div className="pop">
        <button className="primary" onClick={() => setMenu(menu === 'export' ? '' : 'export')}>Export for AI ▾</button>
        {menu === 'export' && (
          <div className="popover menu" style={{ width: 250 }}>
            <button className="primary" onClick={async () => { await copyText(designSystemPrompt(doc)); toast('Design system and build instructions copied. Paste into your AI.'); close() }}>Copy as AI prompt</button>
            <button onClick={() => { download(name + '.design-system.json', JSON.stringify(designSystem(doc), null, 2), 'application/json'); close() }}>Download design system JSON</button>
            <hr />
            <small className="hint">The preview page</small>
            <button onClick={() => { download(name + '.html', exportHtml(doc, ui.wire)); close() }}>Download HTML</button>
            <button onClick={async () => { await copyText(exportHtml(doc, ui.wire)); toast('HTML copied'); close() }}>Copy HTML</button>
            <hr />
            <button onClick={() => { download(name + '.json', JSON.stringify(doc, null, 2), 'application/json'); close() }}>Download page tree JSON</button>
            <button onClick={async () => { await copyText(JSON.stringify(doc, null, 2)); toast('JSON copied'); close() }}>Copy page tree JSON</button>
            <button onClick={() => { importRef.current?.click(); close() }}>Import page tree JSON…</button>
          </div>
        )}
      </div>
      <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={async (e) => {
        const f = e.target.files?.[0]; e.target.value = ''
        if (!f) return
        try {
          const d = JSON.parse(await f.text()) as Doc
          if (!d.root || !d.tokens || !d.meta) throw new Error('Not a Tailor page tree')
          commit(d, '', true); setUI({ selectedId: null, codeInput: null }); toast('Imported')
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
      if (e.key === 'Escape' && getState().ui.drawer) { setUI({ drawer: '' }); return }
      if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo() }
      else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo() }
      else if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateSelected() }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected() }
      else if (e.key === 'Escape') setUI({ selectedId: null, drawer: '' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const tabs: [typeof ui.leftTab, string][] = [['generate', 'Generate'], ['critique', 'Critique']]
  return (
    <div className={'app' + (ui.drawer ? ' drawer-' + ui.drawer : '')}>
      <TopBar />
      <button className="fab fab-left" aria-expanded={ui.drawer === 'left'} aria-controls="left-drawer" onClick={() => setUI({ drawer: ui.drawer === 'left' ? '' : 'left' })}>
        <span aria-hidden>{ui.drawer === 'left' ? '✕' : '☰'}</span> {ui.drawer === 'left' ? 'Close' : 'Generate'}
      </button>
      <button className="fab fab-right" aria-expanded={ui.drawer === 'right'} aria-controls="right-drawer" onClick={() => setUI({ drawer: ui.drawer === 'right' ? '' : 'right' })}>
        <span aria-hidden>{ui.drawer === 'right' ? '✕' : '⚙'}</span> {ui.drawer === 'right' ? 'Close' : 'Style'}
      </button>
      <div className="backdrop" onClick={() => setUI({ drawer: '' })} />
      <aside className="left" id="left-drawer">
        <nav className="tabs">{tabs.map(([k, l]) => <button key={k} className={ui.leftTab === k ? 'on' : ''} onClick={() => setUI({ leftTab: k })}>{l}</button>)}</nav>
        <div className="scroll">
          {ui.leftTab === 'generate' && <Generate />}
          {ui.leftTab === 'critique' && <CritiquePanel />}
        </div>
      </aside>
      <main className="center"><Canvas /></main>
      <aside className="right" id="right-drawer">
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
