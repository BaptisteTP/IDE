import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Sliders, Cpu, Save, Key, Terminal, 
  Palette, Check, FolderCog, FileCode, Play, Wrench, ShieldAlert 
} from 'lucide-react';
import { AppSettings, IDETheme } from '../types';
import { THEMES, ThemeConfig } from '../theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  themeConfig: ThemeConfig;
  workspacePath: string | null;
  onRunTechnicalCommand?: (cmd: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  themeConfig,
  workspacePath,
  onRunTechnicalCommand
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'technical'>('general');
  const [formState, setFormState] = useState<AppSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [envKey, setEnvKey] = useState('');
  const [envVal, setEnvVal] = useState('');

  if (!isOpen) return null;

  const handleUpdate = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  };

  const handleAddEnv = () => {
    if (!envKey.trim()) return;
    setFormState(prev => ({
      ...prev,
      envVariables: {
        ...prev.envVariables,
        [envKey.trim()]: envVal.trim()
      }
    }));
    setEnvKey('');
    setEnvVal('');
  };

  const handleRemoveEnv = (key: string) => {
    setFormState(prev => {
      const next = { ...prev.envVariables };
      delete next[key];
      return { ...prev, envVariables: next };
    });
  };

  const handleSave = () => {
    onSaveSettings(formState);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#161619] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 bg-[#1a1a1e] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <SettingsIcon size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Paramètres de l'IDE</h2>
              <p className="text-[11px] text-neutral-400">Configuration de l'éditeur & options techniques du projet</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              {savedSuccess ? <Check size={14} className="text-emerald-300" /> : <Save size={14} />}
              <span>{savedSuccess ? 'Enregistré !' : 'Enregistrer'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium transition"
            >
              Fermer
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-[#141417] px-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 transition ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Sliders size={15} />
            <span>Paramètres Simples & Thèmes</span>
          </button>
          <button
            onClick={() => setActiveTab('technical')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 transition ${
              activeTab === 'technical'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Cpu size={15} />
            <span>Paramètres Techniques du Projet</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6 text-xs text-neutral-300">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Thème Selector */}
              <div>
                <label className="flex items-center gap-2 text-white font-semibold mb-2">
                  <Palette size={15} className="text-blue-400" />
                  <span>Thème visuel de l'IDE</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(Object.keys(THEMES) as IDETheme[]).map(themeKey => {
                    const t = THEMES[themeKey];
                    const isSelected = formState.theme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        onClick={() => handleUpdate('theme', themeKey)}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500/10 shadow-md ring-1 ring-blue-500/50'
                            : 'border-neutral-800 bg-[#1c1c20] hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-bold text-xs text-white">{t.name}</span>
                          {isSelected && <Check size={14} className="text-blue-400" />}
                        </div>
                        <p className="text-[10px] text-neutral-400 line-clamp-2">{t.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Police et taille */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-200 mb-1.5">Taille de police (px)</label>
                  <input
                    type="number"
                    min={10}
                    max={32}
                    value={formState.fontSize}
                    onChange={(e) => handleUpdate('fontSize', parseInt(e.target.value) || 14)}
                    className="w-full bg-[#202024] border border-neutral-700/80 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-200 mb-1.5">Taille des indentations (espaces)</label>
                  <select
                    value={formState.tabSize}
                    onChange={(e) => handleUpdate('tabSize', parseInt(e.target.value) || 2)}
                    className="w-full bg-[#202024] border border-neutral-700/80 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  >
                    <option value={2}>2 espaces</option>
                    <option value={4}>4 espaces</option>
                    <option value={8}>8 espaces</option>
                  </select>
                </div>
              </div>

              {/* Famille de police */}
              <div>
                <label className="block font-semibold text-neutral-200 mb-1.5">Police d'écriture du code</label>
                <input
                  type="text"
                  value={formState.fontFamily}
                  onChange={(e) => handleUpdate('fontFamily', e.target.value)}
                  className="w-full bg-[#202024] border border-neutral-700/80 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 font-mono"
                  placeholder='Consolas, "Fira Code", monospace'
                />
              </div>

              {/* Options de l'éditeur */}
              <div className="space-y-3 pt-2 border-t border-neutral-800">
                <span className="block font-semibold text-neutral-200">Affichage de l'éditeur</span>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.minimap}
                    onChange={(e) => handleUpdate('minimap', e.target.checked)}
                    className="rounded accent-blue-500 cursor-pointer"
                  />
                  <span>Afficher la mini-carte de défilement (Minimap)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.wordWrap}
                    onChange={(e) => handleUpdate('wordWrap', e.target.checked)}
                    className="rounded accent-blue-500 cursor-pointer"
                  />
                  <span>Retour à la ligne automatique (Word Wrap)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.lineNumbers}
                    onChange={(e) => handleUpdate('lineNumbers', e.target.checked)}
                    className="rounded accent-blue-500 cursor-pointer"
                  />
                  <span>Afficher les numéros de lignes</span>
                </label>
              </div>

              {/* Gemini API Key */}
              <div className="pt-2 border-t border-neutral-800">
                <label className="flex items-center gap-2 font-semibold text-neutral-200 mb-1.5">
                  <Key size={14} className="text-purple-400" />
                  <span>Clé d'API Gemini (Assistant IA)</span>
                </label>
                <input
                  type="password"
                  value={formState.geminiApiKey}
                  onChange={(e) => handleUpdate('geminiApiKey', e.target.value)}
                  className="w-full bg-[#202024] border border-neutral-700/80 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500 font-mono"
                  placeholder="AIzaSy..."
                />
                <p className="text-[11px] text-neutral-500 mt-1">Utilisée directement pour la génération de code sans passer par un serveur tiers.</p>
              </div>
            </div>
          )}

          {activeTab === 'technical' && (
            <div className="space-y-6">
              {/* Projet actuel info */}
              <div className="p-3 bg-[#1e1e24] border border-neutral-800 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-neutral-400 text-[11px] block">Dossier de projet actif</span>
                  <span className="font-mono text-white text-xs truncate max-w-md block">
                    {workspacePath || 'Aucun dossier ouvert'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold text-[11px]">
                  <FolderCog size={14} />
                  <span>Config Technique</span>
                </div>
              </div>

              {/* Type de projet */}
              <div>
                <label className="block font-semibold text-neutral-200 mb-1.5">Écosystème / Type de projet</label>
                <select
                  value={formState.projectType || 'custom'}
                  onChange={(e) => handleUpdate('projectType', e.target.value as any)}
                  className="w-full bg-[#202024] border border-neutral-700/80 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                >
                  <option value="node">Node.js / TypeScript / React</option>
                  <option value="python">Python / Django / FastAPI</option>
                  <option value="rust">Rust / Cargo</option>
                  <option value="c_cpp">C / C++ (Make, CMake)</option>
                  <option value="go">Go (Golang)</option>
                  <option value="custom">Personnalisé / Polyglotte</option>
                </select>
              </div>

              {/* Commandes Techniques de Cycle de Vie */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-neutral-200 flex items-center gap-1.5">
                      <Play size={13} className="text-emerald-400" />
                      <span>Commande d'exécution (Run / Start)</span>
                    </label>
                    {onRunTechnicalCommand && formState.runCommand && (
                      <button
                        onClick={() => onRunTechnicalCommand(formState.runCommand)}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-medium"
                      >
                        Tester dans le terminal
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formState.runCommand}
                    onChange={(e) => handleUpdate('runCommand', e.target.value)}
                    className="w-full bg-[#202024] border border-neutral-700/80 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono"
                    placeholder="npm run dev ou python main.py"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-neutral-200 flex items-center gap-1.5">
                      <Wrench size={13} className="text-blue-400" />
                      <span>Commande de compilation (Build)</span>
                    </label>
                    {onRunTechnicalCommand && formState.buildCommand && (
                      <button
                        onClick={() => onRunTechnicalCommand(formState.buildCommand)}
                        className="text-[10px] text-blue-400 hover:text-blue-300 underline font-medium"
                      >
                        Tester dans le terminal
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formState.buildCommand}
                    onChange={(e) => handleUpdate('buildCommand', e.target.value)}
                    className="w-full bg-[#202024] border border-neutral-700/80 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 font-mono"
                    placeholder="npm run build ou cargo build --release"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-neutral-200 flex items-center gap-1.5">
                      <Terminal size={13} className="text-amber-400" />
                      <span>Commande de tests automatisés (Test)</span>
                    </label>
                    {onRunTechnicalCommand && formState.testCommand && (
                      <button
                        onClick={() => onRunTechnicalCommand(formState.testCommand)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 underline font-medium"
                      >
                        Tester dans le terminal
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formState.testCommand}
                    onChange={(e) => handleUpdate('testCommand', e.target.value)}
                    className="w-full bg-[#202024] border border-neutral-700/80 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 font-mono"
                    placeholder="npm test ou pytest"
                  />
                </div>
              </div>

              {/* Variables d'environnement de projet */}
              <div className="pt-2 border-t border-neutral-800 space-y-3">
                <span className="block font-semibold text-neutral-200">Variables d'environnement (.env injecté)</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="VAR_NAME (ex: PORT)"
                    value={envKey}
                    onChange={(e) => setEnvKey(e.target.value)}
                    className="w-1/2 bg-[#202024] border border-neutral-700/80 rounded-xl px-3 py-1.5 text-white outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Valeur (ex: 8080)"
                    value={envVal}
                    onChange={(e) => setEnvVal(e.target.value)}
                    className="w-1/2 bg-[#202024] border border-neutral-700/80 rounded-xl px-3 py-1.5 text-white outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                  <button
                    onClick={handleAddEnv}
                    className="px-3 py-1.5 bg-[#2b2b34] hover:bg-[#343440] text-indigo-400 rounded-xl font-semibold transition"
                  >
                    Ajouter
                  </button>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {Object.entries(formState.envVariables || {}).length === 0 ? (
                    <p className="text-[11px] text-neutral-500">Aucune variable définie.</p>
                  ) : (
                    Object.entries(formState.envVariables).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between p-2 rounded-xl bg-[#202024] border border-neutral-800 text-xs">
                        <span className="font-mono text-indigo-300 font-semibold">{k} = <span className="text-white font-normal">{v}</span></span>
                        <button
                          onClick={() => handleRemoveEnv(k)}
                          className="text-neutral-500 hover:text-red-400 text-xs font-bold px-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
