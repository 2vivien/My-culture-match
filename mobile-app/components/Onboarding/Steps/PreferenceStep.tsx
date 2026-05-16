import React from 'react';
import { View } from 'react-native';
import { StepHeader } from '../StepHeader';
import { StepOption } from '../StepOption';
import Svg, { Path, Circle } from 'react-native-svg';

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export const PreferenceStep = ({ value, onChange }: Props) => (
  <View>
    <StepHeader 
      badge="Préférence" 
      title="Ton match idéal" 
      sub="Définit tes priorités pour les suggestions de profils." 
    />
    <StepOption 
      label="Ma propre culture" 
      sub="Même ethnie, région ou langue" 
      icon={
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="2.5">
          <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <Circle cx="12" cy="13" r="3" />
        </Svg>
      } 
      selected={value === 'same'} 
      onPress={() => onChange('same')} 
    />
    <StepOption 
      label="Même continent" 
      sub="Ex: Afrique de l'Ouest, Maghreb..." 
      icon={
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="2.5">
          <Circle cx="12" cy="12" r="10" />
          <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          <Path d="M2 12h20" />
        </Svg>
      } 
      selected={value === 'region'} 
      onPress={() => onChange('region')} 
    />
    <StepOption 
      label="Une culture précise" 
      sub="J'ai une préférence particulière" 
      icon={
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="2.5">
          <Circle cx="12" cy="12" r="10" />
          <Path d="M12 8v4l3 3" />
        </Svg>
      } 
      selected={value === 'target'} 
      onPress={() => onChange('target')} 
    />
    <StepOption 
      label="Ouverture totale" 
      sub="Les valeurs comptent plus que l'origine" 
      icon={
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="2.5">
          <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
          <Path d="M8 11h8v10H8z" />
        </Svg>
      } 
      selected={value === 'open'} 
      onPress={() => onChange('open')} 
    />
  </View>
);
