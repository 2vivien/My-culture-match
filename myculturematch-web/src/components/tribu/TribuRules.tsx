import React from 'react';
import { motion } from 'framer-motion';
import type { TribeRule } from '@/src/types/tribu';

interface TribuRulesProps {
  rules: TribeRule[];
  tribeName?: string;
  expandedRule: number | null;
  setExpandedRule: (n: number | null) => void;
}

export const TribuRules: React.FC<TribuRulesProps> = ({
  rules,
  tribeName,
  expandedRule,
  setExpandedRule,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900/60 border border-app-border dark:border-zinc-800 rounded-[20px] p-5 shadow-xs">
      <h3 className="font-extrabold text-sm text-app-black dark:text-zinc-200 mb-3 border-b border-app-border/40 dark:border-zinc-800 pb-2">
        t/{tribeName ?? 'Communauté'} Rules
      </h3>
      {rules.length === 0 && (
        <p className="text-[11px] text-app-gray dark:text-zinc-500 py-2 select-none">Aucune règle définie pour cette communauté.</p>
      )}
      <div className="flex flex-col gap-3">
        {rules.map((rule) => {
          const isExpanded = expandedRule === rule.number;
          return (
            <div key={rule.number} className="text-xs border-b border-app-border/20 dark:border-zinc-800/40 pb-2.5 last:border-b-0 last:pb-0">
              <button
                onClick={() => setExpandedRule(isExpanded ? null : rule.number)}
                className="w-full text-left font-black text-app-black dark:text-zinc-200 hover:text-[#E27D60] dark:hover:text-[#E27D60] cursor-pointer flex items-center justify-between py-1 transition-colors"
              >
                <span>{rule.number}. {rule.title}</span>
                <span className="text-app-gray text-[9px] font-bold">{isExpanded ? '▲' : '▼'}</span>
              </button>
              <motion.div
                initial={false}
                animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                className="overflow-hidden"
                transition={{ duration: 0.2 }}
              >
                <p className="text-[10.5px] text-app-gray dark:text-zinc-400 mt-1 leading-snug pt-0.5">
                  {rule.desc}
                </p>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
