import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import tw from '@/lib/tailwind';
import { StepHeader } from '../StepHeader';
import Svg, { Path } from 'react-native-svg';

const LANGUAGES = {
  intl: ['Français', 'Anglais', 'Arabe', 'Espagnol', 'Portugais'],
  africa: ['Wolof', 'Bambara', 'Soninké', 'Peul', 'Yoruba', 'Igbo', 'Haoussa', 'Twi', 'Éwé', 'Lingala', 'Moore', 'Bamiléké', 'Swahili'],
  diaspora: ['Créole haïtien', 'Créole antillais']
};

type Props = {
  selected: string[];
  onToggle: (val: string) => void;
};

export const LanguagesStep = ({ selected, onToggle }: Props) => (
  <View>
    <StepHeader 
      badge="Langues" 
      title="Que maîtrises-tu ?" 
      sub="Sélectionne toutes les langues que tu parles couramment." 
    />
    {Object.entries(LANGUAGES).map(([key, list]) => (
      <View key={key} style={tw`mb-8`}>
        <Text style={[tw`text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4`, { fontFamily: 'Urbanist_800ExtraBold' }]}>
          {key === 'intl' ? 'International' : key === 'africa' ? 'Afrique' : 'Diaspora'}
        </Text>
        <View style={tw`flex-row flex-wrap gap-3`}>
          {list.map(l => (
            <TouchableOpacity 
              key={l} 
              onPress={() => onToggle(l)} 
              activeOpacity={0.7}
              style={[
                tw`px-6 py-3 rounded-[20px] border-2 flex-row items-center gap-2`, 
                selected.includes(l) ? tw`border-primary bg-primary/5` : tw`border-gray-50 bg-white`
              ]}
            >
              {selected.includes(l) && (
                <View style={tw`w-3.5 h-3.5 bg-primary rounded-full items-center justify-center`}>
                  <Svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                    <Path d="M20 6L9 17l-5-5" />
                  </Svg>
                </View>
              )}
              <Text style={[
                tw`text-sm font-bold`, 
                { fontFamily: 'Urbanist_700Bold', color: selected.includes(l) ? '#ff386c' : '#111' }
              ]}>
                {l}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ))}
  </View>
);
