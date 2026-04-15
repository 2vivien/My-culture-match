import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import tw from '@/lib/tailwind';
import { SHADOWS } from '@/lib/styles';

const INTERESTS = [
  { id: '1', emoji: '⚽', title: 'Game On', sub: 'Football frenzy', badges: ['🚩', '🚩'] },
  { id: '2', emoji: '🎬', title: 'Screen Time', sub: 'Epic movie nights' },
  { id: '3', emoji: '🃏', title: 'Gaming Galore', sub: 'Board game', badges: ['🎟️'] },
  { id: '4', emoji: '🐶', title: 'Pet Pals', sub: 'Wildlife wonders' },
  { id: '5', emoji: '📍', title: 'Volunteer Ventures', sub: 'Social meetups', badges: ['🩶'] },
  { id: '6', emoji: '🥗', title: 'Global Cuisines', sub: 'Foodie festivals' },
  { id: '7', emoji: '🎨', title: 'Artistic Souls', sub: 'Canvas creations' },
  { id: '8', emoji: '🎹', title: 'Music Melodies', sub: 'Classical vibes' },
];

export const InterestsScreen = () => {
  const [selected, setSelected] = useState<string[]>(['1', '3']);

  const toggleInterest = (id: string) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`px-6 pt-8 pb-4 relative z-10`}>
        <Text style={[tw`text-[28px] font-extrabold text-textMain mb-2`, { fontFamily: 'Urbanist_800ExtraBold' }]}>
          I'm looking for
        </Text>
        <Text style={[tw`text-[15px] font-medium text-textSub`, { fontFamily: 'Urbanist_500Medium' }]}>
          Select Your Interests and Activities
        </Text>
        
        {/* Progress Bar */}
        <View style={tw`flex-row gap-2 mt-6`}>
          <View style={tw`h-2 flex-1 bg-primary rounded-full`} />
          <View style={tw`h-2 flex-[2] bg-gray-100 rounded-full`} />
        </View>
      </View>

      <View style={tw`flex-1`}>
        <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={tw`px-6 pt-4 pb-40`}
        >
          <View style={tw`flex-row flex-wrap justify-between`}>
            {INTERESTS.map((item) => {
              const isSelected = selected.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => toggleInterest(item.id)}
                  activeOpacity={0.8}
                  style={[
                    tw`w-[47%] rounded-[24px] p-5 items-center mb-4`,
                    isSelected 
                      ? tw`border-2 border-primary bg-primaryLight` 
                      : [tw`bg-white border-2 border-transparent`, SHADOWS.card],
                    { elevation: isSelected ? 0 : 5 }
                  ]}
                >
                  <View style={tw`mb-2 relative`}>
                    <Text style={tw`text-[40px]`}>{item.emoji}</Text>
                    {item.badges && item.badges.map((b, i) => (
                      <Text key={i} style={[
                        tw`absolute text-lg`, 
                        i === 0 ? { top: -4, right: -12 } : { top: -4, left: -12 }
                      ]}>
                        {b}
                      </Text>
                    ))}
                  </View>
                  <Text style={[tw`text-[15px] font-bold text-textMain mb-1 text-center`, { fontFamily: 'Urbanist_700Bold' }]}>
                    {item.title}
                  </Text>
                  <Text style={[tw`text-[11px] font-medium text-textSub text-center`, { fontFamily: 'Urbanist_500Medium' }]}>
                    {item.sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Footer / Next Button */}
      <View style={tw`absolute bottom-0 w-full h-[120px] items-center justify-center px-6 pb-6 shadow-sm`}>
        {/* Gradient Background for Button shadow/fade */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.8)' }]} />
        
        <TouchableOpacity 
          style={[tw`bg-primary rounded-full pl-6 pr-2 py-2 flex-row items-center gap-4`, SHADOWS.floatingBtn]}
        >
          <Text style={[tw`text-white text-[15px] font-bold tracking-wide`, { fontFamily: 'Urbanist_700Bold' }]}>Next</Text>
          <View style={tw`w-10 h-10 bg-white rounded-full items-center justify-center`}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M5 12h14" />
                <Path d="M12 5l7 7-7 7" />
            </Svg>
          </View>
        </TouchableOpacity>
        
        {/* iOS Indicator Bar */}
        <View style={tw`absolute bottom-2 w-1/3 h-1 bg-gray-900 rounded-full`} />
      </View>
    </SafeAreaView>
  );
};
