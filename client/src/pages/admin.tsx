import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Lock, Plus, Trash2, ToggleLeft, ToggleRight, Webhook, AlertTriangle } from 'lucide-react';

interface DiscordWebhook {
  id: number;
  name: string;
  url: string;
  active: boolean;
  created_at: string;
}

async function adminFetch(path: string, method = 'GET', body?: object, adminKey?: string): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (adminKey) headers['X-Admin-Key'] = adminKey;
  return fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [authError, setAuthError] = useState('');
  const [authing, setAuthing] = useState(false);
  const [webhooks, setWebhooks] = useState<DiscordWebhook[]>([]);
  const [loadError, setLoadError] = useState('');
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  async function handleAuth() {
    setAuthError('');
    setAuthing(true);
    try {
      const res = await adminFetch('/api/admin/auth', 'POST', { password: inputKey });
      if (res.ok) {
        setAdminKey(inputKey);
        await loadWebhooks(inputKey);
      } else {
        setAuthError('Mot de passe incorrect');
      }
    } catch {
      setAuthError('Erreur de connexion');
    }
    setAuthing(false);
  }

  async function loadWebhooks(key: string) {
    setLoadError('');
    try {
      const res = await adminFetch('/api/admin/webhooks', 'GET', undefined, key);
      if (res.ok) {
        setWebhooks(await res.json());
      } else {
        setLoadError('Impossible de charger les webhooks');
      }
    } catch {
      setLoadError('Erreur réseau');
    }
  }

  useEffect(() => {
    if (adminKey) loadWebhooks(adminKey);
  }, []);

  async function addWebhook() {
    setAddError('');
    if (!newName.trim()) { setAddError('Le nom est requis'); return; }
    if (!newUrl.trim()) { setAddError("L'URL est requise"); return; }
    if (!newUrl.startsWith('https://discord.com/api/webhooks/')) {
      setAddError("L'URL doit commencer par https://discord.com/api/webhooks/");
      return;
    }
    setAdding(true);
    try {
      const res = await adminFetch('/api/admin/webhooks', 'POST', { name: newName.trim(), url: newUrl.trim() }, adminKey);
      if (res.ok) {
        setNewName('');
        setNewUrl('');
        await loadWebhooks(adminKey);
      } else {
        const data = await res.json().catch(() => ({}));
        setAddError(data.error || "Erreur lors de l'ajout");
      }
    } catch {
      setAddError('Erreur réseau');
    }
    setAdding(false);
  }

  async function toggleWebhook(id: number, active: boolean) {
    await adminFetch(`/api/admin/webhooks/${id}`, 'PATCH', { active }, adminKey);
    await loadWebhooks(adminKey);
  }

  async function deleteWebhook(id: number) {
    if (!confirm('Supprimer ce webhook ?')) return;
    await adminFetch(`/api/admin/webhooks/${id}`, 'DELETE', undefined, adminKey);
    await loadWebhooks(adminKey);
  }

  if (!adminKey) {
    return (
      <AppLayout>
        <div className="h-full flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at center, rgba(255,184,0,0.04) 0%, #000 100%)' }}>
          <div className="w-full max-w-sm p-8 rounded-2xl border border-amber-500/20 bg-black/90 flex flex-col items-center gap-6"
            style={{ boxShadow: '0 0 60px rgba(255,184,0,0.05)' }}>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.25)' }}>
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
            <div className="text-center">
              <div className="text-xl font-black uppercase tracking-widest text-white mb-1">Zone Admin</div>
              <div className="text-[10px] font-mono text-white/25">Accès restreint · Astral Security</div>
            </div>
            <div className="w-full flex flex-col gap-3">
              <input
                type="password"
                placeholder="Mot de passe administrateur"
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !authing && handleAuth()}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-white/20 focus:outline-none focus:border-amber-500/40"
                autoFocus
              />
              {authError && (
                <div className="flex items-center gap-2 text-[10px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {authError}
                </div>
              )}
              <button
                onClick={handleAuth}
                disabled={authing || !inputKey}
                className="w-full py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-40"
                style={{ background: 'rgba(255,184,0,0.10)', border: '1px solid rgba(255,184,0,0.35)', color: '#FFB800' }}
              >
                {authing ? 'Vérification…' : 'Accéder'}
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 py-8 space-y-8 pb-16">

          <header className="flex items-center gap-4">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.25)' }}>
              <Lock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="text-xl font-black uppercase tracking-tight text-white">Zone Admin</div>
              <div className="text-[10px] font-mono text-white/30">Webhooks Discord · Astral Security</div>
            </div>
            <button
              onClick={() => setAdminKey('')}
              className="ml-auto text-[9px] font-mono text-white/20 hover:text-white/50 transition-colors"
            >
              Déconnexion
            </button>
          </header>

          <div className="glass-panel rounded-xl border border-white/10 p-5 space-y-4">
            <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,184,0,0.5)' }}>
              Ajouter un Webhook Discord
            </div>
            <div className="flex flex-col gap-3">
              <input
                placeholder="Nom du webhook (ex : #alertes-critiques)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-white/20 focus:outline-none focus:border-amber-500/40 transition-colors"
              />
              <input
                placeholder="https://discord.com/api/webhooks/…"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !adding && addWebhook()}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-white/20 focus:outline-none focus:border-amber-500/40 transition-colors"
              />
              {addError && (
                <div className="flex items-center gap-2 text-[10px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {addError}
                </div>
              )}
              <button
                onClick={addWebhook}
                disabled={adding}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-40"
                style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.25)', color: '#00F0FF' }}
              >
                <Plus className="w-3.5 h-3.5" />
                {adding ? 'Ajout…' : 'Ajouter le webhook'}
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-xl border border-white/10 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/8 bg-white/3 flex items-center gap-2">
              <Webhook className="w-4 h-4 text-primary/50" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/35">Webhooks configurés</span>
              <span className="ml-auto text-[9px] font-mono text-white/20">
                {webhooks.filter(w => w.active).length} actif{webhooks.filter(w => w.active).length > 1 ? 's' : ''} / {webhooks.length}
              </span>
            </div>

            {loadError && (
              <div className="px-5 py-4 text-[10px] font-mono text-red-400/70">{loadError}</div>
            )}

            {!loadError && webhooks.length === 0 && (
              <div className="px-5 py-10 text-center">
                <Webhook className="w-8 h-8 text-white/10 mx-auto mb-3" />
                <div className="text-[10px] font-mono text-white/20">Aucun webhook configuré</div>
                <div className="text-[9px] font-mono text-white/10 mt-1">Ajoutez un webhook Discord ci-dessus</div>
              </div>
            )}

            {webhooks.length > 0 && (
              <div className="divide-y divide-white/5">
                {webhooks.map(wh => (
                  <div key={wh.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/2 transition-colors">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${wh.active ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-white/15'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white/80">{wh.name}</div>
                      <div className="text-[9px] font-mono text-white/20 truncate mt-0.5">
                        discord.com/api/webhooks/{wh.url.split('/').slice(-2).join('/')}
                      </div>
                    </div>
                    <div className="text-[8px] font-mono text-white/15 shrink-0 hidden sm:block">
                      {new Date(wh.created_at).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleWebhook(wh.id, !wh.active)}
                        className="transition-colors"
                        title={wh.active ? 'Désactiver' : 'Activer'}
                      >
                        {wh.active
                          ? <ToggleRight className="w-5 h-5 text-green-400" />
                          : <ToggleLeft className="w-5 h-5 text-white/25" />}
                      </button>
                      <button
                        onClick={() => deleteWebhook(wh.id)}
                        className="text-white/20 hover:text-red-400 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/5 bg-white/2 p-4 text-[9px] font-mono text-white/20 leading-relaxed">
            <strong className="text-white/40 block mb-1">Comment ça fonctionne</strong>
            Chaque alerte vérifiée par EVA est automatiquement envoyée à tous les webhooks actifs sous forme d'embed Discord coloré par sévérité. Les webhooks Discord fonctionnent sur Vercel (simple appel HTTP POST, pas de bot persistant requis).
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
