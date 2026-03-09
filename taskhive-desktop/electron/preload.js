import { contextBridge, ipcRenderer } from 'electron'

const validListener = (listener) => typeof listener === 'function'

contextBridge.exposeInMainWorld('TaskHiveDesktop', {
  toggleWidget: () => ipcRenderer.invoke('taskhive:toggle-widget'),
  closeWidget: () => ipcRenderer.invoke('taskhive:close-widget'),
  iconClick: () => ipcRenderer.invoke('taskhive:icon-click'),
  dragWidget: (payload) => ipcRenderer.invoke('taskhive:drag-widget', payload),
  openMain: () => ipcRenderer.invoke('taskhive:open-main'),
  getDesktopRole: () => ipcRenderer.invoke('taskhive:get-role'),
  login: (payload) => ipcRenderer.invoke('taskhive:login', payload),
  logout: () => ipcRenderer.invoke('taskhive:logout'),
  toggleTimer: () => ipcRenderer.invoke('taskhive:toggle-timer'),
  onWidgetLayout: (listener) => {
    if (!validListener(listener)) return () => {}
    const channel = 'taskhive:widget-layout'
    const wrapped = (_event, payload) => listener(payload)
    ipcRenderer.on(channel, wrapped)
    return () => ipcRenderer.removeListener(channel, wrapped)
  },
  onWidgetState: (listener) => {
    if (!validListener(listener)) return () => {}
    const channel = 'taskhive:widget-state'
    const wrapped = (_event, payload) => listener(payload)
    ipcRenderer.on(channel, wrapped)
    return () => ipcRenderer.removeListener(channel, wrapped)
  }
})
