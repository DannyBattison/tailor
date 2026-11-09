# Tailor

A theming tool: it generates a design system that doesn't look AI-generated, and exports it as a design doc for AI agents to build a whole multi-page site with.
Design decisions are taken out of any model's hands: seeded tokens → layout archetype → component tree → HTML. The canvas is a
specimen page with lorem ipsum text; the only output is the handover for an agent, as a prompt or JSON (Export for AI).

    npm install --include=dev
    npm run dev           # editor in the browser
    npm run build         # typecheck + production build
    npm test              # generation sanity checks (determinism, contrast, hue ban, design-code round trips, export)

* `src/gen` – seeded (mulberry32) token, palette (OKLCH), font, archetype, lorem text and critique logic. Pure functions.
* `src/render` – tree → React components + one doc stylesheet, used by the canvas and included in the handover (CSS variables, clamp()/cqw, @container).
* `src/editor` – read-only preview canvas, design token and generate/critique panels.
* `src/gen/fonts.ts` + `googleFonts.json` – any free Google font: the seed picks two (curated pairings or rule-based ones from ~1,200 families); you can type your own two with autocomplete. Refresh the list with `node scripts/gen-fonts.mjs`.
* Marketing previews are one coherent website: nav, hero, logo strip, features, how it works, proof, pricing, FAQ, closing call, footer. Archetypes change how each reads, not which exist. Animation is four independent parts, each with its own seed and lock: background (what moves on its own), entrance (how content arrives), interaction (how elements answer the pointer) and navigation (link hover and how the top bar sits).
* `src/designSystem.ts` – the export (about 13 KB): colours, type, shape, motion rules, key CSS variables, components, a one-line-per-pattern list and page recipes. No stylesheet.

## Desktop app (Electron)

    npm run electron:dev   # Vite + Electron with hot reload
    npm run electron       # production build, then open in Electron

If Electron's binary is missing (`node_modules/electron/dist`), run `node node_modules/electron/install.js`.
There is no AI integration and no network use beyond Google Fonts and placehold.co images.

## Seeds

The seed shown in the Generate tab is nine plain words (`acorn-brook-cedar-...`) from a fixed 1,024-word list: 10 bits a word, 90 bits in all.
They hold the ten part seeds (palette, fonts, shape, layout, text, backdrops, and the background, entrance, interaction and navigation animation), each with a range
suited to what it controls (`SEED_BITS` in `src/gen/generate.ts`), plus mood, product, background boldness and mode. Type or paste a seed to load it; it is
case-insensitive and tolerates dashes, spaces or commas. Re-rolling a part changes only the bits that hold it, and loading a seed rebuilds the generated design exactly.
Export files are named after the seed, and a new design starts with a random one. Earlier digit and base64 seeds are no longer accepted. The word list is part of the format: never reorder it.
Animation re-rolls come in two levels: "Re-roll all" for the whole group, a re-roll per part (background, entrance, interaction, navigation), and ▸ to re-roll one setting inside a part (hover style or feel; nav links or top bar). Look (palette, fonts, shape) has a "Re-roll all" too.
Hand tweaks (sliders, swatches, typed fonts) are not part of the code, but the design system export includes them.
