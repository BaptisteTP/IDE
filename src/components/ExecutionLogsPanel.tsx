import React, { useState } from 'react';
import { 
  Play, Wrench, Terminal, CheckCircle2, XCircle, Clock, 
  AlertTriangle, RotateCcw, Trash2, ChevronRight, ChevronDown, 
  Copy, Check, FileCode, Folder
} from 'lucide-react';
import { ExecutionLogItem } from '../types';
import { ThemeConfig } from '../theme';

interface ExecutionLogsPanelProps {
  logs: ExecutionLogItem[];
  onClearLogs: () => void;
  onRerun: (log: ExecutionLogItem) => void;
  themeConfig?: ThemeConfig;
}

export const ExecutionLogsPanel: React.FC<ExecutionLogsPanelProps> = ({
  logs,
  onClearLogs,
  onRerun,
  themeConfig
}) => {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(logs[0]?.id || null);
  const [filterType, setFilterType] = useState<'all' | 'error' | 'success'>('all');
  const [copied, setCopied] = useState(false);

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'error') return log.status === 'error';
    if (filterType === 'success') return log.status === 'success';
    return true;
  });

  const selectedLog = logs.find((l) => l.id === selectedLogId) || logs[0];

  const handleCopyOutput = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#161618] border border-neutral-800/80 rounded-2xl w-full text-xs text-neutral-300 shadow-xl overflow-hidden">
      {/* Top Header */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-[#161618]">
        <div className="flex items-center gap-2">
          <Terminal size={15} className="text-blue-400" />
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
            Historique & Erreurs d'Exécution
          </span>
          <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-[10px] text-neutral-400 font-mono">
            {logs.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-red-400 disabled:opacity-30 transition"
            title="Effacer tout l'historique"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-[#19191d] border-b border-neutral-800 text-[11px]">
        <button
          onClick={() => setFilterType('all')}
          className={`px-2.5 py-0.5 rounded-lg transition font-medium ${
            filterType === 'all' ? 'bg-[#292930] text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Tous ({logs.length})
        </button>
        <button
          onClick={() => setFilterType('error')}
          className={`px-2.5 py-0.5 rounded-lg transition font-medium flex items-center gap-1 ${
            filterType === 'error' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-neutral-400 hover:text-rose-400'
          }`}
        >
          <XCircle size={11} className="text-rose-400" />
          Erreurs ({logs.filter(l => l.status === 'error').length})
        </button>
        <button
          onClick={() => setFilterType('success')}
          className={`px-2.5 py-0.5 rounded-lg transition font-medium flex items-center gap-1 ${
            filterType === 'success' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-neutral-400 hover:text-emerald-400'
          }`}
        >
          <CheckCircle2 size={11} className="text-emerald-400" />
          Succès ({logs.filter(l => l.status === 'success').length})
        </button>
      </div>

      {/* Main Split Body: Left List / Right Details */}
      <div className="flex-1 flex overflow-hidden">
        {/* Command List Column */}
        <div className="w-1/2 border-r border-neutral-800 overflow-y-auto p-2 space-y-1.5">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-neutral-500 space-y-2">
              <Terminal size={24} className="text-neutral-600" />
              <p>Aucune exécution enregistrée.</p>
              <p className="text-[10px]">Lancez un Run ou Build depuis la barre supérieure ou l'explorateur.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isSelected = selectedLog?.id === log.id;
              const isError = log.status === 'error';
              const isRunning = log.status === 'running';

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLogId(log.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition text-xs select-none ${
                    isSelected
                      ? 'bg-[#222228] border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                      : 'bg-[#1b1b1e] border-neutral-800/80 hover:bg-[#202024]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      {isRunning ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                      ) : isError ? (
                        <XCircle size={13} className="text-rose-400 shrink-0" />
                      ) : (
                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      )}
                      <span className="font-mono font-semibold text-white truncate max-w-[140px]">
                        {log.command}
                      </span>
                    </div>

                    <span className="text-[10px] text-neutral-500 font-mono">
                      {log.startTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="truncate max-w-[150px] font-mono text-[10px]">
                      {log.targetFile ? log.targetFile.split(/[\\/]/).pop() : (log.cwd.split(/[\\/]/).pop() || 'Projet')}
                    </span>

                    {log.duration !== undefined && (
                      <span className="font-mono text-[10px] text-neutral-500">
                        {log.duration}ms
                      </span>
                    )}
                  </div>

                  {log.errors.length > 0 && (
                    <div className="mt-1 px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 text-[10px] truncate border border-rose-500/20">
                      ⚠️ {log.errors[0]}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Selected Execution Details Column */}
        <div className="w-1/2 flex flex-col bg-[#131316] overflow-hidden">
          {!selectedLog ? (
            <div className="h-full flex items-center justify-center text-neutral-500 text-xs">
              Sélectionnez une commande
            </div>
          ) : (
            <>
              {/* Detail Header */}
              <div className="p-3 bg-[#17171b] border-b border-neutral-800 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-xs">{selectedLog.command}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedLog.status === 'error'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : selectedLog.status === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {selectedLog.status} (Code {selectedLog.exitCode ?? '?'})
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                    Dossier : {selectedLog.cwd}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onRerun(selectedLog)}
                    className="p-1.5 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg transition"
                    title="Relancer cette commande"
                  >
                    <RotateCcw size={13} />
                  </button>
                  <button
                    onClick={() => handleCopyOutput(selectedLog.output)}
                    className="p-1.5 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg transition"
                    title="Copier les logs de sortie"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {/* Erreurs extraites en premier si présentes */}
              {selectedLog.errors.length > 0 && (
                <div className="p-2.5 bg-rose-950/20 border-b border-rose-900/40 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[11px] uppercase">
                    <AlertTriangle size={13} />
                    <span>Erreurs détectées ({selectedLog.errors.length})</span>
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {selectedLog.errors.map((err, idx) => (
                      <div key={idx} className="font-mono text-rose-300 text-[11px] bg-rose-500/10 p-1 rounded border border-rose-500/20 break-words">
                        {err}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sortie console complète */}
              <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed text-neutral-300 bg-[#0f0f12]">
                <div className="text-neutral-500 mb-1 select-none font-semibold">--- SORTIE DE COMMANDE ---</div>
                <pre className="whitespace-pre-wrap break-words">
                  {selectedLog.output || '[Aucune sortie générée]'}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
