const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // File System
  openFolderDialog: () => ipcRenderer.invoke('fs:openFolderDialog'),
  readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath),
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', { filePath, content }),
  createFile: (filePath) => ipcRenderer.invoke('fs:createFile', filePath),

  // Git (100% via UI)
  gitInit: (repoPath) => ipcRenderer.invoke('git:init', repoPath),
  gitClone: (targetDir, repoUrl) => ipcRenderer.invoke('git:clone', { targetDir, repoUrl }),
  gitAddRemote: (repoPath, name, url) => ipcRenderer.invoke('git:addRemote', { repoPath, name, url }),
  getGitStatus: (repoPath) => ipcRenderer.invoke('git:status', repoPath),
  gitCommit: (repoPath, message) => ipcRenderer.invoke('git:commit', { repoPath, message }),
  gitPush: (repoPath, branch) => ipcRenderer.invoke('git:push', { repoPath, branch }),
  gitPull: (repoPath) => ipcRenderer.invoke('git:pull', { repoPath }),
  gitCheckout: (repoPath, branch, create = false, startPoint = undefined) => ipcRenderer.invoke('git:checkout', { repoPath, branch, create, startPoint }),
  getGitLog: (repoPath) => ipcRenderer.invoke('git:log', repoPath),

  // HTTP Tester (Postman-like)
  httpRequest: (params) => ipcRenderer.invoke('http:request', params),

  // AI Assistant & AGY (Antigravity CLI)
  generateCode: (params) => ipcRenderer.invoke('ai:generateCode', params),
  listAgySessions: () => ipcRenderer.invoke('agy:listSessions'),
  getAgySessionDetails: (sessionId) => ipcRenderer.invoke('agy:getSessionDetails', sessionId),

  // Terminals
  spawnTerminal: (id, cwd, cols, rows) => ipcRenderer.send('terminal:spawn', { id, cwd, cols, rows }),
  writeTerminal: (id, data) => ipcRenderer.send('terminal:write', { id, data }),
  resizeTerminal: (id, cols, rows) => ipcRenderer.send('terminal:resize', { id, cols, rows }),
  killTerminal: (id) => ipcRenderer.send('terminal:kill', id),
  onTerminalData: (id, callback) => {
    const channel = `terminal:data:${id}`;
    const listener = (_, data) => callback(data);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
  onTerminalExit: (id, callback) => {
    const channel = `terminal:exit:${id}`;
    const listener = (_, code) => callback(code);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  }
});
