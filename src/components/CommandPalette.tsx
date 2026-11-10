import React, { useState, useEffect, useRef } from 'react';
import { Search, FileCode, ArrowRight, Zap, Check, Eye, X } from 'lucide-react';
import { FileItem } from '../types';
import { FileIcon } from './FileIcon';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileItem[];
  onSelectFile: (filePath: string) => void;
  onExecuteCommand: (commandId: string) => void;
  onOpenSettings: () => void;
  onOpenFolder: () => void;
}

interface CommandAction {
  id: string;
  title: string;
  category: string;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  files,
  onSelectFile,
  onExecuteCommand,
  onOpenSettings,
  onOpenFolder
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten files list for quick file jump
  const flattenFiles = (items: FileItem[]): { name: string; path: string }[] => {
    let result: { name: string; path: string }[] = [];
    for (const item of items) {
      if (!item.isDirectory) {
        result.push({ name: item.name, path: item.path });
      }
      if (item.children) {
        result = result.concat(flattenFiles(item.children));
      }
    }
    return result;
  };

  const fileList = flattenFiles(files);

  const commands: CommandAction[] = [
    {
      id: 'cmd-open-folder',
      title: 'Ouvrir un dossier...',
      category: 'Fichier',
      action: () => {
        onClose();
        onOpenFolder();
      }
    },
    {
      id: 'cmd-settings',
      title: 'Ouvrir les Paramètres',
      category: 'Préférences',
      shortcut: 'Ctrl+,',
      action: () => {
        onClose();
        onOpenSettings();
      }
    },
    {
      id: 'cmd-save',
      title: 'Enregistrer le fichier',
      category: 'Fichier',
      shortcut: 'Ctrl+S',
      action: () => {
        onClose();
        onExecuteCommand('save');
      }
    },
    {
      id: 'cmd-search-global',
      title: 'Rechercher dans les fichiers',
      category: 'Recherche',
      shortcut: 'Ctrl+Shift+F',
      action: () => {
        onClose();
        onExecuteCommand('search');
      }
    },
    {
      id: 'cmd-git-status',
      title: 'Ouvrir le panneau Git',
      category: 'Git',
      action: () => {
        onClose();
        onExecuteCommand('git');
      }
    },
    {
      id: 'cmd-toggle-terminal',
      title: 'Basculer le terminal',
      category: 'Terminal',
      action: () => {
        onClose();
        onExecuteCommand('toggle-terminal');
      }
    },
    {
      id: 'cmd-new-terminal',
      title: 'Nouveau terminal',
      category: 'Terminal',
      action: () => {
        onClose();
        onExecuteCommand('new-terminal');
      }
    },
    {
      id: 'cmd-ai-assistant',
      title: 'Ouvrir l\'Assistant IA',
      category: 'IA',
      action: () => {
        onClose();
        onExecuteCommand('ai');
      }
    },
    {
      id: 'cmd-http-tester',
      title: 'Ouvrir le Testeur HTTP',
      category: 'Outils',
      action: () => {
        onClose();
        onExecuteCommand('http');
      }
    },
    {
      id: 'cmd-run-project',
      title: 'Lancer le projet (Run)',
      category: 'Exécution',
      action: () => {
        onClose();
        onExecuteCommand('run');
      }
    },
    {
      id: 'cmd-build-project',
      title: 'Compiler le projet (Build)',
      category: 'Exécution',
      action: () => {
        onClose();
        onExecuteCommand('build');
      }
    }
  ];

  const isCommandMode = query.startsWith('>');
  const filterText = isCommandMode ? query.slice(1).trim().toLowerCase() : query.trim().toLowerCase();

