// Optional: the browser calls the Anthropic API directly with the user's own key.
import { MOOD_NAMES } from './gen/moods'
import type { Kind } from './types'

export const MODELS = [
  { id: 'claude-sonnet-5-5', label: 'Sonnet 5.5 (balanced)' },
  { id: 'claude-haiku-5-5', label: 'Haiku 5.5 (fast, cheap)' },
  { id: 'claude-opus-5-5', label: 'Opus 5.5 (best copy)' },
]

async function call(key: string, model: string, system: string, user: string, maxTokens = 2000): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
  })
  if (!res.ok) {
    let msg = res.statusText
    try { msg = (await res.json()).error?.message ?? msg } catch { /* ignore */ }
    throw new Error(`Anthropic API ${res.status}: ${msg}`)
  }
  const data = await res.json()
  return (data.content ?? []).map((b: any) => b.text ?? '').join('')
}

function parseJson(text: string): any {
  const a = text.indexOf('{')
  const b = text.lastIndexOf('}')
  const arr = text.indexOf('[')
  const start = arr >= 0 && (a < 0 || arr < a) ? arr : a
  const end = start === arr ? text.lastIndexOf(']') : b
  if (start < 0 || end < 0) throw new Error('The model did not return JSON')
  return JSON.parse(text.slice(start, end + 1))
}

const STYLE = `Write specific, concrete, human copy. Name real-feeling details (numbers, places, materials). Never use: "unlock", "power of", "seamless", "supercharge", "elevate", "revolutionize", "all-in-one", "next level", emoji. Short sentences. No exclamation marks.`

export interface AiBrief { mood?: string; siteKind?: string; override: Record<string, any> }

/** Brief stage: the only stage that touches an LLM. Returns copy + a mood; design decisions stay algorithmic. */
export async function aiBrief(key: string, model: string, text: string, kind: Kind): Promise<AiBrief> {
  const shape = kind === 'marketing'
    ? `{"mood": one of ${MOOD_NAMES.join('|')}, "name": string, "eyebrow": string, "headline": string (max 70 chars), "short": string (2-3 words, poster headline), "sub": string (max 200 chars), "cta": string (max 20 chars), "ctaAlt": string, "nav": string[4], "features": [{"title": string, "body": string}] x6, "stats": [{"value": string, "label": string}] x4, "quotes": [{"text": string, "who": string}] x3, "closing": string, "closingSub": string, "marquee": string[4]}`
    : `{"mood": one of ${MOOD_NAMES.join('|')}, "name": string, "title": string, "sub": string, "primary": string (button), "nav": string[5], "user": string, "kpis": [{"value": string, "label": string}] x4}`
  const out = await call(key, model, `You are a copywriter and art director's assistant. ${STYLE} Reply with JSON only, matching exactly: ${shape}`, `Kind: ${kind}.\nBrief: ${text || 'Surprise me with a specific, believable small business.'}`, 2500)
  const j = parseJson(out)
  const { mood, ...override } = j
  return { mood: MOOD_NAMES.includes(mood) ? mood : undefined, override }
}

export interface TextItem { id: string; prop: string; text: string }

/** Rewrite the copy of a section in place. Structure and count of strings are preserved. */
export async function aiRewrite(key: string, model: string, items: TextItem[], instruction: string, context: string): Promise<TextItem[]> {
  const out = await call(
    key, model,
    `You rewrite website copy. ${STYLE} You receive a JSON array of {id, prop, text}. Return a JSON array with the same ids and props and new text. Keep each string about the same length (+/- 30%). Return JSON only.`,
    `Site: ${context}\nInstruction: ${instruction}\n\n${JSON.stringify(items)}`,
    3000,
  )
  const j = parseJson(out)
  if (!Array.isArray(j)) throw new Error('Unexpected response shape')
  const byKey = new Map(items.map((i) => [i.id + ':' + i.prop, i]))
  return j.filter((r: TextItem) => byKey.has(r.id + ':' + r.prop) && typeof r.text === 'string')
}
