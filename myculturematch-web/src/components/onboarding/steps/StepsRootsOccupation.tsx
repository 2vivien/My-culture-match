import React from 'react';
import { StepRoots } from './StepRoots';
import { StepBirthdate } from './StepBirthdate';
import { StepOccupation } from './StepOccupation';

interface StepsRootsOccupationProps {
  step: number;
  roots: { country: string; region: string; ethnicity: string; village: string };
  birthdate: string;
  age: number;
  occupation: { domain: string; title: string };
  updateField: (field: string, value: any) => void;
  updateRoots: (roots: { country: string; region: string; ethnicity: string; village: string }) => void;
}

export const StepsRootsOccupation: React.FC<StepsRootsOccupationProps> = (props) => {
  switch (props.step) {
    case 4:
      return (
        <StepRoots
          country={props.roots.country}
          region={props.roots.region}
          ethnicity={props.roots.ethnicity}
          village={props.roots.village}
          updateRoots={props.updateRoots}
        />
      );
    case 5:
      return (
        <StepBirthdate
          birthdate={props.birthdate}
          age={props.age}
          updateField={props.updateField}
        />
      );
    case 6:
      return (
        <StepOccupation
          occupation={props.occupation}
          updateField={props.updateField}
        />
      );
    default:
      return null;
  }
};
