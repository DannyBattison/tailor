const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('handmade', {
  desktop: true,
  llm: {
    detect: () => ipcRenderer.invoke('llm:detect'),
    run: (req) => ipcRenderer.invoke('llm:run', { provider: req.provider, system: req.system, prompt: req.prompt }),
  },
})
