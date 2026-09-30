// Mock electron module for browser environment
export const shell = {
  openExternal: (url: string) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank')
    }
  },
}

// No-op mocks for IPC APIs not available in browser mode
const noop = () => {}
export const ipcRenderer = {
  on: noop,
  once: noop,
  send: noop,
  removeListener: noop,
  removeAllListeners: noop,
}

export const ipcMain = {
  on: noop,
  once: noop,
  handle: noop,
  removeListener: noop,
  removeAllListeners: noop,
}

export default {
  shell,
  ipcRenderer,
  ipcMain,
}
