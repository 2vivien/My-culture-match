import React from 'react';
import { Compass, Plus } from 'lucide-react';
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
      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Visibilité de la tribu">
        {/* Public Option */}
        <div
          role="radio"
          aria-checked={tribeType === 'public'}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onTypeChange('public');
            }
          }}
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
              <span className="font-extrabold text-xs text-app-black dark:text-white block">Publique</span>
              <span className="text-[10px] text-app-gray dark:text-zinc-400 font-medium block mt-0.5">
                Tout le monde peut voir, publier et commenter, et rejoindre librement la tribu
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

        {/* Private Option */}
        <div
          role="radio"
          aria-checked={tribeType === 'private'}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onTypeChange('private');
            }
          }}
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
              <span className="font-extrabold text-xs text-app-black dark:text-white block">Privée</span>
              <span className="text-[10px] text-app-gray dark:text-zinc-400 font-medium block mt-0.5">
                Seuls les membres approuvés par un modérateur voient et publient le contenu
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
