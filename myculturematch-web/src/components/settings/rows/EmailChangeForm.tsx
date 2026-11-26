import React, { useState } from 'react';
import type { useEmailChange } from '@/src/hooks/useEmailChange';

type Flow = ReturnType<typeof useEmailChange>;

const inputCls =
  'px-3 py-1.5 text-xs rounded-xl border border-app-border bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-200 focus:outline-none focus:border-zinc-400';
const btnCls =
  'px-2.5 py-1.5 text-xs font-bold text-white rounded-lg bg-zinc-800 dark:bg-zinc-700 cursor-pointer disabled:opacity-50';
const cancelCls = 'px-2 py-1.5 text-xs font-semibold text-app-gray cursor-pointer';
const errorCls = 'text-[10px] text-red-500';

interface StepProps {
  flow: Flow;
  onCancel: () => void;
}

const EmailCodeStep: React.FC<StepProps> = ({ flow, onCancel }) => {
  const [code, setCode] = useState('');

  return (
    <div className="flex flex-col items-end gap-1" onClick={(e) => e.stopPropagation()}>
      <span className="text-[10px] text-app-gray">Code envoyé à {flow.pendingEmail}</span>
      <div className="flex items-center gap-1.5">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="Code à 6 chiffres"
          inputMode="numeric"
          maxLength={6}
          className={`${inputCls} w-32`}
        />
        <button
          onClick={() => void flow.confirmCode(code)}
          disabled={flow.isSubmitting || code.length !== 6}
          className={btnCls}
        >
          Valider
        </button>
        <button onClick={onCancel} className={cancelCls}>
          Annuler
        </button>
      </div>
      {flow.error && <span className={errorCls}>{flow.error}</span>}
    </div>
  );
};

const EmailAddressStep: React.FC<StepProps> = ({ flow, onCancel }) => {
  const [newEmail, setNewEmail] = useState('');

  return (
    <div className="flex flex-col items-end gap-1" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-1.5">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Nouvel email"
          className={`${inputCls} w-44`}
        />
        <button
          onClick={() => void flow.requestCode(newEmail.trim())}
          disabled={flow.isSubmitting || !newEmail.trim()}
          className={btnCls}
        >
          Recevoir le code
        </button>
        <button onClick={onCancel} className={cancelCls}>
          Annuler
        </button>
      </div>
      {flow.error && <span className={errorCls}>{flow.error}</span>}
    </div>
  );
};

interface EmailChangeFormProps {
  flow: Flow;
  onCancel: () => void;
}

export const EmailChangeForm: React.FC<EmailChangeFormProps> = ({ flow, onCancel }) => {
  return flow.step === 'awaiting-code' ? (
    <EmailCodeStep flow={flow} onCancel={onCancel} />
  ) : (
    <EmailAddressStep flow={flow} onCancel={onCancel} />
  );
};
