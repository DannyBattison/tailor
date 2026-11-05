import { useEffect, useMemo, useState } from 'react'
import { findFont, searchFonts, type GFont } from '../gen/fonts'

const CAT_LABEL = { serif: 'serif', sans: 'sans', display: 'display', script: 'script', mono: 'mono' } as const

/** Type-ahead for any Google font name. Only a real Google Fonts family can be applied. */
export function FontInput({ label, value, onPick }: { label: string; value: string; onPick: (g: GFont) => void }) {
  const [q, setQ] = useState(value)
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const [bad, setBad] = useState(false)
  useEffect(() => { setQ(value); setBad(false) }, [value]) // follows re-rolls and undo
  const items = useMemo(() => (open ? searchFonts(q) : []), [open, q])

  const pick = (g: GFont) => { onPick(g); setQ(g.family); setOpen(false); setBad(false) }
  const settle = () => {
    const exact = findFont(q)
    if (exact) return pick(exact)
    setBad(q.trim() !== '' && q.trim() !== value)
    setQ(value)
    setOpen(false)
  }
  return (
    <div className="field fontfield">
      <label>{label}</label>
      <input
        type="text" value={q} spellCheck={false} autoComplete="off" placeholder="Search Google Fonts"
        onFocus={(e) => { setOpen(true); setHi(0); e.currentTarget.select() }}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0); setBad(false) }}
        onBlur={settle}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(items.length - 1, h + 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(0, h - 1)) }
          else if (e.key === 'Enter') { e.preventDefault(); if (items[hi]) pick(items[hi]); else settle() }
          else if (e.key === 'Escape') { setQ(value); setOpen(false); e.currentTarget.blur() }
        }}
      />
      {open && items.length > 0 && (
        <ul className="ac" role="listbox">
          {items.map((g, i) => (
            <li key={g.family} role="option" aria-selected={i === hi} className={i === hi ? 'hi' : ''} onMouseDown={(e) => { e.preventDefault(); pick(g) }} onMouseEnter={() => setHi(i)}>
              <span style={{ fontFamily: 'inherit' }}>{g.family}</span><small>{CAT_LABEL[g.cat]}</small>
            </li>
          ))}
        </ul>
      )}
      {bad && <span className="warn">Not a Google Fonts family. Pick one from the list.</span>}
    </div>
  )
}
