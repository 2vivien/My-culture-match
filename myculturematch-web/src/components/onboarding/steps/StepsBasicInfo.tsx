import React from 'react';
import { StepIntention } from './StepIntention';
import { StepGender } from './StepGender';
import { StepAvatar } from './StepAvatar';

interface StepsBasicInfoProps {
  step: number;
  intention: string;
  gender: string;
  seeking: string;
  name: string;
  username: string;
  avatarSeed: string;
  usernameSuggestions: string[];
  setName: (name: string) => void;
  setUsername: (user: string) => void;
  shuffleAvatar: () => void;
  updateField: (field: string, value: any) => void;
}

export const StepsBasicInfo: React.FC<StepsBasicInfoProps> = (props) => {
  switch (props.step) {
    case 1:
      return <StepIntention intention={props.intention} updateField={props.updateField} />;
    case 2:
      return (
        <StepGender
          gender={props.gender}
          seeking={props.seeking}
          updateField={props.updateField}
        />
      );
    case 3:
      return (
        <StepAvatar
          name={props.name}
          username={props.username}
          avatarSeed={props.avatarSeed}
          usernameSuggestions={props.usernameSuggestions}
          setName={props.setName}
          setUsername={props.setUsername}
          shuffleAvatar={props.shuffleAvatar}
        />
      );
    default:
      return null;
  }
};
