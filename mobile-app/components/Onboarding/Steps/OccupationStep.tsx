import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import tw from '@/lib/tailwind';
import { StepHeader } from '../StepHeader';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { SHADOWS } from '@/lib/styles';

type Props = {
  value: { domain: string; title: string };
  onChange: (val: { domain: string; title: string }) => void;
};

const DOMAINS = [
  { id: 'tech', label: 'Tech & Digital', icon: (color: string) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <Path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
    </Svg>
  )},
  { id: 'business', label: 'Business & Finance', icon: (color: string) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <Rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <Path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </Svg>
  )},
  { id: 'creative', label: 'Art & Design', icon: (color: string) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M12 8v8M8 12h8" />
    </Svg>
  )},
  { id: 'medical', label: 'Santé & Social', icon: (color: string) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <Path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </Svg>
  )},
  { id: 'other', label: 'Autre domaine', icon: (color: string) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <Circle cx="12" cy="12" r="1" /><Circle cx="19" cy="12" r="1" /><Circle cx="5" cy="12" r="1" />
    </Svg>
  )},
];

export const OccupationStep = ({ value, onChange }: Props) => (
  <View>
    <StepHeader 
      badge="Carrière" 
      title="Que fais-tu dans la vie ?" 
      sub="Ton domaine d'activité en dit long sur tes passions." 
    />

    <Text style={[tw`text-[11px] font-bold text-gray-400 uppercase mb-4`, { fontFamily: 'Urbanist_700Bold' }]}>Ton domaine d'activité</Text>
    <View style={tw`flex-row flex-wrap gap-3 mb-8`}>
      {DOMAINS.map((domain) => (
        <TouchableOpacity
          key={domain.id}
          onPress={() => onChange({ ...value, domain: domain.label })}
          activeOpacity={0.7}
          style={[
            tw`flex-row items-center gap-3 px-5 py-4 rounded-2xl border-2`,
            value.domain === domain.label ? tw`border-primary bg-primary/5` : tw`border-gray-50 bg-white`,
            { width: '100%' }
          ]}
        >
          <View style={tw`w-10 h-10 bg-gray-50 rounded-full items-center justify-center`}>
            {domain.icon(value.domain === domain.label ? '#ff386c' : '#111')}
          </View>
          <Text style={[
            tw`text-[15px] font-bold`,
            { fontFamily: 'Urbanist_700Bold', color: value.domain === domain.label ? '#ff386c' : '#111' }
          ]}>{domain.label}</Text>
          {value.domain === domain.label && (
            <View style={tw`ml-auto w-5 h-5 bg-primary rounded-full items-center justify-center`}>
               <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <Path d="M20 6L9 17l-5-5" />
               </Svg>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>

    <Text style={[tw`text-[11px] font-bold text-gray-400 uppercase mb-3`, { fontFamily: 'Urbanist_700Bold' }]}>Ton métier (Optionnel)</Text>
    <View style={[tw`bg-white p-5 rounded-3xl border border-gray-100 flex-row items-center`, SHADOWS.card]}>
      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5">
        <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <Circle cx="12" cy="7" r="4" />
      </Svg>
      <TextInput 
        value={value.title}
        onChangeText={t => onChange({ ...value, title: t })}
        placeholder="Ex: Designer, Ingénieur, Étudiant..."
        style={[tw`flex-1 ml-4 text-gray-900 font-bold`, { fontFamily: 'Urbanist_700Bold' }]}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  </View>
);
