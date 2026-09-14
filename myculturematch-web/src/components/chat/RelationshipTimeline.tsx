import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Camera, Clock3, Heart, ImagePlus, Loader2, Plus, Sparkles, Users, X } from 'lucide-react';
import { relationshipMemoryService, type RelationshipCapsule, type RelationshipMemory, type RelationshipType } from '@/src/services/relationshipMemoryService';

interface Props {
  conversationId: string;
  partnerName: string;
  open: boolean;
  onClose: () => void;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

function iconFor(kind: string) {
  if (kind === 'first') return <Sparkles className="w-4 h-4" />;
  if (kind === 'media') return <Camera className="w-4 h-4" />;
  if (kind === 'rhythm') return <Clock3 className="w-4 h-4" />;
  if (kind === 'positive') return <Heart className="w-4 h-4" />;
  return <CalendarDays className="w-4 h-4" />;
}

export const RelationshipTimeline: React.FC<Props> = ({ conversationId, partnerName, open, onClose }) => {
  const [memories, setMemories] = useState<RelationshipMemory[]>([]);
  const [capsules, setCapsules] = useState<RelationshipCapsule[]>([]);
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('friendship');
  const [loading, setLoading] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [composer, setComposer] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await relationshipMemoryService.getTimeline(conversationId);
      setMemories(data.memories ?? []);
      setCapsules(data.capsules ?? []);
      setRelationshipType(data.relationshipType);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) void load(); }, [open, conversationId]);

  const sortedMemories = useMemo(() => [...memories].sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()), [memories]);

  const rebuild = async () => {
    setRebuilding(true);
    try { await relationshipMemoryService.rebuild(conversationId); await load(); } finally { setRebuilding(false); }
  };

  const saveCapsule = async () => {
    if (!body.trim() && !mediaUrl.trim()) return;
    setSaving(true);
    try {
      await relationshipMemoryService.createCapsule(conversationId, { title: title.trim() || undefined, body: body.trim() || undefined, mediaUrls: mediaUrl.trim() ? [mediaUrl.trim()] : undefined });
      setTitle(''); setBody(''); setMediaUrl(''); setComposer(false); await load();
    } finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-[2px] flex justify-end" onMouseDown={onClose}>
      <aside className="h-full w-full max-w-xl bg-white dark:bg-zinc-950 border-l border-app-border dark:border-zinc-800 shadow-2xl flex flex-col" onMouseDown={(e) => e.stopPropagation()}>
        <header className="px-5 py-4 border-b border-app-border dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 text-app-black dark:text-white font-bold">
              {relationshipType === 'love' ? <Heart className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              Notre histoire
            </div>
            <p className="text-xs text-app-gray mt-1">{relationshipType === 'love' ? 'Love Story' : 'Friendship Timeline'} · avec {partnerName}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full border border-app-border dark:border-zinc-800 flex items-center justify-center text-app-gray hover:text-app-black dark:hover:text-white"><X className="w-4 h-4" /></button>
        </header>

        <div className="px-5 py-3 border-b border-app-border dark:border-zinc-800 flex items-center gap-2">
          <button onClick={() => setComposer((v) => !v)} className="inline-flex items-center gap-2 rounded-full bg-app-black text-white px-4 py-2 text-xs font-bold"><Plus className="w-3.5 h-3.5" /> Ajouter un souvenir</button>
          <button onClick={() => void rebuild()} disabled={rebuilding} className="inline-flex items-center gap-2 rounded-full border border-app-border dark:border-zinc-800 px-4 py-2 text-xs font-semibold text-app-gray disabled:opacity-50"><Sparkles className="w-3.5 h-3.5" /> {rebuilding ? 'Analyse…' : 'Actualiser l’analyse'}</button>
        </div>

        {composer && (
          <div className="mx-5 mt-4 rounded-2xl border border-app-border dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-4 space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du souvenir" className="w-full bg-transparent border-b border-app-border dark:border-zinc-800 py-2 text-sm outline-none" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Aujourd’hui, nous avons…" rows={4} className="w-full resize-none rounded-xl bg-white dark:bg-zinc-950 border border-app-border dark:border-zinc-800 p-3 text-sm outline-none" />
            <div className="flex items-center gap-2">
              <ImagePlus className="w-4 h-4 text-app-gray" />
              <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="URL photo / vidéo (optionnel)" className="flex-1 bg-transparent text-xs outline-none" />
            </div>
            <div className="flex justify-end gap-2"><button onClick={() => setComposer(false)} className="px-3 py-2 text-xs text-app-gray">Annuler</button><button onClick={() => void saveCapsule()} disabled={saving || (!body.trim() && !mediaUrl.trim())} className="px-4 py-2 rounded-xl bg-app-black text-white text-xs font-bold disabled:opacity-40">{saving ? 'Enregistrement…' : 'Garder dans notre histoire'}</button></div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {loading ? <div className="h-40 flex items-center justify-center text-app-gray"><Loader2 className="w-5 h-5 animate-spin" /></div> : (
            <>
              {sortedMemories.length === 0 && capsules.length === 0 && <div className="rounded-2xl border border-dashed border-app-border dark:border-zinc-800 p-8 text-center"><Sparkles className="w-7 h-7 mx-auto mb-3 text-app-gray" /><p className="font-semibold text-sm">Votre histoire commence ici</p><p className="text-xs text-app-gray mt-1">Envoyez quelques messages puis actualisez l’analyse pour faire apparaître les premiers moments.</p></div>}
              {sortedMemories.map((memory, index) => (
                <article key={memory.id} className="relative pl-9 pb-8 last:pb-2">
                  {index < sortedMemories.length - 1 && <span className="absolute left-[8px] top-7 bottom-0 w-px bg-app-border dark:bg-zinc-800" />}
                  <span className="absolute left-0 top-0 w-4 h-4 rounded-full bg-white dark:bg-zinc-950 border-2 border-app-black dark:border-white flex items-center justify-center">{iconFor(memory.kind)}</span>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-app-gray">{formatDate(memory.occurred_at)}</p>
                  <h3 className="mt-1 text-sm font-bold text-app-black dark:text-white">{memory.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-app-gray">{memory.summary}</p>
                  <div className="mt-2 text-[10px] text-app-gray">Confiance {Math.round(memory.confidence * 100)}% · analyse algorithmique</div>
                </article>
              ))}
              {capsules.map((capsule) => (
                <article key={capsule.id} className="mb-4 rounded-2xl border border-app-border dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-zinc-900/50">
                  {capsule.media_urls?.[0] && <img src={capsule.media_urls[0]} alt="Souvenir" className="w-full max-h-64 object-cover" />}
                  <div className="p-4"><p className="text-[10px] uppercase tracking-wider font-bold text-app-gray">Capsule · {formatDate(capsule.event_date)}</p><h3 className="font-bold text-sm mt-1">{capsule.title || 'Un souvenir à nous'}</h3>{capsule.body && <p className="text-sm text-app-gray leading-6 mt-2 whitespace-pre-wrap">{capsule.body}</p>}</div>
                </article>
              ))}
            </>
          )}
        </div>
      </aside>
    </div>
  );
};
