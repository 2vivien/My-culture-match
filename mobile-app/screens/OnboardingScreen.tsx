import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  StyleSheet 
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft
} from 'react-native-reanimated';
import { ChevronLeft, BatteryFull, Wifi, SignalHigh, Sparkles, Heart, Flame } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { MeshBackground } from '../components/Onboarding/MeshBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FloatingAvatar = ({ source, size, style, duration = 4000 }: any) => {
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
      tw`absolute rounded-full p-1 bg-white/50 shadow-lg`,
      { width: size, height: size },
      style,
      animatedStyle
    ]}>
      <Image source={{ uri: source }} style={tw`w-full h-full rounded-full`} />
    </Animated.View>
  );
};

const Step1 = () => (
  <View style={tw`flex-1`}>
    <MeshBackground variant={1} />
    <View style={tw`relative h-[380px] w-full items-center justify-center`}>
      <FloatingAvatar 
        source="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200" 
        size={110} 
        style={{ top: '10%', left: '8%' }}
        duration={4000}
      />
      <FloatingAvatar 
        source="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300" 
        size={130} 
        style={{ top: '15%', right: '5%' }}
        duration={6000}
      />
      <FloatingAvatar 
        source="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250" 
        size={110} 
        style={{ bottom: '10%', left: '10%' }}
        duration={3000}
      />
      <FloatingAvatar 
        source="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200" 
        size={85} 
        style={{ bottom: '20%', right: '18%' }}
        duration={4000}
      />
      
      {/* Decorative Sparkle */}
      <Animated.View style={[tw`absolute top-[45%] left-[40%] opacity-80`]}>
        <Sparkles size={40} color="#FDBA74" />
      </Animated.View>
    </View>

    <View style={tw`px-8 text-center flex-1 justify-end pb-12`}>
      <Text style={[tw`text-[32px] font-bold text-app-black leading-tight text-center mb-4`, { fontFamily: 'Urbanist_700Bold' }]}>
        Dating, With Deeper Clarity.
      </Text>
      <Text style={[tw`text-[15px] text-gray-500 leading-relaxed text-center mb-8`, { fontFamily: 'Urbanist_500Medium' }]}>
        Go beyond swipes. Explore how mental, emotional, and physical compatibility create real connections. ❤️
      </Text>
    </View>
  </View>
);

const Step2 = () => (
  <View style={tw`flex-1`}>
    <MeshBackground variant={2} />
    <View style={tw`relative h-[420px] w-full items-center justify-center`}>
      {/* Stacked Cards */}
      <View style={[tw`absolute w-[220px] h-[280px] bg-white rounded-[24px] shadow-lg opacity-80 border-4 border-white`, { transform: [{ rotate: '-6deg' }, { translateX: -48 }, { translateY: 16 }] }]}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1515378960530-7c0da622941F?w=400' }} 
          style={tw`w-full h-full rounded-[20px]`} 
        />
      </View>
      <View style={[tw`absolute w-[220px] h-[280px] bg-black rounded-[24px] shadow-lg border-4 border-white`, { transform: [{ rotate: '6deg' }, { translateX: 48 }, { translateY: 8 }] }]}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400' }} 
          style={[tw`w-full h-full rounded-[20px]`, { opacity: 0.8 }]} 
        />
      </View>
      <View style={[tw`absolute w-[240px] h-[320px] bg-white rounded-[28px] shadow-2xl border-[5px] border-white overflow-hidden`]}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500' }} 
          style={tw`w-full h-full`} 
        />
        <View style={[tw`absolute inset-0`, { backgroundColor: 'rgba(124, 45, 18, 0.4)' }]} />
        <View style={tw`absolute bottom-0 left-0 w-full p-5`}>
          <View style={tw`bg-indigo-500/80 px-3 py-1.5 rounded-full self-start flex-row items-center gap-1.5 mb-1`}>
            <Sparkles size={12} color="white" />
            <Text style={tw`text-white text-[11px] font-bold`}>Similar to 89%</Text>
          </View>
          <Text style={[tw`text-white text-2xl font-bold`, { fontFamily: 'Urbanist_700Bold' }]}>Milan, 26</Text>
          <Text style={[tw`text-white/90 text-sm font-medium`, { fontFamily: 'Urbanist_500Medium' }]}>Graphic Designer</Text>
        </View>
      </View>

      {/* Floating Reactions */}
      <FloatingAvatar 
        source="https://twemoji.maxcdn.com/v/latest/72x72/2728.png" 
        size={40} 
        style={{ top: '15%', left: '12%', backgroundColor: 'rgba(255,255,255,0.4)', padding: 10 }}
        duration={3000}
      />
      <FloatingAvatar 
        source="https://twemoji.maxcdn.com/v/latest/72x72/1f970.png" 
        size={48} 
        style={{ top: '20%', right: '12%', backgroundColor: 'rgba(255,255,255,0.4)', padding: 10 }}
        duration={4000}
      />
    </View>

    <View style={tw`px-8 text-center flex-1 justify-end pb-12`}>
      <Text style={[tw`text-[30px] font-bold text-app-black leading-tight text-center mb-3`, { fontFamily: 'Urbanist_700Bold' }]}>
        Compatibility, Explained Simply.
      </Text>
      <Text style={[tw`text-[14px] text-gray-500 leading-relaxed text-center mb-8 px-1`, { fontFamily: 'Urbanist_500Medium' }]}>
        We translate ancient compatibility wisdom into clear, modern insights—so you understand why a connection works, not just if it does. 🚀
      </Text>
    </View>
  </View>
);

