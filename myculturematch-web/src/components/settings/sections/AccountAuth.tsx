import React from 'react';
import { Chrome, Apple } from 'lucide-react';
import { ConnectionRow } from '../rows/ConnectionRow';
import { TwoFactorRow } from '../rows/TwoFactorRow';

interface AccountAuthProps {
  googleConnected: boolean;
  setGoogleConnected: (val: boolean) => void;
  appleConnected: boolean;
  setAppleConnected: (val: boolean) => void;
  twoFactor: boolean;
  setTwoFactor: (val: boolean) => void;
}

export const AccountAuth: React.FC<AccountAuthProps> = ({
  googleConnected,
  setGoogleConnected,
  appleConnected,
  setAppleConnected,
  twoFactor,
  setTwoFactor,
}) => {
  return (
    <div>
      <h2 className="text-xs uppercase font-extrabold tracking-wider text-app-gray dark:text-zinc-500 mb-4">
        Account authorization
      </h2>
      <div className="divide-y divide-app-border/40 dark:divide-zinc-850/40">
        <ConnectionRow
          icon={<Chrome className="w-5 h-5 text-app-gray dark:text-zinc-400" />}
          title="Google"
          description="Connect to log in to MyCultureMatch with your Google account"
          isConnected={googleConnected}
          onToggle={() => setGoogleConnected(!googleConnected)}
        />
        <ConnectionRow
          icon={<Apple className="w-5 h-5 text-app-gray dark:text-zinc-400" />}
          title="Apple"
          description="Connect to log in to MyCultureMatch with your Apple account"
          isConnected={appleConnected}
          onToggle={() => setAppleConnected(!appleConnected)}
        />
        <TwoFactorRow twoFactor={twoFactor} setTwoFactor={setTwoFactor} />
      </div>
    </div>
  );
};
