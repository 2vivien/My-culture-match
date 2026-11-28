import React, { useState, useRef, useEffect } from 'react';
import { Phone, Video, Smile, Paperclip, Mic, Send, ArrowLeft, BookHeart, X, Reply, Pencil, Loader2, UploadCloud, Clock3 } from 'lucide-react';
import { Conversation, ChatMessage } from '@/src/types/chat.types';
import { ChatMessageBubble } from './ChatMessageBubble';
import { AssistantPanel } from './AssistantPanel';
import { RelationshipTimeline } from './RelationshipTimeline';
import { TemporalMessageComposer } from './TemporalMessageComposer';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import { chatService } from '@/src/services/chat.service';
import { relationshipMemoryService, type SharedMemoryKind } from '@/src/services/relationshipMemoryService';
import { uploadService } from '@/src/services/uploadService';
import { mediaUrl } from '@/src/lib/media';

interface ActiveChatProps { partner: Conversation; messages: ChatMessage[]; onSendMessage: (text: string, replyToId?: string) => void; onRefresh?: () => void; onBack?: () => void; }

export const ActiveChatColumn: React.FC<ActiveChatProps> = ({ partner, messages, onSendMessage, onRefresh, onBack }) => {
  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [saving, setSaving] = useState(false);
  const [typing, setTyping] = useState(false);
  const [lyraOpen, setLyraOpen] = useState(false);
  const [lyraContext, setLyraContext] = useState<ChatMessage | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [temporalOpen, setTemporalOpen] = useState(false);
  const [pins, setPins] = useState<Set<string>>(new Set());
  const [memoryMessages, setMemoryMessages] = useState<ChatMessage[]>([]);
  const [memoryTitle, setMemoryTitle] = useState('');
  const [memoryNote, setMemoryNote] = useState('');
  const [memoryKind, setMemoryKind] = useState<SharedMemoryKind>('memory');
  const [memoryFiles, setMemoryFiles] = useState<File[]>([]);
  const [memorySaving, setMemorySaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const memoryFileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages.length > 0 ? messages[messages.length - 1]?.text : undefined;

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);
  useEffect(() => { let mounted = true; chatService.getPins(partner.id).then((rows) => { if (mounted) setPins(new Set(rows.map((r) => r.messageId))); }).catch(() => undefined); return () => { mounted = false; }; }, [partner.id]);
  useEffect(() => { const timer = window.setInterval(() => onRefresh?.(), 5000); return () => window.clearInterval(timer); }, [onRefresh]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim(); if (!text || saving) return;
    if (editing) { setSaving(true); try { await chatService.editMessage(partner.id, editing.id, text); setEditing(null); setInput(''); onRefresh?.(); } finally { setSaving(false); } return; }
    onSendMessage(text, replyingTo?.id); setInput(''); setReplyingTo(null); void chatService.setTyping(partner.id, false);
  };

  const handleInput = (value: string) => { setInput(value); if (!typing) { setTyping(true); void chatService.setTyping(partner.id, true); } window.clearTimeout((handleInput as any)._timer); (handleInput as any)._timer = window.setTimeout(() => { setTyping(false); void chatService.setTyping(partner.id, false); }, 1200); };
  const editMessage = (m: ChatMessage) => { setEditing(m); setReplyingTo(null); setInput(m.text ?? ''); window.setTimeout(() => inputRef.current?.focus(), 0); };
  const deleteMessage = async (m: ChatMessage) => { if (!window.confirm('Supprimer ce message ?')) return; await chatService.deleteMessage(partner.id, m.id); onRefresh?.(); };
  const react = async (m: ChatMessage, reaction: string) => { await chatService.toggleReaction(partner.id, m.id, reaction); onRefresh?.(); };
  const pin = async (m: ChatMessage) => { const next = !pins.has(m.id); await chatService.pinMessage(partner.id, m.id, next); setPins((prev) => { const n = new Set(prev); if (next) n.add(m.id); else n.delete(m.id); return n; }); onRefresh?.(); };

  const openMemoryComposer = (message?: ChatMessage) => {
    if (message) {
      setMemoryMessages((prev) => prev.some((m) => m.id === message.id) ? prev : [...prev, message]);
      if (!memoryTitle) setMemoryTitle(message.text?.slice(0, 70) || 'Un moment à nous');
      if (message.img) setMemoryKind(message.type === 'video' ? 'video' : 'photo');
    }
  };
  const removeMemoryMessage = (id: string) => setMemoryMessages((prev) => prev.filter((m) => m.id !== id));
  const closeMemoryComposer = () => { setMemoryMessages([]); setMemoryTitle(''); setMemoryNote(''); setMemoryFiles([]); setMemoryKind('memory'); };

  const saveMemory = async () => {
    if (!memoryMessages.length && !memoryFiles.length && !memoryNote.trim() && !memoryTitle.trim()) return;
    setMemorySaving(true);
    try {
      const uploadedUrls: string[] = memoryMessages.flatMap((m) => m.img ? [m.img] : []);
      for (const file of memoryFiles) {
        const uploaded = await uploadService.uploadFile(file, 'file');
        if (uploaded.objectKey) uploadedUrls.push(mediaUrl(uploaded.objectKey));
      }
      const selectedType: SharedMemoryKind = memoryKind === 'memory' && memoryFiles.length === 0 && memoryMessages.some((m) => m.img) ? 'photo' : memoryKind;
      await relationshipMemoryService.createMemoryBoxEntry(partner.id, {
        kind: selectedType,
        title: memoryTitle.trim() || 'Un souvenir à nous',
        body: memoryNote.trim() || undefined,
        mediaUrls: uploadedUrls.length ? [...new Set(uploadedUrls)] : undefined,
        messageIds: memoryMessages.map((m) => m.id),
      });
      closeMemoryComposer();
      setTimelineOpen(true);
    } finally { setMemorySaving(false); }
  };

  const openTemporalComposer = () => {
    setTemporalOpen(true);
    void chatService.setTyping(partner.id, false);
  };

  return <div className="flex-1 border border-app-border dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-[24px] flex flex-col h-full select-none shadow-soft overflow-hidden">
    <div className="p-4 border-b border-app-border dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-950 shrink-0">
      <div className="flex items-center gap-2 sm:gap-3">
        {onBack && <button onClick={onBack} className="w-8 h-8 rounded-full border border-app-border dark:border-zinc-800/80 flex items-center justify-center text-app-gray hover:text-app-black dark:hover:text-white transition-colors"><ArrowLeft className="w-4 h-4" /></button>}
        <div className="relative"><ProfileAvatar src={partner.avatar} alt={partner.name} size="md" glow={partner.glow as any} level={partner.level} />{partner.online && <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-950" />}</div>
        <div><h3 className="font-bold text-sm text-app-black dark:text-zinc-100">{partner.name}</h3><p className="text-xs text-app-gray truncate max-w-[240px]">{partner.culture || partner.lang}{typing && <span className="ml-2 text-[#8B4A2B]">écrit…</span>}</p></div>
      </div>
      <div className="flex items-center gap-1.5"><button type="button" onClick={() => setTimelineOpen(true)} title="Boîte à souvenirs" className="w-9 h-9 border border-app-border dark:border-zinc-800 rounded-full flex items-center justify-center text-app-gray"><BookHeart className="w-4 h-4" /></button><button type="button" onClick={openTemporalComposer} title="Écrire un message temporel" className="w-9 h-9 border border-app-border dark:border-zinc-800 rounded-full flex items-center justify-center text-app-gray hover:text-[#8B4A2B]"><Clock3 className="w-4 h-4" /></button><button type="button" title="Appel audio" className="w-9 h-9 border border-app-border dark:border-zinc-800 rounded-full flex items-center justify-center text-app-gray"><Phone className="w-4 h-4" /></button><button type="button" title="Appel vidéo" className="w-9 h-9 border border-app-border dark:border-zinc-800 rounded-full flex items-center justify-center text-app-gray"><Video className="w-4 h-4" /></button></div>
    </div>

    {memoryMessages.length > 0 && <div className="mx-4 mt-3 rounded-2xl border border-app-border dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 p-3 shrink-0">
      <div className="flex items-center justify-between mb-2"><div><p className="text-xs font-bold">Ajouter à la boîte à souvenirs</p><p className="text-[10px] text-app-gray">Tu peux ajouter plusieurs messages et des photos/vidéos depuis ton appareil.</p></div><button type="button" onClick={closeMemoryComposer}><X className="w-4 h-4 text-app-gray" /></button></div>
      <div className="flex gap-2 overflow-x-auto pb-2">{memoryMessages.map((m) => <div key={m.id} className="relative min-w-[180px] max-w-[220px] rounded-xl border border-app-border dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2"><button type="button" onClick={() => removeMemoryMessage(m.id)} className="absolute right-1 top-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"><X className="w-3 h-3" /></button>{m.img && <img src={m.img} alt="Message sélectionné" className="w-full h-20 object-cover rounded-lg mb-1" />}<p className="text-[10px] line-clamp-3 pr-3">{m.text || `Contenu ${m.type}`}</p></div>)}</div>
      {memoryFiles.length > 0 && <div className="text-[10px] text-app-gray mb-2">{memoryFiles.length} fichier(s) ajouté(s)</div>}
      <div className="grid grid-cols-2 gap-2 mb-2"><select value={memoryKind} onChange={(e) => setMemoryKind(e.target.value as SharedMemoryKind)} className="rounded-xl border border-app-border dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-2 text-xs"><option value="memory">Moment</option><option value="photo">Photo</option><option value="video">Vidéo</option><option value="audio">Audio</option><option value="event">Événement</option><option value="place">Lieu</option><option value="milestone">Étape importante</option><option value="conversation">Conversation</option><option value="custom">Autre</option></select><input value={memoryTitle} onChange={(e) => setMemoryTitle(e.target.value)} placeholder="Titre" className="rounded-xl border border-app-border dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs outline-none" /></div>
      <textarea value={memoryNote} onChange={(e) => setMemoryNote(e.target.value)} placeholder="Écrire ce que vous voulez garder de ce moment…" rows={2} className="w-full rounded-xl border border-app-border dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 text-xs outline-none resize-none" />
      <input ref={memoryFileRef} type="file" multiple accept="image/*,video/*,audio/*" className="hidden" onChange={(e) => setMemoryFiles(Array.from(e.target.files ?? []))} />
      <div className="flex items-center justify-between mt-2"><button type="button" onClick={() => memoryFileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl border border-app-border dark:border-zinc-800 px-3 py-2 text-xs text-app-gray"><UploadCloud className="w-3.5 h-3.5" />Ajouter des médias</button><button type="button" onClick={() => void saveMemory()} disabled={memorySaving} className="inline-flex items-center gap-1.5 rounded-xl bg-app-black text-white px-4 py-2 text-xs font-bold">{memorySaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookHeart className="w-3.5 h-3.5" />}Garder dans la boîte</button></div>
    </div>}

    <div className="flex-1 overflow-y-auto p-4 bg-[#FEFEFE] dark:bg-zinc-950/40 hide-scrollbar flex flex-col">
      {messages.map((m) => <ChatMessageBubble key={m.id} message={{ ...m, pinned: pins.has(m.id) }} onAskLyra={(msg) => { setLyraContext(msg); setLyraOpen(true); }} onReply={setReplyingTo} onEdit={editMessage} onDelete={(m) => void deleteMessage(m)} onReact={(m,r) => void react(m,r)} onPin={(m) => void pin(m)} onSaveToMemory={openMemoryComposer} />)}
      <div ref={messagesEndRef} />
    </div>

    <form onSubmit={(e) => void handleSend(e)} className="p-4 border-t border-app-border dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
      {(replyingTo || editing) && <div className="mb-2 flex items-center gap-2 rounded-xl border border-app-border dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2"><div className="flex-1 min-w-0"><p className="text-[10px] uppercase font-bold text-app-gray">{editing ? 'Modification' : 'Réponse à'}</p><p className="text-xs truncate">{(editing ?? replyingTo)?.text || 'Message'}</p></div><button type="button" onClick={() => { setEditing(null); setReplyingTo(null); setInput(''); }}><X className="w-4 h-4 text-app-gray" /></button></div>}
      <div className="flex items-center gap-2 bg-[#FCFCFC] dark:bg-zinc-900 border border-[#ECECEC] dark:border-zinc-800 rounded-2xl px-3 py-2 focus-within:ring-1 focus-within:ring-[#8B4A2B]">
        <button type="button" title="Pièce jointe" className="text-app-gray p-1" onClick={() => setTimelineOpen(true)}><Paperclip className="w-4 h-4" /></button>
        <button type="button" title="Écrire pour plus tard" onClick={openTemporalComposer} className="text-app-gray p-1 hover:text-[#8B4A2B]"><Clock3 className="w-4 h-4" /></button>
        <input ref={inputRef} type="text" placeholder={editing ? 'Modifier le message…' : `Écrire à ${partner.name.split(' ')[0]}…`} value={input} onChange={(e) => handleInput(e.target.value)} className="flex-1 bg-transparent text-sm text-app-black dark:text-zinc-200 placeholder:text-app-gray outline-none font-medium h-8" />
        <button type="button" title="Emoji" className="text-app-gray p-1"><Smile className="w-4 h-4" /></button>
        <AssistantPanel partner={partner} lastMessage={lyraContext?.text ?? lastMessage} onPick={(suggestion) => { setInput(suggestion.trim()); setLyraOpen(false); setLyraContext(null); inputRef.current?.focus(); }} open={lyraOpen} onOpenChange={setLyraOpen} />
        <button type="button" title="Note vocale" className="text-app-gray p-1"><Mic className="w-4 h-4" /></button>
        <button type="submit" disabled={!input.trim() || saving} className="w-8 h-8 rounded-xl bg-[#8B4A2B] text-white flex items-center justify-center disabled:opacity-50">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editing ? <Pencil className="w-3.5 h-3.5" /> : replyingTo ? <Reply className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}</button>
      </div>
    </form>
    <RelationshipTimeline conversationId={partner.id} partnerName={partner.name} open={timelineOpen} onClose={() => setTimelineOpen(false)} />
    <TemporalMessageComposer conversationId={partner.id} partnerName={partner.name} initialText={input} open={temporalOpen} onClose={() => setTemporalOpen(false)} onScheduled={() => { setInput(''); setReplyingTo(null); }} />
  </div>;
};
