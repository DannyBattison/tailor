import { fontSpec, fontStacks } from '../gen/fonts'
import type { Tokens } from '../types'

/** Token → CSS custom properties (set inline on the doc root, so many docs can coexist). */
/** Fluid size for scale step n: clamp(min, a + b·cqw, max). Reaches `max` at a 1280px container and `min` at 390px. */
const CAP: Record<number, number> = { 1: 22, 2: 28, 3: 40, 4: 64, 5: 84, 6: 168 }
export function typeStep(t: Tokens, n: number) {
  const max = Math.min(17 * t.scale ** n, CAP[n] ?? 999)
  const min = n <= 0 ? max : Math.max(15, max * 0.5)
  const b = (max - min) / 8.9
  const a = min - 3.9 * b
  return { min, max, css: n <= 0 ? `${Math.max(13, max).toFixed(1)}px` : `clamp(${min.toFixed(1)}px, ${a.toFixed(1)}px + ${b.toFixed(2)}cqw, ${max.toFixed(1)}px)` }
}

const MOTION = {
  smooth: { ease: 'cubic-bezier(.22,1,.36,1)', dur: '.5s', lift: 4 },
  snappy: { ease: 'cubic-bezier(.3,0,0,1)', dur: '.16s', lift: 2 },
  springy: { ease: 'cubic-bezier(.34,1.56,.64,1)', dur: '.55s', lift: 6 },
}

export function tokenVars(t: Tokens): Record<string, string> {
  const spec = fontSpec(t)
  const f = fontStacks(spec)
  const p = t.palette
  const step = (n: number) => typeStep(t, n).css
  const shadow = t.shadow === 'hard' ? `${Math.max(4, t.border * 2.5)}px ${Math.max(4, t.border * 2.5)}px 0 var(--ink)` : t.shadow === 'soft' ? '0 10px 30px -10px color-mix(in oklab, var(--ink) 35%, transparent)' : 'none'
  const m = MOTION[t.motion ?? 'smooth']
  const hard = t.shadow === 'hard'
  const off = Math.max(4, t.border * 2.5)
  return {
    '--ease': m.ease, '--dur': m.dur,
    // hover lift: hard shadows move the element up-left while the shadow grows; others float up
    '--lift': hard ? '-3px -3px' : `0 -${m.lift}px`,
    '--shadow-h': hard ? `${off + 3}px ${off + 3}px 0 var(--ink)` : t.shadow === 'soft' ? '0 18px 38px -12px color-mix(in oklab, var(--ink) 42%, transparent)' : '0 16px 30px -16px color-mix(in oklab, var(--ink) 30%, transparent)',
    '--shadow-float': hard ? `${off}px ${off}px 0 var(--ink)` : '0 34px 60px -28px color-mix(in oklab, var(--ink) 55%, transparent)',
    '--press': hard ? `${off - 1}px ${off - 1}px` : '0 1px',
    '--press-shadow': hard ? '0 0 0 var(--ink)' : shadow,
    '--bg': p.bg, '--surface': p.surface, '--ink': p.ink, '--muted': p.muted, '--line': p.line,
    '--accent': p.accent, '--accent2': p.accent2, '--on-accent': p.onAccent, '--accent-text': p.accentText,
    '--inverse': p.inverse, '--on-inverse': p.onInverse,
    '--f-display': f.display, '--f-body': f.body, '--f-mono': f.mono,
    '--w-display': String(spec.heading.weight),
    '--radius': `${t.radius}px`, '--radius-l': `${Math.min(t.radius, 22)}px`, '--bw': `${t.border}px`, '--shadow': shadow,
    '--d': String(t.density), '--track': `${t.tracking}em`, '--case': t.headingCase === 'none' ? 'none' : t.headingCase,
    '--fs-s': `calc(${step(0)} * 0.85)`, '--fs-m': step(0), '--fs-l': step(1), '--fs-3': step(2), '--fs-2': step(3),
    '--fs-1': step(4), '--fs-xxl': step(6),
    '--space': `calc(${(16 * t.density).toFixed(2)}px + 0.6cqw)`,
  }
}

const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>")`

