import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { ChevronLeft, Search, Star } from 'lucide-react-native';
import Svg, { Path, Rect, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import tw from '@/lib/tailwind';
import { MATCHES, MESSAGES } from '@/data/conversations';
import { SHADOWS } from '@/lib/styles';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const BackgroundShapes = () => (
  <View style={StyleSheet.absoluteFill}>
    <Svg height="35%" width="100%">
      <Defs>
        <RadialGradient
          id="grad1"
          cx="0"
          cy="0"
          rx="50%"
          ry="100%"
          fx="0"
          fy="0"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#fff0f4" stopOpacity="1" />
          <Stop offset="1" stopColor="#fff0f4" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad1)" />
    </Svg>
  </View>
);

const NewMatchIcon = () => {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={tw`items-center gap-2 mr-5`}>
      <View style={[
        tw`w-[70px] h-[70px] rounded-full border-[2.5px] border-primary items-center justify-center p-1.5`,
        { borderStyle: 'dashed' }
      ]}>
        <View style={tw`w-full h-full bg-primary rounded-full items-center justify-center`}>
          <AnimatedSvg width="26" height="26" viewBox="0 0 24 24" style={animatedStyle}>
            <Path 
              d="M12 2V6M12 18V22M6 12H2M22 12H18M19.0711 19.0711L16.2426 16.2426M7.75736 7.75736L4.92893 4.92893M19.0711 4.92893L16.2426 7.75736M7.75736 16.2426L4.92893 19.0711" 
              stroke="white" strokeWidth="2.5" strokeLinecap="round"
            />
          </AnimatedSvg>
        </View>
      </View>
      <Text style={[tw`text-[13px] font-semibold text-textMain`, { fontFamily: 'Urbanist_600SemiBold' }]}>New</Text>
    </View>
  );
};

