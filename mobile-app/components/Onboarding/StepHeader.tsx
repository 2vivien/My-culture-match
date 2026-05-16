import React from 'react';
import { View, Text } from 'react-native';
import tw from '@/lib/tailwind';

type StepHeaderProps = {
  badge: string;
  title: string;
  sub: string;
};

export const StepHeader = ({ badge, title, sub }: StepHeaderProps) => (
  <View style={tw`mb-8`}>
    <View style={tw`bg-primary/10 self-start px-3 py-1 rounded-full mb-3`}>
      <Text style={[tw`text-[11px] font-extrabold text-primary uppercase`, { fontFamily: 'Urbanist_800ExtraBold' }]}>
        {badge}
      </Text>
    </View>
    <Text style={[tw`text-[28px] font-extrabold text-gray-900 leading-tight mb-2`, { fontFamily: 'Urbanist_800ExtraBold' }]}>
      {title}
    </Text>
    <Text style={[tw`text-[15px] font-medium text-gray-500 leading-relaxed`, { fontFamily: 'Urbanist_500Medium' }]}>
      {sub}
    </Text>
  </View>
);
