import React, { useState, useRef } from 'react';
import { COLORS } from '@/lib/theme';
import { View, Text, TouchableOpacity, useWindowDimensions, StatusBar, Image, FlatList } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
  runOnJS
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Svg, { Path, Circle, Line, Polygon } from 'react-native-svg';
import tw from '@/lib/tailwind';
import { LinearGradient } from 'expo-linear-gradient';

const MOCK_DATA = [
  {
    id: '1',
    name: 'Julia Siti',
    age: 24,
    location: 'Bali, Indonesia',
    origin: 'Marocaine-Colombienne',
    ethnicity: 'Arabe-Latina',
    languages: ['Français', 'Arabe', 'Espagnol'],
    livesIn: 'Bali',
    bio: 'Passionate about culture, travel and meeting new people. Looking for someone special to share life with. Let\'s connect and see where it goes!',
    mode: 'love',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
    ],
    tags: ['Cat', 'Football', 'Fashion', 'Chinese', 'Modeling'],
    avatar: 'https://i.pravatar.cc/150?u=1'
  },
  {
    id: '2',
    name: 'Sarah Parker',
    age: 26,
    location: 'Los Angeles, USA',
    origin: 'Sénégalaise-Française',
    ethnicity: 'Wolof-Parisienne',
    languages: ['Français', 'Wolof', 'Anglais'],
    livesIn: 'LA',
    bio: 'I love exploring new cities, trying exotic food, and meeting people from different backgrounds. Let\'s explore together!',
    mode: 'friendship',
    images: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    ],
    tags: ['Travel', 'Coffee', 'Music'],
    avatar: 'https://i.pravatar.cc/150?u=2'
  },
  {
    id: '3',
    name: 'Moussa',
    age: 28,
    location: 'Paris, France',
    origin: 'Sénégalais',
    ethnicity: 'Peul',
    languages: ['Wolof', 'Français'],
    livesIn: 'Paris',
    bio: 'Envie d\'un café et de discuter de nos racines.',
    mode: 'love',
    images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800'],
    tags: ['Roots', 'Coffee', 'Music'],
    avatar: 'https://i.pravatar.cc/150?u=3'
  }
];

const VerificationStar = ({ color = COLORS.primary, size = 14 }: { color?: string, size?: number }) => (
  <View style={[tw`rounded-full items-center justify-center bg-white shadow-sm`, { width: size * 1.5, height: size * 1.5 }]}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </Svg>
  </View>
);

const LoveSwipe = ({ onMatch }: { onMatch: () => void }) => {
  const translateY = useSharedValue(0);
  const contextY = useSharedValue(0);
  const matched = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onStart(() => {
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateY.value = Math.max(-80, Math.min(0, contextY.value + event.translationY));
      if (translateY.value <= -70) {
        matched.value = withSpring(1);
      } else {
        matched.value = withSpring(0);
      }
    })
    .onEnd(() => {
      if (translateY.value <= -70) {
        runOnJS(onMatch)();
      }
      translateY.value = withSpring(0);
      matched.value = withSpring(0);
    });

  const animatedHeartStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      backgroundColor: interpolateColor(
        matched.value,
        [0, 1],
        ['#000000', COLORS.primary]
      ),
    };
  });

  return (
    <View style={tw`absolute right-6 bottom-44 items-center`}>
      <View style={tw`h-[120px] w-14 bg-white/20 rounded-full items-center justify-between py-2 border border-white/10`}>
        <View style={tw`w-10 h-10 bg-white rounded-full items-center justify-center`}>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill={COLORS.primary}>
            <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </Svg>
        </View>

        <GestureDetector gesture={gesture}>
          <Animated.View style={[tw`w-10 h-10 rounded-full items-center justify-center shadow-lg`, animatedHeartStyle]}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </Svg>
          </Animated.View>
        </GestureDetector>
      </View>
      <Text style={tw`text-white text-[10px] font-bold mt-2 uppercase tracking-tighter`}>Swipe to match</Text>
    </View>
  );
};

