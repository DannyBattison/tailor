export function download(name: string, text: string, mime: string) {
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
