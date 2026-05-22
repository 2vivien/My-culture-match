import React, { useState } from 'react';
import { View, Text, Image, useWindowDimensions, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS
} from 'react-native-reanimated';
import Svg, { Path, Polygon, Line, Circle } from 'react-native-svg';
import { ArrowUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '@/lib/tailwind';
import { SHADOWS } from '@/lib/styles';

type User = {
  id: string;
  name: string;
  age: number;
  location: string;
  role: string;
  distance: string;
  bio: string;
  images: string[];
  badges?: string[];
  mode?: 'love' | 'friendship';
  tags: string[];
  origin?: string;
  ethnicity?: string;
  languages?: string[];
  livesIn?: string;
};

const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Julia handsome',
    age: 24,
    location: 'Paris, France',
    role: 'Product designer',
    distance: '566 m',
    bio: 'Passionate about culture, travel and meeting new people. Looking for someone special to share life with. Let\'s connect and see where it goes!',
    images: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
    ],
    tags: ['Design', 'Art', 'Gaming'],
    mode: 'love',
    origin: 'Marocaine-Colombienne',
    ethnicity: 'North African',
    languages: ['French', 'Arabic', 'English'],
    livesIn: 'France',
  },
  {
    id: '2',
    name: 'Sophia',
    age: 26,
    location: 'Lyon, France',
    role: 'Motion Designer',
    distance: '1.2 km',
    bio: 'I love exploring new cities, trying exotic food, and meeting people from different backgrounds. Let\'s explore together!',
    images: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    ],
    tags: ['Photography', 'Travel', 'Art'],
    mode: 'friendship',
    origin: 'Sénégalaise-Française',
    ethnicity: 'Mixed',
    languages: ['French', 'Spanish'],
    livesIn: 'France',
  },
];

const ActionButtons = ({ onDislike, onLike, onSuperLike }: { onDislike?: () => void; onLike?: () => void; onSuperLike?: () => void }) => (
  <View style={tw`absolute -bottom-10 left-0 w-full flex-row justify-center items-end gap-5 px-6 z-50`}>
    <TouchableOpacity 
      onPress={onDislike}
      activeOpacity={0.8}
      style={[tw`w-[62px] h-[62px] bg-white rounded-full items-center justify-center border border-gray-100`, SHADOWS.card]}
    >
      <Svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2.8" strokeLinecap="round">
        <Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" />
      </Svg>
    </TouchableOpacity>
    
    <TouchableOpacity 
      onPress={onLike}
      activeOpacity={0.8}
      style={[
        tw`w-[88px] h-[88px] bg-primary rounded-full items-center justify-center translate-y-2`, 
        SHADOWS.floatingBtn
      ]}
    >
      <View style={tw`relative items-center justify-center w-full h-full`}>
        <Svg width="42" height="42" viewBox="0 0 24 24" fill="white">
            <Path d="M12 2c0 0-5.5 5-5.5 11a5.5 5.5 0 0 0 11 0C17.5 7 12 2 12 2z" />
        </Svg>
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="#ff386c" style={tw`absolute top-[55%]`}>
            <Path d="M12 12c0 0-2 1.5-2 3.5a2 2 0 0 0 4 0C14 13.5 12 12 12 12z" />
        </Svg>
      </View>
    </TouchableOpacity>
    
    <TouchableOpacity 
      onPress={onSuperLike}
      activeOpacity={0.8}
      style={[tw`w-[62px] h-[62px] bg-white rounded-full items-center justify-center border border-gray-100`, SHADOWS.card]}
    >
      <Svg width="28" height="28" viewBox="0 0 24 24" fill="#9013FE">
        <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </Svg>
    </TouchableOpacity>
  </View>
);

