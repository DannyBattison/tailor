// Builds the npm package: dist-lib/index.js (library), dist-lib/mcp.js (MCP server bin) and type declarations.
import { build } from 'esbuild'
import { execSync } from 'node:child_process'
import { rmSync } from 'node:fs'

rmSync('dist-lib', { recursive: true, force: true })
await build({
  entryPoints: { index: 'src/api.ts', mcp: 'src/mcp/server.ts' },
  outdir: 'dist-lib', bundle: true, platform: 'node', format: 'esm', target: 'node20', packages: 'external', logLevel: 'info',
})
execSync('npx tsc -p tsconfig.lib.json', { stdio: 'inherit' })
