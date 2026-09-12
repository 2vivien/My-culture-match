import React from 'react';
import { ChevronRight } from 'lucide-react';

interface GenderRowProps {
  gender: string;
  setGender: (val: string) => void;
  isEditingGender: boolean;
  setIsEditingGender: (val: boolean) => void;
}

export const GenderRow: React.FC<GenderRowProps> = ({
  gender,
  setGender,
  isEditingGender,
  setIsEditingGender,
}) => {
  return (
    <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <span className="text-sm font-extrabold text-app-black dark:text-zinc-300">
        Gender
      </span>
      <div className="flex items-center gap-2">
        {isEditingGender ? (
          <select
            value={gender}
            onChange={(e) => {
              setGender(e.target.value);
              setIsEditingGender(false);
            }}
            className="px-3.5 py-2 text-sm rounded-xl border border-app-border bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-200 outline-none focus:ring-1 focus:ring-[#E27D60]"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        ) : (
          <>
            <span className="text-sm text-app-gray dark:text-zinc-400 font-semibold">
              {gender}
            </span>
            <button 
              onClick={() => setIsEditingGender(true)}
              className="p-1 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer text-app-gray"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