const FeedItem = ({ item, onSelect, width, height }: { item: any, onSelect: (user: any) => void, width: number, height: number }) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const handleNextImage = () => {
    if (currentImgIndex < item.images.length - 1) {
      setCurrentImgIndex(currentImgIndex + 1);
    } else {
      setCurrentImgIndex(0);
    }
  };

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleNextImage}
        onLongPress={() => onSelect(item)}
        style={{ width, height }}
      >
        <Image 
          source={{ uri: item.images[currentImgIndex] }} 
          style={{ width, height }} 
          resizeMode="cover" 
        />
        {/* Indicators (triars) removed as requested */}
      </TouchableOpacity>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.85)']}
        style={[tw`absolute inset-x-0 bottom-0`, { height: height * 0.6 }]}
      />

      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => onSelect(item)}
        style={tw`absolute bottom-32 left-6 right-20`}
      >
        <View style={tw`flex-row items-center gap-1.5 mb-2`}>
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <Line x1="4" y1="22" x2="4" y2="15" />
          </Svg>
          <Text style={[tw`text-[16px] font-bold text-primary uppercase tracking-wider`, { fontFamily: 'Urbanist_800ExtraBold' }]}>{item.origin}</Text>
        </View>

        <View style={tw`flex-row items-center gap-2.5 mb-1`}>
          <Text style={[tw`text-[36px] font-bold text-white`, { fontFamily: 'Urbanist_700Bold' }]}>{item.name}, {item.age}</Text>
          <VerificationStar size={18} />
        </View>

        <View style={tw`flex-row items-center gap-1.5 mb-4`}>
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <Circle cx="12" cy="10" r="3" />
          </Svg>
          <Text style={[tw`text-[16px] font-semibold text-white/80`, { fontFamily: 'Urbanist_600SemiBold' }]}>{item.location}</Text>
        </View>

        <Text
          numberOfLines={1}
          style={[tw`text-[14px] text-white/70 leading-5`, { fontFamily: 'Urbanist_500Medium' }]}
        >
          {item.bio.split('.')[0]}. <Text style={tw`text-white font-bold`}>Voir plus</Text>
        </Text>
      </TouchableOpacity>

      <LoveSwipe onMatch={() => console.log('Matched!')} />
    </View>
  );
};

export const HomeScreen = ({ onSelectUser, onShowNotifications, onBack }: { onSelectUser: (user: any) => void, onShowNotifications: () => void, onBack: () => void }) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const SCREEN_WIDTH = Math.min(windowWidth, 500);
  const SCREEN_HEIGHT = windowHeight;
  const flatListRef = useRef<FlatList>(null);

  const handleAvatarPress = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  return (
    <View style={[tw`flex-1 bg-black`, { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, alignSelf: 'center', overflow: 'hidden' }]}>
      <StatusBar barStyle="light-content" />

      {/* Top Header Bar - Avatars used for dynamic navigation */}
      <View style={tw`absolute top-12 left-0 right-0 z-50 flex-row justify-between items-center px-6`}>
        <TouchableOpacity
          onPress={onBack}
          style={tw`w-10 h-10 bg-black/20 rounded-full items-center justify-center border border-white/10`}
        >
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 18l-6-6 6-6" />
          </Svg>
        </TouchableOpacity>

        <View style={tw`flex-row items-center bg-black/20 rounded-full px-2 py-1 gap-2 border border-white/10`}>
          {MOCK_DATA.map((user, idx) => (
            <TouchableOpacity 
              key={user.id}
              onPress={() => handleAvatarPress(idx)}
            >
              <Image
                source={{ uri: user.avatar }}
                style={tw`w-9 h-9 rounded-full border-2 ${idx === 0 ? 'border-primary' : 'border-white/50'}`}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={onShowNotifications}
          style={tw`w-10 h-10 bg-black/20 rounded-full items-center justify-center border border-white/10`}
        >
          <View style={tw`relative`}>
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
            </Svg>
            <View style={tw`absolute top-0 right-0 w-2.5 h-2.5 bg-primary rounded-full border border-black`} />
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={MOCK_DATA}
        renderItem={({ item }) => (
          <FeedItem 
            item={item} 
            onSelect={onSelectUser} 
            width={SCREEN_WIDTH} 
            height={SCREEN_HEIGHT} 
          />
        )}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
      />
    </View>
  );
};
