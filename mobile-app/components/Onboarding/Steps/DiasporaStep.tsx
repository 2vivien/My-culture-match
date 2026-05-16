import React from 'react';
import { View } from 'react-native';
import { StepHeader } from '../StepHeader';
import { StepOption } from '../StepOption';
import Svg, { Path, Circle } from 'react-native-svg';

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export const DiasporaStep = ({ value, onChange }: Props) => (
  <View>
    <StepHeader 
      badge="Diaspora" 
      title="Profils à l'étranger" 
      sub="Acceptes-tu les profils de ta culture vivant dans d'autres pays ?" 
    />
    <StepOption 
      label="Oui, sans problème" 
      sub="Les racines comptent plus que le lieu de vie" 
      icon={
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="2.5">
          <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <Path d="M22 4L12 14.01l-3-3" />
        </Svg>
      } 
      selected={value === 'yes'} 
      onPress={() => onChange('yes')} 
    />
    <StepOption 
      label="Selon le pays" 
      sub="Je préfère une proximité géographique" 
      icon={
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="2.5">
          <Circle cx="12" cy="12" r="10" />
          <Path d="M12 2v20M2 12h20" />
        </Svg>
      } 
      selected={value === 'maybe'} 
      onPress={() => onChange('maybe')} 
    />
    <StepOption 
      label="Priorité pays d'origine" 
      sub="Vivre au cœur de notre culture natale" 
      icon={
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="2.5">
          <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </Svg>
      } 
      selected={value === 'no'} 
      onPress={() => onChange('no')} 
    />
  </View>
);
