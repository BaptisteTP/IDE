import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  History,
  Bot,
  User,
  ArrowDownToLine,
  ChevronRight,
  Terminal,
  RefreshCw,
  FolderOpen,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AgySessionSummary, AgyTurn } from '../types';

interface AIAssistantProps {
  currentFile: string | null;
  currentCode: string;
  onApplyCode: (newCode: string) => void;
  onRunTechnicalCommand?: (cmd: string) => void;
  workspacePath?: string | null;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  currentFile,
  currentCode,
  onApplyCode,
  onRunTechnicalCommand,
  workspacePath
}) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'viewer' | 'interactive'>('sessions');
  const [sessions, setSessions] = useState<AgySessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionTurns, setSessionTurns] = useState<AgyTurn[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  // Interactive quick prompt via agy CLI
  const [interactivePrompt, setInteractivePrompt] = useState<string>('');
  const [continueSession, setContinueSession] = useState<boolean>(true);

  // Load all AGY sessions from ~/.gemini/antigravity-cli/brain
  const loadSessions = async () => {
    if (!window.api?.listAgySessions) return;
    setLoadingSessions(true);
    try {
      const list = await window.api.listAgySessions();
      setSessions(list);
      // Auto-select latest session if none selected
      if (!selectedSessionId && list.length > 0) {
        handleSelectSession(list[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleSelectSession = async (sessionId: string) => {
    if (!window.api?.getAgySessionDetails) return;
    setSelectedSessionId(sessionId);
    setLoadingDetails(true);
    try {
      const details = await window.api.getAgySessionDetails(sessionId);
      if (details) {
        setSessionTurns(details.turns);
        setActiveTab('viewer');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleTools = (turnId: string) => {
    setExpandedTools((prev) => ({
      ...prev,
      [turnId]: !prev[turnId]
    }));
  };

  const extractCodeBlock = (text: string): string | null => {
    const match = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
    return match ? match[1] : null;
  };

  const handleLaunchAgyInteractive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactivePrompt.trim() || !onRunTechnicalCommand) return;

    let cmd = `agy`;
    if (continueSession && selectedSessionId) {
      cmd += ` --conversation ${selectedSessionId}`;
    }
    cmd += ` -i "${interactivePrompt.replace(/"/g, '\\"')}"`;

    onRunTechnicalCommand(cmd);
    setInteractivePrompt('');
  };

  return (
    <div className="flex flex-col h-full bg-[#161618] border border-neutral-800/80 rounded-2xl w-full text-sm text-neutral-200 shadow-xl overflow-hidden">
      {/* Top Header */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between text-xs font-semibold bg-[#141416]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-sm">
            <Sparkles size={14} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold tracking-wide">AGY Assistant</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded-full font-mono">
                CLI Engine
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 font-normal">Historiques & Sessions Antigravity</p>
          </div>
        </div>

        <button
          onClick={loadSessions}
          title="Actualiser les sessions"
          className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition"
        >
          <RefreshCw size={14} className={loadingSessions ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 text-xs px-2 pt-2 gap-1 bg-[#101012]">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-t-lg transition ${
            activeTab === 'sessions'
              ? 'bg-[#1b1b1f] text-white border-b-2 border-purple-500'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <History size={12} />
          <span>Sessions ({sessions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('viewer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-t-lg transition ${
            activeTab === 'viewer'
              ? 'bg-[#1b1b1f] text-white border-b-2 border-purple-500'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Bot size={12} />
          <span>Discussion active</span>
        </button>
        <button
          onClick={() => setActiveTab('interactive')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-t-lg transition ${
            activeTab === 'interactive'
              ? 'bg-[#1b1b1f] text-white border-b-2 border-purple-500'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Terminal size={12} />
          <span>Lancer AGY</span>
        </button>
      </div>

      {/* Tab 1: Sessions List */}
      {activeTab === 'sessions' && (
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-400">
              {loadingSessions ? 'Chargement des sessions...' : 'Aucune session AGY trouvée dans le répertoire local.'}
            </div>
          ) : (
            sessions.map((sess) => {
              const isSelected = sess.id === selectedSessionId;
              const date = new Date(sess.updatedAt).toLocaleDateString([], {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={sess.id}
                  onClick={() => handleSelectSession(sess.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-purple-950/20 border-purple-500/50 shadow-sm'
                      : 'bg-[#1a1a1e] border-neutral-800 hover:border-neutral-700 hover:bg-[#202026]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-white truncate max-w-[200px]">
                      {sess.title}
                    </span>
                    <span className="text-[10px] text-neutral-500 flex items-center gap-1 shrink-0">
                      <Calendar size={10} />
                      {date}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-400 line-clamp-2">
                    {sess.firstPrompt}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60 text-[10px] text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Layers size={10} /> {sess.messageCount} requête{sess.messageCount > 1 ? 's' : ''}
                    </span>
                    <span className="font-mono text-[9px] text-neutral-500">
                      ID: {sess.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Selected Conversation Details */}
      {activeTab === 'viewer' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {loadingDetails ? (
            <div className="p-6 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
              <RefreshCw size={14} className="animate-spin text-purple-400" />
              <span>Chargement des échanges de la session...</span>
            </div>
          ) : sessionTurns.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-400">
              Sélectionnez une session dans l'onglet « Sessions » pour afficher les messages et outils exécutés par AGY.
            </div>
          ) : (
            sessionTurns.map((turn) => {
              const hasTools = turn.toolsUsed && turn.toolsUsed.length > 0;
              const isToolsExpanded = !!expandedTools[turn.id];

              return (
                <div key={turn.id} className="space-y-3">
                  {/* User Turn */}
                  {turn.sender === 'user' && (
                    <div className="flex flex-col items-end space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 px-1">
                        <span>Vous</span>
                        <User size={11} className="text-blue-400" />
                        <span>• {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-none max-w-[95%] text-xs leading-relaxed shadow">
                        <div className="whitespace-pre-wrap">{turn.text}</div>
                      </div>
                    </div>
                  )}

                  {/* Tools Run by AGY */}
                  {hasTools && (
                    <div className="border border-neutral-800 bg-[#121215] rounded-xl overflow-hidden text-xs">
                      <button
                        onClick={() => toggleTools(turn.id)}
                        className="w-full px-3 py-2 flex items-center justify-between text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 transition"
                      >
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-purple-300">
                          <Terminal size={12} className="text-purple-400" />
                          <span>{turn.toolsUsed.length} action{turn.toolsUsed.length > 1 ? 's' : ''} outil AGY</span>
                        </span>
                        <ChevronDown
                          size={13}
                          className={`transform transition-transform ${isToolsExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {isToolsExpanded && (
                        <div className="p-2 space-y-1.5 border-t border-neutral-800/80 bg-[#0d0d10] font-mono text-[10px]">
                          {turn.toolsUsed.map((tool, idx) => (
                            <div
                              key={idx}
                              className="px-2 py-1 rounded bg-[#18181c] border border-neutral-800/60 flex items-center justify-between"
                            >
                              <span className="text-purple-300 font-semibold">{tool.name}</span>
                              <span className="text-neutral-400 truncate max-w-[240px]" title={tool.summary}>
                                {tool.summary}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Assistant Response(s) */}
                  {turn.assistantResponses?.map((resp) => {
                    const code = extractCodeBlock(resp.text);
                    return (
                      <div key={resp.id} className="flex flex-col items-start space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 px-1">
                          <Bot size={11} className="text-purple-400" />
                          <span>AGY Assistant</span>
                          <span>• {new Date(resp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="p-3 bg-[#1e1e24] border border-neutral-800/90 text-neutral-200 rounded-2xl rounded-tl-none max-w-[95%] text-xs leading-relaxed shadow">
                          <div className="prose prose-invert prose-xs max-w-none break-words">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {resp.text}
                            </ReactMarkdown>
                          </div>

                          {code && (
                            <div className="mt-2.5 pt-2 border-t border-neutral-700/60 flex items-center justify-between">
                              <span className="text-[10px] text-neutral-400">Extrait de code disponible</span>
                              <button
                                onClick={() => onApplyCode(code)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-medium shadow transition"
                              >
                                <ArrowDownToLine size={12} />
                                <span>Remplacer dans l'éditeur</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 3: Interactive Launch Form */}
      {activeTab === 'interactive' && (
        <form onSubmit={handleLaunchAgyInteractive} className="flex-1 p-4 space-y-4 flex flex-col justify-between text-xs">
          <div className="space-y-3">
            <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-2xl text-neutral-300 space-y-1.5">
              <span className="font-semibold text-purple-300 block flex items-center gap-1.5">
                <Terminal size={14} />
                Lancer AGY directement dans l'IDE
              </span>
              <p className="text-[11px] text-neutral-400">
                Vous pouvez envoyer une consigne ou continuer la conversation en cours avec le moteur CLI d'Antigravity via un terminal intégré dédié.
              </p>
            </div>

            {selectedSessionId && (
              <label className="flex items-center gap-2 p-2 bg-[#1c1c20] rounded-xl border border-neutral-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={continueSession}
                  onChange={(e) => setContinueSession(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-0"
                />
                <span className="text-neutral-300 truncate">
                  Continuer la session sélectionnée ({selectedSessionId.slice(0, 8)}...)
                </span>
              </label>
            )}

            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">
                Consigne pour AGY :
              </label>
              <textarea
                value={interactivePrompt}
                onChange={(e) => setInteractivePrompt(e.target.value)}
                placeholder="ex: Vérifie la syntaxe, ajoute un composant, refactore le code..."
                rows={5}
                className="w-full bg-[#1b1b1e] border border-neutral-700 rounded-xl p-3 text-white outline-none focus:border-purple-500 font-mono text-xs shadow-inner resize-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-md transition transform active:scale-95"
          >
            <Send size={14} />
            <span>Exécuter dans le Terminal</span>
          </button>
        </form>
      )}

      {/* Bottom Context Indicator */}
      <div className="px-3 py-2 bg-[#121214] border-t border-neutral-800 text-[10px] text-neutral-400 flex items-center justify-between">
        <span className="truncate">
          Fichier actif : <span className="text-neutral-200 font-mono">{currentFile ? currentFile.split(/[\\/]/).pop() : 'Aucun'}</span>
        </span>
        {selectedSessionId && (
          <span className="text-[9px] text-purple-400 font-mono">
            Session: {selectedSessionId.slice(0, 8)}
          </span>
        )}
      </div>
    </div>
  );
};
