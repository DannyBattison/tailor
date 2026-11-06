# Tailor

A tool that generates a design system that doesn't look AI-generated, and exports it for an AI to build a whole multi-page site with.
Design decisions are taken out of any model's hands: seeded tokens → layout archetype → component tree → HTML. The canvas is a
specimen page with lorem ipsum text; the real output is the design system JSON / prompt (Export for AI).

    npm install --include=dev
    npm run dev           # editor in the browser
    npm run build         # typecheck + production build
    npm test              # generation sanity checks (determinism, contrast, hue ban, design-code round trips, export)

* `src/gen` – seeded (mulberry32) token, palette (OKLCH), font, archetype, lorem text and critique logic. Pure functions.
* `src/render` – tree → React components + one doc stylesheet shared by canvas and export (CSS variables, clamp()/cqw, @container).
* `src/editor` – canvas, drag & drop, layers, inspector, generate/critique panels.
* `src/gen/fonts.ts` + `googleFonts.json` – any free Google font: the seed picks two (curated pairings or rule-based ones from ~1,200 families); you can type your own two with autocomplete. Refresh the list with `node scripts/gen-fonts.mjs`.
* Marketing previews are one coherent website: nav, hero, logo strip, features, how it works, proof, pricing, FAQ, closing call, footer. Archetypes change how each reads, not which exist. Motion (hover, load and scroll reveals, animated backdrops) follows the design's `motion` token.
* `src/designSystem.ts` – the export: tokens, rules, components, a section-pattern library and page recipes.

## Desktop app (Electron)

    npm run electron:dev   # Vite + Electron with hot reload
    npm run electron       # production build, then open in Electron

If Electron's binary is missing (`node_modules/electron/dist`), run `node node_modules/electron/install.js`.
There is no AI integration and no network use beyond Google Fonts and placehold.co images.

## Seeds

The seed shown in the Generate tab is a 35-digit design code: six 5-digit blocks (palette, fonts, shape, layout, text, backdrops)
and a setup block (mood, product, background boldness, mode). Re-rolling a part rewrites only its own block, and loading a seed
rebuilds the generated design exactly. A new design starts with a fully random seed.
Hand edits (tree edits, sliders, swatches) are not part of the code; export the page tree JSON to keep those.
