import { makeRng } from '../lib/rng'

export const ART_KINDS = ['blocks', 'stripes', 'arches', 'dots', 'waves', 'sun', 'rings'] as const
export type ArtKind = (typeof ART_KINDS)[number]

const TONES = ['surface', 'accent2', 'accent', 'ink'] as const

/** Generated SVG art drawn only in palette variables. Fills its box (slice). */
export function Art({ kind, seed, tone = 0, soft = false }: { kind: ArtKind; seed: number; tone?: number; soft?: boolean }) {
  const r = makeRng(seed * 7 + tone)
  const W = 400
  const H = 300
  // a disciplined palette: the ground plus at most three other tones, never the whole rainbow
  const ground = TONES[tone % 4]
  // soft art (backdrops) never uses ink, so it reads as colour, not grey smudges
  const pal = r.shuffle(TONES.filter((t) => t !== ground && !(ground === 'accent' && t === 'accent2') && !(soft && t === 'ink'))).slice(0, 3).map((t) => `var(--${t})`)
  const bg = `var(--${ground})`
  const c = (i: number) => pal[i % pal.length]
  const shapes: JSX.Element[] = []
  if (kind === 'blocks') {
    // Bauhaus tiles on a 4x3 grid, built from a rule so they read as a pattern: either one motif repeated
    // with a rotation that cycles in a 2x2 pinwheel, or a free left half mirrored into the right.
    const cell = 100
    type Cell = { shape: string; rot: number; col: number }
    const grid: Cell[][] = []
    const mirror = r.chance(0.5)
    if (mirror) {
      const set = r.shuffle(['quarter', 'quarter', 'half', 'circle', 'square', 'empty']).slice(0, 3)
      for (let gy = 0; gy < 3; gy++) {
        grid.push([])
        for (let gx = 0; gx < 2; gx++) grid[gy].push({ shape: r.pick(set), rot: r.pick([0, 90, 180, 270]), col: r.int(0, 2) })
        for (let gx = 2; gx < 4; gx++) {
          const m = grid[gy][3 - gx]
          grid[gy].push({ ...m, rot: m.shape === 'quarter' ? (270 - m.rot + 360) % 360 : m.shape === 'half' ? (360 - m.rot) % 360 : m.rot })
        }
      }
    } else {
      const motif = r.pick(['quarter', 'quarter', 'half'])
      const base = r.pick([0, 90])
      const twoTone = r.chance(0.5)
      for (let gy = 0; gy < 3; gy++) {
        grid.push([])
        for (let gx = 0; gx < 4; gx++) {
          const spin = base + 90 * ((gx % 2) + 2 * (gy % 2) * (gx % 2 ? -1 : 1))
          grid[gy].push({ shape: motif, rot: ((spin % 360) + 360) % 360, col: twoTone ? (gx + gy) % 2 : 0 })
        }
      }
    }
    grid.forEach((rowCells, gy) => rowCells.forEach(({ shape, rot, col: ci }, gx) => {
      const x = gx * cell
      const y = gy * cell
      const key = gx + '-' + gy
      const fill = c(ci)
      const tf = `rotate(${rot} ${x + cell / 2} ${y + cell / 2})`
      if (shape === 'square') shapes.push(<rect key={key} x={x} y={y} width={cell} height={cell} fill={fill} />)
      else if (shape === 'circle') shapes.push(<circle key={key} cx={x + cell / 2} cy={y + cell / 2} r={cell / 2} fill={fill} />)
      else if (shape === 'quarter') shapes.push(<path key={key} d={`M${x} ${y + cell} V${y} A${cell} ${cell} 0 0 1 ${x + cell} ${y + cell} Z`} fill={fill} transform={tf} />)
      else if (shape === 'half') shapes.push(<path key={key} d={`M${x} ${y + cell} A${cell / 2} ${cell / 2} 0 0 1 ${x + cell} ${y + cell} Z`} fill={fill} transform={tf} />)
    }))
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
    // a regular halftone grid: one size, two tones, a few missing
    const step = r.pick([36, 44, 56])
    const rad = step * r.range(0.3, 0.42)
    const two = [c(0), c(1)]
    for (let y = step / 2; y < H + step; y += step) for (let x = step / 2; x < W + step; x += step) {
      if (r.chance(0.12)) continue
      shapes.push(<circle key={x + '-' + y} cx={x + (Math.round(y / step) % 2 ? step / 2 : 0)} cy={y} r={rad} fill={two[(Math.round(x / step) + Math.round(y / step)) % 2 === 0 ? 0 : 1]} />)
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
