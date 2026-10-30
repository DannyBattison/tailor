# Handmade

A browser tool that generates editable wireframes/designs that don't look AI-generated.
Design decisions are taken out of the model's hands: brief → tokens → layout archetype → component tree → HTML.

    npm install --include=dev
    npm run dev        # editor
    npm run build      # typecheck + production build
    npm test           # generation sanity checks (determinism, contrast, banned hues, archetype coverage)

* `src/gen` – seeded (mulberry32) token, palette (OKLCH), font, archetype, content and critique logic. Pure functions.
* `src/render` – tree → React components + one doc stylesheet shared by canvas and export (CSS variables, clamp()/cqw, @container).
* `src/editor` – canvas, drag & drop, layers, inspector, generate/critique panels.
* AI is optional: paste your own Anthropic key (stored in memory, or localStorage if you opt in). Without it a keyword→mood fallback and built-in content bank are used.
