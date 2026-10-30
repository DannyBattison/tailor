import { fontStacks, getFont } from '../gen/fonts'
import type { Tokens } from '../types'

/** Token → CSS custom properties (set inline on the doc root, so many docs can coexist). */
export function tokenVars(t: Tokens): Record<string, string> {
  const f = fontStacks(getFont(t.fontId))
  const p = t.palette
  const r = t.scale
  const step = (n: number) => {
    const max = 16 * r ** n
    const min = n <= 0 ? max : Math.max(15, max * 0.5)
    const b = (max - min) / 8.9
    const a = min - 3.9 * b
    if (n <= 0) return `${Math.max(13, max).toFixed(1)}px`
    return `clamp(${min.toFixed(1)}px, ${a.toFixed(1)}px + ${b.toFixed(2)}cqw, ${max.toFixed(1)}px)`
  }
  const shadow = t.shadow === 'hard' ? `${Math.max(4, t.border * 2.5)}px ${Math.max(4, t.border * 2.5)}px 0 var(--ink)` : t.shadow === 'soft' ? '0 10px 30px -10px color-mix(in oklab, var(--ink) 35%, transparent)' : 'none'
  return {
    '--bg': p.bg, '--surface': p.surface, '--ink': p.ink, '--muted': p.muted, '--line': p.line,
    '--accent': p.accent, '--accent2': p.accent2, '--on-accent': p.onAccent, '--accent-text': p.accentText,
    '--inverse': p.inverse, '--on-inverse': p.onInverse,
    '--f-display': f.display, '--f-body': f.body, '--f-mono': f.mono,
    '--w-display': String(getFont(t.fontId).displayWeight),
    '--radius': `${t.radius}px`, '--bw': `${t.border}px`, '--shadow': shadow,
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
.d-doc{background:var(--bg);color:var(--ink);font-family:var(--f-body);font-size:var(--fs-m);line-height:1.55;position:relative;overflow:hidden;min-height:100%}
.d-doc *,.d-doc *::before,.d-doc *::after{box-sizing:border-box}
.d-doc h1,.d-doc h2,.d-doc h3,.d-doc p,.d-doc ul,.d-doc ol,.d-doc figure{margin:0}
.d-doc a{color:inherit;text-decoration:none}
.d-h{font-family:var(--f-display);font-weight:var(--w-display);letter-spacing:var(--track);text-transform:var(--case);line-height:1.04;text-wrap:balance}
.d-h[data-size=xxl]{font-size:var(--fs-xxl);line-height:.92}
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
.d-box[data-variant=card]{border:var(--bw) solid var(--ink);border-radius:var(--radius);box-shadow:var(--shadow);background-color:var(--surface)}
.d-box[data-variant=card][data-bg=accent]{background:var(--accent)}
.d-box[data-variant=card][data-bg=inverse]{background:var(--inverse)}
.d-box[data-variant=outline]{border:max(1px,var(--bw)) solid var(--line);border-radius:var(--radius)}
.d-box[data-variant=rule-top]{border-top:max(1px,var(--bw)) solid var(--ink);padding-top:calc(var(--space) * .6)}
.d-box[data-variant=rule-left]{border-left:max(1px,var(--bw)) solid var(--ink);padding-left:calc(var(--space) * .8)}
.d-box[data-sticky=true]{position:sticky;top:0;align-self:start}
.d-box[data-full=true]{min-height:100cqh}
.d-btn{display:inline-flex;align-items:center;gap:.5em;font:inherit;font-weight:600;font-size:var(--fs-m);padding:calc(.7em * var(--d)) calc(1.3em * var(--d));border-radius:var(--radius);border:max(1.5px,var(--bw)) solid var(--ink);background:var(--accent);color:var(--on-accent);box-shadow:var(--shadow);cursor:pointer;white-space:nowrap;line-height:1.1}
.d-btn[data-variant=outline]{background:transparent;color:var(--ink);box-shadow:none}
.d-btn[data-variant=ink]{background:var(--ink);color:var(--bg)}
.d-btn[data-variant=ghost]{background:transparent;color:var(--ink);border-color:transparent;box-shadow:none;padding-inline:0;text-decoration:underline;text-underline-offset:.25em;text-decoration-thickness:1.5px}
.d-btn[data-size=s]{font-size:var(--fs-s)}
.d-btn[data-size=l]{font-size:var(--fs-l)}
.d-btn[data-tilt=true]{transform:rotate(-1.5deg)}
.d-img{position:relative;overflow:hidden;border-radius:var(--radius);border:var(--bw) solid var(--ink);background:var(--surface);width:100%;aspect-ratio:var(--ratio,4/3)}
.d-img[data-shape=arch]{border-radius:999px 999px var(--radius) var(--radius)}
.d-img[data-shape=pill]{border-radius:999px}
.d-img[data-shape=circle]{border-radius:50%}
.d-img .d-art{position:absolute;inset:0;width:100%;height:100%;display:block}
.d-img figcaption{position:absolute;left:8px;bottom:8px;background:var(--bg);color:var(--ink);font:var(--fs-s)/1.2 var(--f-mono);padding:3px 7px;border-radius:calc(var(--radius) / 2)}
.d-nav{display:flex;align-items:center;justify-content:space-between;gap:calc(var(--space) * 1.2);padding:calc(var(--space) * .8) calc(var(--space) * 1.2);flex-wrap:wrap}
.d-nav[data-border=true]{border-bottom:max(1px,var(--bw)) solid var(--ink)}
.d-nav-brand{font-family:var(--f-display);font-weight:var(--w-display);font-size:var(--fs-l);letter-spacing:var(--track);text-transform:var(--case)}
.d-nav-links{display:flex;gap:calc(var(--space) * 1);list-style:none;margin:0;padding:0;font-size:var(--fs-s);flex-wrap:wrap}
.d-nav[data-variant=centered]{flex-direction:column;text-align:center}
.d-nav[data-variant=stacked]{flex-direction:column;align-items:flex-start;gap:calc(var(--space) * 1.6)}
.d-nav[data-variant=stacked] .d-nav-links{flex-direction:column;gap:.7em;font-size:var(--fs-m)}
.d-tag{display:inline-block;align-self:flex-start;font:600 var(--fs-s)/1 var(--f-mono);text-transform:uppercase;letter-spacing:.08em;padding:.45em .8em;border:max(1px,var(--bw)) solid var(--ink);border-radius:calc(var(--radius) * .6);background:var(--accent2);color:var(--ink)}
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
.d-field .d-control{padding:calc(.7em * var(--d)) .9em;border:max(1px,var(--bw)) solid var(--ink);border-radius:var(--radius);background:var(--bg);color:var(--muted);font-size:var(--fs-m);min-height:2.6em}
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
@media (prefers-reduced-motion:reduce){.d-marquee-track{animation:none}}
.d-sec>.d-inner>.d-marquee,.d-sec .d-marquee{margin-inline:calc(var(--space) * -1.2)}
.d-quote{display:flex;flex-direction:column;gap:.8em;margin:0}
.d-quote blockquote{margin:0;font-family:var(--f-display);font-weight:var(--w-display);font-size:var(--fs-2);line-height:1.15;letter-spacing:var(--track);text-wrap:balance}
.d-quote[data-size=s] blockquote{font-size:var(--fs-l);font-family:var(--f-body);font-weight:500}
.d-quote[data-size=xl] blockquote{font-size:var(--fs-1)}
.d-quote cite{font:var(--fs-s) var(--f-mono);font-style:normal;color:var(--muted)}
.d-quote[data-mark=true] blockquote::before{content:'\\201C';display:block;font-size:2em;line-height:.6;color:var(--accent-text)}
/* signatures */
.d-doc[data-sig=hardShadow]{--shadow:6px 6px 0 var(--ink)}
.d-doc[data-sig=oversized] .d-h[data-size=xl]{font-size:calc(var(--fs-1) * 1.22);line-height:.95}
.d-doc[data-sig=oversized] .d-h[data-size=xxl]{font-size:calc(var(--fs-xxl) * 1.12)}
.d-doc[data-sig=ruled] .d-sec{border-top:max(3px,calc(var(--bw) * 2)) solid var(--ink)}
.d-doc[data-sig=ruled] .d-sec:first-child{border-top:0}
.d-doc[data-sig=ruled] .d-h{border-bottom:max(2px,var(--bw)) solid var(--ink);padding-bottom:.15em}
.d-doc[data-sig=grain]::after{content:'';position:absolute;inset:0;background-image:${GRAIN};opacity:.22;pointer-events:none;mix-blend-mode:multiply;z-index:5}
.d-doc[data-sig=tilted] .d-tag{transform:rotate(-3deg)}
.d-doc[data-sig=tilted] .d-box[data-variant=card]:nth-child(odd){transform:rotate(-.8deg)}
.d-doc[data-sig=tilted] .d-box[data-variant=card]:nth-child(even){transform:rotate(.6deg)}
.d-doc[data-sig=tilted] .d-btn{transform:rotate(-1.5deg)}
.d-doc[data-sig=tilted] .d-img:nth-of-type(odd){transform:rotate(1.2deg)}
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
  .d-nav-links{display:none}
  .d-nav[data-variant=stacked] .d-nav-links{display:flex}
  .d-table th:nth-child(n+4),.d-table td:nth-child(n+4){display:none}
  .d-marquee{font-size:var(--fs-l)}
}
/* wireframe: grey structure only, skin hidden */
.d-frame.wire .d-doc{--bg:#fff;--surface:#f1f1f1;--ink:#2b2b2b;--muted:#7a7a7a;--line:#cfcfcf;--accent:#d9d9d9;--accent2:#e6e6e6;--on-accent:#2b2b2b;--accent-text:#2b2b2b;--inverse:#d4d4d4;--on-inverse:#2b2b2b;--f-display:ui-sans-serif,system-ui,sans-serif;--f-body:ui-sans-serif,system-ui,sans-serif;--radius:2px;--bw:1px;--shadow:none;--w-display:700;--case:none}
.d-frame.wire .d-doc::after{display:none}
.d-frame.wire .d-doc *{transform:none !important;animation:none !important}
.d-frame.wire .d-img{background:#fafafa;border:1px solid #999;border-radius:2px;background-image:linear-gradient(to top right,transparent calc(50% - .5px),#999 calc(50% - .5px),#999 calc(50% + .5px),transparent calc(50% + .5px)),linear-gradient(to bottom right,transparent calc(50% - .5px),#999 calc(50% - .5px),#999 calc(50% + .5px),transparent calc(50% + .5px))}
.d-frame.wire .d-img .d-art{display:none}
.d-frame.wire .d-sec[data-bg]{background:#f1f1f1}
.d-frame.wire .d-sec[data-bg=bg]{background:#fff}
.d-frame.wire .d-sec{outline:1px dashed #bbb;outline-offset:-1px}
`
