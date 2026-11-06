/** Scroll reveal. An IntersectionObserver marks blocks below the fold (data-rv=out) and flips them to `in` as they are scrolled to.
 *  It replaces CSS view() timelines, which ignore the editor's scaled stage and break under sticky ancestors.
 *  Self-contained on purpose: the export inlines `initReveal.toString()` as a script. */
export function initReveal(frame: Element | null): () => void {
  if (!frame || typeof IntersectionObserver === 'undefined') return () => {}
  const targets: Element[] = []
  frame.querySelectorAll('.d-sec:not([data-role=hero])>.d-inner>*').forEach((c) => {
    if (c.matches('.d-marquee')) return
    if (c.matches('.d-box[data-dir=row],.d-box[data-dir=grid]')) Array.prototype.forEach.call(c.children, (k: Element, i: number) => targets.push(Object.assign(k, { _rv: i })))
    else targets.push(Object.assign(c, { _rv: 0 }))
  })
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return
      e.target.setAttribute('data-rv', 'in')
      io.unobserve(e.target)
    })
  }, { rootMargin: '0px 0px -48px 0px' })
  targets.forEach((t) => {
    if (t.getAttribute('data-rv') === 'in') return
    t.setAttribute('data-rv', 'out')
    ;(t as HTMLElement).style.setProperty('--rv', String(Math.min((t as any)._rv, 5)))
    io.observe(t)
  })
  frame.setAttribute('data-reveal', 'on')
  return () => io.disconnect()
}

export const revealScript = () => `<script>var __name=function(f){return f};(${initReveal.toString()})(document.querySelector('.d-frame'))</script>`