export const ConversationsScreen = ({ onSelectChat, onShowNotifications }: { onSelectChat?: (id: string) => void, onShowNotifications?: () => void }) => {
  return (
    <View style={tw`flex-1 bg-[#fcfcfc]`}>
      <StatusBar barStyle="dark-content" />
      <BackgroundShapes />
      
      <SafeAreaView style={tw`flex-1`}>
        {/* Header */}
        <View style={tw`flex-row items-center justify-between px-6 pt-4 pb-2 z-10`}>
          <TouchableOpacity style={tw`w-11 h-11 rounded-full border border-gray-100 bg-white items-center justify-center shadow-sm`}>
            <ChevronLeft size={22} color="#1e1e1e" />
          </TouchableOpacity>
          <Text style={[tw`text-[22px] font-bold text-textMain`, { fontFamily: 'Urbanist_700Bold' }]}>Conversations</Text>
          <TouchableOpacity 
            onPress={onShowNotifications}
            style={tw`w-11 h-11 rounded-full border border-gray-100 bg-white items-center justify-center shadow-sm`}
          >
            <View style={tw`relative`}>
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" strokeWidth="2.5">
                <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
              </Svg>
              <View style={tw`absolute top-0 right-0 w-2.5 h-2.5 bg-primary rounded-full border border-white`} />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-24 pt-4`}>
          {/* Recent Match Section */}
          <View style={tw`mt-6`}>
            <Text style={[tw`px-6 text-[15px] font-extrabold text-textSub mb-5 tracking-wide uppercase`, { fontFamily: 'Urbanist_800ExtraBold' }]}>Recent match</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`px-6`}>
              <NewMatchIcon />
              {MATCHES.map((match) => (
                <TouchableOpacity 
                  key={match.id} 
                  style={tw`items-center gap-2 mr-5`}
                  onPress={() => onSelectChat?.(match.id)}
                >
                  <View style={[
                    tw`w-[70px] h-[70px] rounded-full p-[2.5px]`,
                    match.hasStory && { backgroundColor: '#ff386c' }
                  ]}>
                    <View style={tw`flex-1 rounded-full p-[2px] bg-white`}>
                      <Image source={{ uri: match.image }} style={tw`w-full h-full rounded-full`} resizeMode="cover" />
                    </View>
                    {match.isOnline && (
                      <View style={tw`absolute right-[2px] bottom-[2px] w-[15px] h-[15px] bg-[#00d084] border-[2.5px] border-white rounded-full`} />
                    )}
                  </View>
                  <Text style={[tw`text-[13px] font-semibold text-textMain`, { fontFamily: 'Urbanist_600SemiBold' }]}>{match.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Messages List */}
          <View style={tw`mt-10 px-6`}>
            <View style={tw`flex-row justify-between items-center mb-6 px-1`}>
              <Text style={[tw`text-[20px] font-extrabold text-textMain`, { fontFamily: 'Urbanist_800ExtraBold' }]}>Messages</Text>
              <TouchableOpacity style={tw`flex-row items-center gap-1.5`}>
                <Text style={[tw`text-[15px] font-bold text-primary`, { fontFamily: 'Urbanist_700Bold' }]}>Filter</Text>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="2.5" strokeLinecap="round">
                  <Path d="M21 10h-8M21 6H3M21 14H3M21 18H8" />
                </Svg>
              </TouchableOpacity>
            </View>

            <View style={tw`gap-5.5`}>
              {MESSAGES.map((msg) => (
                <View key={msg.id}>
                  {msg.isActive ? (
                    <TouchableOpacity 
                      activeOpacity={0.9}
                      onPress={() => onSelectChat?.(msg.id)}
                      style={[tw`bg-white rounded-[32px] p-5.5 border border-pink-50`, SHADOWS.card]}
                    >
                      <View style={tw`flex-row gap-4.5 items-start`}>
                        <View style={tw`relative`}>
                          <Image source={{ uri: msg.image }} style={tw`w-[54px] h-[54px] rounded-full`} resizeMode="cover" />
                          <View style={tw`absolute -right-1 -top-1 bg-primary px-2 py-0.5 rounded-full border-2 border-white`}>
                            <Text style={tw`text-white text-[11px] font-extrabold`}>+4</Text>
                          </View>
                        </View>
                        <View style={tw`flex-1`}>
                          <View style={tw`flex-row justify-between items-center`}>
                            <Text style={[tw`font-extrabold text-[17px] text-textMain`, { fontFamily: 'Urbanist_800ExtraBold' }]}>{msg.name}</Text>
                            <Text style={[tw`text-xs text-textSub`, { fontFamily: 'Urbanist_500Medium' }]}>{msg.time}</Text>
                          </View>
                          <Text style={[tw`text-[14.5px] text-textMain font-medium leading-tight mt-1.5 pr-4`, { fontFamily: 'Urbanist_500Medium' }]} numberOfLines={2}>
                            {msg.message}
                          </Text>
                        </View>
                      </View>
                      <View style={tw`flex-row gap-3.5 mt-5.5`}>
                        <TouchableOpacity 
                          onPress={() => onSelectChat?.(msg.id)}
                          style={[tw`flex-1 bg-primary flex-row items-center justify-center py-3.5 rounded-2xl shadow-sm`, { elevation: 2 }]}
                        >
                          <Star size={18} color="white" fill="white" style={tw`mr-2`} />
                          <Text style={[tw`text-white text-[14.5px] font-bold`, { fontFamily: 'Urbanist_700Bold' }]}>Quick reply</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={tw`flex-1 bg-white border border-gray-100 flex-row items-center justify-center py-3.5 rounded-2xl shadow-sm`}>
                          <Text style={[tw`text-textMain text-[14.5px] font-bold`, { fontFamily: 'Urbanist_700Bold' }]}>Mark as read</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      activeOpacity={0.65} 
                      onPress={() => onSelectChat?.(msg.id)}
                      style={tw`flex-row gap-5 items-center px-1`}
                    >
                      <View style={tw`relative`}>
                        <Image source={{ uri: msg.image }} style={tw`w-[62px] h-[62px] rounded-full`} resizeMode="cover" />
                        {msg.isUnread && (
                           <View style={tw`absolute -right-[1px] -top-[1px] w-[18px] h-[18px] bg-primary border-[3px] border-white rounded-full`} />
                        )}
                      </View>
                      <View style={tw`flex-1`}>
                        <View style={tw`flex-row justify-between items-center mb-1.5`}>
                          <View style={tw`flex-row items-center gap-2`}>
                            <Text style={[tw`font-extrabold text-[17px] text-textMain`, { fontFamily: 'Urbanist_800ExtraBold' }]}>{msg.name}</Text>
                            {msg.isStarred && <Star size={13} color="#ff386c" fill="#ff386c" />}
                          </View>
                          <Text style={[tw`text-[12px] text-textSub`, { fontFamily: 'Urbanist_500Medium' }]}>{msg.time}</Text>
                        </View>
                        <Text style={[tw`text-[14.5px] ${msg.isUnread ? 'text-textMain font-bold' : 'text-textSub'}`, { fontFamily: msg.isUnread ? 'Urbanist_700Bold' : 'Urbanist_500Medium' }]} numberOfLines={1}>
                          {msg.message}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
