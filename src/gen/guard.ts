import type { Doc } from '../types'

export interface Sig { archetype: string; fontId: string; hueBucket: number }
const KEY = 'hm.sigs'
export const GUARD_N = 6

export const sigOf = (d: Pick<Doc, 'tokens' | 'meta'>): Sig => ({
  archetype: d.meta.archetype,
  fontId: d.tokens.fontId,
  hueBucket: Math.round(d.tokens.hue / 30) % 12,
})

export function tooClose(s: Sig, history: Sig[]): boolean {
  return history.some((h) => {
    const hueNear = Math.min(Math.abs(h.hueBucket - s.hueBucket), 12 - Math.abs(h.hueBucket - s.hueBucket)) <= 0
    const score = Number(h.archetype === s.archetype) + Number(h.fontId === s.fontId) + Number(hueNear)
    return score >= 2
  })
}

export function loadSigs(): Sig[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}
export function pushSig(s: Sig, extra: Sig[] = []) {
  try {
    const next = [...loadSigs(), s].slice(-GUARD_N)
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch { /* ignore */ }
  void extra
}
