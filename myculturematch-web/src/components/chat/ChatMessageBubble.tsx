import React, { useState } from 'react';
import { Volume2, FileText, CheckCheck, MoreHorizontal, Reply, Pencil, Trash2, Pin, Heart, BookHeart } from 'lucide-react';
import { IconRobot } from '@tabler/icons-react';
import { ChatMessage } from '@/src/types/chat.types';
import { cn } from '@/src/lib/utils';

interface BubbleProps { message: ChatMessage; onAskLyra?: (message: ChatMessage) => void; onReply?: (message: ChatMessage) => void; onEdit?: (message: ChatMessage) => void; onDelete?: (message: ChatMessage) => void; onReact?: (message: ChatMessage, reaction: string) => void; onPin?: (message: ChatMessage) => void; onSaveToMemory?: (message: ChatMessage) => void; }

export const ChatMessageBubble: React.FC<BubbleProps> = ({ message, onAskLyra, onReply, onEdit, onDelete, onReact, onPin, onSaveToMemory }) => {
  const isMe = message.senderId === 'me';
  const [menu, setMenu] = useState(false);
  const reactions = message.reactions ?? [];
  const reactionCounts = reactions.reduce<Record<string, number>>((acc, r) => { acc[r.reaction] = (acc[r.reaction] ?? 0) + 1; return acc; }, {});
  const common = ['❤️', '😂', '👍', '👏', '😮'];
  return <div className={cn('flex flex-col mb-3 animate-fade-in max-w-[88%]', isMe ? 'ml-auto items-end' : 'mr-auto items-start')}>
    <span className="text-[10px] text-app-gray dark:text-zinc-500 mb-1 px-1.5 select-none font-medium">{message.senderName} • {message.time}{message.editedAt ? ' · modifié' : ''}</span>
    <div className={cn('group/bubble flex items-end gap-1.5', isMe ? 'flex-row-reverse' : '')}>
      <div className="relative">
        {message.reply && <div className={cn('mb-1 rounded-xl border px-3 py-2 text-[11px] max-w-[280px] opacity-80', isMe ? 'border-white/30 bg-white/10' : 'border-app-border bg-zinc-50 dark:bg-zinc-900')}><span className="font-bold">Réponse</span><p className="truncate">{message.reply.text ?? 'Message supprimé'}</p></div>}
        <div className={cn('p-4 rounded-2xl text-sm leading-relaxed shadow-xs relative border font-medium select-text', isMe ? 'bg-[#E27D60] text-white border-[#E27D60] rounded-tr-sm' : 'bg-[#FCFCFC] text-app-black dark:bg-zinc-900 dark:text-zinc-100 border-[#ECECEC] dark:border-zinc-800 rounded-tl-sm', message.deleted && 'opacity-70 italic')}>
          {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
          {message.img && <div className="rounded-xl overflow-hidden mt-1.5 border border-app-border dark:border-zinc-800"><img src={message.img} alt="attachment" className="max-w-full max-h-48 object-cover" referrerPolicy="no-referrer" /></div>}
          {message.audioDur && <div className="flex items-center gap-3 py-1 font-semibold text-xs select-none"><button className="w-8 h-8 rounded-full bg-[#E27D60]/10 text-[#E27D60] flex items-center justify-center cursor-pointer shrink-0"><Volume2 className="w-4 h-4" /></button><div><div className="flex gap-0.5 items-end h-4 w-28">{[2,4,3,5,2,6,4,7,3,5,4,2].map((h,i)=><span key={i} className="bg-[#E27D60] w-[2px] rounded-full" style={{height:`${h*2}px`}} />)}</div><p className="text-[9px] text-app-gray mt-0.5">Voice Note • {message.audioDur}</p></div></div>}
          {message.file && <div className="flex items-center gap-2.5 py-1 text-xs select-none"><div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0"><FileText className="w-4 h-4" /></div><div className="min-w-0"><p className="font-bold truncate">{message.file.name}</p><p className="text-[9px] text-app-gray">{message.file.size}</p></div></div>}
          {message.pinned && <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white dark:bg-zinc-800 border border-app-border flex items-center justify-center"><Pin className="w-3 h-3" /></div>}
        </div>
        {Object.keys(reactionCounts).length > 0 && <div className={cn('flex flex-wrap gap-1 mt-1', isMe ? 'justify-end' : 'justify-start')}>{Object.entries(reactionCounts).map(([r,n])=><button key={r} onClick={()=>onReact?.(message,r)} className="px-1.5 py-0.5 rounded-full border border-app-border bg-white dark:bg-zinc-900 text-[11px] shadow-sm">{r} {n > 1 ? n : ''}</button>)}</div>}
        {menu && <div className={cn('absolute z-20 bottom-full mb-2 rounded-2xl border border-app-border dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl p-2 w-52', isMe ? 'right-0' : 'left-0')}>
          <div className="flex gap-1 pb-2 mb-1 border-b border-app-border dark:border-zinc-800">{common.map(r=><button key={r} onClick={()=>{onReact?.(message,r);setMenu(false)}} className="w-7 h-7 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900">{r}</button>)}</div>
          {onSaveToMemory && <button onClick={()=>{onSaveToMemory(message);setMenu(false)}} className="w-full flex items-center gap-2 px-2 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg"><BookHeart className="w-3.5 h-3.5"/>Ajouter à la boîte à souvenirs</button>}
          {onReply && <button onClick={()=>{onReply(message);setMenu(false)}} className="w-full flex items-center gap-2 px-2 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg"><Reply className="w-3.5 h-3.5"/>Répondre</button>}
          {isMe && onEdit && !message.deleted && <button onClick={()=>{onEdit(message);setMenu(false)}} className="w-full flex items-center gap-2 px-2 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg"><Pencil className="w-3.5 h-3.5"/>Modifier</button>}
          {isMe && onDelete && !message.deleted && <button onClick={()=>{onDelete(message);setMenu(false)}} className="w-full flex items-center gap-2 px-2 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"><Trash2 className="w-3.5 h-3.5"/>Supprimer</button>}
          {onPin && <button onClick={()=>{onPin(message);setMenu(false)}} className="w-full flex items-center gap-2 px-2 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg"><Pin className="w-3.5 h-3.5"/>Épingler</button>}
        </div>}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover/bubble:opacity-100 focus-within:opacity-100 transition-opacity">
        <button type="button" onClick={()=>setMenu(v=>!v)} title="Actions" className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 border border-app-border dark:border-zinc-700 text-app-gray flex items-center justify-center shadow-sm"><MoreHorizontal className="w-4 h-4" /></button>
        <button type="button" onClick={()=>onReact?.(message,'❤️')} title="Réagir" className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 border border-app-border dark:border-zinc-700 text-app-gray flex items-center justify-center shadow-sm"><Heart className="w-3.5 h-3.5" /></button>
        {!isMe && onAskLyra && <button type="button" onClick={()=>onAskLyra(message)} title="Propositions de réponse" className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 border border-app-border dark:border-zinc-700 text-violet-500 flex items-center justify-center shadow-sm"><IconRobot size={15} /></button>}
      </div>
    </div>
    {isMe && <span className="text-[9px] text-app-gray dark:text-zinc-500 mt-1 flex items-center gap-1 select-none font-bold"><span>{message.isRead ? 'Lu' : 'Envoyé'}</span><CheckCheck className="w-3 h-3 text-[#E27D60]" /></span>}
  </div>;
};
