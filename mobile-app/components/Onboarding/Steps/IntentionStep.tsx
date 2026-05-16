import React from 'react';
import { View } from 'react-native';
import { StepHeader } from '../StepHeader';
import { StepOption } from '../StepOption';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export const IntentionStep = ({ value, onChange }: Props) => (
  <View>
    <StepHeader 
      badge="Ton intention" 
      title="Pourquoi es-tu là aujourd'hui ?" 
      sub="Ta réponse oriente tout l'algorithme dès le départ." 
    />
    <StepOption 
      label="Je cherche une union sérieuse" 
      sub="Mariage, engagement, construction" 
      icon={
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="2.5">
          <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </Svg>
      }
      selected={value === 'union'} 
      onPress={() => onChange('union')} 
    />
    <StepOption 
      label="Retrouver des gens de ma culture" 
      sub="Communauté, réseau, racines" 
      icon={
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="2.5">
          <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <Circle cx="9" cy="7" r="4" />
          <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </Svg>
      }
      selected={value === 'culture'} 
      onPress={() => onChange('culture')} 
    />
    <StepOption 
      label="Découvrir d'autres cultures" 
      sub="Ouverture, curiosité sincère" 
      icon={
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="2.5">
          <Circle cx="12" cy="12" r="10" />
          <Path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </Svg>
      }
      selected={value === 'discover'} 
      onPress={() => onChange('discover')} 
    />
    <StepOption 
      label="Je ne sais pas encore" 
      sub="Je verrai au fil des rencontres" 
      icon={
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="2.5">
          <Circle cx="11" cy="11" r="8" />
          <Path d="M21 21l-4.35-4.35" />
        </Svg>
      }
      selected={value === 'explore'} 
      onPress={() => onChange('explore')} 
    />
  </View>
);
