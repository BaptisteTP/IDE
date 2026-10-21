import React, { useState } from 'react';
import { Search, FileText, ArrowRight, X, CaseSensitive, Regex, RefreshCw } from 'lucide-react';
import { SearchResultItem } from '../types';
import { ThemeConfig } from '../theme';
import { FileIcon } from './FileIcon';

interface SearchPanelProps {
  workspacePath: string | null;
  onSelectResult: (filePath: string, line: number, column: number) => void;
  themeConfig: ThemeConfig;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  workspacePath,
  onSelectResult,
  themeConfig
}) => {
  const [query, setQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [isRegex, setIsRegex] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || !workspacePath || !window.api?.searchFiles) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await window.api.searchFiles({
        dirPath: workspacePath,
        query: query.trim(),
        matchCase,
        isRegex
      });
      setResults(res || []);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  // Group results by file
  const grouped = results.reduce<Record<string, SearchResultItem[]>>((acc, item) => {
    if (!acc[item.filePath]) acc[item.filePath] = [];
    acc[item.filePath].push(item);
    return acc;
  }, {});

  const fileCount = Object.keys(grouped).length;
  const matchCount = results.length;

  return (
    <div className={`flex flex-col h-full ${themeConfig.styles.bgPanel} border ${themeConfig.styles.border} rounded-2xl w-full text-xs text-neutral-300 shadow-xl overflow-hidden`}>
      {/* Header */}
      <div className={`p-3 border-b ${themeConfig.styles.border} flex items-center justify-between font-semibold uppercase tracking-wider text-neutral-400 bg-black/10`}>
        <div className="flex items-center gap-2">
          <Search size={15} className="text-cyan-400" />
          <span>Recherche Globale</span>
        </div>
        {hasSearched && (
          <span className="text-[11px] font-normal text-neutral-400 font-mono lowercase">
            {matchCount} résultat{matchCount > 1 ? 's' : ''} ({fileCount} fichier{fileCount > 1 ? 's' : ''})
          </span>
        )}
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="p-3 border-b border-neutral-800 space-y-2">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-2.5 text-neutral-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher du texte ou regex dans tous les fichiers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#1b1b20] border border-neutral-700/80 rounded-xl pl-8 pr-16 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-cyan-500 transition"
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-neutral-700/60 rounded-md text-neutral-400 hover:text-white"
                title="Effacer"
              >
                <X size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setMatchCase(!matchCase)}
              className={`p-1 rounded-md text-[11px] font-bold transition ${
                matchCase ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Respecter la casse"
            >
              <CaseSensitive size={13} />
            </button>
            <button
              type="button"
              onClick={() => setIsRegex(!isRegex)}
              className={`p-1 rounded-md text-[11px] font-bold transition ${
                isRegex ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Expression Régulière (Regex)"
            >
              <Regex size={13} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-neutral-500">
            {workspacePath ? 'Dans le projet actif' : 'Aucun projet ouvert'}
          </span>
          <button
            type="submit"
            disabled={loading || !query.trim() || !workspacePath}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-lg font-medium text-xs shadow transition active:scale-95"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            <span>Chercher</span>
          </button>
        </div>
      </form>

      {/* Results View */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {!workspacePath ? (
          <div className="p-8 text-center text-neutral-500 space-y-2">
            <Search size={28} className="mx-auto opacity-20" />
            <p className="text-xs">Ouvrez un dossier pour rechercher dans tous ses fichiers.</p>
          </div>
        ) : loading ? (
          <div className="p-8 text-center text-neutral-400 space-y-2">
            <RefreshCw size={22} className="mx-auto animate-spin text-cyan-400" />
            <p className="text-xs">Recherche dans les fichiers du projet en cours...</p>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 space-y-2">
            <FileText size={28} className="mx-auto opacity-20" />
            <p className="text-xs font-medium text-neutral-400">Aucune correspondance trouvée</p>
            <p className="text-[11px]">Vérifiez vos filtres de casse ou d'expression régulière.</p>
          </div>
        ) : !hasSearched ? (
          <div className="p-8 text-center text-neutral-500 space-y-2">
            <Search size={28} className="mx-auto opacity-20 text-cyan-400" />
            <p className="text-xs">Saisissez un mot-clé ou une regex pour explorer tous les fichiers instantanément sans devoir les ouvrir un par un.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([filePath, matches]) => (
            <div key={filePath} className="rounded-xl border border-neutral-800/80 bg-[#19191e] overflow-hidden">
              <div className="px-3 py-1.5 bg-[#202026] border-b border-neutral-800 flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-2 truncate">
                  <FileIcon fileName={matches[0].fileName} size={14} />
                  <span className="text-white font-medium truncate" title={filePath}>
                    {matches[0].relativePath}
                  </span>
                </div>
                <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 text-[10px] border border-cyan-500/20 font-bold shrink-0">
                  {matches.length}
                </span>
              </div>

              <div className="divide-y divide-neutral-800/40">
                {matches.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectResult(item.filePath, item.lineNumber, item.column)}
                    className="px-3 py-1.5 hover:bg-neutral-800/60 cursor-pointer flex items-center gap-2 text-[11px] font-mono group transition"
                    title={`Ligne ${item.lineNumber}, Colonne ${item.column}`}
                  >
                    <span className="text-neutral-500 w-8 text-right shrink-0 group-hover:text-cyan-400 transition font-bold">
                      {item.lineNumber}
                    </span>
                    <span className="text-neutral-400 truncate flex-1">
                      {item.lineContent}
                    </span>
                    <ArrowRight size={11} className="text-neutral-600 opacity-0 group-hover:opacity-100 transition shrink-0 group-hover:text-cyan-400" />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
