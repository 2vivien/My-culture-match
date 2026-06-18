import React from 'react';
import { COLORS } from '@/lib/theme';
import { View, TouchableOpacity, Text } from 'react-native';
import tw from '@/lib/tailwind';
import { StepHeader } from '../StepHeader';
import Svg, { Path, Circle } from 'react-native-svg';

type Props = {
  gender: string;
  seeking: string;
  onGenderChange: (val: string) => void;
  onSeekingChange: (val: string) => void;
};

const GenderIcon = ({ type, color }: { type: string, color: string }) => {
  if (type === 'Homme' || type === 'Hommes') {
    return (
      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
        <Circle cx="10" cy="14" r="6" /><Path d="M14 10l6-6M20 10V4h-6" />
      </Svg>
    );
  }
  if (type === 'Femme' || type === 'Femmes') {
    return (
      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
        <Circle cx="12" cy="9" r="7" /><Path d="M12 16v6M8 19h8" />
      </Svg>
    );
  }
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><Circle cx="9" cy="7" r="4" />
    </Svg>
  );
};

export const GenderStep = ({ gender, seeking, onGenderChange, onSeekingChange }: Props) => (
  <View>
    <StepHeader 
      badge="Identité" 
      title="Ton profil" 
      sub="Ces informations nous aident à personnaliser ton expérience." 
    />
    
    <Text style={[tw`text-[11px] font-bold text-gray-400 uppercase mb-4`, { fontFamily: 'Urbanist_700Bold' }]}>Je suis</Text>
    <View style={tw`flex-row gap-3 mb-8`}>
      {['Homme', 'Femme', 'Autre'].map(g => (
        <TouchableOpacity 
          key={g} 
          onPress={() => onGenderChange(g)} 
          activeOpacity={0.7}
          style={[
            tw`flex-1 py-6 rounded-[32px] border-2 items-center justify-center gap-3`, 
            gender === g ? tw`border-primary bg-primary/5` : tw`border-gray-50 bg-white`
          ]}
        >
          <View style={[tw`w-10 h-10 rounded-full items-center justify-center`, gender === g ? tw`bg-white` : tw`bg-gray-50`]}>
            <GenderIcon type={g} color={gender === g ? COLORS.primary : '#111'} />
          </View>
          <Text style={[tw`text-sm font-bold`, { fontFamily: 'Urbanist_700Bold', color: gender === g ? COLORS.primary : '#111' }]}>{g}</Text>
        </TouchableOpacity>
      ))}
    </View>

    <Text style={[tw`text-[11px] font-bold text-gray-400 uppercase mb-4`, { fontFamily: 'Urbanist_700Bold' }]}>Je cherche</Text>
    <View style={tw`flex-row gap-3`}>
      {['Hommes', 'Femmes', 'Les deux'].map(s => (
        <TouchableOpacity 
          key={s} 
          onPress={() => onSeekingChange(s)} 
          activeOpacity={0.7}
          style={[
            tw`flex-1 py-6 rounded-[32px] border-2 items-center justify-center gap-3`, 
            seeking === s ? tw`border-primary bg-primary/5` : tw`border-gray-50 bg-white`
          ]}
        >
          <View style={[tw`w-10 h-10 rounded-full items-center justify-center`, seeking === s ? tw`bg-white` : tw`bg-gray-50`]}>
            <GenderIcon type={s} color={seeking === s ? COLORS.primary : '#111'} />
          </View>
          <Text style={[tw`text-sm font-bold`, { fontFamily: 'Urbanist_700Bold', color: seeking === s ? COLORS.primary : '#111' }]}>{s}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);
