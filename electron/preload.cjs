const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('handmade', {
  desktop: true,
  llm: {
    detect: (paths) => ipcRenderer.invoke('llm:detect', paths),
    run: (req) => ipcRenderer.invoke('llm:run', { provider: req.provider, system: req.system, prompt: req.prompt, path: req.path }),
  },
})
