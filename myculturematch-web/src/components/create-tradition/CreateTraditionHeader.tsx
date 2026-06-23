import React from 'react';
import { LayoutTemplate } from 'lucide-react';

export const CreateTraditionHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-black text-app-black dark:text-zinc-100 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full border border-app-border dark:border-zinc-800 flex items-center justify-center shrink-0">
          <LayoutTemplate className="w-4 h-4 text-app-gray" />
        </div>
        Create Tradition
      </h1>
    </div>
  );
};
