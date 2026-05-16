import React from 'react';
import { View, TextInput, Text } from 'react-native';
import tw from '@/lib/tailwind';
import { StepHeader } from '../StepHeader';

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export const BioStep = ({ value, onChange }: Props) => (
  <View>
    <StepHeader badge="Ta Bio" title="Dis quelque chose de vrai" sub="Pas une bio parfaite, juste une phrase sincère." />
    <TextInput 
      multiline
      numberOfLines={6}
      maxLength={1000}
      placeholder="Ex: Sénégalaise à Lyon, le thiéboudienne me manque chaque dimanche..." 
      value={value} 
      onChangeText={onChange}
      style={[tw`w-full p-6 bg-gray-50 rounded-[32px] text-lg leading-relaxed`, { fontFamily: 'Urbanist_500Medium', minHeight: 180 }]}
    />
    <Text style={tw`text-right text-gray-400 mt-2 font-bold text-xs`}>{value.length}/1000</Text>
  </View>
);