const Step3 = () => (
  <View style={tw`flex-1`}>
    <MeshBackground variant={1} />
    <View style={tw`relative h-[400px] w-full items-center justify-center`}>
      {/* Design for Step 3: Cultural Connection */}
      <View style={[tw`absolute w-[280px] h-[340px] bg-white/40 rounded-[40px] border border-white/60 shadow-xl overflow-hidden`, { backdropFilter: 'blur(20px)' }]}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600' }} 
          style={tw`w-full h-full`} 
        />
        <View style={[tw`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent`]} />
        <View style={tw`absolute inset-0 items-center justify-center`}>
            <View style={tw`bg-white/90 p-4 rounded-3xl shadow-lg items-center`}>
                <Flame size={32} color="#ff386c" fill="#ff386c" />
                <Text style={tw`text-app-black font-bold mt-2`}>Local Event Match</Text>
                <Text style={tw`text-gray-500 text-xs`}>Jazz Night • Tonight</Text>
            </View>
        </View>
      </View>

      <FloatingAvatar 
        source="https://twemoji.maxcdn.com/v/latest/72x72/1f3b8.png" 
        size={50} 
        style={{ top: '10%', right: '10%', backgroundColor: 'white' }}
        duration={5000}
      />
      <FloatingAvatar 
        source="https://twemoji.maxcdn.com/v/latest/72x72/2615.png" 
        size={50} 
        style={{ bottom: '15%', left: '10%', backgroundColor: 'white' }}
        duration={4500}
      />
    </View>

    <View style={tw`px-8 text-center flex-1 justify-end pb-12`}>
      <Text style={[tw`text-[30px] font-bold text-app-black leading-tight text-center mb-3`, { fontFamily: 'Urbanist_700Bold' }]}>
        Culture, Beyond the Screen.
      </Text>
      <Text style={[tw`text-[14px] text-gray-500 leading-relaxed text-center mb-8 px-1`, { fontFamily: 'Urbanist_500Medium' }]}>
        Connect through shared passions and local cultural events that bring you closer. Discover the city together. 🏛️
      </Text>
    </View>
  </View>
);

export const OnboardingScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [step, setStep] = useState(1);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onFinish();
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      <SafeAreaView style={tw`flex-1`}>
        {/* Top Header */}
        <View style={tw`flex-row justify-between items-center px-6 pt-2 z-50`}>
          {step > 1 ? (
            <TouchableOpacity 
              onPress={() => setStep(step - 1)}
              style={tw`w-10 h-10 items-center justify-center rounded-full bg-white/40 shadow-sm`}
            >
              <ChevronLeft size={24} color="#1A1A1A" />
            </TouchableOpacity>
          ) : <View style={tw`w-10`} />}

          <TouchableOpacity 
            onPress={onFinish}
            style={tw`bg-white/40 px-4 py-1.5 rounded-full shadow-sm`}
          >
            <Text style={[tw`text-xs font-bold text-gray-800`, { letterSpacing: 1 }]}>SKIP</Text>
          </TouchableOpacity>
        </View>

        <View style={tw`flex-1`}>
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
        </View>

        {/* Footer */}
        <View style={tw`px-6 pb-10 items-center`}>
          {/* Pagination dots */}
          <View style={tw`flex-row gap-2 mb-8`}>
            {[1, 2, 3].map(i => (
              <View 
                key={i} 
                style={[
                  tw`w-2 h-2 rounded-full`, 
                  { backgroundColor: step === i ? '#1A1A1A' : '#E5E7EB' }
                ]} 
              />
            ))}
          </View>

          <TouchableOpacity 
            onPress={handleNext}
            style={tw`w-full bg-app-black rounded-full py-5 items-center shadow-lg active:scale-95`}
          >
            <Text style={[tw`text-white text-[17px] font-bold`, { fontFamily: 'Urbanist_700Bold' }]}>
              {step === 3 ? 'Get Started' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};
