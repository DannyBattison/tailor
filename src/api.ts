// Headless entry point: the theme generator without any preview or editor UI. Pure functions, no DOM or React.
import { codeProblem, designCode, fromCode } from './gen/code'
import { critique, type Issue } from './gen/critique'
import { generate } from './gen/generate'
import { MOOD_NAMES } from './gen/moods'
import * as RR from './gen/reroll'
import { designSystem, designSystemPrompt } from './designSystem'
import type { Doc, Kind } from './types'

export type { Issue }
export type Part = 'palette' | 'fonts' | 'shape' | 'layout' | 'text' | 'backdrops' | 'ambient' | 'entrance' | 'interaction' | 'nav'
export const PARTS: readonly Part[] = ['palette', 'fonts', 'shape', 'layout', 'text', 'backdrops', 'ambient', 'entrance', 'interaction', 'nav']
export const MOODS: readonly string[] = MOOD_NAMES

export interface ThemeOptions {
  /** a number, or a seed code (nine words) to recreate a design; omitted = random */
  seed?: number | string
  kind?: Kind
  mood?: string
  mode?: 'light' | 'dark'
  /** background boldness, 0 (quiet) to 1 */
  bgBold?: number
}

export interface Theme {
  /** the seed code: nine words that recreate this design exactly */
  seed: string
  name: string
  kind: Kind
  mood: string
  archetype: string
  /** the design system handover (colours, type, shape, motion, components, page recipes) */
  designSystem: ReturnType<typeof designSystem>
  /** the same handover as a prompt for an AI agent */
  prompt: string
  /** usability and taste checks: fails and warnings only */
  issues: Issue[]
}

const random = () => Math.floor(Math.random() * 2 ** 31)

function toTheme(doc: Doc): Theme {
  return {
    seed: designCode(doc), name: doc.meta.name, kind: doc.meta.kind, mood: doc.meta.mood, archetype: doc.meta.archetype,
    designSystem: designSystem(doc), prompt: designSystemPrompt(doc), issues: critique(doc).filter((i) => i.level !== 'pass'),
  }
}

function docFor(o: ThemeOptions): Doc {
  if (o.mood && !MOOD_NAMES.includes(o.mood)) throw new Error(`Unknown mood "${o.mood}". Moods: ${MOOD_NAMES.join(', ')}`)
  if (typeof o.seed === 'string') {
    const doc = fromCode(o.seed)
    if (!doc) throw new Error(codeProblem(o.seed))
    return doc
  }
  return generate({ seed: o.seed ?? random(), kind: o.kind ?? 'marketing', mood: o.mood ?? '', mode: o.mode, bgBold: o.bgBold })
}

/** Generate a theme: random, from a number, or recreated from a seed code. The same seed always gives the same theme. */
export const generateTheme = (o: ThemeOptions = {}): Theme => toTheme(docFor(o))

/** Re-roll one part of a design (identified by its seed code) and keep everything else. */
export function rerollTheme(seed: string, part: Part, n: number = random()): Theme {
  const doc = fromCode(seed)
  if (!doc) throw new Error(codeProblem(seed))
  const next =
    part === 'layout' ? RR.rerollLayout(doc, n) : part === 'text' ? RR.rerollText(doc, n) : part === 'backdrops' ? RR.rerollBackdrops(doc, n)
    : part === 'palette' || part === 'fonts' || part === 'shape' ? RR.rerollToken(doc, part, n) : RR.rerollMotion(doc, part, n)
  return toTheme(next)
}
