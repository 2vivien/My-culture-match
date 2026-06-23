import React from 'react';
import { Settings } from 'lucide-react';

export const SettingsHeader: React.FC = () => {
  return (
    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-app-black dark:text-white mt-6 mb-4 flex items-center gap-2">
      <Settings className="w-7 h-7 text-[#E27D60] animate-spin-slow" />
      Settings
    </h1>
  );
};
