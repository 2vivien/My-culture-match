import React from 'react';
import { ChevronRight, Check } from 'lucide-react';

interface EmailRowProps {
  email: string;
  setEmail: (val: string) => void;
  isEditingEmail: boolean;
  setIsEditingEmail: (val: boolean) => void;
}

export const EmailRow: React.FC<EmailRowProps> = ({
  email,
  setEmail,
  isEditingEmail,
  setIsEditingEmail,
}) => {
  return (
    <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <span className="text-xs font-extrabold text-app-black dark:text-zinc-250">
        Email address
      </span>
      <div className="flex items-center gap-2">
        {isEditingEmail ? (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingEmail(false)}
              className="px-3 py-1.5 text-xs rounded-xl border border-app-border bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-200 focus:outline-none focus:border-[#E27D60]"
            />
            <button 
              onClick={() => setIsEditingEmail(false)} 
              className="p-1.5 bg-[#E27D60] text-white rounded-lg cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <span className="text-xs text-app-gray dark:text-zinc-400 font-semibold">
              {email}
            </span>
            <button 
              onClick={() => setIsEditingEmail(true)}
              className="p-1 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer text-app-gray"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
