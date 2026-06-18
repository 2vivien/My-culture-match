import React from 'react';
import { COLORS } from '@/lib/theme';
import { View } from 'react-native';
import { StepHeader } from '../StepHeader';
import { StepOption } from '../StepOption';
import Svg, { Path, Circle } from 'react-native-svg';

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export const FamilyStep = ({ value, onChange }: Props) => (
  <View>
    <StepHeader 
      badge="Famille" 
      title="Rapport à la famille" 
      sub="Quelle place occupe l'avis de ta famille dans tes choix ?" 
    />
    <StepOption 
      label="Accord familial essentiel" 
      sub="C'est une valeur fondamentale pour moi" 
      icon={
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2.5">
          <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><Circle cx="9" cy="7" r="4" />
        </Svg>
      } 
      selected={value === 'strict'} 
      onPress={() => onChange('strict')} 
    />
    <StepOption 
      label="Avis important" 
      sub="Je respecte mais je garde le dernier mot" 
      icon={
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2.5">
          <Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><Circle cx="9" cy="7" r="4" />
          <Path d="M22 21v-2a4 4 0 0 0-3-3.87" /><Circle cx="19" cy="8" r="3" />
        </Svg>
      } 
      selected={value === 'mixed'} 
      onPress={() => onChange('mixed')} 
    />
    <StepOption 
      label="Indépendance totale" 
      sub="Je décide seul(e) de mes relations" 
      icon={
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2.5">
          <Circle cx="12" cy="12" r="10" />
          <Path d="M12 16v-4M12 8h.01" />
        </Svg>
      } 
      selected={value === 'independent'} 
      onPress={() => onChange('independent')} 
    />
  </View>
);
