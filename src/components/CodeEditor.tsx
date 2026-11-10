import React, { useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { Eye, Code, Save, Check, X, FileText, SplitSquareHorizontal } from 'lucide-react';
import { FileIcon } from './FileIcon';
import { MarkdownViewer } from './MarkdownViewer';
import { OpenTab } from '../types';

interface CodeEditorProps {
  tabs: OpenTab[];
  activeFilePath: string | null;
  onSelectTab: (filePath: string) => void;
  onCloseTab: (filePath: string) => void;
  onChange: (val: string) => void;
  onSave: () => void;
  fontSize?: number;
  fontFamily?: string;
  tabSize?: number;
  wordWrap?: boolean;
  minimap?: boolean;
  lineNumbers?: boolean;
  monacoTheme?: string;
}

function getLanguageFromPath(filePath: string | null): string {
  if (!filePath) return 'plaintext';
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'mjs':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'rs':
      return 'rust';
    case 'c':
    case 'h':
      return 'c';
    case 'cpp':
    case 'hpp':
    case 'cc':
      return 'cpp';
    case 'json':
      return 'json';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'sh':
    case 'bash':
      return 'shell';
    case 'sql':
      return 'sql';
    case 'yaml':
    case 'yml':
      return 'yaml';
    default:
      return 'plaintext';
  }
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  tabs,
  activeFilePath,
  onSelectTab,
  onCloseTab,
  onChange,
  onSave,
  fontSize = 14,
  fontFamily = 'Consolas, "Fira Code", monospace',
  tabSize = 2,
  wordWrap = true,
  minimap = true,
  lineNumbers = true,
  monacoTheme = 'vs-dark'
}) => {
  const activeTab = tabs.find((t) => t.filePath === activeFilePath) || tabs[0] || null;
  const filePath = activeTab?.filePath || null;
  const content = activeTab?.content || '';
  const isDirty = !!activeTab?.isDirty;

  const isMarkdown = filePath?.toLowerCase().endsWith('.md');
  const [markdownViewMode, setMarkdownViewMode] = useState<'both' | 'preview' | 'code'>('both');
  const language = getLanguageFromPath(filePath);

  const handleEditorMount = (_editor: any, monaco: Monaco) => {
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    });
  };

  if (tabs.length === 0 || !activeTab) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#161618] border border-neutral-800/80 rounded-2xl m-2 shadow-xl select-none text-neutral-500">
        <div className="p-4 rounded-2xl bg-[#1d1d21] border border-neutral-800 mb-3 shadow">
          <FileText size={32} className="text-neutral-600" />
        </div>
        <p className="text-sm font-medium text-neutral-400">Aucun fichier ouvert</p>
        <p className="text-xs text-neutral-500 mt-1">
          Sélectionnez un fichier dans l&apos;explorateur ou utilisez <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[11px] text-neutral-300">Ctrl+P</kbd>
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#161618] border border-neutral-800/80 rounded-2xl m-2 shadow-xl overflow-hidden">
      {/* Real Multi-Tabs Bar */}
      <div className="flex items-center justify-between bg-[#19191c] border-b border-neutral-800 text-xs px-2 pt-1.5 select-none overflow-x-auto">
        <div className="flex items-center gap-1 overflow-x-auto max-w-[80%] pb-1 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = tab.filePath === activeFilePath;
            return (
              <div
                key={tab.filePath}
                onClick={() => onSelectTab(tab.filePath)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-xl cursor-pointer text-xs font-medium border-t border-x transition shrink-0 ${
                  isActive
                    ? 'bg-[#161618] border-neutral-700 text-white shadow-sm'
                    : 'bg-[#1e1e22]/60 hover:bg-[#222226] border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <FileIcon fileName={tab.fileName} size={14} />
                <span className="truncate max-w-[140px]">{tab.fileName}</span>
                {tab.isDirty ? (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.filePath);
                    }}
                    className="w-2.5 h-2.5 rounded-full bg-blue-500 hover:bg-red-400 group-hover:scale-110 transition flex items-center justify-center cursor-pointer"
                    title="Modifié - Cliquer pour fermer"
                  />
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.filePath);
                    }}
                    title="Fermer l'onglet (Ctrl+W)"
                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-neutral-700/80 hover:text-white text-neutral-500 transition"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Action buttons (Save, Markdown, Language) */}
        <div className="flex items-center gap-2 pb-1 shrink-0 ml-2">
          {isMarkdown && (
            <div className="flex items-center bg-[#242428] rounded-lg p-0.5 border border-neutral-700">
              <button
                onClick={() => setMarkdownViewMode('code')}
                className={`px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 font-medium transition ${
                  markdownViewMode === 'code' ? 'bg-[#37373d] text-white shadow' : 'text-neutral-400'
                }`}
              >
                <Code size={12} /> Code
              </button>
              <button
                onClick={() => setMarkdownViewMode('both')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                  markdownViewMode === 'both' ? 'bg-[#37373d] text-white shadow' : 'text-neutral-400'
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setMarkdownViewMode('preview')}
                className={`px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 font-medium transition ${
                  markdownViewMode === 'preview' ? 'bg-[#37373d] text-white shadow' : 'text-neutral-400'
                }`}
              >
                <Eye size={12} /> Rendu
              </button>
            </div>
          )}

          <span className="text-[10px] text-blue-400 font-semibold uppercase px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20">
            {language}
          </span>

          <button
            onClick={onSave}
            disabled={!isDirty}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              isDirty
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                : 'text-neutral-500 hover:text-neutral-400'
            }`}
          >
            {isDirty ? <Save size={13} /> : <Check size={13} />}
            <span>{isDirty ? 'Enregistrer' : 'À jour'}</span>
          </button>
        </div>
      </div>

      {/* Editor or Markdown Split */}
      <div className="flex-1 flex overflow-hidden">
        {(!isMarkdown || markdownViewMode !== 'preview') && (
          <div className="flex-1 h-full min-w-0">
            <Editor
              height="100%"
              language={language}
              value={content}
              theme={monacoTheme}
              onChange={(value) => onChange(value || '')}
              onMount={handleEditorMount}
              options={{
                fontSize,
                fontFamily,
                minimap: { enabled: minimap },
                lineNumbers: lineNumbers ? 'on' : 'off',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                wordWrap: wordWrap ? 'on' : 'off',
                tabSize,
                cursorBlinking: 'smooth',
                quickSuggestions: true,
                suggestOnTriggerCharacters: true
              }}
            />
          </div>
        )}

        {isMarkdown && markdownViewMode !== 'code' && (
          <div className="flex-1 h-full min-w-0 border-l border-neutral-800">
            <MarkdownViewer content={content} filePath={filePath} />
          </div>
        )}
      </div>
    </div>
  );
};