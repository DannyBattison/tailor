// Electron shell: hosts the built Vite app (or the dev server) in a desktop window.
const { app, BrowserWindow, shell } = require('electron')
const path = require('node:path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1560, height: 960, minWidth: 1100, minHeight: 700, title: 'Tailor', backgroundColor: '#efeadf',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  })
  win.setMenuBarVisibility(false)
  // Electron's built-in Zoom In is Ctrl+Plus, which needs Shift on most layouts. Make Ctrl/Cmd + =, +, - and 0 behave like a browser.
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown' || !(input.control || input.meta) || input.alt) return
    const wc = win.webContents
    const clamp = (z) => Math.min(5, Math.max(-3, z))
    if (['=', '+', 'Add'].includes(input.key)) { wc.setZoomLevel(clamp(wc.getZoomLevel() + 0.5)); event.preventDefault() }
    else if (['-', '_', 'Subtract'].includes(input.key)) { wc.setZoomLevel(clamp(wc.getZoomLevel() - 0.5)); event.preventDefault() }
    else if (input.key === '0') { wc.setZoomLevel(0); event.preventDefault() }
  })
  const dev = process.env.VITE_DEV_URL
  const external = (u) => /^https?:\/\//.test(u) && !(dev && u.startsWith(dev))
  win.webContents.setWindowOpenHandler(({ url }) => { if (external(url)) shell.openExternal(url); return { action: 'deny' } })
  win.webContents.on('will-navigate', (e, url) => { if (external(url)) { e.preventDefault(); shell.openExternal(url) } })
  if (dev) win.loadURL(dev)
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
