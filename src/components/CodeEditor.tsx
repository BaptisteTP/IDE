import React, { useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { Eye, Code, Save, Check } from 'lucide-react';
import { FileIcon } from './FileIcon';
import { MarkdownViewer } from './MarkdownViewer';

interface CodeEditorProps {
  filePath: string | null;
  content: string;
  onChange: (val: string) => void;
  onSave: () => void;
  isDirty: boolean;
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
  filePath,
  content,
  onChange,
  onSave,
  isDirty,
  fontSize = 14,
  fontFamily = 'Consolas, "Fira Code", monospace',
  tabSize = 2,
  wordWrap = true,
  minimap = true,
  lineNumbers = true,
  monacoTheme = 'vs-dark'
}) => {
  const isMarkdown = filePath?.toLowerCase().endsWith('.md');
  const [markdownViewMode, setMarkdownViewMode] = useState<'both' | 'preview' | 'code'>('both');
  const language = getLanguageFromPath(filePath);

  const handleEditorMount = (_editor: any, monaco: Monaco) => {
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    });

    // Register Inlay Hints provider for function dependency analysis
    // Detects imported items/modules used inside function bodies and displays them next to the function declaration
    const supportedLanguages = ['typescript', 'javascript'];
    
    // Check if provider is already registered to avoid duplicates
    if (!(monaco as any).__funcDepsProviderRegistered) {
      (monaco as any).__funcDepsProviderRegistered = true;

      const provider = {
        provideInlayHints(model: any) {
          const hints: any[] = [];
          const text = model.getValue();
          const lines = text.split('\n');

          // 1. Collect all imported identifiers: import { a, b } from 'pkg', import c from 'pkg', const d = require('pkg')
          const imports: { name: string; source: string }[] = [];
          const importNamedRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
          const importDefaultRegex = /import\s+([a-zA-Z0-9_$]+)\s*(?:,\s*\{([^}]+)\})?\s+from\s+['"]([^'"]+)['"]/g;
          const requireRegex = /(?:const|let|var)\s+(?:\{([^}]+)\}|([a-zA-Z0-9_$]+))\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

          let match;
          while ((match = importNamedRegex.exec(text)) !== null) {
            const names = match[1].split(',').map((s) => s.trim().split(/\s+as\s+/).pop()?.trim()).filter(Boolean);
            names.forEach((n) => {
              if (n) imports.push({ name: n, source: match[2] });
            });
          }

          while ((match = importDefaultRegex.exec(text)) !== null) {
            if (match[1]) imports.push({ name: match[1].trim(), source: match[3] });
            if (match[2]) {
              const names = match[2].split(',').map((s) => s.trim().split(/\s+as\s+/).pop()?.trim()).filter(Boolean);
              names.forEach((n) => {
                if (n) imports.push({ name: n, source: match[3] });
              });
            }
          }

          while ((match = requireRegex.exec(text)) !== null) {
            const source = match[3];
            if (match[1]) {
              const names = match[1].split(',').map((s) => s.trim().split(/\s+as\s+/).pop()?.trim()).filter(Boolean);
              names.forEach((n) => {
                if (n) imports.push({ name: n, source });
              });
            } else if (match[2]) {
              imports.push({ name: match[2].trim(), source });
            }
          }

          if (imports.length === 0) {
            return { hints: [], dispose: () => {} };
          }

          // 2. Identify function declarations & arrow functions
          // e.g.: function foo(...) {, const bar = (...) => {, const baz = async function(...) {
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const funcMatch =
              line.match(/(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)/) ||
              line.match(/(?:export\s+)?(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(/) ||
              line.match(/(?:export\s+)?(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?[a-zA-Z0-9_$]+\s*=>/);

            if (funcMatch) {
              const funcName = funcMatch[1];
              // Find function declaration column
              const nameIndex = line.indexOf(funcName);
              if (nameIndex === -1) continue;

              // Read function body (next ~50 lines or until balanced braces)
              const bodyLines: string[] = [];
              let braceCount = 0;
              let bodyStarted = false;

              for (let j = i; j < Math.min(i + 60, lines.length); j++) {
                const cur = lines[j];
                for (const char of cur) {
                  if (char === '{') {
                    braceCount++;
                    bodyStarted = true;
                  } else if (char === '}') {
                    braceCount--;
                  }
                }
                bodyLines.push(cur);
                if (bodyStarted && braceCount <= 0) break;
              }

              const bodyText = bodyLines.join('\n');

              // Find which imported dependencies are referenced inside this function
              const usedDeps = new Set<string>();
              for (const imp of imports) {
                if (imp.name === funcName) continue; // Don't self-reference
                const depWordRegex = new RegExp(`\\b${imp.name}\\b`);
                if (depWordRegex.test(bodyText)) {
                  usedDeps.add(imp.name);
                }
              }

              if (usedDeps.size > 0) {
                const depsList = Array.from(usedDeps).slice(0, 4);
                const extraCount = usedDeps.size - depsList.length;
                const labelText = `[deps: ${depsList.join(', ')}${extraCount > 0 ? ` +${extraCount}` : ''}]`;

                hints.push({
                  kind: monaco.languages.InlayHintKind.Type,
                  position: {
                    lineNumber: i + 1,
                    column: nameIndex + funcName.length + 1
                  },
                  label: labelText,
                  tooltip: `Dépendances externes utilisées par ${funcName} :\n${Array.from(usedDeps).join(', ')}`,
                  paddingLeft: true,
                  paddingRight: true
                });
              }
            }
          }

          return {
            hints,
            dispose: () => {}
          };
        }
      };

      supportedLanguages.forEach((lang) => {
        monaco.languages.registerInlayHintsProvider(lang, provider);
      });
    }
  };

  if (!filePath) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#161618] border border-neutral-800/80 rounded-2xl m-2 shadow-xl text-neutral-400">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-neutral-800/80 flex items-center justify-center text-blue-400 shadow-inner">
            <Code size={28} />
          </div>
          <p className="text-base font-semibold text-neutral-200">Prêt à coder</p>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Sélectionnez un fichier dans l'explorateur ou utilisez l'IA latérale pour générer une structure de projet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#161618] border border-neutral-800/80 rounded-2xl m-2 shadow-xl overflow-hidden">
      {/* Tab bar header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1b1b1e] border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-2">
          <FileIcon fileName={filePath} size={15} />
          <span className="text-white font-medium">
            {filePath.split(/[\\/]/).pop()}
          </span>
          {isDirty && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Modifications non enregistrées" />}
          <span className="text-[10px] text-blue-400 font-semibold uppercase px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-2">
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
                suggestOnTriggerCharacters: true,
                inlayHints: {
                  enabled: 'on'
                }
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
