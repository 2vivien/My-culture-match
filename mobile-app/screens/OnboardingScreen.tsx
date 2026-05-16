import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  StyleSheet,
  StatusBar
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedProps,
  withRepeat, 
  withTiming, 
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ChevronRight, ChevronLeft } from 'lucide-react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import tw from '@/lib/tailwind';
import { MeshBackground } from '../components/Onboarding/MeshBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const FloatingAvatar = ({ source, size, style, duration = 4000, children }: any) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[
      tw`absolute rounded-full p-1.5 bg-white/40 shadow-lg`,
      { width: size, height: size },
      style,
      animatedStyle,
      { backdropFilter: 'blur(10px)' } as any
    ]}>
      <Image source={{ uri: source }} style={tw`w-full h-full rounded-full`} />
      {children}
    </Animated.View>
  );
};

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
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke="#ff386c" // Pink color
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeLinecap="round"
            fill="none"
            animatedProps={animatedProps}
          />
        </Svg>
        
        {/* Central Black Squircle Button */}
        <View style={[
          tw`bg-[#111] w-[62px] h-[62px] rounded-[24px] items-center justify-center shadow-lg`,
          { elevation: 5 }
        ]}>
          <ChevronRight size={28} color="#ff386c" strokeWidth={3} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const StepContent = ({ step }: { step: number }) => {
  if (step === 1) {
    return (
      <View style={tw`flex-1 justify-between`}>
        <View style={tw`relative h-[44%] w-full flex-row items-center justify-center mt-4`}>
          <FloatingAvatar source="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400" size={115} style={{ top: '10%', left: '8%' }} duration={4000}>
            <View style={tw`absolute -bottom-2 -left-4 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm`}>
               <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="2.5">
                  <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
               </Svg>
            </View>
          </FloatingAvatar>
          <FloatingAvatar source="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400" size={135} style={{ top: '15%', right: '8%' }} duration={6000}>
             <View style={tw`absolute -top-5 -right-3 w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm`}>
               <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="2.5">
                  <Path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707" />
               </Svg>
            </View>
          </FloatingAvatar>
          <FloatingAvatar source="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400" size={145} style={{ top: '50%', left: '10%' }} duration={3500}>
             <View style={tw`absolute -bottom-2 -right-5 w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm`}>
               <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="2.5">
                  <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
               </Svg>
            </View>
          </FloatingAvatar>
          <FloatingAvatar source="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400" size={95} style={{ top: '60%', right: '15%' }} duration={5000}>
            <View style={tw`absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full items-center justify-center shadow-sm`}>
               <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="2.5">
                  <Circle cx="12" cy="12" r="10" />
               </Svg>
            </View>
          </FloatingAvatar>
        </View>
        <View style={tw`px-10 text-center pb-0`}>
          <Text style={[tw`text-[34px] font-extrabold text-[#111] leading-tight text-center mb-4`, { fontFamily: 'Urbanist_800ExtraBold' }]}>
            Dating, With Deeper Clarity.
          </Text>
          <Text style={[tw`text-[16px] text-gray-500 leading-relaxed text-center px-4`, { fontFamily: 'Urbanist_500Medium' }]}>
            Go beyond swipes. Explore how mental, emotional, and physical compatibility create real connections.
          </Text>
        </View>
      </View>
    );
  }
  
  if (step === 2) {
    return (
      <View style={tw`flex-1 justify-between`}>
        <View style={tw`relative h-[44%] w-full flex-row items-center justify-center mt-4`}>
          <View style={tw`items-center justify-center`}>
            <View style={tw`bg-white/40 p-10 rounded-[40px] border border-white/20 shadow-xl`}>
               <ChevronRight size={60} color="#111" />
            </View>
            <Text style={[tw`mt-8 text-2xl font-bold text-[#111]`, { fontFamily: 'Urbanist_700Bold' }]}>Ready to match?</Text>
          </View>
        </View>
        <View style={tw`px-10 text-center pb-0`}>
          <Text style={[tw`text-[32px] font-extrabold text-[#111] leading-tight text-center mb-4`, { fontFamily: 'Urbanist_800ExtraBold' }]}>
            Your Journey Starts Here.
          </Text>
          <Text style={[tw`text-[16px] text-gray-500 leading-relaxed text-center px-6`, { fontFamily: 'Urbanist_500Medium' }]}>
            Join thousands of people finding meaningful connections through our unique compatibility matching.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 justify-between`}>
      <View style={tw`relative h-[44%] w-full items-center justify-center mt-4`}>
        <View style={[tw`absolute w-[180px] h-[240px] bg-white rounded-[24px] shadow-lg border-[4px] border-white`, { transform: [{ rotate: '-8deg' }, { translateX: -50 }, { translateY: 20 }], opacity: 0.7 }]}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1515378960530-7c0da622941F?w=400' }} style={tw`w-full h-full rounded-[20px]`} />
        </View>
        <View style={[tw`absolute w-[180px] h-[240px] bg-black rounded-[24px] shadow-lg border-[4px] border-white`, { transform: [{ rotate: '8deg' }, { translateX: 50 }, { translateY: 10 }] }]}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400' }} style={[tw`w-full h-full rounded-[20px]`, { opacity: 0.8 }]} />
        </View>
        <View style={[tw`absolute w-[215px] h-[285px] bg-white rounded-[28px] shadow-2xl border-[5px] border-white overflow-hidden`]}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500' }} style={tw`w-full h-full`} />
          <View style={[tw`absolute inset-0`, { backgroundColor: 'rgba(234, 88, 12, 0.4)' }]} />
          <View style={tw`absolute bottom-0 left-0 w-full p-5`}>
             <View style={tw`bg-indigo-500/80 px-3 py-1.5 rounded-full self-start flex-row items-center gap-1.5 mb-2 border border-white/20 shadow-sm`}>
                <Svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                   <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </Svg>
                <Text style={tw`text-white text-[11px] font-extrabold`}>Similar to 89%</Text>
             </View>
             <Text style={[tw`text-white text-[22px] font-extrabold`, { fontFamily: 'Urbanist_800ExtraBold' }]}>Milan, 26</Text>
             <Text style={[tw`text-white/90 text-sm font-bold`, { fontFamily: 'Urbanist_700Bold' }]}>Graphic Designer</Text>
          </View>
        </View>
      </View>
      <View style={tw`px-10 text-center pb-0`}>
        <Text style={[tw`text-[30px] font-extrabold text-[#111] leading-tight text-center mb-4`, { fontFamily: 'Urbanist_800ExtraBold' }]}>
          Compatibility, Explained Simply.
        </Text>
        <Text style={[tw`text-[15px] text-gray-500 leading-relaxed text-center px-4`, { fontFamily: 'Urbanist_500Medium' }]}>
          We translate ancient compatibility wisdom into clear, modern insights—so you understand why a connection works.
        </Text>
      </View>
    </View>
  );
};

export const OnboardingScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else onFinish();
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <MeshBackground variant={step === 1 ? 1 : 2} />
      <SafeAreaView style={tw`flex-1`}>
        <View style={tw`flex-row justify-between items-center px-6 pt-2 z-50`}>
          {step > 1 ? (
            <TouchableOpacity onPress={() => setStep(step - 1)} style={tw`w-11 h-11 items-center justify-center rounded-xl bg-white/20 border border-white/20`}>
              <ChevronLeft size={24} color="#111" />
            </TouchableOpacity>
          ) : <View style={tw`w-11`} />}
          <TouchableOpacity onPress={onFinish} style={tw`bg-white/10 px-5 py-2 rounded-xl border border-white/10 shadow-sm`}>
            <Text style={[tw`text-[13px] font-extrabold text-[#111] uppercase`, { letterSpacing: 0.8 }]}>SKIP</Text>
          </TouchableOpacity>
        </View>

        <View style={tw`flex-1`}>
          <StepContent step={step} />
        </View>

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
