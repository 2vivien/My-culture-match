import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import tw from '@/lib/tailwind';
import { StepHeader } from '../StepHeader';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

type Props = {
  value: string;
  onChange: (val: string) => void;
};

const SituationIcon = ({ type, color }: { type: string, color: string }) => {
  switch (type) {
    case 'Célibataire':
      return (
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
          <Circle cx="12" cy="12" r="10" />
          <Path d="M12 8v4l3 3" />
        </Svg>
      );
    case 'Divorcé(e)':
      return (
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
          <Path d="M10.5 22L12 21l1.5 1M12 2v2M3.5 15l2-1M18.5 15l-2-1M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
          <G transform="translate(12, 12) rotate(45) translate(-12, -12)">
            <Path d="M10 12h4M12 10v4" />
          </G>
        </Svg>
      );
    case 'Secret':
      return (
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
          <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </Svg>
      );
    default:
      return (
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
          <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </Svg>
      );
  }
};

export const SituationStep = ({ value, onChange }: Props) => (
  <View>
    <StepHeader 
      badge="Situation" 
      title="Ta situation civile" 
      sub="Pour une transparence totale dès le départ." 
    />
    <View style={tw`flex-row flex-wrap gap-4`}>
      {['Célibataire', 'Divorcé(e)', 'Veuf/Veuve', 'Secret'].map(s => (
        <TouchableOpacity 
          key={s} 
          onPress={() => onChange(s)} 
          activeOpacity={0.7}
          style={[
            tw`w-[47%] py-8 rounded-[40px] border-2 items-center justify-center gap-3`, 
            value === s ? tw`border-primary bg-primary/5` : tw`border-gray-50 bg-white`
          ]}
        >
          <View style={[tw`w-10 h-10 rounded-full items-center justify-center`, value === s ? tw`bg-white` : tw`bg-gray-50`]}>
            <SituationIcon type={s} color={value === s ? '#ff386c' : '#111'} />
          </View>
          <Text style={[tw`text-sm font-bold`, { fontFamily: 'Urbanist_700Bold', color: value === s ? '#ff386c' : '#111' }]}>
            {s}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);
