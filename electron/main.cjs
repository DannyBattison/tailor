// Electron main process: hosts the Vite app and lets it drive the user's installed `claude` / `codex` CLIs.
// The renderer never gets a shell: it can only ask for a fixed set of providers with a prompt on stdin.
const { app, BrowserWindow, ipcMain, shell } = require('electron')
const { spawn, execFile } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const PROVIDERS = { 'claude-cli': 'claude', 'codex-cli': 'codex' }
const MAX_PROMPT = 400_000
const TIMEOUT_MS = 240_000

function searchPath() {
  const home = os.homedir()
  const extra = [
    path.join(home, '.local/bin'), path.join(home, '.claude/local'), path.join(home, '.npm-global/bin'), path.join(home, '.bun/bin'),
    path.join(home, '.volta/bin'), '/opt/homebrew/bin', '/usr/local/bin', '/usr/bin',
  ]
  return [...(process.env.PATH ?? '').split(path.delimiter), ...extra].filter(Boolean)
}
const augmentedEnv = () => ({ ...process.env, PATH: [...new Set(searchPath())].join(path.delimiter), NO_COLOR: '1' })

const resolved = new Map()
function which(bin) {
  if (resolved.has(bin)) return Promise.resolve(resolved.get(bin))
  const win = process.platform === 'win32'
  for (const dir of searchPath()) {
    for (const ext of win ? ['.cmd', '.exe', ''] : ['']) {
      const p = path.join(dir, bin + ext)
      try { fs.accessSync(p, fs.constants.X_OK); if (fs.statSync(p).isFile()) { resolved.set(bin, p); return Promise.resolve(p) } } catch { /* next */ }
    }
  }
  // GUI-launched apps often miss version-manager paths (nvm, asdf…): ask a login shell once.
  if (win) return Promise.resolve(null)
  return new Promise((res) => {
    execFile(process.env.SHELL || '/bin/sh', ['-lc', `command -v ${bin}`], { timeout: 4000 }, (err, out) => {
      const p = err ? null : out.trim().split('\n').pop()
      if (p) resolved.set(bin, p)
      res(p || null)
    })
  })
}

function version(file) {
  const shell = process.platform === 'win32' && /\.(cmd|bat)$/i.test(file)
  return new Promise((res) => execFile(shell ? `"${file}"` : file, ['--version'], { timeout: 6000, env: augmentedEnv(), shell }, (err, out) => res(err ? null : out.trim().split('\n')[0])))
}

async function detect() {
  const out = {}
  for (const [id, bin] of Object.entries(PROVIDERS)) {
    const file = await which(bin)
    out[id] = file ? { found: true, path: file, version: await version(file) } : { found: false }
  }
  return out
}

function runProcess(file, args, input, cwd) {
  return new Promise((resolve) => {
    // npm shims on Windows are .cmd files, which need a shell. Every argument here is a fixed flag or a temp path
    // (user text goes over stdin), so quoting them is safe.
    const shell = process.platform === 'win32' && /\.(cmd|bat)$/i.test(file)
    const child = shell
      ? spawn(`"${file}"`, args.map((a) => `"${a}"`), { cwd, env: augmentedEnv(), stdio: ['pipe', 'pipe', 'pipe'], shell: true })
      : spawn(file, args, { cwd, env: augmentedEnv(), stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => { child.kill('SIGKILL'); resolve({ code: -1, stdout, stderr: stderr + '\nTimed out' }) }, TIMEOUT_MS)
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    child.on('error', (e) => { clearTimeout(timer); resolve({ code: -1, stdout, stderr: String(e.message) }) })
    child.on('close', (code) => { clearTimeout(timer); resolve({ code, stdout, stderr }) })
    child.stdin.on('error', () => {})
    child.stdin.end(input)
  })
}

async function runLlm({ provider, system, prompt }) {
  const bin = PROVIDERS[provider]
  if (!bin) return { ok: false, error: 'Unknown provider' }
  if (typeof prompt !== 'string' || typeof system !== 'string' || prompt.length + system.length > MAX_PROMPT) return { ok: false, error: 'Prompt missing or too large' }
  const file = await which(bin)
  if (!file) return { ok: false, error: `${bin} is not installed or not on PATH` }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'handmade-llm-'))
  try {
    if (bin === 'claude') {
      // plain text in, plain text out; no tools, no session saved, so it can only write copy
      const r = await runProcess(file, ['-p', '--output-format', 'text', '--tools', '', '--no-session-persistence'], system + '\n\n' + prompt, tmp)
      return r.code === 0 && r.stdout.trim() ? { ok: true, text: r.stdout } : { ok: false, error: (r.stderr || r.stdout || `claude exited with ${r.code}`).trim().slice(-600) }
    }
    const outFile = path.join(tmp, 'out.txt')
    const r = await runProcess(file, ['exec', '--skip-git-repo-check', '--ephemeral', '--sandbox', 'read-only', '-C', tmp, '-o', outFile, '-'], system + '\n\n' + prompt, tmp)
    let text = ''
    try { text = fs.readFileSync(outFile, 'utf8') } catch { /* no output */ }
    return r.code === 0 && text.trim() ? { ok: true, text } : { ok: false, error: (r.stderr || `codex exited with ${r.code}`).trim().slice(-600) }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1560, height: 960, minWidth: 1100, minHeight: 700, title: 'Handmade', backgroundColor: '#efeadf',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  })
  win.setMenuBarVisibility(false)
  const dev = process.env.VITE_DEV_URL
  const external = (u) => /^https?:\/\//.test(u) && !(dev && u.startsWith(dev))
  win.webContents.setWindowOpenHandler(({ url }) => { if (external(url)) shell.openExternal(url); return { action: 'deny' } })
  win.webContents.on('will-navigate', (e, url) => { if (external(url) || url.startsWith('file:') && !dev && !url.includes('/dist/')) { e.preventDefault(); if (external(url)) shell.openExternal(url) } })
  if (dev) win.loadURL(dev)
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

app.whenReady().then(() => {
  ipcMain.handle('llm:detect', () => detect())
  ipcMain.handle('llm:run', (_e, req) => runLlm(req ?? {}))
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
