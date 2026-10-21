import React, { useState } from 'react';
import { 
  Send, Globe, Clock, CheckCircle2, AlertCircle, Copy, Check, Plus, Trash2, 
  RotateCcw, Code, ListFilter, Bookmark, ExternalLink 
} from 'lucide-react';
import { HttpResponseResult } from '../types';
import { ThemeConfig } from '../theme';

interface HeaderItem {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface SavedRequest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: HeaderItem[];
  body: string;
}

const DEFAULT_SAVED_REQUESTS: SavedRequest[] = [
  {
    id: 'req-1',
    name: 'Exemple JSONPlaceholder Users',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/users',
    headers: [{ id: 'h-1', key: 'Accept', value: 'application/json', enabled: true }],
    body: ''
  },
  {
    id: 'req-2',
    name: 'Exemple POST Todo',
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/todos',
    headers: [
      { id: 'h-1', key: 'Content-Type', value: 'application/json', enabled: true }
    ],
    body: JSON.stringify({ title: 'Tester mon IDE', completed: false, userId: 1 }, null, 2)
  }
];

interface HttpTesterProps {
  themeConfig?: ThemeConfig;
}

export const HttpTester: React.FC<HttpTesterProps> = ({ themeConfig }) => {
  const [url, setUrl] = useState<string>('https://jsonplaceholder.typicode.com/todos/1');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET');
  const [headers, setHeaders] = useState<HeaderItem[]>([
    { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
    { id: '2', key: 'Accept', value: 'application/json', enabled: true }
  ]);
  const [bodyText, setBodyText] = useState<string>('{\n  "name": "Antigravity IDE",\n  "status": "ready"\n}');
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'history' | 'saved'>('body');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<HttpResponseResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Saved requests / Collections
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>(() => {
    try {
      const stored = localStorage.getItem('ide_saved_requests');
      return stored ? JSON.parse(stored) : DEFAULT_SAVED_REQUESTS;
    } catch {
      return DEFAULT_SAVED_REQUESTS;
    }
  });

  // History
  const [history, setHistory] = useState<SavedRequest[]>(() => {
    try {
      const stored = localStorage.getItem('ide_http_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const getMethodBadge = (m: string) => {
    if (themeConfig?.styles.badgeMethod) {
      switch (m) {
        case 'GET': return themeConfig.styles.badgeMethod.get;
        case 'POST': return themeConfig.styles.badgeMethod.post;
        case 'PUT': return themeConfig.styles.badgeMethod.put;
        case 'DELETE': return themeConfig.styles.badgeMethod.delete;
        default: return themeConfig.styles.badgeMethod.patch;
      }
    }
    switch (m) {
      case 'GET': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'POST': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'PUT': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'DELETE': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  const handleAddHeader = () => {
    setHeaders([...headers, { id: Date.now().toString(), key: '', value: '', enabled: true }]);
  };

  const handleRemoveHeader = (id: string) => {
    setHeaders(headers.filter(h => h.id !== id));
  };

  const handleUpdateHeader = (id: string, field: 'key' | 'value' | 'enabled', val: any) => {
    setHeaders(headers.map(h => h.id === id ? { ...h, [field]: val } : h));
  };

  const handleSend = async () => {
    if (!url.trim() || !window.api) return;
    setLoading(true);

    const headersRecord: Record<string, string> = {};
    headers.forEach(h => {
      if (h.enabled && h.key.trim()) {
        headersRecord[h.key.trim()] = h.value;
      }
    });

    try {
      const res = await window.api.httpRequest({
        url: url.trim(),
        method,
        headers: headersRecord,
        body: ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? bodyText : undefined
      });
      setResponse(res);

      // Add to history
      const newHistoryItem: SavedRequest = {
        id: Date.now().toString(),
        name: `${method} ${url.substring(0, 30)}...`,
        method,
        url,
        headers,
        body: bodyText
      };
      const updatedHistory = [newHistoryItem, ...history.slice(0, 19)];
      setHistory(updatedHistory);
      localStorage.setItem('ide_http_history', JSON.stringify(updatedHistory));
    } catch (e: any) {
      setResponse({
        success: false,
        error: e.message || 'Erreur lors de la requête'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrentRequest = () => {
    const name = prompt('Nom de la requête à sauvegarder :', `${method} ${url.split('/').pop() || 'Request'}`);
    if (!name) return;
    const newReq: SavedRequest = {
      id: Date.now().toString(),
      name,
      method,
      url,
      headers,
      body: bodyText
    };
    const updated = [newReq, ...savedRequests];
    setSavedRequests(updated);
    localStorage.setItem('ide_saved_requests', JSON.stringify(updated));
  };

  const handleLoadRequest = (req: SavedRequest) => {
    setUrl(req.url);
    setMethod(req.method);
    setHeaders(req.headers || []);
    setBodyText(req.body || '');
    setActiveTab('body');
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedRequests.filter(r => r.id !== id);
    setSavedRequests(updated);
    localStorage.setItem('ide_saved_requests', JSON.stringify(updated));
  };

  const handleCopyResponse = () => {
    if (!response?.data) return;
    const str = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);
    navigator.clipboard.writeText(str);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(bodyText);
      setBodyText(JSON.stringify(parsed, null, 2));
    } catch {
      alert('JSON invalide');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#161618] border border-neutral-800/80 rounded-2xl w-full text-sm text-neutral-300 shadow-xl overflow-hidden shrink-0">
      {/* Top Header */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-400 bg-[#161618]">
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-emerald-400" />
          <span>Client API & HTTP (Postman)</span>
        </div>
        <button
          onClick={handleSaveCurrentRequest}
          title="Sauvegarder la requête"
          className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-[11px] transition"
        >
          <Bookmark size={12} className="text-amber-400" />
          <span>Sauvegarder</span>
        </button>
      </div>

      {/* URL & Method Input Bar */}
      <div className="p-3 bg-[#19191d] border-b border-neutral-800 space-y-2">
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            className={`font-bold text-xs px-2.5 py-1.5 rounded-xl border outline-none cursor-pointer bg-[#202024] ${getMethodBadge(method)}`}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
          <input
            type="text"
            placeholder="https://api.example.com/v1/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-[#202024] border border-neutral-700/80 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 font-mono shadow-inner min-w-0"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50 shrink-0"
          >
            <Send size={13} />
            <span>{loading ? '...' : 'Envoyer'}</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80 text-[11px]">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('body')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                activeTab === 'body' ? 'bg-[#292930] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Body (JSON)
            </button>
            <button
              onClick={() => setActiveTab('headers')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                activeTab === 'headers' ? 'bg-[#292930] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Headers ({headers.filter(h => h.enabled).length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                activeTab === 'saved' ? 'bg-[#292930] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Favoris ({savedRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                activeTab === 'history' ? 'bg-[#292930] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Historique
            </button>
          </div>

          {activeTab === 'body' && (
            <button
              onClick={handleFormatJson}
              className="text-neutral-400 hover:text-neutral-200 text-[10px] px-2 py-0.5 rounded hover:bg-neutral-800"
              title="Formater le JSON"
            >
              Formater JSON
            </button>
          )}
        </div>

        {/* Body View */}
        {activeTab === 'body' && (
          <div className="space-y-1">
            <textarea
              rows={4}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full bg-[#202024] border border-neutral-700/80 rounded-xl p-2 text-xs font-mono text-neutral-300 outline-none resize-none focus:border-blue-500"
              placeholder='{\n  "clé": "valeur"\n}'
            />
          </div>
        )}

        {/* Headers View (Key-Value Builder) */}
        {activeTab === 'headers' && (
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {headers.map(h => (
              <div key={h.id} className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={h.enabled}
                  onChange={(e) => handleUpdateHeader(h.id, 'enabled', e.target.checked)}
                  className="rounded accent-blue-500 cursor-pointer"
                />
                <input
                  type="text"
                  placeholder="En-tête (ex: Authorization)"
                  value={h.key}
                  onChange={(e) => handleUpdateHeader(h.id, 'key', e.target.value)}
                  className="w-1/2 bg-[#202024] border border-neutral-700/80 rounded-lg px-2 py-1 text-xs font-mono text-white outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Valeur (ex: Bearer token)"
                  value={h.value}
                  onChange={(e) => handleUpdateHeader(h.id, 'value', e.target.value)}
                  className="w-1/2 bg-[#202024] border border-neutral-700/80 rounded-lg px-2 py-1 text-xs font-mono text-white outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => handleRemoveHeader(h.id)}
                  className="p-1 hover:text-red-400 text-neutral-500 rounded"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button
              onClick={handleAddHeader}
              className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium pt-1"
            >
              <Plus size={12} /> Ajouter un en-tête
            </button>
          </div>
        )}

        {/* Saved Requests List */}
        {activeTab === 'saved' && (
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {savedRequests.length === 0 ? (
              <p className="text-xs text-neutral-500 py-2 text-center">Aucune requête enregistrée.</p>
            ) : (
              savedRequests.map(req => (
                <div
                  key={req.id}
                  onClick={() => handleLoadRequest(req)}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#202024] hover:bg-[#27272d] border border-neutral-800 cursor-pointer transition text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getMethodBadge(req.method)}`}>
                      {req.method}
                    </span>
                    <span className="font-medium text-neutral-200 truncate">{req.name}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSaved(req.id, e)}
                    className="p-1 text-neutral-500 hover:text-red-400 rounded"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* History List */}
        {activeTab === 'history' && (
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-xs text-neutral-500 py-2 text-center">Historique vide.</p>
            ) : (
              history.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleLoadRequest(item)}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#202024] hover:bg-[#27272d] border border-neutral-800 cursor-pointer transition text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getMethodBadge(item.method)}`}>
                      {item.method}
                    </span>
                    <span className="text-neutral-400 font-mono text-[11px] truncate">{item.url}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Response Panel */}
      <div className="flex-1 flex flex-col p-3 overflow-hidden bg-[#141416]">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-xs">
          <span className="font-semibold text-neutral-400 uppercase tracking-wide">Réponse</span>
          {response && (
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-1 font-mono font-bold ${
                response.success && (response.status || 0) < 400 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {response.success ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                {response.status || 'Erreur'} {response.statusText}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
                <Clock size={12} /> {response.duration} ms
              </span>
              <button
                onClick={handleCopyResponse}
                title="Copier la réponse JSON"
                className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto mt-2 bg-[#1b1b1e] rounded-xl p-3 border border-neutral-800/80">
          {!response ? (
            <div className="h-full flex flex-col items-center justify-center text-xs text-neutral-500 space-y-2">
              <Globe size={24} className="text-neutral-600" />
              <span>Configurez votre requête ci-dessus et cliquez sur Envoyer.</span>
            </div>
          ) : response.error ? (
            <div className="text-xs text-rose-400 font-mono p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
              ⚠️ Échec de connexion : {response.error}
            </div>
          ) : (
            <pre className="text-xs font-mono text-neutral-300 whitespace-pre-wrap break-words">
              {typeof response.data === 'string'
                ? response.data
                : JSON.stringify(response.data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