/** One stylesheet, used by both the editor canvas and standalone export. */
export const DOC_CSS = `
.d-frame{container-type:inline-size;container-name:doc;width:100%}
.d-doc{background:var(--bg);color:var(--ink);font-family:var(--f-body);font-size:var(--fs-m);line-height:1.55;position:relative;overflow:hidden;overflow:clip;min-height:100%}
.d-doc *,.d-doc *::before,.d-doc *::after{box-sizing:border-box}
.d-doc h1,.d-doc h2,.d-doc h3,.d-doc p,.d-doc ul,.d-doc ol,.d-doc figure{margin:0}
.d-doc a{color:inherit;text-decoration:none}
.d-h{font-family:var(--f-display);font-weight:var(--w-display);letter-spacing:var(--track);text-transform:var(--case);line-height:1.04;text-wrap:balance}
.d-h[data-size=xxl]{font-size:var(--fs-xxl);line-height:.98}
.d-h[data-size=xl]{font-size:var(--fs-1)}
.d-h[data-size=l]{font-size:var(--fs-2)}
.d-h[data-size=m]{font-size:var(--fs-3)}
.d-h[data-size=s]{font-size:var(--fs-l);line-height:1.15}
.d-text{max-width:var(--maxw,62ch);text-wrap:pretty}
.d-text[data-size=s]{font-size:var(--fs-s)}
.d-text[data-size=l]{font-size:var(--fs-l);line-height:1.4}
.d-text[data-muted=true]{color:var(--muted)}
.d-sec{position:relative;padding-block:calc(var(--space) * var(--pad,3));padding-inline:calc(var(--space) * 1.2)}
.d-sec[data-bg=surface]{background:var(--surface)}
.d-sec[data-bg=accent]{background:var(--accent);color:var(--on-accent);--muted:color-mix(in oklab,var(--on-accent) 75%,transparent);--ink:var(--on-accent);--line:color-mix(in oklab,var(--on-accent) 35%,transparent)}
.d-sec[data-bg=inverse]{background:var(--inverse);color:var(--on-inverse);--muted:color-mix(in oklab,var(--on-inverse) 70%,transparent);--ink:var(--on-inverse);--line:color-mix(in oklab,var(--on-inverse) 28%,transparent);--accent-text:var(--accent)}
.d-sec[data-pad=none]{padding-block:0}
.d-sec>.d-inner{max-width:var(--sw,1180px);margin-inline:auto;display:flex;flex-direction:column;gap:calc(var(--space) * var(--gap,1.2))}
.d-sec[data-width=full]>.d-inner{max-width:none}
.d-sec[data-align=center]>.d-inner{align-items:center;text-align:center}
.d-sec[data-align=end]>.d-inner{align-items:flex-end;text-align:right}
.d-box{display:flex;flex-direction:column;gap:calc(var(--space) * var(--gap,1));min-width:0}
.d-box[data-dir=row],.d-box[data-dir=grid]{display:grid;grid-template-columns:var(--tpl,repeat(auto-fit,minmax(0,1fr)));align-items:var(--ai,start)}
.d-box[data-dir=col][data-align=center]{align-items:center;text-align:center}
.d-box[data-dir=col][data-align=end]{align-items:flex-end;text-align:right}
.d-box[data-justify=center]{justify-content:center}
.d-box[data-justify=between]{justify-content:space-between}
.d-box[data-pad]{padding:calc(var(--space) * var(--bpad,1))}
.d-box[data-bg=surface]{background:var(--surface)}
.d-box[data-bg=accent]{background:var(--accent);color:var(--on-accent);--ink:var(--on-accent);--muted:color-mix(in oklab,var(--on-accent) 75%,transparent)}
.d-box[data-bg=inverse]{background:var(--inverse);color:var(--on-inverse);--ink:var(--on-inverse);--muted:color-mix(in oklab,var(--on-inverse) 70%,transparent)}
.d-box[data-variant=card]{border:var(--bw) solid var(--ink);border-radius:var(--radius-l);box-shadow:var(--shadow);background-color:var(--surface)}
.d-box[data-variant=card][data-bg=accent]{background:var(--accent)}
.d-box[data-variant=card][data-bg=inverse]{background:var(--inverse)}
.d-box[data-variant=outline]{border:max(1px,var(--bw)) solid var(--line);border-radius:var(--radius-l)}
.d-box[data-variant=rule-top]{border-top:max(1px,var(--bw)) solid var(--ink);padding-top:calc(var(--space) * .6)}
.d-box[data-variant=rule-left]{border-left:max(1px,var(--bw)) solid var(--ink);padding-left:calc(var(--space) * .8)}
.d-box[data-sticky=true]{position:sticky;top:var(--stick,0px);align-self:start}
.d-doc:has(>.d-nav[data-variant=bar]){--stick:calc(var(--space) * 1.6 + max(var(--fs-l) * 1.55,46px) + 14px)}
.d-doc:has(>.d-nav[data-variant=centered]){--stick:calc(var(--space) * 2.8 + max(var(--fs-l) * 1.55,30px) + var(--fs-m) * 1.6 + 14px)}
.d-box[data-full=true]{min-height:100cqh}
.d-btn{display:inline-flex;align-items:center;gap:.5em;font:inherit;font-weight:600;font-size:var(--fs-m);padding:calc(.7em * var(--d)) calc(1.3em * var(--d));border-radius:var(--radius);border:max(1.5px,var(--bw)) solid var(--ink);background:var(--accent);color:var(--on-accent);box-shadow:var(--shadow);cursor:pointer;white-space:nowrap;line-height:1.1}
.d-btn[data-variant=outline]{background:transparent;color:var(--ink);box-shadow:none}
.d-btn[data-variant=ink]{background:var(--ink);color:var(--bg)}
.d-btn[data-variant=ghost]{background:transparent;color:var(--ink);border-color:transparent;box-shadow:none;padding-inline:0;text-decoration:underline;text-underline-offset:.25em;text-decoration-thickness:1.5px}
.d-btn[data-size=s]{font-size:var(--fs-s)}
.d-btn[data-size=l]{font-size:var(--fs-l)}
.d-img{position:relative;overflow:hidden;border-radius:var(--radius-l);border:var(--bw) solid var(--ink);background:var(--surface);width:100%;aspect-ratio:var(--ratio,4/3)}
.d-img[data-shape=arch]{border-radius:999px 999px var(--radius-l) var(--radius-l)}
.d-img[data-shape=pill]{border-radius:999px;aspect-ratio:3/1}
.d-img[data-shape=circle]{border-radius:50%}
.d-img img.d-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.d-img .d-art{position:absolute;inset:0;width:100%;height:100%;display:block}
.d-img figcaption{position:absolute;left:8px;bottom:8px;background:var(--bg);color:var(--ink);font:var(--fs-s)/1.2 var(--f-mono);padding:3px 7px;border-radius:calc(var(--radius) / 2)}
.d-nav{display:flex;align-items:center;justify-content:space-between;gap:calc(var(--space) * 1.2);padding:calc(var(--space) * .8) max(calc(var(--space) * 1.2),calc((100cqw - var(--sw,1180px)) / 2));flex-wrap:wrap}
.d-nav[data-border=true]{border-bottom:max(1px,var(--bw)) solid var(--ink)}
.d-nav-brand{font-family:var(--f-display);font-weight:var(--w-display);font-size:var(--fs-l);letter-spacing:var(--track);text-transform:var(--case)}
.d-nav-links{display:flex;gap:calc(var(--space) * 1.1);list-style:none;margin:0;padding:0;font-size:var(--fs-m);flex-wrap:wrap}
.d-nav[data-variant=centered]{flex-direction:column;text-align:center}
.d-nav[data-variant=stacked]{flex-direction:column;align-items:flex-start;gap:calc(var(--space) * 1.6)}
.d-nav[data-variant=stacked] .d-nav-links{flex-direction:column;gap:.7em;font-size:var(--fs-m)}
.d-tag{display:inline-block;align-self:flex-start;justify-self:start;font:600 var(--fs-s)/1 var(--f-mono);text-transform:uppercase;letter-spacing:.08em;padding:.45em .8em;border:max(1px,var(--bw)) solid var(--ink);border-radius:calc(var(--radius) * .6);background:var(--accent2);color:var(--ink)}
.d-box[data-align=center]>.d-tag,.d-sec[data-align=center]>.d-inner>.d-tag{align-self:center;justify-self:center}
.d-tag[data-variant=solid]{background:var(--ink);color:var(--bg)}
.d-tag[data-variant=plain]{background:transparent;border-color:var(--line)}
.d-tag[data-variant=accent]{background:var(--accent);color:var(--on-accent)}
.d-stat{display:flex;flex-direction:column;gap:.15em}
.d-stat-v{font-family:var(--f-display);font-weight:var(--w-display);font-size:var(--fs-2);line-height:1;letter-spacing:var(--track)}
.d-stat[data-size=l] .d-stat-v{font-size:var(--fs-1)}
.d-stat[data-size=s] .d-stat-v{font-size:var(--fs-3)}
.d-stat-l{font-size:var(--fs-s);color:var(--muted)}
.d-table{width:100%;border-collapse:collapse;font-size:var(--fs-s)}
.d-table th{text-align:left;font:600 var(--fs-s)/1.2 var(--f-mono);text-transform:uppercase;letter-spacing:.06em;color:var(--muted);padding:.7em .8em;border-bottom:max(1.5px,var(--bw)) solid var(--ink)}
.d-table td{padding:calc(.75em * var(--d)) .8em;border-bottom:1px solid var(--line)}
.d-table[data-zebra=true] tbody tr:nth-child(even){background:var(--surface)}
.d-list{list-style:none;padding:0;display:flex;flex-direction:column}
.d-list li{display:flex;gap:1em;justify-content:space-between;align-items:baseline;padding-block:calc(.8em * var(--d))}
.d-list[data-variant=ruled] li,.d-list[data-variant=index] li{border-top:max(1px,var(--bw)) solid var(--ink)}
.d-list[data-variant=ruled] li:last-child,.d-list[data-variant=index] li:last-child{border-bottom:max(1px,var(--bw)) solid var(--ink)}
.d-list[data-variant=index] li{font-family:var(--f-display);font-size:var(--fs-l);font-weight:var(--w-display);letter-spacing:var(--track)}
.d-list[data-variant=index] .d-li-meta{font:400 var(--fs-s) var(--f-mono);color:var(--muted)}
.d-list[data-variant=bullets] li{display:list-item;list-style:square;margin-left:1.2em;padding-block:.25em}
.d-list[data-variant=bullets] .d-li-meta{display:none}
.d-list[data-variant=numbered]{counter-reset:li}
.d-list[data-variant=numbered] li{counter-increment:li;justify-content:flex-start;border-top:1px solid var(--line)}
.d-list[data-variant=numbered] li::before{content:counter(li,decimal-leading-zero);font:600 var(--fs-s) var(--f-mono);color:var(--accent-text)}
.d-list[data-variant=numbered] .d-li-meta{margin-left:auto;color:var(--muted);font-size:var(--fs-s)}
.d-li-title{font-weight:600}
.d-div{border:0;border-top:1px solid var(--ink);margin:0;width:100%}
.d-div[data-variant=heavy]{border-top-width:max(3px,calc(var(--bw) * 2))}
.d-div[data-variant=dotted]{border-top-style:dotted;border-top-width:3px}
.d-div[data-variant=thin]{border-top-color:var(--line)}
.d-field{display:flex;flex-direction:column;gap:.35em;font-size:var(--fs-s)}
.d-field label{font:600 var(--fs-s)/1.2 var(--f-mono);text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.d-field .d-control{padding:calc(.7em * var(--d)) .9em;border:max(1px,var(--bw)) solid var(--ink);border-radius:var(--radius-l);background:var(--bg);color:var(--muted);font-size:var(--fs-m);min-height:2.6em}
.d-sec[data-bg=inverse] .d-control,.d-sec[data-bg=accent] .d-control,.d-box[data-bg=inverse] .d-control{background:transparent;color:var(--muted)}
.d-field .d-toggle{width:3.2em;height:1.7em;border:max(1px,var(--bw)) solid var(--ink);border-radius:999px;background:var(--surface);position:relative}
.d-field .d-toggle::after{content:'';position:absolute;top:.15em;left:.2em;width:1.1em;height:1.1em;border-radius:50%;background:var(--ink)}
.d-field .d-toggle[data-on=true]{background:var(--accent)}
.d-field .d-toggle[data-on=true]::after{left:auto;right:.2em;background:var(--on-accent)}
.d-marquee{overflow:hidden;white-space:nowrap;border-block:max(1.5px,var(--bw)) solid var(--ink);background:var(--accent);color:var(--on-accent);font-family:var(--f-display);font-weight:var(--w-display);font-size:var(--fs-2);text-transform:var(--case);padding-block:.3em;margin-inline:calc(var(--space) * -1.2)}
.d-marquee[data-bg=ink]{background:var(--ink);color:var(--bg)}
.d-marquee[data-bg=accent2]{background:var(--accent2);color:var(--ink)}
.d-marquee-track{display:inline-flex;gap:1.5em;padding-right:1.5em;animation:d-slide 28s linear infinite}
.d-marquee-track span::after{content:'\\2726';margin-left:1.5em;font-family:sans-serif}
@keyframes d-slide{to{transform:translateX(-50%)}}
.d-sec>.d-inner>.d-marquee,.d-sec .d-marquee{margin-inline:calc(var(--space) * -1.2)}
.d-quote{display:flex;flex-direction:column;gap:.8em;margin:0}
.d-quote blockquote{margin:0;font-family:var(--f-display);font-weight:var(--w-display);font-size:var(--fs-2);line-height:1.15;letter-spacing:var(--track);text-wrap:balance}
.d-quote[data-size=s] blockquote{font-size:var(--fs-l);font-family:var(--f-body);font-weight:500}
.d-quote[data-size=xl] blockquote{font-size:var(--fs-1)}
.d-quote cite{font:var(--fs-s) var(--f-mono);font-style:normal;color:var(--muted)}
.d-quote[data-mark=true] blockquote::before{content:'\\201C';display:block;font-size:2em;line-height:.6;color:var(--accent-text)}
/* backdrops: quiet texture and colour fields behind heroes and components (all palette-driven) */
[data-backdrop]{position:relative;--bd-s:1}
.d-sec[data-backdrop],.d-box[data-backdrop]{overflow:hidden;overflow:clip}
.d-sec[data-backdrop]>.d-inner{position:relative;z-index:1}
.d-box[data-backdrop]>*:not(.d-bd){position:relative;z-index:1}
[data-backdrop=grid]::before{content:'';position:absolute;inset:-44px;pointer-events:none;z-index:0;background-image:linear-gradient(color-mix(in oklab,var(--ink) calc(var(--bd-s) * 7%),transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in oklab,var(--ink) calc(var(--bd-s) * 7%),transparent) 1px,transparent 1px);background-size:44px 44px;background-position:43px 43px;animation:d-pan-grid 40s linear infinite}
[data-backdrop=dots]::before{content:'';position:absolute;inset:-20px;pointer-events:none;z-index:0;background-image:radial-gradient(color-mix(in oklab,var(--ink) calc(var(--bd-s) * 16%),transparent) 1.4px,transparent 1.7px);background-size:20px 20px;animation:d-pan-dots 24s linear infinite}
[data-backdrop=hatch]{background-image:repeating-linear-gradient(135deg,transparent 0 9px,color-mix(in oklab,var(--ink) calc(var(--bd-s) * 6%),transparent) 9px 10px)}
[data-backdrop=split]{background-image:linear-gradient(to right,color-mix(in oklab,var(--accent2) calc(var(--bd-s) * 55%),transparent) 0 34%,transparent 34%)}
[data-backdrop=split][data-bdside=right]{background-image:linear-gradient(to left,color-mix(in oklab,var(--accent2) calc(var(--bd-s) * 55%),transparent) 0 34%,transparent 34%)}
[data-backdrop=noise]{background-image:${GRAIN};background-blend-mode:multiply}
.d-bd{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;opacity:calc(var(--bd-s) * .14)}
.d-bd .d-art,.d-bd img{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover}
.d-bd[data-kind=photo]{opacity:1}
.d-bd[data-kind=photo]::after{content:'';position:absolute;inset:0;background:color-mix(in oklab,var(--scrim,var(--bg)) calc(100% - var(--bd-s) * 12%),transparent)}
.d-sec[data-bg=inverse]{--scrim:var(--inverse)}
.d-sec[data-bg=accent]{--scrim:var(--accent)}
.d-sec[data-bg=surface]{--scrim:var(--surface)}
.d-frame.wire [data-backdrop]{background-image:none !important}
.d-frame.wire [data-backdrop]::before,.d-frame.wire [data-backdrop]::after{display:none}
.d-frame.wire .d-bd{display:none}
/* signatures */
.d-doc[data-sig=hardShadow]{--shadow:6px 6px 0 var(--ink)}
.d-doc[data-sig=oversized] .d-h[data-size=xl]{font-size:calc(var(--fs-1) * 1.22);line-height:.95}
.d-doc[data-sig=oversized] .d-h[data-size=xxl]{font-size:calc(var(--fs-xxl) * 1.12)}
.d-doc[data-sig=ruled] .d-sec{border-top:max(3px,calc(var(--bw) * 2)) solid var(--ink)}
.d-doc[data-sig=ruled] .d-sec:first-child{border-top:0}
.d-doc[data-sig=ruled] .d-h{border-bottom:max(2px,var(--bw)) solid var(--ink);padding-bottom:.15em}
.d-doc[data-sig=grain]::after{content:'';position:absolute;inset:0;background-image:${GRAIN};opacity:.22;pointer-events:none;mix-blend-mode:multiply;z-index:5}
.d-doc[data-sig=tilted] .d-tag{transform:rotate(-2deg)}
/* more of a site: logo strip, FAQ, framed screenshots, icon tiles, footer links */
.d-logos{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:calc(var(--space) * .7) calc(var(--space) * 1.8);width:100%;color:var(--ink)}
.d-logos li{display:inline-flex;align-items:center;gap:.5em;font-family:var(--f-display);font-weight:var(--w-display);font-size:var(--fs-l);letter-spacing:var(--track);line-height:1;opacity:.5;transition:opacity .3s,translate .4s var(--ease)}
.d-logos li::before{content:'';width:.85em;height:.85em;background:currentColor;flex:none}
.d-logos li:nth-child(6n+1)::before{border-radius:50%}
.d-logos li:nth-child(6n+2)::before{rotate:45deg;scale:.78}
.d-logos li:nth-child(6n+3)::before{border-radius:50% 50% 0 0}
.d-logos li:nth-child(6n+4)::before{clip-path:polygon(50% 0,100% 100%,0 100%)}
.d-logos li:nth-child(6n+5)::before{border-radius:0 60% 0 60%}
.d-logos li:nth-child(6n)::before{background:none;border:.22em solid currentColor;border-radius:50%}
.d-logos li:nth-child(3n+2){font-family:var(--f-body);font-weight:800;text-transform:uppercase;letter-spacing:.1em;font-size:var(--fs-m)}
.d-logos li:nth-child(3n){font-style:italic}
.d-logos li:hover{opacity:1;translate:0 -2px}
.d-faq{display:flex;flex-direction:column;border-top:max(1px,var(--bw)) solid var(--ink);width:100%;interpolate-size:allow-keywords}
.d-faq details{border-bottom:max(1px,var(--bw)) solid var(--ink)}
.d-faq summary{display:flex;align-items:center;justify-content:space-between;gap:1.2em;cursor:pointer;list-style:none;padding-block:calc(1em * var(--d));font-family:var(--f-display);font-weight:var(--w-display);font-size:var(--fs-l);letter-spacing:var(--track);line-height:1.2;transition:color .25s}
.d-faq summary::-webkit-details-marker{display:none}
.d-faq summary::after{content:'';flex:none;width:.9em;height:.9em;background:linear-gradient(currentColor,currentColor) center/100% 2px no-repeat,linear-gradient(currentColor,currentColor) center/2px 100% no-repeat;transition:rotate var(--dur) var(--ease)}
.d-faq details[open] summary::after{rotate:135deg}
.d-faq summary:hover{color:var(--accent-text)}
.d-faq-a{padding-bottom:calc(1.1em * var(--d));color:var(--muted);max-width:62ch;text-wrap:pretty}
@supports selector(::details-content){
  .d-faq details::details-content{block-size:0;opacity:0;overflow:clip;transition:block-size var(--dur) var(--ease),opacity var(--dur) var(--ease),content-visibility var(--dur) allow-discrete}
  .d-faq details[open]::details-content{block-size:auto;opacity:1}
}
.d-img[data-frame=browser]{border-radius:var(--radius-l);box-shadow:var(--shadow-float)}
.d-img[data-frame=browser]::before{content:'';position:absolute;z-index:2;left:0;right:0;top:0;height:2.1em;background:radial-gradient(circle at 1.1em 50%,var(--ink) .22em,transparent .25em),radial-gradient(circle at 2em 50%,var(--ink) .22em,transparent .25em),radial-gradient(circle at 2.9em 50%,var(--ink) .22em,transparent .25em),var(--surface);border-bottom:max(1px,var(--bw)) solid var(--ink)}
.d-img[data-frame=browser] .d-art,.d-img[data-frame=browser] img.d-photo{top:2.1em;height:calc(100% - 2.1em)}
.d-img[data-icon=true]{width:3.4em;aspect-ratio:1;flex:none}
.d-text[data-label=true]{font:600 var(--fs-s)/1.2 var(--f-mono);text-transform:uppercase;letter-spacing:.08em}
.d-list[data-variant=links] li{justify-content:flex-start;padding-block:.22em}
.d-list[data-variant=links] .d-li-title{font-weight:400;color:var(--muted);display:inline-block;transition:color .2s,translate .35s var(--ease)}
.d-list[data-variant=links] li:hover .d-li-title{color:var(--ink);translate:.3em 0}
.d-list[data-variant=links] .d-li-meta{display:none}
.d-list[data-variant=checks] li{justify-content:flex-start;gap:.7em;padding-block:.3em;align-items:center}
.d-list[data-variant=checks] li::before{content:'';flex:none;width:.6em;height:.32em;border-left:2px solid var(--accent-text);border-bottom:2px solid var(--accent-text);rotate:-45deg;translate:0 -.1em}
.d-box[data-bg=accent] .d-list[data-variant=checks] li::before,.d-box[data-bg=inverse] .d-list[data-variant=checks] li::before{border-color:currentColor}
.d-list[data-variant=checks] .d-li-title{font-weight:400}
.d-list[data-variant=checks] .d-li-meta{display:none}
.d-nav[data-variant=bar],.d-nav[data-variant=centered]{position:sticky;top:0;z-index:20;background:color-mix(in oklab,var(--bg) 84%,transparent);-webkit-backdrop-filter:blur(14px) saturate(1.5);backdrop-filter:blur(14px) saturate(1.5)}
.d-box[data-variant=card]>.d-btn:last-child{margin-top:auto}
.d-box[data-variant=card]>.d-btn{justify-content:center}
/* motion: transitions on everything interactive, ease and duration come from the design's motion token */
.d-btn{transition:translate var(--dur) var(--ease),box-shadow var(--dur) var(--ease),background-color .25s,color .25s,border-color .25s}
.d-btn>span[aria-hidden]{display:inline-block;transition:translate var(--dur) var(--ease)}
.d-btn:hover{translate:var(--lift);box-shadow:var(--shadow-h);background:color-mix(in oklab,var(--accent) 86%,var(--ink))}
.d-btn:hover>span[aria-hidden]{translate:.3em 0}
.d-btn:active{translate:var(--press);box-shadow:var(--press-shadow);transition-duration:.06s}
.d-btn[data-variant=outline]:hover{background:var(--ink);color:var(--bg)}
.d-sec[data-bg=accent] .d-btn[data-variant=ink],.d-box[data-bg=accent] .d-btn[data-variant=ink]{background:var(--on-accent);color:var(--accent);border-color:var(--on-accent)}
.d-sec[data-bg=inverse] .d-btn[data-variant=ink],.d-box[data-bg=inverse] .d-btn[data-variant=ink]{background:var(--on-inverse);color:var(--inverse);border-color:var(--on-inverse)}
.d-sec[data-bg=accent] .d-btn:not([data-variant=outline]):not([data-variant=ghost]),.d-box[data-bg=accent] .d-btn:not([data-variant=outline]):not([data-variant=ghost]){border-color:var(--on-accent)}
.d-btn[data-variant=ink]:hover{background:var(--accent);color:var(--on-accent)}
.d-btn[data-variant=ghost]:hover{translate:none;box-shadow:none;background:transparent;text-decoration-thickness:3px;color:var(--accent-text)}
.d-box[data-variant=card]{transition:translate var(--dur) var(--ease),box-shadow var(--dur) var(--ease)}
.d-box[data-variant=card]:not(:has(.d-table,.d-field,.d-box[data-variant=card])):hover{translate:var(--lift);box-shadow:var(--shadow-h)}
.d-img .d-art,.d-img img.d-photo{transition:scale 1.1s var(--ease)}
.d-img:hover .d-art,.d-img:hover img.d-photo{scale:1.07}
/* only the hero image drifts: one moving thing at a time, so the page has somewhere for the eye to rest */
.d-sec[data-role=hero] .d-img:not([data-frame]):not([data-icon]) .d-art{animation:d-drift 26s ease-in-out infinite alternate}
@keyframes d-drift{from{transform:scale(1.1) translate(-1.6%,-1%)}to{transform:scale(1.1) translate(1.6%,1%)}}
.d-nav-links a{background:linear-gradient(currentColor,currentColor) left bottom/0 1.5px no-repeat;padding-bottom:.15em;transition:background-size .4s var(--ease),color .2s}
.d-nav-links a:hover{background-size:100% 1.5px}
.d-list li .d-li-title{transition:translate .35s var(--ease),color .2s}
.d-list[data-variant=index] li:hover .d-li-title{translate:.35em 0;color:var(--accent-text)}
.d-table td{transition:background-color .2s}
.d-table tbody tr:hover td{background:color-mix(in oklab,var(--accent) 14%,transparent)}
.d-marquee:hover .d-marquee-track{animation-play-state:paused}
.d-tag{transition:translate .3s var(--ease),background-color .2s}
.d-tag:hover{translate:0 -2px}
.d-doc a:focus-visible,.d-faq summary:focus-visible{outline:2px solid var(--accent-text);outline-offset:3px;border-radius:4px}
/* entrance: the hero plays in on load, everything below rises into view as it is scrolled to */
@keyframes d-in{from{opacity:0;translate:0 26px}}
.d-sec[data-role=hero] :is(.d-tag,.d-h,.d-text,.d-btn,.d-img,.d-stat,.d-nav){animation:d-in 1s var(--ease) backwards}
.d-sec[data-role=hero] .d-tag{animation-delay:.05s}
.d-sec[data-role=hero] .d-h{animation-delay:.15s}
.d-sec[data-role=hero] .d-text{animation-delay:.3s}
.d-sec[data-role=hero] .d-btn{animation-delay:.42s}
.d-sec[data-role=hero] .d-btn+.d-btn{animation-delay:.52s}
.d-sec[data-role=hero] .d-img{animation-delay:.25s;animation-duration:1.3s}
@keyframes d-rise{from{opacity:0;translate:0 38px}}
.d-frame[data-reveal=on] [data-rv=out]{opacity:0}
.d-frame[data-reveal=on] [data-rv=in]{animation:d-rise 1s var(--ease) backwards;animation-delay:calc(var(--rv,0) * 80ms)}
.d-frame.still [data-rv],.d-frame.wire [data-rv]{opacity:1 !important}
@media (prefers-reduced-motion:reduce){[data-rv]{opacity:1 !important}.d-doc *,.d-doc *::before,.d-doc *::after{animation:none !important;transition:none !important}}
/* animated backdrops: blurred colour fields drift behind the content, grids and dots pan, art floats */
[data-backdrop=wash]::before,[data-backdrop=aurora]::before,[data-backdrop=aurora]::after{content:'';position:absolute;pointer-events:none;z-index:0;will-change:transform}
[data-backdrop=wash]::before{inset:-25%;background-image:radial-gradient(60% 90% at 88% 0%,color-mix(in oklab,var(--accent) calc(var(--bd-s) * 18%),transparent),transparent 70%),radial-gradient(45% 70% at 0% 100%,color-mix(in oklab,var(--accent2) calc(var(--bd-s) * 45%),transparent),transparent 70%);animation:d-wash 20s ease-in-out infinite alternate}
[data-backdrop=aurora]{background-image:radial-gradient(50% 60% at 50% 120%,color-mix(in oklab,var(--accent2) calc(var(--bd-s) * 30%),transparent),transparent 80%)}
[data-backdrop=aurora]::before{width:62%;aspect-ratio:1;left:-10%;top:-34%;border-radius:50%;background:color-mix(in oklab,var(--accent) calc(var(--bd-s) * 24%),transparent);filter:blur(72px);animation:d-blob-a 19s ease-in-out infinite alternate}
[data-backdrop=aurora]::after{width:52%;aspect-ratio:1;right:-8%;bottom:-38%;border-radius:50%;background:color-mix(in oklab,var(--accent2) calc(var(--bd-s) * 55%),transparent);filter:blur(84px);animation:d-blob-b 25s ease-in-out infinite alternate}
@keyframes d-wash{from{transform:translate(-4%,-3%) rotate(0) scale(1)}to{transform:translate(4%,5%) rotate(7deg) scale(1.14)}}
@keyframes d-blob-a{0%{transform:translate(0,0) scale(1)}50%{transform:translate(20%,24%) scale(1.25)}100%{transform:translate(44%,6%) scale(.92)}}
@keyframes d-blob-b{0%{transform:translate(0,0) scale(1.1)}50%{transform:translate(-32%,-20%) scale(.85)}100%{transform:translate(-14%,-44%) scale(1.2)}}
@keyframes d-pan-grid{to{transform:translate(44px,44px)}}
@keyframes d-pan-dots{to{transform:translate(20px,20px)}}
.d-bd .d-art{animation:d-float-art 30s ease-in-out infinite alternate}
@keyframes d-float-art{from{transform:scale(1.06) rotate(-1.5deg) translate(-1%,-1%)}to{transform:scale(1.16) rotate(1.5deg) translate(1%,1.5%)}}
.d-bd img{animation:d-kenburns 36s ease-in-out infinite alternate}
@keyframes d-kenburns{from{transform:scale(1)}to{transform:scale(1.12) translate(-1.5%,-1%)}}
/* responsive: container queries on the frame so the canvas viewport toggle works */
@container doc (max-width: 900px){
  .d-box[data-dir=row]:not([data-keep=true]),.d-box[data-dir=grid]{grid-template-columns:repeat(2,minmax(0,1fr)) !important}
  .d-box[data-dir=row]:not([data-keep=true])>*{grid-column:auto !important}
  .d-box[data-dir=row]:not([data-keep=true]){grid-template-columns:minmax(0,1fr) !important}
  .d-box>*{grid-column:auto !important;grid-row:auto !important}
  .d-box[data-sticky=true]{position:static}
  .d-box[data-full=true]{min-height:0}
}
@container doc (max-width: 560px){
  .d-box[data-dir=grid]{grid-template-columns:minmax(0,1fr) !important}
  .d-box[data-btns=true]{display:flex;flex-wrap:wrap}
  .d-nav-links{display:none}
  .d-nav{padding-inline:calc(var(--space) * 1.2)}
  .d-nav[data-variant=stacked] .d-nav-links{display:flex}
  .d-table th:nth-child(n+4),.d-table td:nth-child(n+4){display:none}
  .d-marquee{font-size:var(--fs-l)}
}
/* wireframe: grey structure only, skin hidden */
.d-frame.wire .d-doc{--bg:#fff;--surface:#f1f1f1;--ink:#2b2b2b;--muted:#7a7a7a;--line:#cfcfcf;--accent:#d9d9d9;--accent2:#e6e6e6;--on-accent:#2b2b2b;--accent-text:#2b2b2b;--inverse:#d4d4d4;--on-inverse:#2b2b2b;--f-display:ui-sans-serif,system-ui,sans-serif;--f-body:ui-sans-serif,system-ui,sans-serif;--radius:2px;--bw:1px;--shadow:none;--w-display:700;--case:none}
.d-frame.wire .d-doc::after{display:none}
.d-frame.wire .d-doc *,.d-frame.wire .d-doc *::before,.d-frame.wire .d-doc *::after{transform:none !important;translate:none !important;animation:none !important;transition:none !important}
.d-frame.wire .d-img{background:#fafafa;border:1px solid #999;border-radius:2px;background-image:linear-gradient(to top right,transparent calc(50% - .5px),#999 calc(50% - .5px),#999 calc(50% + .5px),transparent calc(50% + .5px)),linear-gradient(to bottom right,transparent calc(50% - .5px),#999 calc(50% - .5px),#999 calc(50% + .5px),transparent calc(50% + .5px))}
.d-frame.wire .d-img .d-art,.d-frame.wire .d-img img.d-photo{display:none}
.d-frame.wire .d-sec[data-bg]{background:#f1f1f1}
.d-frame.wire .d-sec[data-bg=bg]{background:#fff}
.d-frame.wire .d-sec{outline:1px dashed #bbb;outline-offset:-1px}
`
