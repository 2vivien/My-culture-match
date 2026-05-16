import React from 'react';
import { View, TextInput } from 'react-native';
import tw from '@/lib/tailwind';
import { StepHeader } from '../StepHeader';

type Props = {
  roots: { country: string; region: string; village: string };
  onChange: (roots: { country: string; region: string; village: string }) => void;
};

export const RootsStep = ({ roots, onChange }: Props) => (
  <View>
    <StepHeader 
      badge="Tes racines" 
      title="D'où viens-tu exactement ?" 
      sub="Plus c'est précis, plus le match culturel sera juste." 
    />
    <TextInput 
      placeholder="Pays d'origine" 
      value={roots.country} 
      onChangeText={t => onChange({...roots, country: t})} 
      style={[tw`w-full p-5 bg-gray-50 rounded-3xl mb-3`, { fontFamily: 'Urbanist_600SemiBold' }]} 
    />
    <TextInput 
      placeholder="Région / Ethnie" 
      value={roots.region} 
      onChangeText={t => onChange({...roots, region: t})} 
      style={[tw`w-full p-5 bg-gray-50 rounded-3xl mb-3`, { fontFamily: 'Urbanist_600SemiBold' }]} 
    />
    <TextInput 
      placeholder="Ville ou village natal" 
      value={roots.village} 
      onChangeText={t => onChange({...roots, village: t})} 
      style={[tw`w-full p-5 bg-gray-50 rounded-3xl mb-3`, { fontFamily: 'Urbanist_600SemiBold' }]} 
    />
  </View>
);
