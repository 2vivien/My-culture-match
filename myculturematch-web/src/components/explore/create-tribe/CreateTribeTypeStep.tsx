import React from 'react';
import { Compass, Users, Plus } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { TribeType } from '@/src/types/createTribe';

interface CreateTribeTypeStepProps {
  tribeType: TribeType;
  onTypeChange: (type: TribeType) => void;
}

export const CreateTribeTypeStep: React.FC<CreateTribeTypeStepProps> = ({
  tribeType,
  onTypeChange,
}) => {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        {/* Public Option */}
        <div
          onClick={() => onTypeChange('public')}
          className={cn(
            "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none",
            tribeType === 'public'
              ? "bg-[#E27D60]/5 border-[#E27D60] dark:bg-[#E27D60]/10"
              : "bg-zinc-50 dark:bg-zinc-900 border-app-border dark:border-zinc-800 hover:bg-zinc-100/50"
          )}
        >
          <div className="flex items-center gap-3.5">
            <Compass className={cn("w-5 h-5", tribeType === 'public' ? "text-[#E27D60]" : "text-app-gray")} />
            <div>
              <span className="font-extrabold text-xs text-app-black dark:text-white block">Public</span>
              <span className="text-[10px] text-app-gray dark:text-zinc-400 font-medium block mt-0.5">
                Anyone can view, post, and comment to this tribu
              </span>
            </div>
          </div>
          <div className={cn(
            "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
            tribeType === 'public' ? "border-[#E27D60]" : "border-app-border dark:border-zinc-700"
          )}>
            {tribeType === 'public' && <div className="w-2 h-2 rounded-full bg-[#E27D60]" />}
          </div>
        </div>

        {/* Restricted Option */}
        <div
          onClick={() => onTypeChange('restricted')}
          className={cn(
            "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none",
            tribeType === 'restricted'
              ? "bg-[#E27D60]/5 border-[#E27D60] dark:bg-[#E27D60]/10"
              : "bg-zinc-50 dark:bg-zinc-900 border-app-border dark:border-zinc-800 hover:bg-zinc-100/50"
          )}
        >
          <div className="flex items-center gap-3.5">
            <Users className={cn("w-5 h-5", tribeType === 'restricted' ? "text-[#E27D60]" : "text-app-gray")} />
            <div>
              <span className="font-extrabold text-xs text-app-black dark:text-white block">Restricted</span>
              <span className="text-[10px] text-app-gray dark:text-zinc-400 font-medium block mt-0.5">
                Anyone can view, but only approved members can contribute
              </span>
            </div>
          </div>
          <div className={cn(
            "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
            tribeType === 'restricted' ? "border-[#E27D60]" : "border-app-border dark:border-zinc-700"
          )}>
            {tribeType === 'restricted' && <div className="w-2 h-2 rounded-full bg-[#E27D60]" />}
          </div>
        </div>

        {/* Private Option */}
        <div
          onClick={() => onTypeChange('private')}
          className={cn(
            "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none",
            tribeType === 'private'
              ? "bg-[#E27D60]/5 border-[#E27D60] dark:bg-[#E27D60]/10"
              : "bg-zinc-50 dark:bg-zinc-900 border-app-border dark:border-zinc-800 hover:bg-zinc-100/50"
          )}
        >
          <div className="flex items-center gap-3.5">
            <Plus className="w-5 h-5 text-app-gray" style={{ transform: 'rotate(45deg)' }} />
            <div>
              <span className="font-extrabold text-xs text-app-black dark:text-white block">Private</span>
              <span className="text-[10px] text-app-gray dark:text-zinc-400 font-medium block mt-0.5">
                Only approved members can view and contribute
              </span>
            </div>
          </div>
          <div className={cn(
            "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
            tribeType === 'private' ? "border-[#E27D60]" : "border-app-border dark:border-zinc-700"
          )}>
            {tribeType === 'private' && <div className="w-2 h-2 rounded-full bg-[#E27D60]" />}
          </div>
        </div>
      </div>

      <p className="text-[9px] text-app-gray dark:text-zinc-500 leading-normal font-semibold">
        By continuing, you agree to our <span className="text-[#E27D60] underline cursor-pointer">Tribu Code of Conduct</span> and acknowledge that you understand the <span className="text-[#E27D60] underline cursor-pointer">My Culture Match Rules</span>.
      </p>
    </div>
  );
};
