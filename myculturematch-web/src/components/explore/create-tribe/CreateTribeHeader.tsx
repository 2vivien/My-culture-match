import React from 'react';
import { X } from 'lucide-react';

interface CreateTribeHeaderProps {
  step: number;
  onClose: () => void;
}

export const CreateTribeHeader: React.FC<CreateTribeHeaderProps> = ({ step, onClose }) => {
  return (
    <div className="flex justify-between items-center pb-2 border-b border-app-border/40 dark:border-zinc-800/40">
      <div>
        <h3 className="text-xl font-black text-app-black dark:text-white">
          {step === 1 && "What will your community be about?"}
          {step === 2 && "What kind of community is this?"}
          {step === 3 && "Tell us about your community"}
          {step === 4 && "Community Created!"}
        </h3>
        <p className="text-xs text-app-gray mt-1">
          {step === 1 && "Choose a topic to help members discover your community"}
          {step === 2 && "Decide who can view and contribute in your community."}
          {step === 3 && "A name and description help people understand what your community is all about."}
          {step === 4 && "Your new community is now ready for its members!"}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-app-border dark:border-zinc-800 text-app-black dark:text-white flex items-center justify-center hover:opacity-90 cursor-pointer transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
