import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import tw from '@/lib/tailwind';
import { StepHeader } from '../StepHeader';
import Svg, { Path } from 'react-native-svg';

const CRITERIA = [
  'Communication', 'Respect mutuel', 'Foi partagée', 'Ambition commune', 
  'Humour', 'Stabilité financière', 'Tendresse', 'Honnêteté', 
  'Passion', 'Autonomie', 'Projet familial', 'Culture', 'Proximité'
];

type Props = {
  selected: string[];
  onToggle: (val: string) => void;
};

export const CriteriaStep = ({ selected, onToggle }: Props) => (
  <View>
    <StepHeader 
      badge="Critères" 
      title="Ce qui est vital pour toi" 
      sub="Choisis jusqu'à 5 critères profonds pour tes futurs matchs." 
    />
    <View style={tw`flex-row flex-wrap gap-3`}>
      {CRITERIA.map(c => (
        <TouchableOpacity 
          key={c} 
          onPress={() => onToggle(c)} 
          activeOpacity={0.7}
          style={[
            tw`px-6 py-4 rounded-[24px] border-2 flex-row items-center gap-3`, 
            selected.includes(c) ? tw`border-primary bg-primary/5` : tw`border-gray-50 bg-white`
          ]}
        >
          {selected.includes(c) && (
            <View style={tw`w-4 h-4 bg-primary rounded-full items-center justify-center`}>
              <Svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                <Path d="M20 6L9 17l-5-5" />
              </Svg>
            </View>
          )}
          <Text style={[
            tw`text-[15px] font-bold`, 
            { fontFamily: 'Urbanist_700Bold', color: selected.includes(c) ? '#ff386c' : '#111' }
          ]}>
            {c}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);