const Card = ({ user, actionButtons, onPress, SCREEN_WIDTH }: { user: User; actionButtons?: React.ReactNode; onPress?: () => void, SCREEN_WIDTH: number }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handlePress = (e: any) => {
    const x = e.nativeEvent.locationX;
    const cardWidth = SCREEN_WIDTH - 48;
    if (x < cardWidth * 0.3) {
      if (currentImageIndex > 0) setCurrentImageIndex(prev => prev - 1);
    } else if (x > cardWidth * 0.7) {
      if (currentImageIndex < user.images.length - 1) setCurrentImageIndex(prev => prev + 1);
    } else {
      onPress?.();
    }
  };

  return (
    <View style={[tw`w-full h-full bg-white rounded-[40px] p-2 border-[3.5px] border-white overflow-visible`, SHADOWS.card]}>
      <Pressable 
        onPress={handlePress}
        style={tw`flex-1 rounded-[32px] overflow-hidden bg-gray-200`}
      >
        <Image
          source={{ uri: user.images[currentImageIndex] }}
          style={tw`w-full h-full`}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)'] as [string, string, ...string[]]}
          style={tw`absolute inset-x-0 bottom-0 h-[60%]`}
        />

        <View style={[tw`absolute top-6 left-5 bg-white/90 px-3.5 py-1.5 rounded-full flex-row items-center gap-1.5`]}>
          <Text style={[tw`text-[13px] font-bold text-textMain`, { fontFamily: 'Urbanist_700Bold' }]}>{user.distance}</Text>
          <ArrowUp size={13} color="#1e1e1e" strokeWidth={3} />
        </View>

        <View style={tw`absolute bottom-8 left-6 right-6`}>
          {user.origin && (
            <View style={tw`flex-row items-center gap-1.5 mb-2`}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <Line x1="4" y1="22" x2="4" y2="15" />
              </Svg>
              <Text style={[tw`text-[14px] font-bold text-primary uppercase tracking-wider`, { fontFamily: 'Urbanist_800ExtraBold' }]}>{user.origin}</Text>
            </View>
          )}

          <View style={tw`flex-row items-center gap-2.5 mb-1`}>
            <Text style={[tw`text-[28px] font-extrabold text-white tracking-tight`, { fontFamily: 'Urbanist_800ExtraBold' }]}>{user.name}, {user.age}</Text>
            <View style={tw`bg-white rounded-full w-5.5 h-5.5 items-center justify-center shadow-sm`}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="#ff386c">
                <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </Svg>
            </View>
          </View>
          <Text style={[tw`text-[16px] font-semibold text-white/90 mb-3`, { fontFamily: 'Urbanist_600SemiBold' }]}>{user.role}</Text>

          <Text 
            numberOfLines={1}
            style={[tw`text-[13px] text-white/70 leading-4.5`, { fontFamily: 'Urbanist_500Medium' }]}
          >
            {user.bio.split('.')[0]}.
          </Text>
        </View>
      </Pressable>
      {actionButtons}
    </View>
  );
};

export const SwipeCard = ({ onSelectUser, onMatch }: { onSelectUser?: (user: User) => void, onMatch?: (user: User) => void }) => {
  const { width: windowWidth } = useWindowDimensions();
  const SCREEN_WIDTH = Math.min(windowWidth, 500);
  const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

  const [currentIndex, setCurrentIndex] = useState(0);
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
        const direction = event.translationX > 0 ? 1 : -1;
        translateX.value = withTiming(direction * SCREEN_WIDTH * 1.5, { duration: 300 });
        
        runOnJS(setCurrentIndex)(currentIndex + 1);
        translateX.value = withTiming(0, { duration: 0 });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const topCardStyle = useAnimatedStyle(() => {
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
      zIndex: 10,
    };
  });

  const visibleUsers = MOCK_USERS.slice(currentIndex, currentIndex + 2);
  
  if (currentIndex >= MOCK_USERS.length) {
    return (
        <View style={tw`flex-1 items-center justify-center`}>
            <Text style={[tw`text-lg text-textSub`, { fontFamily: 'Urbanist_600SemiBold' }]}>No more matches!</Text>
        </View>
    );
  }

  const handleLike = () => {
    translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 });
    setTimeout(() => {
        if (onMatch && visibleUsers[0]) {
            onMatch(visibleUsers[0]);
        }
        setCurrentIndex(prev => prev + 1);
        translateX.value = 0;
    }, 300);
  };

  const handleDislike = () => {
    translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 });
    setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        translateX.value = 0;
    }, 300);
  };

  return (
    <View style={tw`w-full h-[480px]`}>
      <View style={tw`flex-1 overflow-visible`}>
          {visibleUsers[1] && (
            <View style={[tw`absolute inset-0 scale-[0.93] translate-y-4 opacity-50`]}>
                <Card user={visibleUsers[1]} SCREEN_WIDTH={SCREEN_WIDTH} />
            </View>
          )}

          {visibleUsers[0] && (
            <GestureDetector gesture={gesture}>
              <Animated.View style={[tw`absolute inset-0`, topCardStyle]}>
                <Card 
                    user={visibleUsers[0]} 
                    SCREEN_WIDTH={SCREEN_WIDTH}
                    onPress={() => onSelectUser?.(visibleUsers[0])}
                    actionButtons={
                        <ActionButtons 
                            onLike={handleLike} 
                            onDislike={handleDislike}
                        />
                    } 
                />
              </Animated.View>
            </GestureDetector>
          )}
      </View>
    </View>
  );
};
