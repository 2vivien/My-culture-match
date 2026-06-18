import React from 'react';
import { View, Image, TouchableOpacity, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import tw from '@/lib/tailwind';
import { COLORS } from '@/lib/theme';

const MOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400',
  'https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?w=400',
];

export const PhotoGrid = () => (
  <View style={tw`px-6 mt-8`}>
    <View style={tw`flex-row justify-between items-center mb-4`}>
      <Text style={[tw`text-gray-400 font-bold uppercase text-[11px]`, { fontFamily: 'Urbanist_700Bold' }]}>Mes Photos (3/6)</Text>
    </View>
    <View style={tw`flex-row flex-wrap gap-4`}>
      {MOCK_PHOTOS.map((uri, i) => (
        <View key={i} style={[tw`w-[47%] bg-gray-100 rounded-3xl overflow-hidden relative`, { aspectRatio: 3 / 4 }]}>
          <Image source={{ uri }} style={tw`w-full h-full`} />
          <TouchableOpacity style={tw`absolute top-2 right-2 bg-black/40 w-8 h-8 rounded-full items-center justify-center`}>
             <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <Path d="M18 6L6 18M6 6l12 12" />
             </Svg>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={[tw`w-[47%] bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl items-center justify-center`, { aspectRatio: 3 / 4 }]}>
        <View style={tw`bg-primary/10 w-12 h-12 rounded-full items-center justify-center mb-2`}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="3">
            <Path d="M12 5v14M5 12h14" />
          </Svg>
        </View>
        <Text style={[tw`text-gray-400 text-xs font-bold`, { fontFamily: 'Urbanist_700Bold' }]}>Ajouter</Text>
      </TouchableOpacity>
    </View>
  </View>
);
