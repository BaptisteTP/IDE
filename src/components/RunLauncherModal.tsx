import React, { useState } from 'react';
import { Play, Folder, FileCode, Terminal, X, CornerDownRight } from 'lucide-react';
import { FileIcon } from './FileIcon';

interface RunLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspacePath: string | null;
  activeFilePath: string | null;
  onLaunch: (command: string, cwd: string, targetFile?: string) => void;
  defaultRunCommand: string;
}

export const RunLauncherModal: React.FC<RunLauncherModalProps> = ({
  isOpen,
  onClose,
  workspacePath,
  activeFilePath,
  onLaunch,
  defaultRunCommand
}) => {
  const [command, setCommand] = useState(defaultRunCommand || 'node index.js');
  const [cwd, setCwd] = useState(workspacePath || '');
  const [useCurrentFile, setUseCurrentFile] = useState(false);

  if (!isOpen) return null;

  const handleSelectCurrentFile = () => {
    if (!activeFilePath) return;
    setUseCurrentFile(true);
    const fileName = activeFilePath.split(/[\\/]/).pop() || '';
    const fileExt = fileName.split('.').pop()?.toLowerCase();
    const dir = activeFilePath.substring(0, Math.max(activeFilePath.lastIndexOf('/'), activeFilePath.lastIndexOf('\\')));

    if (dir) setCwd(dir);

    if (fileExt === 'js' || fileExt === 'mjs' || fileExt === 'cjs') {
      setCommand(`node "${fileName}"`);
    } else if (fileExt === 'ts') {
      setCommand(`npx ts-node "${fileName}"`);
    } else if (fileExt === 'py') {
      setCommand(`python "${fileName}"`);
    } else if (fileExt === 'sh') {
      setCommand(`bash "${fileName}"`);
    } else if (fileExt === 'rs') {
      setCommand(`cargo run`);
    } else {
      setCommand(`node "${fileName}"`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    onLaunch(command.trim(), cwd.trim() || workspacePath || '', useCurrentFile && activeFilePath ? activeFilePath : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#161619] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 space-y-5 text-sm text-neutral-300">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Play size={20} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Lancer une exécution personnalisée</h3>
              <p className="text-xs text-neutral-400">Choisissez le fichier, la commande et le répertoire de travail</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Quick Option: Run active file */}
          {activeFilePath && (
            <div className="p-3 bg-[#1e1e24] rounded-2xl border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <FileIcon fileName={activeFilePath} size={16} />
                <div className="truncate">
                  <span className="font-semibold text-white block truncate">
                    {activeFilePath.split(/[\\/]/).pop()}
                  </span>
                  <span className="text-[10px] text-neutral-400 truncate block">
                    {activeFilePath}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSelectCurrentFile}
                className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl font-semibold text-[11px] transition shrink-0"
              >
                Cibler ce fichier
              </button>
            </div>
          )}

          {/* Commande */}
          <div>
            <label className="block font-semibold text-neutral-200 mb-1.5 flex items-center gap-1.5">
              <Terminal size={14} className="text-emerald-400" />
              <span>Commande à exécuter :</span>
            </label>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="w-full bg-[#202024] border border-neutral-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono text-xs shadow-inner"
              placeholder="ex: node index.js, python test.py, npm run dev..."
              required
            />
          </div>

          {/* Répertoire de travail (CWD) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Folder size={14} className="text-amber-400" />
                <span>Répertoire d'exécution (cwd) :</span>
              </label>
              {window.api?.openFolderDialog && (
                <button
                  type="button"
                  onClick={async () => {
                    const selected = await window.api?.openFolderDialog();
                    if (selected) setCwd(selected);
                  }}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-medium underline"
                >
                  Parcourir...
                </button>
              )}
            </div>
            <input
              type="text"
              value={cwd}
              onChange={(e) => setCwd(e.target.value)}
              className="w-full bg-[#202024] border border-neutral-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 font-mono text-xs shadow-inner"
              placeholder={workspacePath || 'C:\\...'}
              required
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-semibold transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold shadow-md transition transform active:scale-95"
            >
              <Play size={13} fill="currentColor" />
              <span>Lancer dans le Terminal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
