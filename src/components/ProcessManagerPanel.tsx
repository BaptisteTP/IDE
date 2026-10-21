import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Square, Terminal, Cpu, Clock, AlertTriangle } from 'lucide-react';
import { RunningProcessItem } from '../types';
import { ThemeConfig } from '../theme';

interface ProcessManagerPanelProps {
  themeConfig: ThemeConfig;
}

export const ProcessManagerPanel: React.FC<ProcessManagerPanelProps> = ({ themeConfig }) => {
  const [processes, setProcesses] = useState<RunningProcessItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [terminatingPid, setTerminatingPid] = useState<number | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const fetchProcesses = async () => {
    if (!window.api?.listRunningProcesses) return;
    setLoading(true);
    try {
      const list = await window.api.listRunningProcesses();
      setProcesses(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleKill = async (pid: number) => {
    if (!window.api?.killProcess) return;
    setTerminatingPid(pid);
    try {
      const res = await window.api.killProcess(pid);
      if (res.success) {
        setProcesses((prev) => prev.filter((p) => p.pid !== pid));
      } else {
        alert(`Impossible d'arrêter le processus (${pid}) : ${res.error || 'Erreur inconnue'}`);
      }
    } finally {
      setTerminatingPid(null);
    }
  };

  const filtered = processes.filter(
    (p) =>
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.commandLine.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.pid.toString().includes(searchFilter)
  );

  return (
    <div className="flex flex-col h-full bg-[#161618] border border-neutral-800/80 rounded-2xl w-full text-xs text-neutral-300 shadow-xl overflow-hidden animate-refresh">
      {/* Header */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-400 bg-[#141416]">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-emerald-400" />
          <span>Gestionnaire de Tâches</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={fetchProcesses}
            title="Rafraîchir la liste des processus"
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Info bar */}
      <div className="p-2.5 bg-[#18181c] border-b border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
        <span className="flex items-center gap-1.5">
          <Cpu size={13} className="text-emerald-400" />
          <span>Tâches détectées : <strong className="text-white">{processes.length}</strong></span>
        </span>
        <input
          type="text"
          placeholder="Filtrer (ex: vite, 3000, node)..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="bg-[#202025] border border-neutral-700/80 rounded-lg px-2 py-0.5 text-xs text-white outline-none focus:border-emerald-500 w-44"
        />
      </div>

      {/* Process list */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-neutral-500 space-y-2">
            <Activity size={24} className="mx-auto opacity-30 text-emerald-400" />
            <p className="text-xs">
              {loading ? 'Recherche des processus en cours...' : 'Aucun serveur dev ou script node/python actif détecté.'}
            </p>
          </div>
        ) : (
          filtered.map((proc) => {
            const isTerminating = terminatingPid === proc.pid;
            const isVite = proc.commandLine.toLowerCase().includes('vite');
            const isNpm = proc.commandLine.toLowerCase().includes('npm run');

            return (
              <div
                key={proc.pid}
                className="p-2.5 rounded-xl border border-neutral-800/80 bg-[#1b1b20] hover:border-neutral-700 transition flex flex-col gap-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isVite ? 'bg-purple-500 ring-2 ring-purple-500/20' : isNpm ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-blue-500'
                      }`}
                    />
                    <span className="font-semibold text-white truncate text-xs">
                      {proc.label}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px] font-mono text-neutral-400 border border-neutral-700/50">
                      PID: {proc.pid}
                    </span>
                  </div>

                  <button
                    onClick={() => handleKill(proc.pid)}
                    disabled={isTerminating}
                    title="Arrêter ce processus immédiatement"
                    className="flex items-center gap-1 px-2 py-1 bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-lg font-medium text-[10px] transition shrink-0 active:scale-95 disabled:opacity-50"
                  >
                    <Square size={10} fill="currentColor" />
                    <span>{isTerminating ? 'Arrêt...' : 'Arrêter'}</span>
                  </button>
                </div>

                <div className="text-[10px] font-mono text-neutral-400 bg-[#121215] p-1.5 rounded-lg border border-neutral-800/60 truncate" title={proc.commandLine}>
                  {proc.commandLine || proc.name}
                </div>

                {proc.date && (
                  <div className="flex items-center justify-between text-[9px] text-neutral-500 px-0.5">
                    <span className="flex items-center gap-1">
                      <Clock size={9} /> Démarré vers {proc.date}
                    </span>
                    <span className="text-neutral-400">{proc.name}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
