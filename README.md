<a href="https://www.buymeacoffee.com/YOUR_USERNAME"><img src="https://img.shields.io/badge/Buy%20me%20a%20coffee-%E2%98%95-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=black" alt="Buy me a coffee" /></a>

# Tailor

Generate a design system that doesn't look AI-generated, then hand it to an AI agent to build a whole site with.

Tailor makes the design decisions itself: colours, fonts, shape, motion and layout all come from a seed, not from a model. You get a design doc (as a prompt or JSON) that an agent can follow. The same seed always gives the same design.

It comes in three forms:

* **Design tool**: a visual editor in the browser or as a desktop app.
* **npm package**: use the generator from your own code.
* **MCP server**: let an AI client generate and tweak themes directly.

## Design tool

Needs Node 20+.

    npm install
    npm run dev            # open the editor in your browser

Generate a design, re-roll the parts you don't like (palette, fonts, shape, layout, text, animation), tweak by hand, then use **Export for AI** to copy the design doc.

Other commands:

    npm run build          # typecheck + production build
    npm test               # sanity checks (determinism, contrast, export, seed round trips)

### Desktop app

    npm run electron:dev   # with hot reload
    npm run electron       # production build, then open

If Electron's binary is missing, run `node node_modules/electron/install.js`.

The tool needs no account or API key. The only network use is Google Fonts and placehold.co images.

## npm package

    npm install @dannybattison/tailor

```js
import { generateTheme, rerollTheme } from '@dannybattison/tailor'

const t = generateTheme({ seed: 42, kind: 'marketing', mood: 'editorial' })
t.seed          // nine-word seed code that recreates this theme
t.designSystem  // structured design system
t.prompt        // the same, as agent-ready text
t.issues        // critique findings (contrast etc.)

generateTheme({ seed: t.seed })     // reload from a seed code
rerollTheme(t.seed, 'palette')      // change one part, keep the rest
```

It's headless: no React and no preview. To build it from source, run `npm run build:lib`.

## MCP server

Add this to your MCP client config:

```json
{
  "mcpServers": {
    "tailor": { "command": "npx", "args": ["-y", "-p", "@dannybattison/tailor", "tailor-mcp"] }
  }
}
```

Tools:

* `generate_theme`: new theme from a number, kind (`marketing` or `app`), mood, mode and background boldness.
* `load_theme`: recreate a theme from its seed code.
* `reroll_theme_part`: change one part and keep the rest.
* `critique_theme`: check a theme for problems.

Each returns the seed code plus the design system, as JSON or as a prompt.

## Seeds

A seed is nine plain words like `acorn-brook-cedar-...`. It encodes every part of the design, so you can share or save it and get the exact same result back. Re-rolling one part changes only the bits that hold it. Hand tweaks (sliders, swatches, typed fonts) aren't in the seed, but the export includes them.

## How it works

Seeded tokens → layout archetype → component tree → HTML. Pure functions in `src/gen`, rendering in `src/render`, the editor in `src/editor`, the export in `src/designSystem.ts`. Fonts come from the Google Fonts list in `src/gen/googleFonts.json` (refresh it with `node scripts/gen-fonts.mjs`).

## License

MIT. See [LICENSE](LICENSE). Keep the copyright and licence notice when you copy or distribute this code.
