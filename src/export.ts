import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { fontSpec, fontsUrl } from './gen/fonts'
import { DOC_CSS } from './render/css'
import { DocView } from './render/Doc'
import type { Doc } from './types'

/** Standalone HTML: the same React components, the same stylesheet, rendered to a string. */
export function exportHtml(doc: Doc, wire = false): string {
  const body = renderToStaticMarkup(createElement(DocView, { root: doc.root, tokens: doc.tokens, wire }))
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${doc.meta.name.replace(/</g, '&lt;')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fontsUrl(fontSpec(doc.tokens))}">
<style>
html,body{margin:0;background:${doc.tokens.palette.bg}}
${DOC_CSS}
</style>
</head>
<body>
${body}
</body>
</html>
`
}

export function download(name: string, text: string, mime = 'text/html') {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: mime + ';charset=utf-8' }))
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text) } catch {
    const t = document.createElement('textarea')
    t.value = text
    document.body.appendChild(t)
    t.select()
    document.execCommand('copy')
    t.remove()
  }
}

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'design'
