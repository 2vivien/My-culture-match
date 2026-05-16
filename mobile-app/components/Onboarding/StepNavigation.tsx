import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import tw from '@/lib/tailwind';

type Props = {
  step: number;
  onBack: () => void;
  onNext: () => void;
  isLast: boolean;
};

export const StepNavigation = ({ step, onBack, onNext, isLast }: Props) => (
  <View style={tw`absolute bottom-0 w-full p-8 flex-row justify-between items-center bg-white/90`}>
    {step > 1 ? (
      <TouchableOpacity onPress={onBack} style={tw`px-6 py-4`}>
        <Text style={[tw`text-gray-400 font-bold`, { fontFamily: 'Urbanist_700Bold' }]}>Retour</Text>
      </TouchableOpacity>
    ) : <View />}

    <TouchableOpacity 
      onPress={onNext}
      activeOpacity={0.8}
      style={[tw`bg-primary rounded-full pl-8 pr-3 py-3 flex-row items-center gap-6 shadow-lg`, { elevation: 6 }]}
    >
      <Text style={[tw`text-white text-[17px] font-black`, { fontFamily: 'Urbanist_800ExtraBold' }]}>
        {isLast ? 'C\'est parti' : 'Suivant'}
      </Text>
      <View style={tw`w-11 h-11 bg-white rounded-full items-center justify-center`}>
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="4">
          <Path d="M5 12h14M12 5l7 7-7 7" />
        </Svg>
      </View>
    </TouchableOpacity>
  </View>
);
