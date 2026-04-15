import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Defs, RadialGradient, Stop, Polygon, Line } from 'react-native-svg';
import tw from '@/lib/tailwind';
import { SHADOWS } from '@/lib/styles';
import { SwipeCard } from '@/components/SwipeCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BackgroundShapes = () => (
  <View style={StyleSheet.absoluteFill}>
    <Svg height="100%" width="100%">
      <Defs>
        <RadialGradient
          id="grad1"
          cx="0"
          cy="0"
          rx="40%"
          ry="40%"
          fx="0"
          fy="0"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#fff6f8" stopOpacity="1" />
          <Stop offset="1" stopColor="#fff6f8" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient
          id="grad2"
          cx="100%"
          cy="100%"
          rx="40%"
          ry="40%"
          fx="100%"
          fy="100%"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#f4f4f4" stopOpacity="1" />
          <Stop offset="1" stopColor="#f4f4f4" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad1)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad2)" />
    </Svg>
  </View>
);

const MOCK_USER = {
  id: '1',
  name: 'Julia handsome',
  role: 'Product designer',
  distance: '566 m',
  image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800',
};

export const IdealMatchScreen = () => {
  return (
    <View style={tw`flex-1 bg-bgLight`}>
      <BackgroundShapes />

      <SafeAreaView style={tw`flex-1`}>
        {/* Header */}
        <View style={tw`px-6 pt-6 gap-4 z-10`}>
          <Text style={[tw`text-xl font-bold text-textMain text-center`, { fontFamily: 'Urbanist_700Bold' }]}>
            Ideal match
          </Text>

          <View style={tw`flex-row justify-between items-center`}>
            <TouchableOpacity style={tw`flex-row items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100`}>
              <Text style={[tw`text-sm font-semibold text-textMain`, { fontFamily: 'Urbanist_600SemiBold' }]}>
                Washington
              </Text>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" strokeWidth="2" strokeLinecap="round">
                <Path d="M6 9l6 6 6-6" />
              </Svg>
            </TouchableOpacity>

            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity style={tw`w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100`}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="#EAB308">
                  <Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </Svg>
              </TouchableOpacity>
              <TouchableOpacity style={tw`w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100`}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" strokeWidth="2" strokeLinecap="round">
                  <Line x1="4" y1="21" x2="4" y2="14" />
                  <Line x1="4" y1="10" x2="4" y2="3" />
                  <Line x1="12" y1="21" x2="12" y2="12" />
                  <Line x1="12" y1="8" x2="12" y2="3" />
                  <Line x1="20" y1="21" x2="20" y2="16" />
                  <Line x1="20" y1="12" x2="20" y2="3" />
                  <Line x1="1" y1="14" x2="7" y2="14" />
                  <Line x1="9" y1="8" x2="15" y2="8" />
                  <Line x1="17" y1="16" x2="23" y2="16" />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Card Section */}
        <View style={tw`flex-1 justify-center px-4 relative mt-4 z-10`}>
          <SwipeCard
            user={MOCK_USER}
            onSwipeLeft={() => console.log('Passed')}
            onSwipeRight={() => console.log('Liked')}
          />

          {/* Action Buttons Overlay */}
          <View style={tw`absolute bottom-0 left-0 right-0 flex-row justify-center items-end gap-5 px-6 pb-2`}>
            {/* Dislike */}
            <TouchableOpacity style={tw`w-[60px] h-[60px] bg-white rounded-full items-center justify-center shadow-lg border border-gray-100`}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2.5" strokeLinecap="round">
                <Line x1="18" y1="6" x2="6" y2="18" />
                <Line x1="6" y1="6" x2="18" y2="18" />
              </Svg>
            </TouchableOpacity>

            {/* Like */}
            <TouchableOpacity
              style={[
                tw`w-[85px] h-[85px] bg-primary rounded-full items-center justify-center`,
                SHADOWS.floatingBtn,
                { transform: [{ translateY: 12 }] }
              ]}
            >
              {/* Custom Flame SVG from HTML */}
              <Svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                <Path d="M12 2c0 0-5.5 5-5.5 11a5.5 5.5 0 0 0 11 0C17.5 7 12 2 12 2z" stroke="white" strokeWidth="1.5" />
                <Path d="M12 12c0 0-2 1.5-2 3.5a2 2 0 0 0 4 0C14 13.5 12 12 12 12z" fill="#ff386c" />
              </Svg>
            </TouchableOpacity>

            {/* Super Like */}
            <TouchableOpacity style={tw`w-[60px] h-[60px] bg-white rounded-full items-center justify-center shadow-lg border border-gray-100`}>
              <Svg width="26" height="26" viewBox="0 0 24 24" fill="#9013FE">
                <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};
