import React, { useState } from 'react';
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
  ChevronDown,
  MessageSquare,
  Code2,
  Bug,
  HelpCircle,
  FileCheck2
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
  geminiApiKey?: string;
}

interface DirectChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  currentFile,
  currentCode,
  onApplyCode,
  onRunTechnicalCommand,
  workspacePath,
  geminiApiKey
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'sessions' | 'viewer' | 'interactive'>('chat');
  const [sessions, setSessions] = useState<AgySessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionTurns, setSessionTurns] = useState<AgyTurn[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  // Direct AI Chat State
  const [directPrompt, setDirectPrompt] = useState<string>('');
  const [directLoading, setDirectLoading] = useState<boolean>(false);
  const [directMessages, setDirectMessages] = useState<DirectChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Bonjour ! Je suis votre copilote IA intégré. Je peux expliquer votre code, proposer des optimisations, générer des tests ou corriger des bugs.',
      timestamp: new Date().toISOString()
    }
  ]);

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
      if (!selectedSessionId && list.length > 0) {
        handleSelectSession(list[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSessions(false);
    }
  };

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

  const handleSendDirectPrompt = async (promptToSend?: string) => {
    const prompt = promptToSend || directPrompt;
    if (!prompt.trim() || !window.api?.generateCode || directLoading) return;

    const userMsg: DirectChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: prompt.trim(),
      timestamp: new Date().toISOString()
    };

    setDirectMessages((prev) => [...prev, userMsg]);
    if (!promptToSend) setDirectPrompt('');
    setDirectLoading(true);

    try {
      const res = await window.api.generateCode({
        prompt: prompt.trim(),
        fileContext: currentFile || undefined,
        fullCode: currentCode || undefined,
        apiKey: geminiApiKey
      });

      if (res.success && res.text) {
        setDirectMessages((prev) => [
          ...prev,
          {
            id: 'assistant-' + Date.now(),
            sender: 'assistant',
            text: res.text!,
            timestamp: new Date().toISOString()
          }
        ]);
      } else {
        setDirectMessages((prev) => [
          ...prev,
          {
            id: 'err-' + Date.now(),
            sender: 'assistant',
            text: `⚠️ Erreur : ${res.error || 'Impossible de joindre Gemini API.'}`,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch (err: any) {
      setDirectMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'assistant',
          text: `⚠️ Exception : ${err.message}`,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setDirectLoading(false);
    }
  };

  const handleQuickAction = (actionType: 'explain' | 'refactor' | 'tests' | 'fix') => {
    let prompt = '';
    const fileName = currentFile ? currentFile.split(/[\\/]/).pop() : 'le fichier actuel';
    if (actionType === 'explain') {
      prompt = `Explique en détail le rôle, l'architecture et les fonctions principales de ${fileName}.`;
    } else if (actionType === 'refactor') {
      prompt = `Analyse et refactorise ce code pour le rendre plus propre, modulaire et performant en appliquant les meilleures pratiques.`;
    } else if (actionType === 'tests') {
      prompt = `Génère des tests unitaires complets et robustes (avec mocks si nécessaire) pour tester le code de ${fileName}.`;
    } else if (actionType === 'fix') {
      prompt = `Détecte les bugs potentiels, failles de sécurité ou mauvaises pratiques dans ${fileName} et propose le code corrigé.`;
    }
    handleSendDirectPrompt(prompt);
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
              <span className="text-white font-bold tracking-wide">Assistant IA</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded-full font-mono">
                Gemini + AGY
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 font-normal">Génération, refactoring & sessions</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (activeTab === 'sessions') loadSessions();
          }}
          title="Actualiser"
          className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition"
        >
          <RefreshCw size={14} className={loadingSessions ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 text-xs px-2 pt-2 gap-1 bg-[#101012]">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-t-lg transition ${
            activeTab === 'chat'
              ? 'bg-[#1b1b1f] text-white border-b-2 border-purple-500'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <MessageSquare size={12} />
          <span>Chat IA</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('sessions');
            loadSessions();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-t-lg transition ${
            activeTab === 'sessions'
              ? 'bg-[#1b1b1f] text-white border-b-2 border-purple-500'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <History size={12} />
          <span>Sessions AGY</span>
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
          <span>Journal</span>
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
          <span>CLI AGY</span>
        </button>
      </div>

      {/* Tab 1: Direct Chat with Gemini & Quick Actions */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#161618]">
          {/* Quick Actions Shortcuts */}
          <div className="p-2 border-b border-neutral-800 bg-[#1a1a1e] flex flex-wrap gap-1.5">
            <button
              onClick={() => handleQuickAction('explain')}
              disabled={!currentCode || directLoading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-purple-600/30 hover:border-purple-500/50 border border-neutral-700 text-neutral-300 hover:text-white text-[11px] transition disabled:opacity-40"
            >
              <HelpCircle size={12} className="text-blue-400" />
              <span>Expliquer</span>
            </button>
            <button
              onClick={() => handleQuickAction('refactor')}
              disabled={!currentCode || directLoading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-purple-600/30 hover:border-purple-500/50 border border-neutral-700 text-neutral-300 hover:text-white text-[11px] transition disabled:opacity-40"
            >
              <Code2 size={12} className="text-purple-400" />
              <span>Refactoriser</span>
            </button>
            <button
              onClick={() => handleQuickAction('tests')}
              disabled={!currentCode || directLoading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-purple-600/30 hover:border-purple-500/50 border border-neutral-700 text-neutral-300 hover:text-white text-[11px] transition disabled:opacity-40"
            >
              <FileCheck2 size={12} className="text-emerald-400" />
              <span>Tests</span>
            </button>
            <button
              onClick={() => handleQuickAction('fix')}
              disabled={!currentCode || directLoading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-purple-600/30 hover:border-purple-500/50 border border-neutral-700 text-neutral-300 hover:text-white text-[11px] transition disabled:opacity-40"
            >
              <Bug size={12} className="text-amber-400" />
              <span>Corriger</span>
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {directMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              const code = !isUser ? extractCodeBlock(msg.text) : null;
              return (
                <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}>
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 px-1">
                    {isUser ? <User size={11} className="text-blue-400" /> : <Bot size={11} className="text-purple-400" />}
                    <span>{isUser ? 'Vous' : 'Gemini'}</span>
                    <span>• {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[92%] shadow ${
                      isUser
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none'
                        : 'bg-[#1e1e24] border border-neutral-800 text-neutral-200 rounded-tl-none'
                    }`}
                  >
                    <div className="prose prose-invert prose-xs max-w-none break-words">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>

                    {code && (
                      <div className="mt-2.5 pt-2 border-t border-neutral-700/60 flex items-center justify-between">
                        <span className="text-[10px] text-neutral-400">Code extrait</span>
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
            {directLoading && (
              <div className="flex items-center gap-2 p-3 bg-[#1e1e24] border border-neutral-800 rounded-2xl rounded-tl-none max-w-[80%] text-xs text-neutral-400 animate-pulse">
                <Sparkles size={14} className="text-purple-400 animate-spin" />
                <span>Gemini réfléchit et rédige...</span>
              </div>
            )}
          </div>

          {/* Prompt Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendDirectPrompt();
            }}
            className="p-3 border-t border-neutral-800 bg-[#141416] flex items-center gap-2"
          >
            <input
              type="text"
              value={directPrompt}
              onChange={(e) => setDirectPrompt(e.target.value)}
              placeholder="Posez une question ou demandez une modification..."
              disabled={directLoading}
              className="flex-1 bg-[#1e1e24] border border-neutral-700/80 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-purple-500 placeholder-neutral-500"
            />
            <button
              type="submit"
              disabled={directLoading || !directPrompt.trim()}
              className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Sessions List */}
      {activeTab === 'sessions' && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-500">
              {loadingSessions ? 'Chargement des sessions...' : 'Aucune session AGY trouvée.'}
            </div>
          ) : (
            sessions.map((sess) => (
              <div
                key={sess.id}
                onClick={() => handleSelectSession(sess.id)}
                className={`p-3 rounded-xl border cursor-pointer transition flex flex-col gap-1.5 ${
                  selectedSessionId === sess.id
                    ? 'bg-purple-600/15 border-purple-500/50 text-white'
                    : 'bg-[#1a1a1e] border-neutral-800/80 hover:bg-[#202026] text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-purple-400 font-semibold truncate">
                    {sess.id.slice(0, 12)}...
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {new Date(sess.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-xs line-clamp-2 text-neutral-200 font-medium">
                  {sess.title || sess.firstPrompt}
                </div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-800/50">
                  <span>{sess.messageCount} interactions</span>
                  <ChevronRight size={12} className="text-neutral-500" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Detailed Viewer */}
      {activeTab === 'viewer' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {!selectedSessionId ? (
            <div className="p-6 text-center text-xs text-neutral-500">
              Veuillez sélectionner une session dans l'onglet &quot;Sessions&quot;.
            </div>
          ) : loadingDetails ? (
            <div className="p-6 text-center text-xs text-neutral-500 animate-pulse">
              Chargement des échanges...
            </div>
          ) : (
            sessionTurns.map((turn) => {
              const isExpanded = !!expandedTools[turn.id];
              return (
                <div key={turn.id} className="space-y-2 border-b border-neutral-800/60 pb-3">
                  {/* User Turn */}
                  <div className="flex flex-col items-end space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 px-1">
                      <User size={11} className="text-blue-400" />
                      <span>Utilisateur</span>
                      <span>• {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white rounded-2xl rounded-tr-none max-w-[92%] text-xs shadow">
                      {turn.text}
                    </div>
                  </div>

                  {/* Tools info */}
                  {turn.toolsUsed && turn.toolsUsed.length > 0 && (
                    <div className="my-2 border border-neutral-800 rounded-xl bg-[#141417] overflow-hidden text-xs">
                      <button
                        onClick={() => toggleTools(turn.id)}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] text-purple-300 font-medium hover:bg-neutral-800/40 transition"
                      >
                        <div className="flex items-center gap-1.5">
                          <Layers size={12} className="text-purple-400" />
                          <span>{turn.toolsUsed.length} outils exécutés</span>
                        </div>
                        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>
                      {isExpanded && (
                        <div className="p-2 space-y-1 border-t border-neutral-800 bg-[#121214] font-mono text-[10px]">
                          {turn.toolsUsed.map((tool, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-neutral-300">
                              <span className="text-purple-400 font-semibold">{tool.name}</span>
                              <span className="text-neutral-500 truncate">{tool.summary}</span>
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

      {/* Tab 4: Interactive Launch Form */}
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