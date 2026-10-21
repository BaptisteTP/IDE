import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Files,
  GitBranch,
  Terminal as TerminalIcon,
  FolderOpen,
  Plus,
  X,
  Sparkles,
  Globe,
  Settings,
  Play,
  Wrench,
  Check,
  ListOrdered,
  Layers,
  ChevronDown
} from 'lucide-react';
import { FileItem, GitStatus, TerminalTab, AppSettings, ExecutionLogItem } from './types';
import { THEMES, ThemeConfig } from './theme';
import { FileExplorer } from './components/FileExplorer';
import { GitPanel } from './components/GitPanel';
import { CodeEditor } from './components/CodeEditor';
import { TerminalView } from './components/TerminalView';
import { AIAssistant } from './components/AIAssistant';
import { HttpTester } from './components/HttpTester';
import { SettingsModal } from './components/SettingsModal';
import { GitInitPromptModal } from './components/GitInitPromptModal';
import { ExecutionLogsPanel } from './components/ExecutionLogsPanel';
import { RunLauncherModal } from './components/RunLauncherModal';

const DEFAULT_SETTINGS: AppSettings = {
  fontSize: 14,
  fontFamily: 'Consolas, "Fira Code", monospace',
  tabSize: 2,
  wordWrap: true,
  minimap: true,
  autoSave: false,
  lineNumbers: true,
  theme: 'dark-modern',
  projectType: 'node',
  buildCommand: 'npm run build',
  runCommand: 'npm run dev',
  testCommand: 'npm test',
  envVariables: {},
  geminiApiKey: localStorage.getItem('gemini_api_key') || ''
};

