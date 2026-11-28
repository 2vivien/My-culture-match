import React from 'react';
import { View, Text } from 'react-native';
import tw from '@/lib/tailwind';

export const StatsCard = () => (
  <View style={tw`flex-row justify-between px-6 mt-8`}>
    {[
      { label: 'Matchs', value: '12' },
      { label: 'Likes', value: '48+', special: true },
      { label: 'Vues', value: '124' },
    ].map((stat, i) => (
      <View key={i} style={tw`bg-gray-50 flex-1 ${i !== 0 ? 'ml-3' : ''} p-4 rounded-3xl items-center`}>
        <Text style={[tw`text-lg font-black ${stat.special ? 'text-primary' : 'text-gray-900'}`, { fontFamily: 'Urbanist_800ExtraBold' }]}>
          {stat.value}
        </Text>
        <Text style={[tw`text-[10px] font-bold text-gray-400 uppercase mt-0.5`, { fontFamily: 'Urbanist_700Bold' }]}>
          {stat.label}
        </Text>
      </View>
    ))}
  </View>
);
