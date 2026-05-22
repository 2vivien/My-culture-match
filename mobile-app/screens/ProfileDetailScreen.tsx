import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, useWindowDimensions, SafeAreaView, Platform } from 'react-native';
import Svg, { Path, Circle, Line, Polygon } from 'react-native-svg';
import tw from '@/lib/tailwind';
import { LinearGradient } from 'expo-linear-gradient';
import { SHADOWS } from '@/lib/styles';

const VerificationStar = ({ color = "#ff386c", size = 20 }: { color?: string, size?: number }) => (
  <View style={[tw`rounded-full items-center justify-center bg-white shadow-sm`, { width: size * 1.5, height: size * 1.5 }]}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </Svg>
  </View>
);

interface ProfileDetailProps {
  user: any;
  onBack: () => void;
}

export const ProfileDetailScreen = ({ user, onBack }: ProfileDetailProps) => {
  const { width: windowWidth } = useWindowDimensions();
  const SCREEN_WIDTH = Math.min(windowWidth, 500);

  return (
    <View style={tw`flex-1 bg-white`}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-32`}>
        {/* Hero Image Section */}
        <View style={{ height: SCREEN_WIDTH * 0.9, width: '100%' }}>
          <Image source={{ uri: user.images[0] }} style={tw`w-full h-full`} resizeMode="cover" />
          
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'transparent']}
            style={tw`absolute inset-0`}
          />

          <SafeAreaView style={tw`absolute top-0 left-0 right-0`}>
            <View style={tw`flex-row justify-between items-center px-6 pt-4`}>
              <TouchableOpacity 
                onPress={onBack}
                style={[tw`w-12 h-12 bg-white rounded-2xl items-center justify-center`, SHADOWS.card]}
              >
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M15 18l-6-6 6-6" />
                </Svg>
              </TouchableOpacity>

              <TouchableOpacity style={[tw`w-12 h-12 bg-white rounded-2xl items-center justify-center`, SHADOWS.card]}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5">
                   <Circle cx="12" cy="12" r="1" /><Circle cx="19" cy="12" r="1" /><Circle cx="5" cy="12" r="1" />
                </Svg>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Content Section */}
        <View style={tw`px-6 pt-6`}>
           <View style={tw`flex-row items-center justify-between mb-2`}>
              <View style={tw`flex-row items-center gap-3`}>
                 <Text style={[tw`text-[34px] font-black text-gray-900 tracking-tight`, { fontFamily: 'Urbanist_800ExtraBold' }]}>{user.name}, {user.age}</Text>
                 <VerificationStar size={22} />
              </View>
           </View>

           <View style={tw`flex-row items-center gap-4 mb-8`}>
              <View style={tw`flex-row items-center gap-1.5`}>
                 <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5">
                    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx="12" cy="10" r="3" />
                 </Svg>
                 <Text style={[tw`text-gray-500 font-semibold`, { fontFamily: 'Urbanist_600SemiBold' }]}>{user.location}</Text>
              </View>
              <View style={tw`bg-primary/10 px-3 py-1.5 rounded-xl`}>
                 <Text style={[tw`text-[10px] font-black text-primary uppercase`, { fontFamily: 'Urbanist_800ExtraBold' }]}>{user.mode === 'love' ? 'Love' : 'Amitié'}</Text>
              </View>
           </View>

           <Text style={[tw`text-xl font-black text-gray-900 mb-3`, { fontFamily: 'Urbanist_800ExtraBold' }]}>Cultural Profile</Text>
           
           {/* Redesigned Info Grid - No more cards that cut off */}
           <View style={tw`bg-gray-50 rounded-[32px] p-2 mb-8`}>
              <View style={tw`flex-row flex-wrap`}>
                 {[
                   { label: 'Origine', value: user.origin, icon: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z' },
                   { label: 'Ethnie', value: user.ethnicity, icon: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z' },
                   { label: 'Langues', value: user.languages?.join(', '), icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
                   { label: 'Vit à', value: user.livesIn, icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }
                 ].map((item, idx) => (
                   <View key={idx} style={[tw`w-1/2 p-4`, idx < 2 && tw`border-b border-gray-100`, idx % 2 === 0 && tw`border-r border-gray-100`]}>
                      <View style={tw`flex-row items-center gap-2 mb-1`}>
                         <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="2.5">
                            <Path d={item.icon} />
                         </Svg>
                         <Text style={[tw`text-[10px] text-gray-400 font-black uppercase`, { fontFamily: 'Urbanist_800ExtraBold' }]}>{item.label}</Text>
                      </View>
                      <Text style={[tw`text-[15px] text-gray-900 font-bold`, { fontFamily: 'Urbanist_700Bold' }]} numberOfLines={1}>{item.value || 'N/A'}</Text>
                   </View>
                 ))}
              </View>
           </View>

           <Text style={[tw`text-xl font-black text-gray-900 mb-3`, { fontFamily: 'Urbanist_800ExtraBold' }]}>Bio</Text>
           <Text style={[tw`text-[16px] text-gray-500 leading-relaxed mb-8`, { fontFamily: 'Urbanist_500Medium' }]}>
             {user.bio}
           </Text>

           <Text style={[tw`text-xl font-black text-gray-900 mb-4`, { fontFamily: 'Urbanist_800ExtraBold' }]}>Gallery</Text>
           <View style={tw`flex-row flex-wrap gap-2`}>
              {user.images.slice(1).map((img: string, idx: number) => (
                <View key={idx} style={[tw`rounded-[24px] overflow-hidden`, { width: (SCREEN_WIDTH - 56) / 2, height: 220 }]}>
                   <Image 
                    source={{ uri: img }} 
                    style={tw`w-full h-full`} 
                    resizeMode="cover"
                  />
                </View>
              ))}
           </View>
        </View>
      </ScrollView>

      {/* Floating Action Bar */}
      <View style={tw`absolute bottom-8 left-6 right-6 flex-row gap-4`}>
         <TouchableOpacity 
            onPress={onBack}
            style={[tw`w-16 h-16 bg-white rounded-[24px] items-center justify-center border border-gray-100`, SHADOWS.card]}
          >
            <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF4D6D" strokeWidth={3}>
               <Path d="M18 6L6 18M6 6l12 12" />
            </Svg>
         </TouchableOpacity>
         <TouchableOpacity 
            style={[
              tw`flex-1 h-16 rounded-[24px] items-center justify-center flex-row gap-3 shadow-lg bg-primary shadow-primary/30`,
              SHADOWS.floatingBtn
            ]}
          >
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="white">
               {user.mode === 'friendship' ? (
                 <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" transform="translate(0, 4)" />
               ) : (
                 <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
               )}
            </Svg>
            <Text style={[tw`text-white text-lg font-black uppercase tracking-wider`, { fontFamily: 'Urbanist_800ExtraBold' }]}>Match Now</Text>
         </TouchableOpacity>
      </View>
    </View>
  );
};
