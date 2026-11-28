import React from 'react';
import { Landmark } from 'lucide-react';
import type { TribeType } from '@/src/types/createTribe';

interface CreateTribeDetailsStepProps {
  tribeName: string;
  setTribeName: (name: string) => void;
  tribeDescription: string;
  setTribeDescription: (desc: string) => void;
  tribeType: TribeType;
}

export const CreateTribeDetailsStep: React.FC<CreateTribeDetailsStepProps> = ({
  tribeName,
  setTribeName,
  tribeDescription,
  setTribeDescription,
  tribeType,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <div className="flex flex-col gap-4">
        {/* Name input */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
            Community name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="t/tribename"
            value={tribeName}
            maxLength={21}
            onChange={(e) => {
              const val = e.target.value;
              if (!val.startsWith(' ')) {
                setTribeName(val);
              }
            }}
            className="w-full bg-[#FCFCFC] dark:bg-zinc-900 text-sm text-app-black dark:text-white border border-app-border dark:border-zinc-800 rounded-2xl py-3 px-4 outline-none focus:border-[#8B4A2B] focus:ring-1 focus:ring-[#8B4A2B]/20 transition-all placeholder:text-app-gray/50"
          />
          <span className="text-[9px] text-app-gray dark:text-zinc-500 text-right font-black tracking-wider">
            {tribeName.length}/21
          </span>
        </div>

        {/* Description input */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            placeholder="Tell members what your community is all about..."
            value={tribeDescription}
            onChange={(e) => setTribeDescription(e.target.value)}
            rows={4}
            className="w-full bg-[#FCFCFC] dark:bg-zinc-900 text-sm text-app-black dark:text-white border border-app-border dark:border-zinc-800 rounded-2xl py-3 px-4 outline-none resize-none focus:border-[#8B4A2B] focus:ring-1 focus:ring-[#8B4A2B]/20 transition-all placeholder:text-app-gray/50"
          />
          <span className="text-[9px] text-app-gray dark:text-zinc-500 text-right font-black tracking-wider">
            {tribeDescription.length} characters
          </span>
        </div>
      </div>

      {/* Card Preview */}
      <div className="flex flex-col gap-3 select-none">
        <span className="text-[10px] font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
          Live Preview
        </span>
        <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-app-border dark:border-zinc-800 rounded-[24px] p-5 shadow-sm flex flex-col justify-between h-48 border-dashed">
          <div>
            <div className="flex items-center gap-3.5 mb-3.5">
              <div className="w-12 h-12 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-app-gray dark:text-zinc-400 border border-app-border dark:border-zinc-700">
                <Landmark className="w-6 h-6 text-[#8B4A2B]" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-sm text-app-black dark:text-zinc-100 truncate leading-tight">
                  {tribeName ? `t/${tribeName}` : 't/tribename'}
                </h4>
                <p className="text-[10px] text-app-gray dark:text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                  1 member • 1 online
                </p>
              </div>
            </div>
            <p className="text-xs text-app-gray dark:text-zinc-400 leading-relaxed line-clamp-3">
              {tribeDescription || 'Your community description will appear here. Talk about heritage posts, arts, writing, or festivals.'}
            </p>
          </div>
          <div className="text-[9px] font-bold text-[#8B4A2B] uppercase tracking-wider">
            {tribeType.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};
