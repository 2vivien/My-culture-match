import React from 'react';
import { View, Text, Image, Dimensions, TouchableOpacity } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  runOnJS
} from 'react-native-reanimated';
import { MapPin, Star, Gamepad2, Trophy, ArrowUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '@/lib/tailwind';
import { SHADOWS } from '@/lib/styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

type User = {
  id: string;
  name: string;
  role: string;
  distance: string;
  image: string;
};

type Props = {
  user: User;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
};

export const SwipeCard = ({ user, onSwipeLeft, onSwipeRight }: Props) => {
  const translateX = useSharedValue(0);
  const contextX = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
    })
    .onUpdate((event) => {
      translateX.value = contextX.value + event.translationX;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        if (event.translationX > 0) {
          translateX.value = withSpring(SCREEN_WIDTH * 1.5);
          if (onSwipeRight) runOnJS(onSwipeRight)();
        } else {
          translateX.value = withSpring(-SCREEN_WIDTH * 1.5);
          if (onSwipeLeft) runOnJS(onSwipeLeft)();
        }
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-10, 0, 10]
    );

    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[tw`w-full h-[480px]`, animatedStyle]}>
        <View style={[tw`flex-1 bg-white rounded-[40px] p-2 border-[3px] border-white overflow-hidden`, SHADOWS.card]}>
          <View style={tw`flex-1 rounded-[32px] overflow-hidden bg-gray-200`}>
            <Image
              source={{ uri: user.image }}
              style={tw`w-full h-full`}
              resizeMode="cover"
            />

            {/* Gradient Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
              style={tw`absolute inset-x-0 bottom-0 h-1/2`}
            />

            {/* Top Badges */}
            <View style={tw`absolute top-4 left-4 flex-row items-center bg-white/90 px-3 py-1.5 rounded-full gap-1.5 shadow-sm`}>
              <Text style={[tw`text-[13px] font-bold text-textMain`, { fontFamily: 'Urbanist_700Bold' }]}>{user.distance}</Text>
              <ArrowUp size={12} color="#1e1e1e" strokeWidth={3} />
            </View>

            <View style={tw`absolute top-4 right-4 gap-2`}>
              <View style={tw`w-8 h-8 bg-white/90 rounded-full items-center justify-center shadow-sm`}>
                <Text style={tw`text-lg`}>💛</Text>
              </View>
              <View style={tw`w-8 h-8 bg-white/90 rounded-full items-center justify-center shadow-sm`}>
                <Text style={tw`text-lg`}>🎮</Text>
              </View>
              <View style={tw`w-8 h-8 bg-white/90 rounded-full items-center justify-center shadow-sm`}>
                <Text style={tw`text-lg`}>🎾</Text>
              </View>
            </View>

            {/* Bottom Info */}
            <View style={tw`absolute bottom-6 left-5 px-1`}>
              <View style={tw`bg-white px-3 py-1.5 rounded-full flex-row items-center gap-1.5 mb-2 self-start shadow-sm`}>
                <Text style={[tw`text-textMain text-xs font-bold`, { fontFamily: 'Urbanist_700Bold' }]}>Here to chat</Text>
                <Text style={tw`text-xs`}>💬</Text>
              </View>

              <View style={tw`flex-row items-center gap-2 mb-0.5`}>
                <Text style={[tw`text-[26px] font-extrabold text-white tracking-tighter`, { fontFamily: 'Urbanist_800ExtraBold' }]}>{user.name}</Text>
                <View style={tw`bg-white rounded-full w-5 h-5 items-center justify-center shadow-sm`}>
                  <Star size={12} color="#ff386c" fill="#ff386c" />
                </View>
              </View>
              <Text style={[tw`text-[15px] font-medium text-white/90`, { fontFamily: 'Urbanist_500Medium' }]}>{user.role}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};
