import { useMemo } from 'react'
import { critique } from '../gen/critique'
import { setUI, useStore } from '../store'

export function CritiquePanel() {
  const { doc } = useStore()
  const issues = useMemo(() => critique(doc), [doc])
  const bad = issues.filter((i) => i.level !== 'pass')
  return (
    <div className="panel-body">
      <p className="meta">{bad.length ? `${bad.length} thing${bad.length > 1 ? 's' : ''} to look at` : 'Nothing generic detected'}</p>
      <ul className="issues">
        {[...issues].sort((a, b) => ['fail', 'warn', 'pass'].indexOf(a.level) - ['fail', 'warn', 'pass'].indexOf(b.level)).map((i) => (
          <li key={i.id} className={'issue ' + i.level} onClick={() => i.nodeId && setUI({ selectedId: i.nodeId })} style={{ cursor: i.nodeId ? 'pointer' : 'default' }}>
            <b>{i.level === 'pass' ? 'Pass' : i.level === 'fail' ? 'Fail' : 'Warn'}</b> {i.title}
            <small>{i.detail}</small>
          </li>
        ))}
      </ul>
    </div>
  )
}
