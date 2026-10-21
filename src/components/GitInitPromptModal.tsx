import React from 'react';
import { GitBranch, FolderGit2, AlertTriangle, Check, X } from 'lucide-react';

interface GitInitPromptModalProps {
  isOpen: boolean;
  folderPath: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export const GitInitPromptModal: React.FC<GitInitPromptModalProps> = ({
  isOpen,
  folderPath,
  onConfirm,
  onCancel,
  loading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#161619] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 space-y-5 text-sm text-neutral-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
            <FolderGit2 size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Dépôt Git non détecté</h3>
            <p className="text-xs text-neutral-400">Aucun gestionnaire de versions actif dans ce dossier</p>
          </div>
        </div>

        <div className="p-3 bg-[#1e1e24] rounded-2xl border border-neutral-800 space-y-1">
          <span className="text-[11px] text-neutral-400 font-medium">Dossier ouvert :</span>
          <p className="font-mono text-xs text-white truncate">{folderPath}</p>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed">
          Souhaitez-vous initialiser automatiquement un dépôt Git (<code className="text-amber-300 font-mono">git init</code>) pour bénéficier du suivi de modifications, branches et commits visuels dans l'IDE ?
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold transition"
          >
            Plus tard
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition transform active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span>Initialisation...</span>
            ) : (
              <>
                <Check size={14} />
                <span>Oui, initialiser Git</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
