// Starts Vite, waits for it, then opens Electron pointed at it.
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const electron = require('electron')
const port = process.env.PORT ?? '5173'
const url = `http://127.0.0.1:${port}`
const vite = spawn('npx', ['vite', '--port', port, '--strictPort', '--host', '127.0.0.1'], { stdio: 'inherit' })
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(url)).ok) break } catch { /* not up yet */ }
  await new Promise((r) => setTimeout(r, 500))
}
const app = spawn(electron, ['.'], { stdio: 'inherit', env: { ...process.env, VITE_DEV_URL: url } })
const stop = () => { vite.kill(); app.kill() }
app.on('close', () => { vite.kill(); process.exit(0) })
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
