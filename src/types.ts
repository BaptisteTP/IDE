export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileItem[];
}

export interface GitRemote {
  name: string;
  refs: {
    fetch: string;
    push: string;
  };
}

export interface GitStatus {
  isRepo: boolean;
  actualRepoPath?: string;
  currentBranch?: string;
  branches?: string[];
  modified?: string[];
  not_added?: string[];
  staged?: string[];
  deleted?: string[];
  ahead?: number;
  behind?: number;
  remotes?: GitRemote[];
  error?: string;
}

export interface GitCommitItem {
  hash: string;
  date: string;
  message: string;
  author_name: string;
}

export interface TerminalTab {
  id: string;
  title: string;
  cwd?: string;
}

export interface AgySessionSummary {
  id: string;
  title: string;
  firstPrompt: string;
  messageCount: number;
  updatedAt: string;
}

export interface AgyToolCall {
  name: string;
  summary: string;
  step: number;
}

export interface AgyTurn {
  id: string;
  step: number;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  toolsUsed: AgyToolCall[];
  assistantResponses: {
    id: string;
    step: number;
    sender: 'assistant';
    text: string;
    timestamp: string;
  }[];
}

export interface AgySessionDetails {
  id: string;
  turns: AgyTurn[];
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  extractedCode?: string;
}

export interface HttpRequestOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  body?: string;
}

export interface HttpResponseResult {
  success: boolean;
  status?: number;
  statusText?: string;
  duration?: number;
  headers?: Record<string, string>;
  data?: any;
  error?: string;
}

export interface ExecutionLogItem {
  id: string;
  command: string;
  type: 'run' | 'build' | 'test' | 'custom';
  cwd: string;
  targetFile?: string;
  startTime: string;
  duration?: number;
  status: 'running' | 'success' | 'error';
  exitCode?: number | null;
  output: string;
  errors: string[];
}

export type IDETheme = 'dark-modern' | 'midnight' | 'cyberpunk' | 'monokai' | 'dracula' | 'nord' | 'light';

export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  autoSave: boolean;
  lineNumbers: boolean;
  theme: IDETheme;
}

export interface ProjectTechnicalSettings {
  buildCommand: string;
  runCommand: string;
  testCommand: string;
  envVariables: Record<string, string>;
  projectType?: 'node' | 'python' | 'rust' | 'c_cpp' | 'go' | 'custom';
  nodeVersion?: string;
  pythonVenv?: string;
}

export interface AppSettings extends EditorSettings, ProjectTechnicalSettings {
  geminiApiKey: string;
}

declare global {
  interface Window {
    api?: {
      openFolderDialog: () => Promise<string | null>;
      readDir: (dirPath: string) => Promise<FileItem[]>;
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<{ success: boolean }>;
      createFile: (filePath: string) => Promise<{ success: boolean }>;

      gitInit: (repoPath: string) => Promise<{ success: boolean; error?: string }>;
      gitClone: (targetDir: string, repoUrl: string) => Promise<{ success: boolean; error?: string }>;
      gitAddRemote: (repoPath: string, name: string, url: string) => Promise<{ success: boolean; error?: string }>;
      getGitStatus: (repoPath: string) => Promise<GitStatus>;
      gitCommit: (repoPath: string, message: string) => Promise<{ success: boolean; error?: string }>;
      gitPush: (repoPath: string, branch?: string) => Promise<{ success: boolean; error?: string }>;
      gitPull: (repoPath: string) => Promise<{ success: boolean; error?: string }>;
      gitCheckout: (repoPath: string, branch: string, create?: boolean, startPoint?: string) => Promise<{ success: boolean; error?: string }>;
      getGitLog: (repoPath: string) => Promise<GitCommitItem[]>;

      httpRequest: (params: HttpRequestOptions) => Promise<HttpResponseResult>;

      generateCode: (params: {
        prompt: string;
        fileContext?: string;
        fullCode?: string;
        apiKey?: string;
      }) => Promise<{ success: boolean; text?: string; error?: string }>;
      listAgySessions: () => Promise<AgySessionSummary[]>;
      getAgySessionDetails: (sessionId: string) => Promise<AgySessionDetails | null>;

      spawnTerminal: (id: string, cwd?: string, cols?: number, rows?: number) => void;
      writeTerminal: (id: string, data: string) => void;
      resizeTerminal: (id: string, cols: number, rows: number) => void;
      killTerminal: (id: string) => void;
      onTerminalData: (id: string, callback: (data: string) => void) => () => void;
      onTerminalExit: (id: string, callback: (code: number) => void) => () => void;
    };
  }
}
