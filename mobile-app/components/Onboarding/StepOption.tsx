import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import tw from '@/lib/tailwind';
import { SHADOWS } from '@/lib/styles';

type StepOptionProps = {
  label: string;
  sub?: string;
  icon: React.ReactNode;
  selected: boolean;
  onPress: () => void;
};

export const StepOption = ({ label, sub, icon, selected, onPress }: StepOptionProps) => (
  <TouchableOpacity 
    onPress={onPress}
    activeOpacity={0.8}
    style={[
      tw`p-5 rounded-[32px] mb-4 flex-row items-center border-2`,
      selected 
        ? [tw`border-primary bg-primary/5`, SHADOWS.card] 
        : tw`border-gray-50 bg-white`
    ]}
  >
    <View style={[
      tw`w-14 h-14 rounded-2xl items-center justify-center mr-4`,
      selected ? tw`bg-white` : tw`bg-gray-50`
    ]}>
      {icon}
    </View>
    <View style={tw`flex-1`}>
      <Text style={[
        tw`text-[17px] font-bold`, 
        { fontFamily: 'Urbanist_700Bold', color: selected ? '#ff386c' : '#111' }
      ]}>{label}</Text>
      {sub && (
        <Text style={[
            tw`text-[13px] mt-0.5`, 
            { fontFamily: 'Urbanist_500Medium', color: selected ? '#ff386c' : '#9CA3AF', opacity: selected ? 0.7 : 1 }
        ]}>{sub}</Text>
      )}
    </View>
    <View style={[
        tw`w-7 h-7 rounded-full border-2 items-center justify-center`, 
        selected ? tw`border-primary bg-primary` : tw`border-gray-100`
    ]}>
      {selected && (
        <View style={tw`w-2.5 h-2.5 bg-white rounded-full`} />
      )}
    </View>
  </TouchableOpacity>
);
