import { makeRng } from '../lib/rng'

export const ART_KINDS = ['blocks', 'stripes', 'arches', 'dots', 'waves', 'sun', 'rings'] as const
export type ArtKind = (typeof ART_KINDS)[number]

const COLORS = ['var(--accent)', 'var(--accent2)', 'var(--ink)', 'var(--surface)', 'var(--inverse)']

/** Generated SVG art drawn only in palette variables. Fills its box (slice). */
export function Art({ kind, seed, tone = 0 }: { kind: ArtKind; seed: number; tone?: number }) {
  const r = makeRng(seed * 7 + tone)
  const W = 400
  const H = 300
  const pal = r.shuffle(COLORS)
  const bg = ['var(--surface)', 'var(--accent2)', 'var(--accent)', 'var(--ink)'][tone % 4]
  const c = (i: number) => {
    const col = pal[i % pal.length]
    return col === bg ? pal[(i + 1) % pal.length] : col
  }
  const shapes: JSX.Element[] = []
  if (kind === 'blocks') {
    const n = r.int(4, 7)
    for (let i = 0; i < n; i++) {
      const w = r.int(60, 200)
      const h = r.int(60, 180)
      shapes.push(<rect key={i} x={r.int(-20, W - 60)} y={r.int(-20, H - 50)} width={w} height={h} fill={c(i)} rx={r.chance(0.3) ? w / 2 : 0} />)
    }
  } else if (kind === 'stripes') {
    const w = W / r.int(6, 14)
    const ang = r.pick([0, 0, 90, -30, 45])
    // cover the whole rotated viewBox; never skip every third stripe so the art can't come out empty
    for (let i = 0, x = -150; x < 550; i++, x += 2 * w) {
      if (i % 3 !== 0 && r.chance(0.3)) continue
      shapes.push(<rect key={i} x={x} y={-300} width={w} height={900} fill={c(i)} transform={`rotate(${ang} 200 150)`} />)
    }
  } else if (kind === 'arches') {
    const n = r.int(3, 5)
    const w = W / n
    for (let i = 0; i < n; i++) {
      const hh = r.int(120, 280)
      shapes.push(<path key={i} d={`M${i * w + 8} ${H} V${H - hh + w / 2} a${w / 2 - 8} ${w / 2 - 8} 0 0 1 ${w - 16} 0 V${H} Z`} fill={c(i)} />)
      if (r.chance(0.5)) shapes.push(<circle key={'c' + i} cx={i * w + w / 2} cy={H - hh + w / 2 + 10} r={w / 6} fill={c(i + 2)} />)
    }
  } else if (kind === 'dots') {
    const step = r.pick([30, 40, 50])
    const rad = r.int(5, step / 2 - 2)
    for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < W; x += step) {
      if (r.chance(0.2)) continue
      shapes.push(<circle key={x + '-' + y} cx={x + (Math.floor(y / step) % 2 ? step / 2 : 0)} cy={y} r={rad * (r.chance(0.2) ? 1.6 : 1)} fill={c(r.int(0, 2))} />)
    }
  } else if (kind === 'waves') {
    const n = r.int(4, 7)
    for (let i = 0; i < n; i++) {
      const y = (i * H) / n + 20
      const a = r.int(10, 30)
      const p = r.int(60, 130)
      let d = `M-10 ${y}`
      for (let x = -10; x < W + p; x += p) d += ` q${p / 4} ${-a} ${p / 2} 0 t${p / 2} 0`
      d += ` V${H + 10} H-10Z`
      shapes.push(<path key={i} d={d} fill={c(i)} />)
    }
  } else if (kind === 'sun') {
    shapes.push(<circle key="s" cx={r.int(120, 280)} cy={r.int(100, 170)} r={r.int(60, 100)} fill={c(0)} />)
    shapes.push(<rect key="g" x={0} y={r.int(190, 230)} width={W} height={120} fill={c(1)} />)
    for (let i = 0; i < 3; i++) shapes.push(<rect key={'l' + i} x={0} y={200 + i * 22} width={W} height={5} fill={c(2)} />)
  } else {
    const cx = r.int(120, 280)
    const cy = r.int(100, 200)
    for (let i = 7; i > 0; i--) shapes.push(<circle key={i} cx={cx} cy={cy} r={i * 28} fill={c(i)} />)
  }
  return (
    <svg className="d-art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width={W} height={H} fill={bg} />
      {shapes}
    </svg>
  )
}