  // Fast fuzzy match score
  const getFuzzyScore = (target: string, search: string): number => {
    if (!search) return 1;
    let targetIdx = 0;
    let score = 0;
    for (let i = 0; i < search.length; i++) {
      const char = search[i];
      const foundIdx = target.indexOf(char, targetIdx);
      if (foundIdx === -1) return -1;
      // Bonus for consecutive matches and match at beginning/separator
      if (foundIdx === targetIdx) score += 10;
      if (foundIdx === 0 || target[foundIdx - 1] === '/' || target[foundIdx - 1] === '\\') score += 15;
      score += 1;
      targetIdx = foundIdx + 1;
    }
    return score;
  };

  // Filter items
  const filteredCommands = commands
    .map((c) => {
      const titleScore = getFuzzyScore(c.title.toLowerCase(), filterText);
      const catScore = getFuzzyScore(c.category.toLowerCase(), filterText);
      return { cmd: c, score: Math.max(titleScore, catScore) };
    })
    .filter((item) => filterText === '' || item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.cmd);

  const filteredFiles = fileList
    .map((f) => {
      const nameScore = getFuzzyScore(f.name.toLowerCase(), filterText);
      const pathScore = getFuzzyScore(f.path.toLowerCase(), filterText);
      return { file: f, score: Math.max(nameScore * 2, pathScore) };
    })
    .filter((item) => filterText === '' || item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)
    .map((item) => item.file);

  const displayedItems = isCommandMode
    ? filteredCommands.map((c) => ({ type: 'command' as const, data: c }))
    : [
        ...filteredFiles.map((f) => ({ type: 'file' as const, data: f })),
        ...filteredCommands.map((c) => ({ type: 'command' as const, data: c }))
      ];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(displayedItems.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + displayedItems.length) % Math.max(displayedItems.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = displayedItems[selectedIndex];
      if (current) {
        if (current.type === 'file') {
          onSelectFile(current.data.path);
          onClose();
        } else {
          current.data.action();
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-[620px] max-w-[90vw] bg-[#1a1a1d] border border-neutral-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-200">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-neutral-800 gap-3 bg-[#202024]">
          {isCommandMode ? (
            <Zap size={18} className="text-amber-400 shrink-0" />
          ) : (
            <Search size={18} className="text-blue-400 shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher un fichier ou tapez '>' pour les commandes..."
            className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-neutral-500 font-medium"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[360px] overflow-y-auto p-2 space-y-1">
          {displayedItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              Aucun résultat correspondant à &quot;{query}&quot;
            </div>
          ) : (
            displayedItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              if (item.type === 'file') {
                return (
                  <div
                    key={`file-${item.data.path}`}
                    onClick={() => {
                      onSelectFile(item.data.path);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs transition ${
                      isSelected ? 'bg-blue-600 text-white font-medium' : 'text-neutral-300 hover:bg-[#252529]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileIcon fileName={item.data.name} size={16} />
                      <span className="truncate">{item.data.name}</span>
                      <span className={`text-[10px] truncate ${isSelected ? 'text-blue-200' : 'text-neutral-500'}`}>
                        {item.data.path}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`cmd-${item.data.id}`}
                  onClick={() => item.data.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs transition ${
                    isSelected ? 'bg-blue-600 text-white font-medium' : 'text-neutral-300 hover:bg-[#252529]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Zap size={14} className={isSelected ? 'text-white' : 'text-amber-400'} />
                    <span className="truncate">{item.data.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${isSelected ? 'bg-blue-700 text-blue-100' : 'bg-neutral-800 text-neutral-400'}`}>
                      {item.data.category}
                    </span>
                  </div>
                  {item.data.shortcut && (
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${isSelected ? 'bg-blue-700 text-blue-100' : 'bg-neutral-800 text-neutral-400'}`}>
                      {item.data.shortcut}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 border-t border-neutral-800 bg-[#161618] text-[11px] text-neutral-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[10px]">↑↓</kbd> Naviguer</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[10px]">Entrée</kbd> Ouvrir</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[10px]">Echap</kbd> Fermer</span>
          </div>
          <div>
            Tapez <span className="text-amber-400 font-mono">&gt;</span> pour les commandes
          </div>
        </div>
      </div>
    </div>
  );
};