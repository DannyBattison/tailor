# Handmade

A tool that generates a design system that doesn't look AI-generated, and exports it for an AI to build a whole multi-page site with.
Design decisions are taken out of any model's hands: seeded tokens → layout archetype → component tree → HTML. The canvas is a
specimen page with lorem ipsum text; the real output is the design system JSON / prompt (Export for AI).

    npm install --include=dev
    npm run dev           # editor in the browser
    npm run build         # typecheck + production build
    npm test              # generation sanity checks (determinism, contrast, hue ban, re-roll semantics, export)

* `src/gen` – seeded (mulberry32) token, palette (OKLCH), font, archetype, lorem text and critique logic. Pure functions.
* `src/render` – tree → React components + one doc stylesheet shared by canvas and export (CSS variables, clamp()/cqw, @container).
* `src/editor` – canvas, drag & drop, layers, inspector, generate/critique panels.
* `src/designSystem.ts` – the export: tokens, rules, components, a section-pattern library and page recipes.

## Desktop app (Electron)

    npm run electron:dev   # Vite + Electron with hot reload
    npm run electron       # production build, then open in Electron

If Electron's binary is missing (`node_modules/electron/dist`), run `node node_modules/electron/install.js`.
There is no AI integration and no network use beyond Google Fonts and placehold.co images.
