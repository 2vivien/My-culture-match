import React from 'react';
import { EmailRow } from '../rows/EmailRow';
import { GenderRow } from '../rows/GenderRow';
import { LocationRow } from '../rows/LocationRow';

interface AccountGeneralProps {
  email: string;
  onEmailChanged: (email: string) => void;
  gender: string;
  setGender: (val: string) => void;
  isEditingGender: boolean;
  setIsEditingGender: (val: boolean) => void;
  locationType: string;
  setLocationType: (val: string) => void;
  isEditingLocation: boolean;
  setIsEditingLocation: (val: boolean) => void;
}

export const AccountGeneral: React.FC<AccountGeneralProps> = (props) => {
  return (
    <div>
      <h2 className="text-xs uppercase font-extrabold tracking-wider text-app-gray dark:text-zinc-500 mb-4">
        General
      </h2>
      <div className="divide-y divide-app-border/40 dark:divide-zinc-800/40">
        <EmailRow email={props.email} onEmailChanged={props.onEmailChanged} />
        <GenderRow
          gender={props.gender}
          setGender={props.setGender}
          isEditingGender={props.isEditingGender}
          setIsEditingGender={props.setIsEditingGender}
        />
        <LocationRow
          locationType={props.locationType}
          setLocationType={props.setLocationType}
          isEditingLocation={props.isEditingLocation}
          setIsEditingLocation={props.setIsEditingLocation}
        />
      </div>
    </div>
  );
};
