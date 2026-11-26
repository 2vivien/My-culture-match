import React from 'react';
import { COLORS } from '@/lib/theme';
import { View, TouchableOpacity, Text } from 'react-native';
import tw from '@/lib/tailwind';
import { StepHeader } from '../StepHeader';
import Svg, { Path } from 'react-native-svg';

const VALUES = [
  { id: 'faith', label: 'Foi & Spiritualité' },
  { id: 'family', label: 'Famille d\'abord' },
  { id: 'ambition', label: 'Ambition & Réussite' },
  { id: 'post', label: 'Post & Coutumes' },
  { id: 'solidarity', label: 'Solidarité' },
  { id: 'comm', label: 'Communication' },
  { id: 'peace', label: 'Paix & Équilibre' },
  { id: 'indep', label: 'Indépendance' },
  { id: 'loyalty', label: 'Loyauté absolue' },
  { id: 'freedom', label: 'Liberté' },
  { id: 'edu', label: 'Éducation' },
  { id: 'health', label: 'Santé' }
];

type Props = {
  selected: string[];
  onToggle: (val: string) => void;
};

export const ValuesStep = ({ selected, onToggle }: Props) => (
  <View>
    <StepHeader 
      badge="Tes valeurs" 
      title="Tes fondamentaux" 
      sub="Choisis jusqu'à 4 valeurs essentielles pour toi." 
    />
    <View style={tw`flex-row flex-wrap gap-3`}>
      {VALUES.map(v => (
        <TouchableOpacity 
          key={v.id} 
          onPress={() => onToggle(v.label)} 
          activeOpacity={0.7}
          style={[
            tw`px-6 py-4 rounded-[24px] border-2 flex-row items-center gap-3`, 
            selected.includes(v.label) ? tw`border-primary bg-primary/5` : tw`border-gray-50 bg-white`
          ]}
        >
          {selected.includes(v.label) && (
            <View style={tw`w-4 h-4 bg-primary rounded-full items-center justify-center`}>
              <Svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                <Path d="M20 6L9 17l-5-5" />
              </Svg>
            </View>
          )}
          <Text style={[
            tw`text-[15px] font-bold`, 
            { fontFamily: 'Urbanist_700Bold', color: selected.includes(v.label) ? COLORS.primary : '#111' }
          ]}>
            {v.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);
