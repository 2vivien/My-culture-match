import React from 'react';
import { Check } from 'lucide-react';

interface CreateTribeSuccessStepProps {
  tribeName: string;
}

export const CreateTribeSuccessStep: React.FC<CreateTribeSuccessStepProps> = ({
  tribeName,
}) => {
  return (
    <div className="flex flex-col items-center text-center py-8 gap-4 select-none">
      <div className="w-16 h-16 rounded-full bg-[#E27D60]/10 text-[#E27D60] flex items-center justify-center border border-[#E27D60]/20 mb-2">
        <Check className="w-8 h-8 stroke-[3.5]" />
      </div>
      <h4 className="text-lg font-extrabold text-app-black dark:text-white">
        Tribu Initialization Complete!
      </h4>
      <p className="text-xs text-app-gray dark:text-zinc-400 max-w-sm leading-relaxed">
        The tribu <span className="font-extrabold text-app-black dark:text-white">t/{tribeName}</span> has been successfully registered. You are now the official moderator of this guild!
      </p>
    </div>
  );
};
