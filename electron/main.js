const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { simpleGit } = require('simple-git');
const pty = require('node-pty');
const { GoogleGenAI } = require('@google/genai');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: '#121214',
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  const devUrl = 'http://localhost:5173';
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC: File System ---
ipcMain.handle('fs:openFolderDialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

function getDirectoryTree(dirPath, maxDepth = 4, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const items = [];

    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        items.push({
          name: entry.name,
          path: fullPath,
          isDirectory: true,
          children: getDirectoryTree(fullPath, maxDepth, currentDepth + 1)
        });
      } else {
        items.push({
          name: entry.name,
          path: fullPath,
          isDirectory: false
        });
      }
    }
    return items.sort((a, b) => {
      if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
      return a.isDirectory ? -1 : 1;
    });
  } catch (err) {
    return [];
  }
}

ipcMain.handle('fs:readDir', async (_, dirPath) => {
  return getDirectoryTree(dirPath);
});

ipcMain.handle('fs:readFile', async (_, filePath) => {
  try {
    return await fs.promises.readFile(filePath, 'utf-8');
  } catch (err) {
    throw new Error(`Impossible de lire le fichier: ${err.message}`);
  }
});

ipcMain.handle('fs:writeFile', async (_, { filePath, content }) => {
  try {
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (err) {
    throw new Error(`Impossible d'enregistrer: ${err.message}`);
  }
});

ipcMain.handle('fs:createFile', async (_, filePath) => {
  try {
    await fs.promises.writeFile(filePath, '', 'utf-8');
    return { success: true };
  } catch (err) {
    throw new Error(`Impossible de créer le fichier: ${err.message}`);
  }
});

// --- IPC: Git Operations ---
ipcMain.handle('git:init', async (_, repoPath) => {
  try {
    const git = simpleGit(repoPath);
    await git.init();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git:clone', async (_, { targetDir, repoUrl }) => {
  try {
    const git = simpleGit();
    await git.clone(repoUrl, targetDir);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git:addRemote', async (_, { repoPath, name, url }) => {
  try {
    const git = simpleGit(repoPath);
    await git.addRemote(name || 'origin', url);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Helper récursif pour trouver un dépôt git dans le dossier, les sous-dossiers ou les parents
function findGitRepoPath(startPath, maxSubDepth = 4, currentDepth = 0) {
  if (!startPath) return null;
  const normalizedStart = path.resolve(startPath);
  if (!fs.existsSync(normalizedStart)) return null;

  // 1. Chercher directement dans le dossier actuel
  if (fs.existsSync(path.join(normalizedStart, '.git'))) {
    return normalizedStart;
  }

  // 2. Chercher dans les dossiers parents
  if (currentDepth === 0) {
    let current = path.dirname(normalizedStart);
    while (current && current !== path.dirname(current)) {
      if (fs.existsSync(path.join(current, '.git'))) {
        return current;
      }
      current = path.dirname(current);
    }
  }

  // 3. Chercher dans les sous-dossiers immédiats (si workspace multi-projets)
  if (currentDepth < maxSubDepth) {
    try {
      const subdirs = fs.readdirSync(normalizedStart, { withFileTypes: true });
      for (const sub of subdirs) {
        if (sub.isDirectory() && sub.name !== 'node_modules' && sub.name !== 'dist' && !sub.name.startsWith('.')) {
          const potentialPath = path.join(normalizedStart, sub.name);
          if (fs.existsSync(path.join(potentialPath, '.git'))) {
            return potentialPath;
          }
          const nested = findGitRepoPath(potentialPath, maxSubDepth, currentDepth + 1);
          if (nested) return nested;
        }
      }
    } catch (e) {}
  }

  return null;
}

ipcMain.handle('git:status', async (_, repoPath) => {
  try {
    const detectedPath = findGitRepoPath(repoPath) || repoPath;
    const git = simpleGit(detectedPath);
    const isRepo = await git.checkIsRepo();
    if (!isRepo) return { isRepo: false };

    const status = await git.status();
    const branchSummary = await git.branchLocal();
    let remotes = [];
    try {
      remotes = await git.getRemotes(true);
    } catch (e) {}

    return {
      isRepo: true,
      actualRepoPath: detectedPath,
      currentBranch: status.current,
      branches: branchSummary.all,
      modified: status.modified,
      not_added: status.not_added,
      staged: status.staged,
      deleted: status.deleted,
      ahead: status.ahead,
      behind: status.behind,
      remotes
    };
  } catch (err) {
    return { isRepo: false, error: err.message };
  }
});

ipcMain.handle('git:commit', async (_, { repoPath, message }) => {
  try {
    const targetPath = findGitRepoPath(repoPath) || repoPath;
    const git = simpleGit(targetPath);
    await git.add('./*');
    const result = await git.commit(message);
    return { success: true, commit: result.commit };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git:push', async (_, { repoPath, branch }) => {
  try {
    const targetPath = findGitRepoPath(repoPath) || repoPath;
    const git = simpleGit(targetPath);
    const result = await git.push('origin', branch || 'main', ['--set-upstream']);
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git:pull', async (_, { repoPath }) => {
  try {
    const targetPath = findGitRepoPath(repoPath) || repoPath;
    const git = simpleGit(targetPath);
    const result = await git.pull();
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git:checkout', async (_, { repoPath, branch, create, startPoint }) => {
  try {
    const targetPath = findGitRepoPath(repoPath) || repoPath;
    const git = simpleGit(targetPath);
    if (create) {
      if (startPoint) {
        await git.checkoutBranch(branch, startPoint);
      } else {
        await git.checkoutLocalBranch(branch);
      }
    } else {
      await git.checkout(branch);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git:log', async (_, repoPath) => {
  try {
    const targetPath = findGitRepoPath(repoPath) || repoPath;
    const git = simpleGit(targetPath);
    const log = await git.log({ maxCount: 20 });
    return log.all;
  } catch (err) {
    return [];
  }
});

// --- IPC: HTTP Client (Postman-like testeur de requêtes) ---
ipcMain.handle('http:request', async (_, { url, method, headers, body }) => {
  const startTime = Date.now();
  try {
    const options = {
      method: method || 'GET',
      headers: headers || {}
    };

    if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      options.body = body;
    }

    const response = await fetch(url, options);
    const duration = Date.now() - startTime;
    const contentType = response.headers.get('content-type') || '';

    let data;
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (e) {
        data = await response.text();
      }
    } else {
      data = await response.text();
    }

    const resHeaders = {};
    response.headers.forEach((value, key) => {
      resHeaders[key] = value;
    });

    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      duration,
      headers: resHeaders,
      data
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      duration: Date.now() - startTime
    };
  }
});

// --- IPC: AI Assistant & AGY (Antigravity CLI Sessions) ---
const brainDir = path.join(require('os').homedir(), '.gemini', 'antigravity-cli', 'brain');

ipcMain.handle('agy:listSessions', async () => {
  try {
    if (!fs.existsSync(brainDir)) return [];
    const entries = await fs.promises.readdir(brainDir, { withFileTypes: true });
    const sessions = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const transcriptPath = path.join(brainDir, entry.name, '.system_generated', 'logs', 'transcript.jsonl');
      if (fs.existsSync(transcriptPath)) {
        try {
          const stats = await fs.promises.stat(transcriptPath);
          const content = await fs.promises.readFile(transcriptPath, 'utf8');
          const lines = content.split('\n');
          let firstPrompt = '';
          let count = 0;

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const item = JSON.parse(line);
              if (item.type === 'USER_INPUT' && item.content) {
                count++;
                if (!firstPrompt) {
                  const m = item.content.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
                  firstPrompt = m ? m[1].trim() : item.content.trim();
                }
              }
            } catch (e) {}
          }

          sessions.push({
            id: entry.name,
            title: firstPrompt.slice(0, 90) || 'Session AGY sans titre',
            firstPrompt: firstPrompt || '',
            messageCount: count,
            updatedAt: stats.mtime.toISOString()
          });
        } catch (e) {}
      }
    }

    sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return sessions;
  } catch (err) {
    console.error('Error in agy:listSessions:', err);
    return [];
  }
});

ipcMain.handle('agy:getSessionDetails', async (_, sessionId) => {
  try {
    const file = path.join(brainDir, sessionId, '.system_generated', 'logs', 'transcript.jsonl');
    const fileFull = path.join(brainDir, sessionId, '.system_generated', 'logs', 'transcript_full.jsonl');
    if (!fs.existsSync(file)) return null;

    const lines = (await fs.promises.readFile(file, 'utf8')).split('\n');
    let linesFull = null;
    if (fs.existsSync(fileFull)) {
      linesFull = (await fs.promises.readFile(fileFull, 'utf8')).split('\n');
    }

    const turns = [];
    let currentTurn = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      try {
        let item = JSON.parse(line);
        if (item.truncated_fields && linesFull && linesFull[i]) {
          try { item = JSON.parse(linesFull[i]); } catch (e) {}
        }

        if (item.type === 'USER_INPUT' && item.content) {
          let text = item.content;
          const m = text.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
          if (m) text = m[1].trim();
          currentTurn = {
            id: 'turn-' + item.step_index,
            step: item.step_index,
            sender: 'user',
            text,
            timestamp: item.created_at,
            toolsUsed: [],
            assistantResponses: []
          };
          turns.push(currentTurn);
        } else if (item.source === 'MODEL' && item.type === 'PLANNER_RESPONSE') {
          if (item.tool_calls && item.tool_calls.length > 0 && currentTurn) {
            for (const tc of item.tool_calls) {
              let summary = tc.name;
              if (tc.args && tc.args.toolSummary) summary = String(tc.args.toolSummary).replace(/^"|"$/g, '');
              else if (tc.args && tc.args.Path) summary = tc.name + ': ' + path.basename(String(tc.args.Path).replace(/^"|"$/g, ''));
              else if (tc.args && tc.args.CommandLine) summary = 'run: ' + String(tc.args.CommandLine).replace(/^"|"$/g, '').slice(0, 45);
              currentTurn.toolsUsed.push({ name: tc.name, summary, step: item.step_index });
            }
          }
          if (item.content) {
            const resp = {
              id: 'resp-' + item.step_index,
              step: item.step_index,
              sender: 'assistant',
              text: item.content,
              timestamp: item.created_at
            };
            if (currentTurn) {
              currentTurn.assistantResponses.push(resp);
            } else {
              turns.push({
                id: 'turn-' + item.step_index,
                step: item.step_index,
                sender: 'assistant',
                text: item.content,
                timestamp: item.created_at,
                toolsUsed: [],
                assistantResponses: []
              });
            }
          }
        }
      } catch (e) {}
    }

    return {
      id: sessionId,
      turns
    };
  } catch (err) {
    console.error('Error reading session details:', err);
    return null;
  }
});

// Prompt AGY or Gemini
ipcMain.handle('ai:generateCode', async (_, { prompt, fileContext, fullCode, apiKey }) => {
  try {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      return {
        success: false,
        error: "Clé d'API Gemini manquante. Veuillez saisir votre clé d'API dans les réglages ou le volet IA."
      };
    }

    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Tu es l'assistant de programmation intelligent de l'IDE. 
L'utilisateur te demande de modifier ou générer du code pour le fichier actuel (${fileContext || 'fichier'}).

Instructions:
1. Réponds avec des explications claires et concises.
2. Si tu écris ou modifies du code, isole le code complet mis à jour ou les nouvelles fonctions dans un bloc markdown avec le langage approprié.
3. Sois efficace, précis et respecte les bonnes pratiques.

Code actuel du fichier:
\`\`\`
${fullCode || '// Fichier vide'}
\`\`\`

Demande de l'utilisateur:
${prompt}`
            }
          ]
        }
      ]
    });

    return {
      success: true,
      text: response.text
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// --- IPC: Process Terminal (Pseudo-Terminal via node-pty) ---
const activeProcesses = new Map();
const terminalHistoryBuffers = new Map();

ipcMain.on('terminal:spawn', (event, { id, cwd, cols, rows }) => {
  // If a pty with this id already exists, replay recent buffer so the terminal displays previous output
  if (activeProcesses.has(id)) {
    const existing = activeProcesses.get(id);
    if (cols > 0 && rows > 0) {
      try { existing.resize(cols, rows); } catch (e) {}
    }
    const buf = terminalHistoryBuffers.get(id);
    if (buf && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(`terminal:data:${id}`, buf);
    }
    return;
  }

  const shell = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : (process.env.SHELL || 'bash');
  const targetCwd = cwd && fs.existsSync(cwd) ? cwd : process.env.USERPROFILE || process.cwd();

  try {
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: Math.max(cols || 80, 20),
      rows: Math.max(rows || 24, 5),
      cwd: targetCwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor'
      }
    });

    terminalHistoryBuffers.set(id, '');

    ptyProcess.onData((data) => {
      // Keep last 50KB in buffer
      const prev = terminalHistoryBuffers.get(id) || '';
      terminalHistoryBuffers.set(id, (prev + data).slice(-50000));

      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send(`terminal:data:${id}`, data);
      }
    });

    ptyProcess.onExit(({ exitCode }) => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send(`terminal:exit:${id}`, exitCode);
      }
      activeProcesses.delete(id);
      terminalHistoryBuffers.delete(id);
    });

    activeProcesses.set(id, ptyProcess);
  } catch (err) {
    console.error('Failed to spawn pty:', err);
  }
});

ipcMain.on('terminal:write', (_, { id, data }) => {
  const ptyProcess = activeProcesses.get(id);
  if (ptyProcess) {
    ptyProcess.write(data);
  }
});

ipcMain.on('terminal:resize', (_, { id, cols, rows }) => {
  const ptyProcess = activeProcesses.get(id);
  if (ptyProcess && cols > 0 && rows > 0) {
    try {
      ptyProcess.resize(cols, rows);
    } catch (e) {}
  }
});

ipcMain.on('terminal:kill', (_, id) => {
  const ptyProcess = activeProcesses.get(id);
  if (ptyProcess) {
    try {
      ptyProcess.kill();
    } catch (e) {}
    activeProcesses.delete(id);
  }
});
