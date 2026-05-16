import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, useWindowDimensions, StyleSheet, StatusBar } from 'react-native';
import Svg, { Path, Rect, Defs, RadialGradient, Stop, Polygon, Line, Circle } from 'react-native-svg';
import tw from '@/lib/tailwind';
import { SHADOWS } from '@/lib/styles';
import { SwipeCard } from '@/components/SwipeCard';
import { MatchModal } from '@/components/MatchModal';
import { FilterModal } from '@/components/FilterModal';

const BackgroundShapes = () => (
  <View style={StyleSheet.absoluteFill}>
    <Svg height="100%" width="100%">
      <Defs>
        <RadialGradient
          id="grad1"
          cx="0"
          cy="0"
          rx="50%"
          ry="40%"
          fx="0"
          fy="0"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#fff0f4" stopOpacity="1" />
          <Stop offset="1" stopColor="#fff0f4" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient
          id="grad2"
          cx="100%"
          cy="100%"
          rx="50%"
          ry="40%"
          fx="100%"
          fy="100%"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#f3f4f6" stopOpacity="1" />
          <Stop offset="1" stopColor="#f3f4f6" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad1)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad2)" />
    </Svg>
  </View>
);

export const IdealMatchScreen = ({ onSelectUser, onShowNotifications, onBack }: { onSelectUser: (user: any) => void, onShowNotifications: () => void, onBack: () => void }) => {
  const [matchUser, setMatchUser] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const SCREEN_WIDTH = Math.min(windowWidth, 500);

  return (
    <View style={[tw`flex-1 bg-[#fcfcfc]`, { width: SCREEN_WIDTH, alignSelf: 'center' }]}>
      <StatusBar barStyle="dark-content" />
      <BackgroundShapes />

      <SafeAreaView style={tw`flex-1`}>
        {/* Header */}
        <View style={tw`px-6 pt-2 pb-2 relative z-10 flex-row justify-between items-center`}>
            <TouchableOpacity 
              onPress={onBack}
              style={[tw`w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-50 shadow-sm`, SHADOWS.card]}
            >
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M15 18l-6-6 6-6" />
              </Svg>
            </TouchableOpacity>
            <Text style={[tw`text-[24px] font-black text-gray-900 text-center`, { fontFamily: 'Urbanist_800ExtraBold' }]}>
                Ideal Match
            </Text>
            
            <TouchableOpacity 
              onPress={onShowNotifications}
              style={[tw`w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-50 shadow-sm`, SHADOWS.card]}
            >
              <View style={tw`relative`}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5">
                  <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                </Svg>
                <View style={tw`absolute top-0 right-0 w-2.5 h-2.5 bg-primary rounded-full border border-white`} />
              </View>
            </TouchableOpacity>
        </View>

        <View style={tw`px-6 z-10`}>
            <View style={tw`flex-row justify-between items-center mt-2`}>
                <TouchableOpacity 
                    activeOpacity={0.7}
                    style={tw`flex-row items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100`}
                >
                    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <Circle cx="12" cy="10" r="3" />
                    </Svg>
                    <Text style={[tw`text-sm font-semibold text-textMain`, { fontFamily: 'Urbanist_600SemiBold' }]}>Paris, France</Text>
                    <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M6 9l6 6 6-6"/>
                    </Svg>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    onPress={() => setShowFilters(true)}
                    activeOpacity={0.7}
                    style={tw`flex-row items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100`}
                >
                    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <Line x1="4" y1="21" x2="4" y2="14"></Line><Line x1="4" y1="10" x2="4" y2="3"></Line>
                        <Line x1="12" y1="21" x2="12" y2="12"></Line><Line x1="12" y1="8" x2="12" y2="3"></Line>
                        <Line x1="20" y1="21" x2="20" y2="16"></Line><Line x1="20" y1="12" x2="20" y2="3"></Line>
                    </Svg>
                    <Text style={[tw`text-[13px] font-bold text-gray-900`, { fontFamily: 'Urbanist_700Bold' }]}>Filters</Text>
                </TouchableOpacity>
            </View>
        </View>

        <View style={tw`flex-1 relative z-0 mt-4`}>
          <SwipeCard onSelectUser={onSelectUser} onMatch={setMatchUser} />
        </View>
      </SafeAreaView>

      <MatchModal 
        visible={!!matchUser} 
        onClose={() => setMatchUser(null)} 
        user={matchUser} 
      />

      <FilterModal 
        visible={showFilters} 
        onClose={() => setShowFilters(false)} 
        onApply={(filters) => console.log('Ideal match filters:', filters)}
      />
    </View>
  );
};
