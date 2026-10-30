// Seeded RNG (mulberry32) so a seed reproduces a design.
export type Rng = ReturnType<typeof makeRng>

export function hashStr(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function makeRng(seed: number | string) {
  const next = mulberry32(typeof seed === 'string' ? hashStr(seed) : seed)
  const api = {
    next,
    range: (min: number, max: number) => min + next() * (max - min),
    int: (min: number, max: number) => Math.floor(min + next() * (max - min + 1)),
    chance: (p: number) => next() < p,
    pick<T>(arr: readonly T[]): T {
      return arr[Math.floor(next() * arr.length)]
    },
    weighted<T>(items: readonly (readonly [T, number])[]): T {
      const total = items.reduce((s, [, w]) => s + w, 0)
      let r = next() * total
      for (const [v, w] of items) {
        r -= w
        if (r <= 0) return v
      }
      return items[items.length - 1][0]
    },
    shuffle<T>(arr: readonly T[]): T[] {
      const a = arr.slice()
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    },
    /** derive an independent stream for a named stage */
    fork: (label: string) => makeRng(hashStr(label) ^ Math.floor(next() * 4294967296)),
  }
  return api
}

/** Independent stream for (seed, stage) — stages never disturb each other. */
export function stageRng(seed: number, stage: string) {
  return makeRng((hashStr(stage) ^ Math.imul(seed >>> 0, 2654435761)) >>> 0)
}
