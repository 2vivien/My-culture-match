import React, { useState } from 'react';
import { 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  Image, 
  StyleSheet,
  StatusBar,
  Platform
} from 'react-native';
import Animated, { 
  useAnimatedProps,
  withTiming, 
  Easing,
} from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import Svg, { Rect } from 'react-native-svg';
import tw from '@/lib/tailwind';
const AnimatedRect = Animated.createAnimatedComponent(Rect);
// removed LinearGradient overlay per request

const onboardingImages = [
  require('../assets/screensplash/screensplash1.png'),
  require('../assets/screensplash/screensplash2.png'),
  require('../assets/screensplash/screensplash3.png'),
  require('../assets/screensplash/screensplash4.png'),
  require('../assets/screensplash/screensplash5.png'),
  require('../assets/screensplash/screensplash6.png'),
  require('../assets/screensplash/screensplash7.png'),
  require('../assets/screensplash/screensplash8.png'),
];

// Squircle Progress Button matching the new mockup
const ProgressButton = ({ onPress, progress }: { onPress: () => void, progress: number }) => {
  const outerSize = 62;
  const strokeWidth = 3;
  const radius = 16;
  const rectSide = outerSize - strokeWidth;
  const perimeter = 4 * (rectSide - 2 * radius) + 2 * Math.PI * radius;

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: withTiming(perimeter * (1 - progress), {
        duration: 500,
        easing: Easing.bezier(0.4, 0, 0.2, 1)
      })
    };
  });

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.8}
      style={tw`items-center justify-center`}
    >
      <View style={{ width: outerSize, height: outerSize, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={outerSize} height={outerSize} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
          <Rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={rectSide}
            height={rectSide}
            rx={radius}
            ry={radius}
            stroke="rgba(240, 195, 142, 0.2)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedRect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={rectSide}
            height={rectSide}
            rx={radius}
            ry={radius}
            stroke="#F0C38E"
            strokeWidth={strokeWidth}
            strokeDasharray={perimeter}
            strokeLinecap="round"
            fill="none"
            animatedProps={animatedProps}
          />
        </Svg>
        
        {/* Central Dark Purple Squircle Button */}
        <View style={[
          { 
            width: 50, 
            height: 50, 
            borderRadius: 14, 
            alignItems: 'center', 
            justifyContent: 'center',
            ...Platform.select({
              web: {
                boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.18)',
              },
              default: {
                shadowColor: '#000',
                shadowOpacity: 0.18,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
              },
            }),
          },
          { backgroundColor: '#312C51', elevation: 4 }
        ]}>
          <ChevronRight size={22} color="#F0C38E" strokeWidth={3} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const OnboardingScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 8;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else onFinish();
  };

  return (
    <View style={tw`flex-1 bg-black`}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Background Image spanning the entire screen */}
      <Image 
        source={onboardingImages[step - 1]} 
        style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }]} 
        resizeMode="cover" 
      />

      {/* gradient overlay removed per user request */}

      <SafeAreaView style={tw`flex-1`}>
        <View style={{ flex: 1 }} />

        {/* Absolute positioned continue/progress button bottom-right */}
        <View style={{ position: 'absolute', bottom: 5, right: 15, alignItems: 'flex-end', zIndex: 60 }}>
          <ProgressButton onPress={handleNext} progress={step / totalSteps} />
        </View>
      </SafeAreaView>
      <View style={tw`h-4`} />
    </View>
  );
};

