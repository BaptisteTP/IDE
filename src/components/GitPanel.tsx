import React, { useState } from 'react';
import { GitBranch, GitCommit, Upload, Download, RefreshCw, Plus, Check, FolderGit2, Link } from 'lucide-react';
import { GitStatus, GitCommitItem } from '../types';

interface GitPanelProps {
  workspacePath: string | null;
  status: GitStatus | null;
  onRefresh: () => void;
}

export const GitPanel: React.FC<GitPanelProps> = ({ workspacePath, status, onRefresh }) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [sourceBranch, setSourceBranch] = useState('');
  const [showNewBranchInput, setShowNewBranchInput] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneUrl, setCloneUrl] = useState('');
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'changes' | 'history'>('changes');
  const [history, setHistory] = useState<GitCommitItem[]>([]);

  if (!workspacePath) {
    return (
      <div className="p-4 text-xs text-neutral-400 bg-[#161618] rounded-2xl border border-neutral-800 m-2">
        <p>Ouvrez un dossier pour gérer vos branches et versions Git.</p>
      </div>
    );
  }

  // Not a repo -> Button to Git Init directly from UI
  if (status && !status.isRepo) {
    const handleInitRepo = async () => {
      if (!window.api) return;
      setLoading(true);
      try {
        const res = await window.api.gitInit(workspacePath);
        if (res.success) {
          onRefresh();
        } else {
          alert('Erreur: ' + res.error);
        }
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="flex flex-col h-full bg-[#161618] border border-neutral-800/80 rounded-2xl w-full p-4 text-sm text-neutral-300 shadow-xl overflow-hidden">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-800 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          <FolderGit2 size={16} className="text-amber-400" />
          <span>Initialisation Git</span>
        </div>
        <div className="my-auto text-center space-y-4">
          <p className="text-xs text-neutral-400">Ce dossier n'a pas encore de suivi de versions Git.</p>
          <button
            onClick={handleInitRepo}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition transform active:scale-95"
          >
            {loading ? 'Initialisation...' : '✨ Initialiser le dépôt Git (git init)'}
          </button>
        </div>
      </div>
    );
  }

  const handleCommit = async () => {
    if (!commitMessage.trim() || !window.api) return;
    setLoading(true);
    try {
      const res = await window.api.gitCommit(workspacePath, commitMessage);
      if (res.success) {
        setCommitMessage('');
        onRefresh();
      } else {
        alert('Erreur commit: ' + res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    if (!window.api) return;
    setLoading(true);
    try {
      const res = await window.api.gitPush(workspacePath, status?.currentBranch);
      if (res.success) {
        alert('Code poussé avec succès sur le dépôt distant !');
        onRefresh();
      } else {
        alert('Erreur Push (avez-vous configuré un remote ?): ' + res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    if (!window.api) return;
    setLoading(true);
    try {
      const res = await window.api.gitPull(workspacePath);
      if (res.success) {
        onRefresh();
      } else {
        alert('Erreur pull: ' + res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddRemote = async () => {
    if (!remoteUrl.trim() || !window.api) return;
    setLoading(true);
    try {
      const res = await window.api.gitAddRemote(workspacePath, 'origin', remoteUrl.trim());
      if (res.success) {
        setRemoteUrl('');
        setShowRemoteModal(false);
        onRefresh();
      } else {
        alert('Erreur remote: ' + res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchBranch = async (branch: string) => {
    if (!window.api || branch === status?.currentBranch) return;
    setLoading(true);
    try {
      await window.api.gitCheckout(workspacePath, branch, false);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim() || !window.api) return;
    setLoading(true);
    try {
      const baseBranch = sourceBranch || status?.currentBranch || undefined;
      const res = await window.api.gitCheckout(workspacePath, newBranchName.trim(), true, baseBranch);
      if (res.success) {
        setNewBranchName('');
        setShowNewBranchInput(false);
        onRefresh();
      } else if (res.error) {
        alert('Erreur création de branche: ' + res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!window.api) return;
    setActiveTab('history');
    const logs = await window.api.getGitLog(workspacePath);
    setHistory(logs);
  };

  const totalChanges =
    (status?.modified?.length || 0) +
    (status?.not_added?.length || 0) +
    (status?.deleted?.length || 0) +
    (status?.staged?.length || 0);

  return (
    <div className="flex flex-col h-full bg-[#161618] border border-neutral-800/80 rounded-2xl w-full text-sm text-neutral-300 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-neutral-800 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-400">
        <div className="flex items-center gap-2">
          <GitBranch size={16} className="text-blue-400" />
          <span>Contrôle Git</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowRemoteModal(!showRemoteModal)}
            title="Associer un dépôt distant (GitHub, GitLab...)"
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition"
          >
            <Link size={14} />
          </button>
          <button
            onClick={onRefresh}
            title="Rafraîchir"
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Add Remote Modal popup inline */}
      {showRemoteModal && (
        <div className="p-3 bg-neutral-900 border-b border-neutral-800 space-y-2 text-xs">
          <span className="font-medium text-neutral-300">Lier un dépôt GitHub/GitLab :</span>
          <input
            type="text"
            placeholder="https://github.com/user/repo.git"
            value={remoteUrl}
            onChange={(e) => setRemoteUrl(e.target.value)}
            className="w-full bg-[#202022] border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowRemoteModal(false)}
              className="px-2.5 py-1 rounded-lg text-neutral-400 hover:text-white"
            >
              Annuler
            </button>
            <button
              onClick={handleAddRemote}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium"
            >
              Ajouter Remote
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 text-xs px-2 pt-2 gap-1 bg-[#121214]">
        <button
          onClick={() => setActiveTab('changes')}
          className={`flex-1 py-1.5 font-medium rounded-t-lg transition ${
            activeTab === 'changes'
              ? 'bg-[#1e1e22] text-white border-b-2 border-blue-500'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          Modifications ({totalChanges})
        </button>
        <button
          onClick={loadHistory}
          className={`flex-1 py-1.5 font-medium rounded-t-lg transition ${
            activeTab === 'history'
              ? 'bg-[#1e1e22] text-white border-b-2 border-blue-500'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          Historique
        </button>
      </div>

      {/* Branch selector & Actions */}
      <div className="p-3 bg-[#1a1a1d] border-b border-neutral-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-400 font-medium">Branche :</span>
          <div className="flex items-center gap-1.5">
            <select
              value={status?.currentBranch || ''}
              onChange={(e) => handleSwitchBranch(e.target.value)}
              className="bg-[#242428] text-blue-400 font-semibold px-2 py-1 rounded-lg border border-neutral-700 outline-none text-xs shadow-inner"
            >
              {status?.branches?.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (!showNewBranchInput) {
                  setSourceBranch(status?.currentBranch || '');
                }
                setShowNewBranchInput(!showNewBranchInput);
              }}
              title="Créer une nouvelle branche"
              className="p-1 hover:bg-neutral-700 rounded-lg text-neutral-300 hover:text-white transition"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        {showNewBranchInput && (
          <div className="p-2.5 bg-[#202025] rounded-xl border border-neutral-700/80 space-y-2 mt-1">
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1 font-medium">
                Créer la branche depuis :
              </label>
              <select
                value={sourceBranch || status?.currentBranch || ''}
                onChange={(e) => setSourceBranch(e.target.value)}
                className="w-full bg-[#18181b] border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-blue-500"
              >
                {status?.branches?.map((b) => (
                  <option key={b} value={b}>
                    {b} {b === status?.currentBranch ? '(actuelle)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 block mb-1 font-medium">
                Nom de la nouvelle branche :
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="ex: feature/login, fix/bug..."
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateBranch();
                    if (e.key === 'Escape') setShowNewBranchInput(false);
                  }}
                  autoFocus
                  className="flex-1 bg-[#18181b] border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleCreateBranch}
                  disabled={loading || !newBranchName.trim()}
                  title="Confirmer la création"
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow transition"
                >
                  <Check size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={handlePull}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#252529] hover:bg-[#2f2f35] border border-neutral-700 text-xs py-1.5 rounded-xl text-neutral-200 transition font-medium shadow-sm"
          >
            <Download size={13} className="text-emerald-400" />
            <span>Pull</span>
          </button>
          <button
            onClick={handlePush}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs py-1.5 rounded-xl text-white font-semibold transition shadow-md"
          >
            <Upload size={13} />
            <span>Push</span>
          </button>
        </div>
      </div>

      {/* Main Content: Changes or History */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'changes' ? (
          <div className="space-y-3">
            {/* Commit Form */}
            <div className="space-y-2 bg-[#1b1b1e] p-2.5 rounded-xl border border-neutral-800">
              <textarea
                placeholder="Message du commit..."
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleCommit();
                }}
                rows={2}
                className="w-full bg-[#232326] border border-neutral-700/80 rounded-lg p-2 text-xs text-white placeholder-neutral-500 focus:border-blue-500 outline-none resize-none"
              />
              <button
                onClick={handleCommit}
                disabled={loading || !commitMessage.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 transition shadow"
              >
                <GitCommit size={14} />
                <span>Valider le commit ({totalChanges})</span>
              </button>
            </div>

            {/* File List */}
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-1">
                Fichiers modifiés ({totalChanges})
              </div>
              {totalChanges === 0 ? (
                <div className="text-xs text-neutral-500 italic py-3 text-center">
                  Aucun fichier modifié.
                </div>
              ) : (
                <div className="space-y-1 text-xs">
                  {status?.modified?.map((file) => (
                    <div key={file} className="flex items-center justify-between py-1.5 px-2 bg-[#1e1e22] hover:bg-[#25252a] rounded-lg text-neutral-300 border border-neutral-800/50">
                      <span className="truncate">{file}</span>
                      <span className="text-[10px] text-amber-400 font-bold px-1.5 py-0.5 bg-amber-500/10 rounded">MODIFIÉ</span>
                    </div>
                  ))}
                  {status?.not_added?.map((file) => (
                    <div key={file} className="flex items-center justify-between py-1.5 px-2 bg-[#1e1e22] hover:bg-[#25252a] rounded-lg text-neutral-300 border border-neutral-800/50">
                      <span className="truncate">{file}</span>
                      <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-500/10 rounded">NOUVEAU</span>
                    </div>
                  ))}
                  {status?.deleted?.map((file) => (
                    <div key={file} className="flex items-center justify-between py-1.5 px-2 bg-[#1e1e22] hover:bg-[#25252a] rounded-lg text-neutral-300 border border-neutral-800/50">
                      <span className="truncate">{file}</span>
                      <span className="text-[10px] text-rose-400 font-bold px-1.5 py-0.5 bg-rose-500/10 rounded">SUPPRIMÉ</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {history.length === 0 ? (
              <div className="text-xs text-neutral-500 italic p-3 text-center">Aucun commit trouvé.</div>
            ) : (
              history.map((c) => (
                <div key={c.hash} className="p-2.5 rounded-xl bg-[#1b1b1e] hover:bg-[#232328] border border-neutral-800 text-xs space-y-1 transition">
                  <div className="font-semibold text-white truncate">{c.message}</div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400">
                    <span>{c.author_name}</span>
                    <span className="font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{c.hash.slice(0, 7)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
