import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { ChevronLeft, ListFilter, Star as LucideStar, Check } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import tw from '@/lib/tailwind';
import { MATCHES, MESSAGES } from '@/data/conversations';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

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
    <View style={tw`flex-col items-center gap-2 mr-4`}>
      <View style={[
        tw`w-[66px] h-[66px] rounded-full border-[2.5px] border-primary items-center justify-center p-1`,
        { borderStyle: 'dashed' }
      ]}>
        <View style={tw`w-full h-full bg-primary rounded-full items-center justify-center`}>
          <AnimatedSvg 
            width="28" 
            height="28" 
            viewBox="0 0 24 24" 
            style={animatedStyle}
          >
            <Path 
              d="M12 2V6M12 18V22M6 12H2M22 12H18M19.0711 19.0711L16.2426 16.2426M7.75736 7.75736L4.92893 4.92893M19.0711 4.92893L16.2426 7.75736M7.75736 16.2426L4.92893 19.0711" 
              stroke="white" 
              strokeWidth="2.5" 
              strokeLinecap="round"
            />
          </AnimatedSvg>
        </View>
      </View>
      <Text style={[tw`text-[13px] font-medium text-textMain`, { fontFamily: 'Urbanist_500Medium' }]}>New</Text>
    </View>
  );
};

export const ConversationsScreen = () => {
  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between px-6 pt-6 pb-2`}>
        <TouchableOpacity style={tw`w-10 h-10 rounded-full border border-gray-200 items-center justify-center`}>
          <ChevronLeft size={20} color="#1e1e1e" />
        </TouchableOpacity>
        <Text style={[tw`text-[22px] font-bold text-textMain`, { fontFamily: 'Urbanist_700Bold' }]}>Conversations</Text>
        <View style={tw`w-10`} />
      </View>

      <View style={tw`flex-1`}>
        {/* Recent match Section */}
        <View style={tw`mt-4`}>
          <Text style={[tw`px-6 text-sm font-semibold text-textSub mb-4`, { fontFamily: 'Urbanist_600SemiBold' }]}>Recent match</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`px-6 pb-2`}>
            <NewMatchIcon />
            {MATCHES.map((match) => (
              <View key={match.id} style={tw`items-center gap-2 mr-4`}>
                <View style={[
                  tw`w-[66px] h-[66px] rounded-full p-[2px]`,
                  match.hasStory && { backgroundColor: '#ff9c3a' } // Gradient from-primary to-orange-400 sim
                ]}>
                  {match.hasStory ? (
                     <View style={[tw`flex-1 rounded-full p-[1px]`, { backgroundColor: '#ff386c' }]}>
                        <Image source={{ uri: match.image }} style={tw`w-full h-full rounded-full border-2 border-white`} />
                     </View>
                  ) : (
                    <Image source={{ uri: match.image }} style={tw`w-full h-full rounded-full`} />
                  )}
                  {match.isOnline && (
                    <View style={tw`absolute right-0 bottom-[4px] w-[14px] h-[14px] bg-[#00d084] border-2 border-white rounded-full`} />
                  )}
                </View>
                <Text style={[tw`text-[13px] font-medium text-textMain`, { fontFamily: 'Urbanist_500Medium' }]}>{match.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Messages List */}
        <View style={tw`flex-1 mt-8 px-6 pb-24`}>
          <View style={tw`flex-row justify-between items-center mb-6`}>
            <Text style={[tw`text-lg font-bold text-textMain`, { fontFamily: 'Urbanist_700Bold' }]}>Messages</Text>
            <TouchableOpacity>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" strokeWidth="2" strokeLinecap="round">
                <Path d="M21 10h-8M21 6H3M21 14H3M21 18H8" />
              </Svg>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={tw`-mx-6 px-6`}>
            <View style={tw`gap-6 pb-4`}>
              {MESSAGES.map((msg) => (
                <View key={msg.id}>
                  {msg.isActive ? (
                    <View style={[tw`bg-white rounded-[32px] p-4 shadow-xl border border-gray-50`, { elevation: 8 }]}>
                      <View style={tw`flex-row gap-3 items-start`}>
                        <View>
                          <Image source={{ uri: msg.image }} style={tw`w-[42px] h-[42px] rounded-full`} />
                          <View style={tw`absolute -right-1 -top-1 bg-primary px-2 py-0.5 rounded-full`}>
                            <Text style={tw`text-white text-[10px] font-bold`}>+4</Text>
                          </View>
                        </View>
                        <View style={tw`flex-1 pt-1`}>
                          <Text style={[tw`font-bold text-[15px] text-textMain`, { fontFamily: 'Urbanist_700Bold' }]}>{msg.name}</Text>
                          <Text style={[tw`text-[13px] text-textMain font-medium leading-tight mt-1`, { fontFamily: 'Urbanist_500Medium' }]} numberOfLines={2}>
                            {msg.message}
                          </Text>
                        </View>
                      </View>
                      <View style={tw`flex-row gap-3 mt-4`}>
                        <TouchableOpacity style={tw`flex-1 bg-primary flex-row items-center justify-center py-2.5 rounded-2xl shadow-lg`}>
                          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={tw`mr-2`}>
                            <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </Svg>
                          <Text style={[tw`text-white text-[13px] font-bold`, { fontFamily: 'Urbanist_700Bold' }]}>Quick reply</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={tw`flex-1 bg-white border border-gray-200 flex-row items-center justify-center py-2.5 rounded-2xl`}>
                          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={tw`mr-2`}>
                            <Path d="M20 6L9 17l-5-5" />
                          </Svg>
                          <Text style={[tw`text-textMain text-[13px] font-bold`, { fontFamily: 'Urbanist_700Bold' }]}>Mark read</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity style={tw`flex-row gap-4 items-center`}>
                      <Image source={{ uri: msg.image }} style={tw`w-[52px] h-[52px] rounded-full`} />
                      <View style={tw`flex-1`}>
                        <View style={tw`flex-row justify-between items-center mb-1`}>
                          <View style={tw`flex-row items-center gap-1.5`}>
                            <Text style={[tw`font-bold text-[15px] text-textMain`, { fontFamily: 'Urbanist_700Bold' }]}>{msg.name}</Text>
                            {msg.isStarred && <Svg width="12" height="12" viewBox="0 0 24 24" fill="#ff386c"><Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></Svg>}
                          </View>
                          <Text style={[tw`text-xs text-textSub`, { fontFamily: 'Urbanist_400Regular' }]}>{msg.time}</Text>
                        </View>
                        <Text style={[tw`text-[13px] ${msg.isUnread ? 'text-textMain font-medium' : 'text-textSub'}`, { fontFamily: msg.isUnread ? 'Urbanist_600SemiBold' : 'Urbanist_400Regular' }]} numberOfLines={1}>
                          {msg.message}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};
