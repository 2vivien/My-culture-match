import React from 'react';
import { cn } from '@/src/lib/utils';
import type { TribeTopic } from '@/src/types/createTribe';

interface CreateTribeTopicsStepProps {
  topics: TribeTopic[];
  selectedTopics: string[];
  onToggleTopic: (name: string) => void;
}

export const CreateTribeTopicsStep: React.FC<CreateTribeTopicsStepProps> = ({
  topics,
  selectedTopics,
  onToggleTopic,
}) => {
  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[45vh] overflow-y-auto pr-1 hide-scrollbar">
        {topics.map((topic) => {
          const isSelected = selectedTopics.includes(topic.name);
          return (
            <button
              key={topic.name}
              type="button"
              onClick={() => onToggleTopic(topic.name)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-[11px] font-black tracking-wider transition-all text-left cursor-pointer",
                isSelected
                  ? "bg-[#E27D60] border-[#E27D60] text-white"
                  : "bg-zinc-50 dark:bg-zinc-900 border-app-border dark:border-zinc-800 text-app-gray hover:text-app-black dark:hover:text-white"
              )}
            >
              <span className="text-sm shrink-0">{topic.icon}</span>
              <span className="truncate">{topic.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
