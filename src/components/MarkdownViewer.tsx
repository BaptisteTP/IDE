import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  FileText, Copy, Check, Hash, List, ExternalLink, 
  BookOpen, Code2, AlertCircle, Info, CheckCircle2 
} from 'lucide-react';

interface MarkdownViewerProps {
  content: string;
  filePath?: string | null;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, filePath }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const lineCount = content ? content.split('\n').length : 0;
  const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#121215] text-neutral-200 overflow-hidden select-text">
      {/* Markdown Reader Toolbar */}
      <div className="h-9 px-4 bg-[#18181c] border-b border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400 select-none shrink-0">
        <div className="flex items-center gap-2 font-medium">
          <BookOpen size={14} className="text-blue-400" />
          <span className="text-white font-semibold">Aperçu Markdown Haute Définition</span>
          {filePath && (
            <span className="text-[11px] text-neutral-500 font-mono">
              ({filePath.split(/[\\/]/).pop()})
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>{wordCount} mots</span>
          <span>{lineCount} lignes</span>
          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
            GFM
          </span>
        </div>
      </div>

      {/* Markdown Content Container */}
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-4 max-w-4xl mx-auto w-full">
        {!content.trim() ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500 space-y-2 py-20 select-none">
            <FileText size={32} className="text-neutral-600" />
            <p className="text-xs">Fichier Markdown vide.</p>
          </div>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Headings
              h1: ({ children }) => (
                <h1 className="text-2xl font-black text-white pb-3 mb-4 mt-6 border-b border-neutral-800 flex items-center gap-2 group tracking-tight">
                  <span className="text-blue-500 group-hover:scale-110 transition-transform">#</span>
                  <span>{children}</span>
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-bold text-neutral-100 pb-2 mb-3 mt-6 border-b border-neutral-800/60 flex items-center gap-2 group tracking-tight">
                  <span className="text-indigo-400 group-hover:scale-110 transition-transform">##</span>
                  <span>{children}</span>
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-semibold text-neutral-200 mb-2 mt-5 flex items-center gap-2">
                  <span className="text-cyan-400">###</span>
                  <span>{children}</span>
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-base font-semibold text-neutral-300 mb-2 mt-4 text-purple-300">
                  {children}
                </h4>
              ),

              // Paragraphs & Text
              p: ({ children }) => (
                <p className="text-sm text-neutral-300 leading-relaxed mb-4 font-normal">
                  {children}
                </p>
              ),

              // Blockquotes (Callouts)
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-blue-500/80 bg-blue-500/5 px-4 py-2 my-4 rounded-r-xl text-neutral-300 text-sm italic shadow-inner">
                  {children}
                </blockquote>
              ),

              // Lists
              ul: ({ children }) => (
                <ul className="list-disc list-outside pl-6 space-y-1.5 my-3 text-sm text-neutral-300 marker:text-blue-400">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-outside pl-6 space-y-1.5 my-3 text-sm text-neutral-300 marker:text-indigo-400 marker:font-bold">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed pl-1">
                  {children}
                </li>
              ),

              // Links
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline font-medium inline-flex items-center gap-1 transition"
                >
                  <span>{children}</span>
                  <ExternalLink size={11} className="inline opacity-70" />
                </a>
              ),

              // Tables
              table: ({ children }) => (
                <div className="overflow-x-auto my-5 rounded-2xl border border-neutral-800 shadow-md">
                  <table className="w-full text-left text-xs border-collapse">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-[#18181c] text-white uppercase text-[11px] font-bold tracking-wider border-b border-neutral-800">
                  {children}
                </thead>
              ),
              th: ({ children }) => (
                <th className="px-4 py-3 font-semibold text-neutral-200">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-2.5 border-t border-neutral-800/60 text-neutral-300">
                  {children}
                </td>
              ),

              // Horizontal Rule
              hr: () => (
                <hr className="my-6 border-neutral-800" />
              ),

              // Code Blocks & Inline Code
              code: (props: any) => {
                const { inline, className, children } = props;
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');

                if (inline) {
                  return (
                    <code className="bg-[#202026] text-amber-300 px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-neutral-700/60 font-medium">
                      {children}
                    </code>
                  );
                }

                const blockId = Math.random();
                const lang = match ? match[1] : '';

                return (
                  <div className="my-4 rounded-2xl overflow-hidden border border-neutral-800 bg-[#16161a] shadow-lg group">
                    <div className="flex items-center justify-between px-4 py-1.5 bg-[#1a1a20] border-b border-neutral-800/80 text-xs text-neutral-400">
                      <div className="flex items-center gap-2">
                        <Code2 size={13} className="text-blue-400" />
                        <span className="font-mono text-[11px] uppercase font-semibold text-neutral-300">
                          {lang || 'texte'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(codeString, blockId)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] hover:bg-neutral-800 text-neutral-300 hover:text-white transition"
                        title="Copier le code"
                      >
                        {copiedIndex === blockId ? (
                          <>
                            <Check size={12} className="text-emerald-400" />
                            <span className="text-emerald-400">Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copier</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-xs font-mono">
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={lang || 'text'}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          padding: '1rem',
                          background: '#131316',
                          fontSize: '12.5px',
                          lineHeight: '1.6'
                        }}
                      >
                        {codeString}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                );
              }
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
};
