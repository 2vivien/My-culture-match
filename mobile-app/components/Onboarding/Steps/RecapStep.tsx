import React from 'react';
import { COLORS } from '@/lib/theme';
import { View, Text } from 'react-native';
import tw from '@/lib/tailwind';
import { StepHeader } from '../StepHeader';
import { OnboardingData } from '../../../hooks/useOnboarding';
import Svg, { Path, Circle } from 'react-native-svg';

type Props = {
  data: OnboardingData;
};

export const RecapStep = ({ data }: Props) => (
  <View>
    <StepHeader 
      badge="Profil prêt" 
      title="Ton profil est prêt !" 
      sub="Ton identité culturelle est maintenant enregistrée." 
    />
    <View style={tw`bg-gray-50 p-7 rounded-[40px] gap-5 mb-8`}>
      {[
        { label: 'Intention', value: data.intention, icon: (c: string) => <Circle cx="12" cy="12" r="10" stroke={c} strokeWidth="2.5" /> },
        { label: 'Origine', value: data.roots.country, icon: (c: string) => <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke={c} strokeWidth="2.5" /> },
        { label: 'Carrière', value: data.occupation.title || data.occupation.domain, icon: (c: string) => <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={c} strokeWidth="2.5" /> },
        { label: 'Âge souhaité', value: `${data.seekAge[0]}-${data.seekAge[1]} ans`, icon: (c: string) => <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5" stroke={c} strokeWidth="2.5" /> }
      ].map((item, idx) => (
        <View key={idx} style={tw`flex-row justify-between items-center pb-4 ${idx < 3 ? 'border-b border-gray-100' : ''}`}>
          <View style={tw`flex-row items-center gap-3`}>
             <View style={tw`w-8 h-8 rounded-full bg-white items-center justify-center`}>
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                   {item.icon(COLORS.primary)}
                </Svg>
             </View>
             <Text style={[tw`text-gray-400 font-bold uppercase text-[10px]`, { fontFamily: 'Urbanist_700Bold' }]}>{item.label}</Text>
          </View>
          <Text style={[tw`text-gray-900 font-bold text-[15px]`, { fontFamily: 'Urbanist_700Bold' }]}>{item.value || '-'}</Text>
        </View>
      ))}
    </View>

    <View style={tw`bg-primary/5 p-6 rounded-[32px] border border-primary/10`}>
       <View style={tw`flex-row items-center gap-3 mb-2`}>
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2.5">
             <Circle cx="12" cy="12" r="10" /><Path d="M12 8v4l3 3" />
          </Svg>
          <Text style={[tw`text-primary font-black uppercase text-[11px]`, { fontFamily: 'Urbanist_800ExtraBold' }]}>Comment ça marche</Text>
       </View>
       <Text style={[tw`text-gray-600 leading-relaxed text-[14px]`, { fontFamily: 'Urbanist_500Medium' }]}>
         Chaque lundi, tu reçois ton <Text style={tw`font-black text-gray-900`}>Trio Hebdo</Text> — 3 profils choisis sur mesure. Pas de swipe, juste de la qualité.
       </Text>
    </View>
  </View>
);
