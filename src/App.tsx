import { useEffect } from 'react'
import { setMode } from './actions'
import { Canvas } from './editor/Canvas'
import { CritiquePanel } from './editor/CritiquePanel'
import { Design } from './editor/Design'
import { Generate } from './editor/Generate'
import { copyText, download, slug } from './export'
import { critique } from './gen/critique'
import { designSystem, designSystemPrompt } from './designSystem'
import { getState, redo, setUI, toast, undo, useStore, type Viewport } from './store'

function TopBar() {
  const s = useStore()
  const { ui, doc } = s
  const menu = ui.menu
  const setMenu = (m: '' | 'export') => setUI({ menu: m })
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
            <button className="primary" onClick={async () => { await copyText(designSystemPrompt(doc)); toast('Prompt copied. Paste it into your agent.'); close() }}>Copy prompt</button>
            <button onClick={() => { download(name + '.prompt.md', designSystemPrompt(doc), 'text/markdown'); close() }}>Download prompt</button>
            <button onClick={() => { download(name + '.handover.json', JSON.stringify(designSystem(doc), null, 2), 'application/json'); close() }}>Download handover JSON</button>
          </div>
        )}
      </div>
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
        <h2 className="panel-title">Design tokens</h2>
        <div className="scroll"><Design /></div>
      </aside>
      {(ui.busy || ui.toast) && <div className="toast">{ui.busy || ui.toast}</div>}
    </div>
  )
}
