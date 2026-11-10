import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  RefreshCw,
  FolderSearch,
  Play,
  FolderPlus,
  FilePlus,
  Trash2,
  Edit2
} from 'lucide-react';
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

interface TreeItemProps {
  item: FileItem;
  onSelectFile: (filePath: string) => void;
  activeFilePath?: string;
  depth: number;
  onRunFile?: (filePath: string) => void;
  onRefresh?: () => void;
  onMoveItem: (sourcePath: string, targetPath: string) => void;
}

const TreeItem: React.FC<TreeItemProps> = ({
  item,
  onSelectFile,
  activeFilePath,
  depth,
  onRunFile,
  onRefresh,
  onMoveItem
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', item.path);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const sourcePath = e.dataTransfer.getData('text/plain');
    if (!sourcePath || sourcePath === item.path) return;

    // Target folder: if directory, move into it; if file, move into parent directory
    const targetDir = item.isDirectory
      ? item.path
      : item.path.substring(0, Math.max(item.path.lastIndexOf('/'), item.path.lastIndexOf('\\')));
    
    onMoveItem(sourcePath, targetDir);
  };

  const handleRename = async () => {
    if (!editName.trim() || editName === item.name || !window.api) {
      setIsEditing(false);
      setEditName(item.name);
      return;
    }
    const separator = item.path.includes('\\') ? '\\' : '/';
    const parentDir = item.path.substring(0, Math.max(item.path.lastIndexOf('/'), item.path.lastIndexOf('\\')));
    const newPath = `${parentDir}${separator}${editName.trim()}`;
    try {
      await window.api.renameItem(item.path, newPath);
      setIsEditing(false);
      onRefresh?.();
      if (activeFilePath === item.path) {
        onSelectFile(newPath);
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors du renommage');
      setIsEditing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.api) return;
    const confirmMsg = item.isDirectory
      ? `Supprimer définitivement le dossier "${item.name}" et tout son contenu ?`
      : `Supprimer définitivement "${item.name}" ?`;
    if (window.confirm(confirmMsg)) {
      try {
        await window.api.deleteItem(item.path);
        onRefresh?.();
      } catch (err: any) {
        alert(err.message || 'Erreur lors de la suppression');
      }
    }
  };

  if (item.isDirectory) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative group"
      >
        <div
          draggable
          onDragStart={handleDragStart}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer text-xs text-neutral-300 font-medium select-none transition ${
            isDragOver ? 'bg-blue-600/30 border border-blue-400' : 'hover:bg-[#202024]'
          }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          {isOpen ? <ChevronDown size={14} className="text-neutral-500 shrink-0" /> : <ChevronRight size={14} className="text-neutral-500 shrink-0" />}
          {isOpen ? <FolderOpen size={16} className="text-amber-400 shrink-0" /> : <Folder size={16} className="text-amber-500 shrink-0" />}
          
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditName(item.name);
                }
              }}
              autoFocus
              className="bg-[#121214] text-white px-1.5 py-0.5 rounded border border-blue-500 outline-none w-full text-xs"
            />
          ) : (
            <span className="truncate flex-1">{item.name}</span>
          )}

          {/* Action buttons */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition shrink-0 ml-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              title="Renommer"
              className="p-1 hover:bg-neutral-700/60 text-neutral-400 hover:text-white rounded"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={handleDelete}
              title="Supprimer"
              className="p-1 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 rounded"
            >
              <Trash2 size={12} />
            </button>
          </div>
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
                onRefresh={onRefresh}
                onMoveItem={onMoveItem}
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
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => onSelectFile(item.path)}
      className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg cursor-pointer text-xs select-none transition group ${
        isDragOver ? 'bg-blue-600/30 border border-blue-400' : ''
      } ${
        isActive
          ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-white font-semibold border border-blue-500/40'
          : 'text-neutral-300 hover:bg-[#202024] hover:text-white'
      }`}
      style={{ paddingLeft: `${depth * 14 + 20}px` }}
    >
      <div className="flex items-center gap-2 truncate flex-1 min-w-0">
        <FileIcon fileName={item.name} size={15} />
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setIsEditing(false);
                setEditName(item.name);
              }
            }}
            autoFocus
            className="bg-[#121214] text-white px-1.5 py-0.5 rounded border border-blue-500 outline-none w-full text-xs"
          />
        ) : (
          <span className="truncate">{item.name}</span>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0 ml-1">
        {isRunnable && onRunFile && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRunFile(item.path);
            }}
            title="Exécuter ce fichier"
            className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded transition"
          >
            <Play size={11} fill="currentColor" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          title="Renommer"
          className="p-1 hover:bg-neutral-700/60 text-neutral-400 hover:text-white rounded"
        >
          <Edit2 size={11} />
        </button>
        <button
          onClick={handleDelete}
          title="Supprimer"
          className="p-1 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 rounded"
        >
          <Trash2 size={11} />
        </button>
      </div>
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
  const [newItemName, setNewItemName] = useState('');
  const [creatingType, setCreatingType] = useState<'file' | 'folder' | null>(null);
  const [isWorkspaceDragOver, setIsWorkspaceDragOver] = useState(false);

  const handleCreate = async () => {
    if (!newItemName.trim() || !workspacePath || !window.api || !creatingType) return;
    const separator = workspacePath.includes('\\') ? '\\' : '/';
    const fullPath = `${workspacePath}${separator}${newItemName.trim()}`;
    
    try {
      if (creatingType === 'file') {
        await window.api.createFile(fullPath);
        onRefresh?.();
        onSelectFile(fullPath);
      } else {
        await window.api.createDirectory(fullPath);
        onRefresh?.();
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création');
    }

    setNewItemName('');
    setCreatingType(null);
  };

  const handleMoveItem = async (sourcePath: string, targetPath: string) => {
    if (!window.api) return;
    try {
      const res = await window.api.moveItem(sourcePath, targetPath);
      if (res.success) {
        onRefresh?.();
        if (activeFilePath === sourcePath && res.destination) {
          onSelectFile(res.destination);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors du déplacement');
    }
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsWorkspaceDragOver(false);
    if (!workspacePath) return;
    const sourcePath = e.dataTransfer.getData('text/plain');
    if (!sourcePath) return;
    handleMoveItem(sourcePath, workspacePath);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsWorkspaceDragOver(true);
      }}
      onDragLeave={() => setIsWorkspaceDragOver(false)}
      onDrop={handleRootDrop}
      className={`flex flex-col h-full bg-[#161618] border border-neutral-800/80 rounded-2xl w-full text-sm text-neutral-300 shadow-xl overflow-hidden transition ${
        isWorkspaceDragOver ? 'ring-2 ring-blue-500/50' : ''
      }`}
    >
      <div className="p-3.5 border-b border-neutral-800 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-400">
        <div className="flex items-center gap-2 truncate">
          <FolderSearch size={16} className="text-amber-400" />
          <span className="truncate">{workspacePath ? workspacePath.split(/[\\/]/).pop() : 'Explorateur'}</span>
        </div>
        <div className="flex items-center gap-1">
          {workspacePath && (
            <>
              <button
                onClick={() => setCreatingType(creatingType === 'file' ? null : 'file')}
                title="Nouveau fichier"
                className={`p-1.5 rounded-lg transition ${
                  creatingType === 'file' ? 'bg-blue-600 text-white' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <FilePlus size={15} />
              </button>
              <button
                onClick={() => setCreatingType(creatingType === 'folder' ? null : 'folder')}
                title="Nouveau dossier"
                className={`p-1.5 rounded-lg transition ${
                  creatingType === 'folder' ? 'bg-blue-600 text-white' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <FolderPlus size={15} />
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

      {creatingType && (
        <div className="p-2.5 border-b border-neutral-800 bg-[#1a1a1d] flex items-center gap-2">
          {creatingType === 'file' ? <FilePlus size={15} className="text-blue-400" /> : <FolderPlus size={15} className="text-amber-400" />}
          <input
            type="text"
            placeholder={creatingType === 'file' ? 'Nom du fichier (ex: index.ts)...' : 'Nom du dossier...'}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') setCreatingType(null);
            }}
            autoFocus
            className="flex-1 bg-[#232326] border border-neutral-700 text-white text-xs px-2.5 py-1.5 rounded-lg outline-none focus:border-blue-500"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {items.length === 0 ? (
          <div className="p-4 text-xs text-neutral-500 italic text-center">
            {workspacePath ? 'Dossier vide. Glissez-déposez des fichiers ici.' : 'Aucun dossier ouvert.'}
          </div>
        ) : (
          items.map((item) => (
            <TreeItem
              key={item.path}
              item={item}
              onSelectFile={onSelectFile}
              activeFilePath={activeFilePath}
              depth={0}
              onRunFile={onRunFile}
              onRefresh={onRefresh}
              onMoveItem={handleMoveItem}
            />
          ))
        )}
      </div>
    </div>
  );
};