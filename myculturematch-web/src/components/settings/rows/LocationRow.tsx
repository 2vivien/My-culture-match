import React from 'react';
import { ChevronRight } from 'lucide-react';

interface LocationRowProps {
  locationType: string;
  setLocationType: (val: string) => void;
  isEditingLocation: boolean;
  setIsEditingLocation: (val: boolean) => void;
}

export const LocationRow: React.FC<LocationRowProps> = ({
  locationType,
  setLocationType,
  isEditingLocation,
  setIsEditingLocation,
}) => {
  return (
    <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <span className="text-xs font-extrabold text-app-black dark:text-zinc-400">
        Location customization
      </span>
      <div className="flex items-center gap-2">
        {isEditingLocation ? (
          <select
            value={locationType}
            onChange={(e) => {
              setLocationType(e.target.value);
              setIsEditingLocation(false);
            }}
            className="px-3 py-1.5 text-xs rounded-xl border border-app-border bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-200 outline-none focus:ring-1 focus:ring-[#E27D60]"
          >
            <option value="Use approximate location (based on IP)">Use approximate location (based on IP)</option>
            <option value="Use specific location profile details">Use specific location profile details</option>
            <option value="Disable location customization">Disable location customization</option>
          </select>
        ) : (
          <>
            <span className="text-xs text-app-gray dark:text-zinc-400 font-semibold">
              {locationType}
            </span>
            <button 
              onClick={() => setIsEditingLocation(true)}
              className="p-1 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer text-app-gray"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