export function App() {
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeSidePanel, setActiveSidePanel] = useState<'files' | 'git' | 'ai' | 'http' | 'logs' | null>('files');

  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem('ide_settings');
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);

  // File editing state
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');

  // Git state
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [showGitInitPrompt, setShowGitInitPrompt] = useState(false);
  const [isGitInitLoading, setIsGitInitLoading] = useState(false);
  const checkedWorkspacesRef = useRef<Set<string>>(new Set());

  // Execution History & Error Tracker
  const [executionLogs, setExecutionLogs] = useState<ExecutionLogItem[]>(() => {
    try {
      const stored = localStorage.getItem('ide_execution_logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Terminals state (Multi-window / Multi-tab)
  const [terminals, setTerminals] = useState<TerminalTab[]>([
    { id: 'term-1', title: 'Terminal 1' }
  ]);
  const [activeTerminalId, setActiveTerminalId] = useState<string>('term-1');
  const [showTerminalPanel, setShowTerminalPanel] = useState<boolean>(true);

  // Resizable panels state
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    return parseInt(localStorage.getItem('ide_sidebar_width') || '300', 10);
  });
  const [terminalHeight, setTerminalHeight] = useState<number>(() => {
    return parseInt(localStorage.getItem('ide_terminal_height') || '256', 10);
  });

  const isResizingSidebar = useRef(false);
  const isResizingTerminal = useRef(false);

  const themeConfig: ThemeConfig = THEMES[settings.theme] || THEMES['dark-modern'];

  // Save logs to localStorage
  const saveLogs = (newLogs: ExecutionLogItem[]) => {
    setExecutionLogs(newLogs);
    localStorage.setItem('ide_execution_logs', JSON.stringify(newLogs.slice(0, 50)));
  };

  // Refresh directory tree
  const refreshFiles = useCallback(async () => {
    if (!workspacePath || !window.api) return;
    const tree = await window.api.readDir(workspacePath);
    setFiles(tree);
  }, [workspacePath]);

  // Refresh git status and detect git
  const refreshGit = useCallback(async () => {
    if (!workspacePath || !window.api) return;
    const status = await window.api.getGitStatus(workspacePath);
    setGitStatus(status);

    if (!status.isRepo && !checkedWorkspacesRef.current.has(workspacePath)) {
      checkedWorkspacesRef.current.add(workspacePath);
      setShowGitInitPrompt(true);
    }
  }, [workspacePath]);

  // Open Folder
  const handleOpenFolder = async () => {
    if (!window.api) return;
    const folder = await window.api.openFolderDialog();
    if (folder) {
      setWorkspacePath(folder);
      setActiveFilePath(null);
      setFileContent('');
      setOriginalContent('');
    }
  };

  useEffect(() => {
    if (workspacePath) {
      refreshFiles();
      refreshGit();
    }
  }, [workspacePath, refreshFiles, refreshGit]);

  // Handle Git Init from modal
  const handleConfirmGitInit = async () => {
    if (!workspacePath || !window.api) return;
    setIsGitInitLoading(true);
    try {
      const res = await window.api.gitInit(workspacePath);
      if (res.success) {
        setShowGitInitPrompt(false);
        await refreshGit();
        await refreshFiles();
      } else {
        alert("Erreur lors de l'initialisation de Git : " + res.error);
      }
    } finally {
      setIsGitInitLoading(false);
    }
  };

  // Select File to view/edit
  const handleSelectFile = async (filePath: string) => {
    if (!window.api) return;
    try {
      const content = await window.api.readFile(filePath);
      setActiveFilePath(filePath);
      setFileContent(content);
      setOriginalContent(content);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Save current file
  const handleSaveFile = useCallback(async () => {
    if (!activeFilePath || !window.api) return;
    try {
      await window.api.writeFile(activeFilePath, fileContent);
      setOriginalContent(fileContent);
      refreshGit();
    } catch (err: any) {
      alert(err.message);
    }
  }, [activeFilePath, fileContent, refreshGit]);

  // Auto-save logic
  useEffect(() => {
    if (!settings.autoSave || !activeFilePath || fileContent === originalContent) return;
    const timer = setTimeout(() => {
      handleSaveFile();
    }, 1500);
    return () => clearTimeout(timer);
  }, [fileContent, originalContent, activeFilePath, settings.autoSave, handleSaveFile]);

  // Terminals Management
  const handleAddTerminal = (title?: string, customCwd?: string) => {
    const nextNum = terminals.length + 1;
    const newId = `term-${Date.now()}`;
    const newTab: TerminalTab = {
      id: newId,
      title: title || `Terminal ${nextNum}`,
      cwd: customCwd || workspacePath || undefined
    };
    setTerminals((prev) => [...prev, newTab]);
    setActiveTerminalId(newId);
    return newId;
  };

  const handleCloseTerminal = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (terminals.length === 1) return;
    if (window.api) window.api.killTerminal(id);
    const filtered = terminals.filter((t) => t.id !== id);
    setTerminals(filtered);
    if (activeTerminalId === id) {
      setActiveTerminalId(filtered[0].id);
    }
  };

  // Execute command with history tracking and custom terminal
  const executeTrackedCommand = (
    cmd: string,
    type: 'run' | 'build' | 'test' | 'custom',
    customCwd?: string,
    targetFile?: string
  ) => {
    const runCwd = customCwd || workspacePath || '';
    const logId = `exec-${Date.now()}`;
    const startTimeDate = new Date();
    const startTimeStr = startTimeDate.toLocaleTimeString();

    // 1. Create new terminal specifically for this run
    const terminalTitle = `${type.toUpperCase()}: ${cmd.slice(0, 15)}`;
    const termId = handleAddTerminal(terminalTitle, runCwd);
    setShowTerminalPanel(true);

    const newLogItem: ExecutionLogItem = {
      id: logId,
      command: cmd,
      type,
      cwd: runCwd,
      targetFile,
      startTime: startTimeStr,
      status: 'running',
      output: `> ${cmd}\r\n`,
      errors: []
    };

    saveLogs([newLogItem, ...executionLogs]);

    // Send command to the newly spawned terminal after short delay
    setTimeout(() => {
      if (window.api) {
        window.api.writeTerminal(termId, `${cmd}\r\n`);
      }
    }, 400);

    // Track output and errors from terminal stream
    let accumulatedOutput = `> ${cmd}\r\n`;
    const foundErrors: string[] = [];

    const cleanupData = window.api?.onTerminalData(termId, (data) => {
      accumulatedOutput += data;
      // Detect error patterns
      const lines = data.split('\n');
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (
          /error|exception|failed|fatal|errno|cannot find|syntaxerror|typeerror/i.test(trimmed) &&
          trimmed.length > 5 &&
          !trimmed.startsWith('>')
        ) {
          if (!foundErrors.includes(trimmed)) {
            foundErrors.push(trimmed.slice(0, 120));
          }
        }
      });

      setExecutionLogs((prev) =>
        prev.map((item) =>
          item.id === logId
            ? {
                ...item,
                output: accumulatedOutput,
                errors: [...foundErrors],
                status: foundErrors.length > 0 ? 'error' : item.status
              }
            : item
        )
      );
    });

    const cleanupExit = window.api?.onTerminalExit(termId, (code) => {
      const duration = Date.now() - startTimeDate.getTime();
      const finalStatus: 'success' | 'error' = (code === 0 && foundErrors.length === 0) ? 'success' : 'error';

      setExecutionLogs((prev) => {
        const updated: ExecutionLogItem[] = prev.map((item) =>
          item.id === logId
            ? {
                ...item,
                exitCode: code,
                duration,
                status: finalStatus,
                output: accumulatedOutput + `\r\n[Terminé avec code ${code}]`,
                errors: foundErrors
              }
            : item
        );
        localStorage.setItem('ide_execution_logs', JSON.stringify(updated.slice(0, 50)));
        return updated;
      });

      if (cleanupData) cleanupData();
      if (cleanupExit) cleanupExit();
    });
  };

  // Launch File execution directly
  const handleRunFile = (filePath: string) => {
    const fileName = filePath.split(/[\\/]/).pop() || '';
    const ext = fileName.split('.').pop()?.toLowerCase();
    const dir = filePath.substring(0, Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\')));

    let cmd = `node "${fileName}"`;
    if (ext === 'py') cmd = `python "${fileName}"`;
    else if (ext === 'ts') cmd = `npx ts-node "${fileName}"`;
    else if (ext === 'sh') cmd = `bash "${fileName}"`;
    else if (ext === 'rs') cmd = `cargo run`;

    executeTrackedCommand(cmd, 'run', dir, filePath);
  };

  // Save Settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('ide_settings', JSON.stringify(newSettings));
    if (newSettings.geminiApiKey) {
      localStorage.setItem('gemini_api_key', newSettings.geminiApiKey);
    }
  };

  // Global keyboard shortcuts (Ctrl+S for save, Ctrl+, for settings)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveFile();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveFile]);

  // Resizing mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar.current) {
        const newWidth = Math.max(200, Math.min(e.clientX - 56, 800));
        setSidebarWidth(newWidth);
      } else if (isResizingTerminal.current) {
        const newHeight = Math.max(100, Math.min(window.innerHeight - e.clientY - 36, window.innerHeight * 0.8));
        setTerminalHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      if (isResizingSidebar.current) {
        isResizingSidebar.current = false;
        document.body.style.cursor = 'default';
        setSidebarWidth((w) => {
          localStorage.setItem('ide_sidebar_width', w.toString());
          return w;
        });
      }
      if (isResizingTerminal.current) {
        isResizingTerminal.current = false;
        document.body.style.cursor = 'default';
        setTerminalHeight((h) => {
          localStorage.setItem('ide_terminal_height', h.toString());
          return h;
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className={`flex flex-col h-screen w-screen ${themeConfig.styles.bgApp} ${themeConfig.styles.textPrimary} select-none overflow-hidden p-2 gap-2 transition-colors duration-300`}>
      {/* Top Application Bar */}
      <header className={`h-10 ${themeConfig.styles.bgHeader} border ${themeConfig.styles.border} rounded-2xl flex items-center justify-between px-4 text-xs shadow-md`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-sm" />
            <span className="font-bold tracking-wider bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              ANTIGRAVITY IDE
            </span>
          </div>

          <div className="h-4 w-[1px] bg-neutral-800 mx-1" />

          <button
            onClick={handleOpenFolder}
            className={`flex items-center gap-1.5 px-3 py-1 ${themeConfig.styles.bgInput} hover:opacity-90 rounded-xl ${themeConfig.styles.textSecondary} hover:${themeConfig.styles.textPrimary} transition shadow-sm font-medium`}
          >
            <FolderOpen size={13} className={themeConfig.styles.accent} />
            <span>Ouvrir un dossier</span>
          </button>

          {workspacePath && (
            <span className="text-neutral-400 font-mono text-[11px] bg-black/20 px-2.5 py-0.5 rounded-lg border border-neutral-800/80 truncate max-w-sm">
              {workspacePath}
            </span>
          )}

          {/* Quick Technical Run & Build buttons */}
          <div className="flex items-center gap-1">
            {settings.runCommand && (
              <button
                onClick={() => executeTrackedCommand(settings.runCommand, 'run', workspacePath || undefined)}
                title={`Lancer: ${settings.runCommand}`}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 rounded-l-xl font-medium border border-emerald-500/30 transition text-[11px]"
              >
                <Play size={11} fill="currentColor" />
                <span>Run</span>
              </button>
            )}

            <button
              onClick={() => setIsRunModalOpen(true)}
              title="Configurer une exécution personnalisée (cible, fichier, dossier)"
              className="px-1.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 rounded-r-xl border border-l-0 border-emerald-500/30 transition text-[11px]"
            >
              <ChevronDown size={12} />
            </button>
          </div>

          {settings.buildCommand && (
            <button
              onClick={() => executeTrackedCommand(settings.buildCommand, 'build', workspacePath || undefined)}
              title={`Compiler: ${settings.buildCommand}`}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 rounded-xl font-medium border border-blue-500/30 transition text-[11px]"
            >
              <Wrench size={11} />
              <span>Build</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Execution Logs & Errors button */}
          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'logs' ? null : 'logs')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition shadow-sm ${
              activeSidePanel === 'logs'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-amber-500/20'
                : `${themeConfig.styles.bgInput} hover:opacity-90 ${themeConfig.styles.textSecondary}`
            }`}
          >
            <ListOrdered size={13} className="text-amber-400" />
            <span>Logs & Erreurs</span>
            {executionLogs.filter((l) => l.status === 'error').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {executionLogs.filter((l) => l.status === 'error').length}
              </span>
            )}
          </button>

          {/* Postman-like HTTP Tester button */}
          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'http' ? null : 'http')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition shadow-sm ${
              activeSidePanel === 'http'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/20'
                : `${themeConfig.styles.bgInput} hover:opacity-90 ${themeConfig.styles.textSecondary}`
            }`}
          >
            <Globe size={13} className="text-emerald-400" />
            <span>API Tester</span>
          </button>

          {/* AI Assistant button */}
          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'ai' ? null : 'ai')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition shadow-sm ${
              activeSidePanel === 'ai'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-purple-500/20'
                : `${themeConfig.styles.bgInput} hover:opacity-90 ${themeConfig.styles.textSecondary}`
            }`}
          >
            <Sparkles size={13} className="text-purple-400" />
            <span>Assistant IA</span>
          </button>

          {/* Settings modal trigger */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`p-1.5 rounded-xl border border-transparent transition text-neutral-400 hover:${themeConfig.styles.textPrimary} hover:${themeConfig.styles.bgInput}`}
            title="Paramètres simples & configurations techniques (Ctrl+,)"
          >
            <Settings size={15} />
          </button>

          {/* Toggle terminal panel */}
          <button
            onClick={() => setShowTerminalPanel(!showTerminalPanel)}
            className={`p-1.5 rounded-xl border border-transparent transition ${
              showTerminalPanel ? 'bg-blue-600/20 border-blue-500/30 text-blue-400' : 'text-neutral-400 hover:opacity-80'
            }`}
            title="Afficher/Masquer le panneau terminal"
          >
            <TerminalIcon size={15} />
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden gap-2">
        {/* Left Activity Bar (Sidebar icons) */}
        <aside className={`w-12 ${themeConfig.styles.bgSidebar} border ${themeConfig.styles.border} rounded-2xl flex flex-col items-center py-3 gap-3 shadow-md`}>
          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'files' ? null : 'files')}
            title="Explorateur de fichiers"
            className={`p-2 rounded-xl transition ${
              activeSidePanel === 'files'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            <Files size={18} />
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'git' ? null : 'git')}
            title="Gestionnaire Git & Versions"
            className={`p-2 rounded-xl relative transition ${
              activeSidePanel === 'git'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            <GitBranch size={18} />
            {gitStatus?.isRepo && ((gitStatus.modified?.length || 0) + (gitStatus.not_added?.length || 0) > 0) && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[#161618]" />
            )}
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'logs' ? null : 'logs')}
            title="Historique & Erreurs d'Exécution"
            className={`p-2 rounded-xl relative transition ${
              activeSidePanel === 'logs'
                ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            <ListOrdered size={18} />
            {executionLogs.filter((l) => l.status === 'error').length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#161618]" />
            )}
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'http' ? null : 'http')}
            title="Testeur de requêtes HTTP (Postman)"
            className={`p-2 rounded-xl transition ${
              activeSidePanel === 'http'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            <Globe size={18} />
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'ai' ? null : 'ai')}
            title="Générateur de code IA (Claude/Gemini style)"
            className={`p-2 rounded-xl transition ${
              activeSidePanel === 'ai'
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            <Sparkles size={18} />
          </button>

          <div className="mt-auto">
            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Paramètres de l'IDE"
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 transition"
            >
              <Settings size={18} />
            </button>
          </div>
        </aside>

        {/* Dynamic Resizable Left Panel */}
        {activeSidePanel && (
          <div className="flex relative items-stretch" style={{ width: `${sidebarWidth}px` }}>
            <div className="flex-1 h-full min-w-0">
              {activeSidePanel === 'files' && (
                <FileExplorer
                  items={files}
                  onSelectFile={handleSelectFile}
                  activeFilePath={activeFilePath || undefined}
                  onRefresh={refreshFiles}
                  workspacePath={workspacePath}
                  onRunFile={handleRunFile}
                />
              )}

              {activeSidePanel === 'git' && (
                <GitPanel
                  workspacePath={workspacePath}
                  status={gitStatus}
                  onRefresh={refreshGit}
                />
              )}

              {activeSidePanel === 'logs' && (
                <ExecutionLogsPanel
                  logs={executionLogs}
                  onClearLogs={() => saveLogs([])}
                  onRerun={(log) => executeTrackedCommand(log.command, log.type, log.cwd, log.targetFile)}
                  themeConfig={themeConfig}
                />
              )}

              {activeSidePanel === 'http' && (
                <HttpTester themeConfig={themeConfig} />
              )}

              {activeSidePanel === 'ai' && (
                <AIAssistant
                  currentFile={activeFilePath}
                  currentCode={fileContent}
                  onApplyCode={(newCode) => {
                    setFileContent(newCode);
                  }}
                  onRunTechnicalCommand={(cmd) => executeTrackedCommand(cmd, 'custom')}
                  workspacePath={workspacePath}
                />
              )}
            </div>

            {/* Vertical Resize Handle */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                isResizingSidebar.current = true;
                document.body.style.cursor = 'col-resize';
              }}
              className="w-2 -mr-1 cursor-col-resize hover:bg-blue-500/30 active:bg-blue-500/60 transition-colors z-20 flex items-center justify-center group"
              title="Glisser pour redimensionner le panneau"
            >
              <div className="w-[2px] h-8 rounded-full bg-neutral-700 group-hover:bg-blue-400 group-active:bg-blue-300" />
            </div>
          </div>
        )}

        {/* Center: Editor + Bottom Multi-Terminals */}
        <main className="flex-1 flex flex-col min-w-0 gap-2">
          {/* Editor Area */}
          <div className="flex-1 min-h-0">
            <CodeEditor
              filePath={activeFilePath}
              content={fileContent}
              onChange={setFileContent}
              onSave={handleSaveFile}
              isDirty={fileContent !== originalContent}
              fontSize={settings.fontSize}
              fontFamily={settings.fontFamily}
              tabSize={settings.tabSize}
              wordWrap={settings.wordWrap}
              minimap={settings.minimap}
              lineNumbers={settings.lineNumbers}
              monacoTheme={themeConfig.monacoTheme}
            />
          </div>

          {/* Bottom Terminal Section (Multi-window / Multi-tab / Resizable) */}
          {showTerminalPanel && (
            <div
              style={{ height: `${terminalHeight}px` }}
              className={`relative ${themeConfig.styles.bgPanel} border ${themeConfig.styles.border} rounded-2xl flex flex-col shadow-xl overflow-hidden m-2 mt-0 shrink-0`}
            >
              {/* Horizontal Resize Handle on top of Terminal */}
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  isResizingTerminal.current = true;
                  document.body.style.cursor = 'row-resize';
                }}
                className="h-2 w-full cursor-row-resize hover:bg-blue-500/30 active:bg-blue-500/60 transition-colors z-20 flex items-center justify-center group absolute top-0 inset-x-0"
                title="Glisser pour redimensionner la hauteur du terminal"
              >
                <div className="h-[2px] w-12 rounded-full bg-neutral-700 group-hover:bg-blue-400 group-active:bg-blue-300" />
              </div>

              {/* Terminal Tabs Header */}
              <div className={`flex items-center justify-between ${themeConfig.styles.bgHeader} border-b ${themeConfig.styles.border} px-3 py-1.5 pt-2`}>
                <div className="flex items-center gap-1 overflow-x-auto">
                  {terminals.map((term) => (
                    <div
                      key={term.id}
                      onClick={() => setActiveTerminalId(term.id)}
                      className={`flex items-center gap-2 px-3 py-1 cursor-pointer text-xs rounded-lg select-none transition ${
                        activeTerminalId === term.id
                          ? `${themeConfig.styles.bgInput} ${themeConfig.styles.textPrimary} font-medium border border-neutral-700 shadow-sm`
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <TerminalIcon size={12} className={themeConfig.styles.accent} />
                      <span>{term.title}</span>
                      {terminals.length > 1 && (
                        <button
                          onClick={(e) => handleCloseTerminal(term.id, e)}
                          className="hover:text-red-400 rounded p-0.5 ml-1"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => handleAddTerminal()}
                    title="Nouveau terminal"
                    className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  onClick={() => setShowTerminalPanel(false)}
                  title="Masquer le terminal"
                  className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Terminal Viewports */}
              <div className="flex-1 relative overflow-hidden p-2 bg-[#0d0d0f]">
                {terminals.map((term) => (
                  <div
                    key={term.id}
                    className={`absolute inset-0 p-2 ${activeTerminalId === term.id ? 'block' : 'hidden'}`}
                  >
                    <TerminalView id={term.id} cwd={term.cwd || workspacePath || undefined} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer / Status Bar */}
      <footer className={`h-7 ${themeConfig.styles.bgHeader} border ${themeConfig.styles.border} rounded-xl text-neutral-400 flex items-center justify-between px-3 text-[11px] select-none shadow-sm`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-medium text-neutral-300">
            <GitBranch size={12} className={themeConfig.styles.accent} />
            <span>{gitStatus?.currentBranch || (gitStatus?.isRepo ? 'Dépôt Git actif' : 'Pas de dépôt Git')}</span>
          </div>
          {workspacePath && (
            <span className="text-neutral-400">
              Modifiés : <span className="text-white font-semibold">{gitStatus?.modified?.length || 0}</span>
            </span>
          )}
          <span className="text-neutral-500">|</span>
          <span className="text-neutral-400">
            Thème : <span className="text-white font-medium">{themeConfig.name}</span>
          </span>
          {settings.projectType && (
            <span className="text-neutral-400 hidden sm:inline">
              Type : <span className="text-white font-medium uppercase">{settings.projectType}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {settings.autoSave && (
            <span className="text-emerald-400 font-medium text-[10px] flex items-center gap-1">
              <Check size={11} /> AutoSave
            </span>
          )}
          <span>UTF-8</span>
          <span className="font-semibold text-neutral-300">
            {activeFilePath ? activeFilePath.split('.').pop()?.toUpperCase() : 'TEXTE'}
          </span>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        themeConfig={themeConfig}
        workspacePath={workspacePath}
        onRunTechnicalCommand={(cmd) => executeTrackedCommand(cmd, 'custom')}
      />

      {/* Custom Run Launcher Modal */}
      <RunLauncherModal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        workspacePath={workspacePath}
        activeFilePath={activeFilePath}
        onLaunch={(cmd, cwd, targetFile) => executeTrackedCommand(cmd, 'run', cwd, targetFile)}
        defaultRunCommand={settings.runCommand}
      />

      {/* Automatic Git Init Prompt Modal */}
      <GitInitPromptModal
        isOpen={showGitInitPrompt}
        folderPath={workspacePath}
        onConfirm={handleConfirmGitInit}
        onCancel={() => setShowGitInitPrompt(false)}
        loading={isGitInitLoading}
      />
    </div>
  );
}

export default App;
