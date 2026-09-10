import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useEmailChange } from '@/src/hooks/useEmailChange';
import { EmailChangeForm } from './EmailChangeForm';

interface EmailRowProps {
  email: string;
  onEmailChanged: (email: string) => void;
}

export const EmailRow: React.FC<EmailRowProps> = ({ email, onEmailChanged }) => {
  const [isEditing, setIsEditing] = useState(false);
  const flow = useEmailChange(onEmailChanged);

  const closeForm = () => {
    setIsEditing(false);
    flow.cancel();
  };

  return (
    <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <span className="text-xs font-extrabold text-app-black dark:text-zinc-400">
        Email address
      </span>
      <div className="flex items-center gap-2">
        {isEditing ? (
          <EmailChangeForm flow={flow} onCancel={closeForm} />
        ) : (
          <>
            <span className="text-xs text-app-gray dark:text-zinc-400 font-semibold">
              {email}
            </span>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer text-app-gray"
              aria-label="Modifier l'adresse email"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
