import React, { useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  Image, 
  StyleSheet,
  StatusBar
} from 'react-native';
import Animated, { 
  useAnimatedProps,
  withTiming, 
  Easing,
} from 'react-native-reanimated';
import { ChevronRight, ChevronLeft } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '@/lib/tailwind';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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

const ONBOARDING_STEPS = [
  {
    title: "Welcome to Culture Match",
    description: "Connect with like-minded individuals who share your heritage, values, and traditions."
  },
  {
    title: "Celebrate Your Heritage",
    description: "Your culture is unique. Share your background, languages, and roots with pride."
  },
  {
    title: "Deep Compatibility",
    description: "Go beyond simple profile pictures. Discover matches based on deep cultural alignment."
  },
  {
    title: "Real Connections",
    description: "Find friends or romantic partners who truly understand your cultural perspective."
  },
  {
    title: "Rich Conversations",
    description: "Break the ice with cultural topics and spark interesting debates about your favorite traditions."
  },
  {
    title: "A Safe Community",
    description: "We verify profiles to ensure a safe, respectful, and authentic community for everyone."
  },
  {
    title: "Tailored to You",
    description: "Set your preferences and filter matches by country of origin, values, and languages spoken."
  },
  {
    title: "Start Your Journey",
    description: "Your perfect culture match is waiting. Step inside to meet someone extraordinary today."
  }
];

// Squircle Progress Button matching the new mockup
const ProgressButton = ({ onPress, progress }: { onPress: () => void, progress: number }) => {
  const size = 90;
  const strokeWidth = 3;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: withTiming(circumference * (1 - progress), {
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
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="rgba(240, 195, 142, 0.2)" // #F0C38E color with opacity
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke="#F0C38E" // Gold color
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeLinecap="round"
            fill="none"
            animatedProps={animatedProps}
          />
        </Svg>
        
        {/* Central Dark Purple Squircle Button */}
        <View style={[
          tw`w-[62px] h-[62px] rounded-[24px] items-center justify-center shadow-lg`,
          { backgroundColor: '#312C51', elevation: 5 }
        ]}>
          <ChevronRight size={28} color="#F0C38E" strokeWidth={3} />
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

      {/* Premium dark gradient overlay for text legibility at the bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(49, 44, 81, 0.5)', 'rgba(49, 44, 81, 0.95)', '#312C51']}
        locations={[0, 0.35, 0.65, 0.95]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={tw`flex-1`}>
        {/* Header navigation bar */}
        <View style={tw`flex-row justify-between items-center px-6 pt-2 z-50`}>
          {step > 1 ? (
            <TouchableOpacity 
              onPress={() => setStep(step - 1)} 
              style={[tw`w-11 h-11 items-center justify-center rounded-xl border`, { backgroundColor: 'rgba(49, 44, 81, 0.5)', borderColor: 'rgba(240, 195, 142, 0.2)' }]}
            >
              <ChevronLeft size={24} color="#F0C38E" />
            </TouchableOpacity>
          ) : <View style={tw`w-11`} />}
          
          <TouchableOpacity 
            onPress={onFinish} 
            style={[tw`px-5 py-2 rounded-xl border shadow-sm`, { backgroundColor: 'rgba(49, 44, 81, 0.5)', borderColor: 'rgba(240, 195, 142, 0.2)' }]}
          >
            <Text style={[tw`text-[13px] font-extrabold uppercase`, { color: '#F0C38E', letterSpacing: 0.8 }]}>SKIP</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic spacer to push text to the bottom gradient area */}
        <View style={tw`flex-1`} />

        {/* Text descriptions */}
        <View style={tw`px-10 text-center pb-6`}>
          <Text style={[tw`text-[32px] font-extrabold leading-tight text-center mb-4`, { color: '#F0C38E', fontFamily: 'Urbanist_800ExtraBold' }]}>
            {ONBOARDING_STEPS[step - 1].title}
          </Text>
          <Text style={[tw`text-[16px] leading-relaxed text-center px-4`, { color: '#E5E7EB', fontFamily: 'Urbanist_500Medium' }]}>
            {ONBOARDING_STEPS[step - 1].description}
          </Text>
        </View>

        {/* Continue Button and Progress */}
        <View style={tw`px-8 pb-10 items-center pt-4 bg-transparent`}>
          <ProgressButton 
            onPress={handleNext} 
            progress={step / totalSteps} 
          />
        </View>
      </SafeAreaView>
      <View style={tw`h-4`} />
    </View>
  );
};

