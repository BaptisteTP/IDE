import React, { useState } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown, Plus, RefreshCw, FolderSearch, Play } from 'lucide-react';
import { FileItem } from '../types';
import { FileIcon } from './FileIcon';

interface FileTreeProps {
  items: FileItem[];
  onSelectFile: (filePath: string) => void;
  activeFilePath?: string;
  onRefresh?: () => void;
  workspacePath: string | null;
  onRunFile?: (filePath: string) => void;
}

const TreeItem: React.FC<{
  item: FileItem;
  onSelectFile: (filePath: string) => void;
  activeFilePath?: string;
  depth: number;
  onRunFile?: (filePath: string) => void;
}> = ({ item, onSelectFile, activeFilePath, depth, onRunFile }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (item.isDirectory) {
    return (
      <div>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 py-1.5 px-2 hover:bg-[#202024] rounded-lg cursor-pointer text-xs text-neutral-300 font-medium select-none transition group"
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          {isOpen ? <ChevronDown size={14} className="text-neutral-500" /> : <ChevronRight size={14} className="text-neutral-500" />}
          {isOpen ? <FolderOpen size={16} className="text-amber-400" /> : <Folder size={16} className="text-amber-500" />}
          <span className="truncate flex-1">{item.name}</span>
        </div>
        {isOpen && item.children && (
          <div className="space-y-0.5">
            {item.children.map((child) => (
              <TreeItem
                key={child.path}
                item={child}
                onSelectFile={onSelectFile}
                activeFilePath={activeFilePath}
                depth={depth + 1}
                onRunFile={onRunFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = activeFilePath === item.path;
  const isRunnable = /\.(js|ts|py|sh|bat|cmd|ps1|rs|go|rb|php)$/i.test(item.name);

  return (
    <div
      onClick={() => onSelectFile(item.path)}
      className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg cursor-pointer text-xs select-none transition group ${
        isActive
          ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-white font-semibold border border-blue-500/40'
          : 'text-neutral-300 hover:bg-[#202024] hover:text-white'
      }`}
      style={{ paddingLeft: `${depth * 14 + 20}px` }}
    >
      <div className="flex items-center gap-2 truncate">
        <FileIcon fileName={item.name} size={15} />
        <span className="truncate">{item.name}</span>
      </div>

      {isRunnable && onRunFile && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRunFile(item.path);
          }}
          title="Exécuter ce fichier"
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-emerald-500/20 text-emerald-400 rounded transition"
        >
          <Play size={11} fill="currentColor" />
        </button>
      )}
    </div>
  );
};

export const FileExplorer: React.FC<FileTreeProps> = ({
  items,
  onSelectFile,
  activeFilePath,
  onRefresh,
  workspacePath,
  onRunFile
}) => {
  const [newFileName, setNewFileName] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleCreate = async () => {
    if (!newFileName.trim() || !workspacePath || !window.api) return;
    const fullPath = `${workspacePath}/${newFileName.trim()}`;
    await window.api.createFile(fullPath);
    setNewFileName('');
    setShowInput(false);
    onRefresh?.();
    onSelectFile(fullPath);
  };

  return (
    <div className="flex flex-col h-full bg-[#161618] border border-neutral-800/80 rounded-2xl w-full text-sm text-neutral-300 shadow-xl overflow-hidden">
      <div className="p-3.5 border-b border-neutral-800 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-400">
        <div className="flex items-center gap-2 truncate">
          <FolderSearch size={16} className="text-amber-400" />
          <span className="truncate">{workspacePath ? workspacePath.split(/[\\/]/).pop() : 'Explorateur'}</span>
        </div>
        <div className="flex items-center gap-1">
          {workspacePath && (
            <>
              <button
                onClick={() => setShowInput(!showInput)}
                title="Nouveau fichier"
                className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition"
              >
                <Plus size={15} />
              </button>
              <button
                onClick={onRefresh}
                title="Actualiser"
                className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition"
              >
                <RefreshCw size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {showInput && (
        <div className="p-2.5 border-b border-neutral-800 bg-[#1a1a1d]">
          <input
            type="text"
            placeholder="Nom du fichier (ex: script.py)..."
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') setShowInput(false);
            }}
            autoFocus
            className="w-full bg-[#232326] border border-neutral-700 text-white text-xs px-2.5 py-1.5 rounded-lg outline-none focus:border-blue-500"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {items.length === 0 ? (
          <div className="p-4 text-xs text-neutral-500 italic text-center">Aucun dossier ouvert.</div>
        ) : (
          items.map((item) => (
            <TreeItem
              key={item.path}
              item={item}
              onSelectFile={onSelectFile}
              activeFilePath={activeFilePath}
              depth={0}
              onRunFile={onRunFile}
            />
          ))
        )}
      </div>
    </div>
  );
};
