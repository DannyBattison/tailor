#!/usr/bin/env node
// MCP server (stdio): generate, load, re-roll and critique Tailor themes.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { MOODS, PARTS, generateTheme, rerollTheme, type Theme } from '../api'

const server = new McpServer({ name: 'tailor', version: '0.1.0' })

const seedCode = z.string().describe('Seed code: nine words, e.g. "acorn-brook-cedar-..."')
const format = z.enum(['json', 'prompt']).default('json').describe('json = structured design system; prompt = the same as agent-ready text')
const reply = (t: Theme, f: 'json' | 'prompt') => ({
  content: [{ type: 'text' as const, text: f === 'prompt' ? `Seed: ${t.seed}\n\n${t.prompt}` : JSON.stringify({ seed: t.seed, issues: t.issues, designSystem: t.designSystem }, null, 2) }],
})
const guard = <A>(fn: (a: A) => ReturnType<typeof reply>) => (a: A) => {
  try { return fn(a) } catch (e) { return { content: [{ type: 'text' as const, text: (e as Error).message }], isError: true } }
}

server.registerTool('generate_theme', {
  description: 'Generate a distinctive, non-generic design system (palette, fonts, shape, motion, layout recipes) from a seed. Same seed, same theme. Returns a seed code that recreates it.',
  inputSchema: {
    seed: z.number().int().optional().describe('Any integer; omit for a random theme'),
    kind: z.enum(['marketing', 'app']).default('marketing'),
    mood: z.enum(MOODS as [string, ...string[]]).optional().describe('Omit to pick from the seed'),
    mode: z.enum(['light', 'dark']).optional(),
    bgBold: z.number().min(0).max(1).optional().describe('Background boldness, 0 quiet to 1 loud'),
    format,
  },
}, guard(({ format: f, ...o }) => reply(generateTheme(o), f)))

server.registerTool('load_theme', {
  description: 'Recreate a theme exactly from its seed code.',
  inputSchema: { seed: seedCode, format },
}, guard(({ seed, format: f }) => reply(generateTheme({ seed }), f)))

server.registerTool('reroll_theme_part', {
  description: 'Re-roll one part of a theme (palette, fonts, shape, layout, text, backdrops, or ambient/entrance/interaction/nav motion), keeping the rest. Returns a new seed code.',
  inputSchema: { seed: seedCode, part: z.enum(PARTS as unknown as [string, ...string[]]), format },
}, guard(({ seed, part, format: f }) => reply(rerollTheme(seed, part as (typeof PARTS)[number]), f)))

server.registerTool('critique_theme', {
  description: 'List the usability and taste problems (contrast, banned fonts, touch targets, motion clashes) a theme has.',
  inputSchema: { seed: seedCode },
}, guard(({ seed }) => {
  const t = generateTheme({ seed })
  return { content: [{ type: 'text' as const, text: t.issues.length ? JSON.stringify(t.issues, null, 2) : 'No issues.' }] }
}))

await server.connect(new StdioServerTransport())
