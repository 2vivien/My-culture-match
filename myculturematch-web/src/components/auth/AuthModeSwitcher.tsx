import React from 'react';

interface AuthModeSwitcherProps {
  mode: 'signin' | 'signup';
  setMode: (mode: 'signin' | 'signup') => void;
  setError: (error: string) => void;
}

export const AuthModeSwitcher: React.FC<AuthModeSwitcherProps> = ({ mode, setMode, setError }) => {
  const handleSwitch = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setError('');
  };

  return (
    <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl mb-8 border border-zinc-200/40 dark:border-zinc-800/40">
      <button
        onClick={() => handleSwitch('signin')}
        className={`flex-1 py-3 text-center text-sm font-bold rounded-xl transition-all duration-200 ${
          mode === 'signin'
            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
            : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white'
        }`}
      >
        Connexion
      </button>
      <button
        onClick={() => handleSwitch('signup')}
        className={`flex-1 py-3 text-center text-sm font-bold rounded-xl transition-all duration-200 ${
          mode === 'signup'
            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
            : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white'
        }`}
      >
        Inscription
      </button>
    </div>
  );
};
