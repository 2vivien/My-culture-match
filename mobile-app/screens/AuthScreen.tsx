import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ImageBackground, 
  SafeAreaView, 
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions
} from 'react-native';
import { Mail, Lock, Eye, EyeOff, Key } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { COLORS } from '@/lib/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const AuthScreen = ({ onAuthSuccess }: { onAuthSuccess: (mode: 'login' | 'register') => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={[tw`flex-1`, { height: SCREEN_HEIGHT, overflow: 'hidden' }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground 
        source={require('../assets/login-background.png')} 
        style={tw`flex-1`}
        resizeMode="cover"
      >
        <SafeAreaView style={tw`flex-1`}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={tw`flex-1 items-center justify-center px-6`}
          >
            {/* Extremely compact floating card to ELIMINATE SCROLL */}
            <View style={[
              tw`bg-white/95 rounded-[32px] px-6 py-6 w-full`, 
              Platform.select({
                web: {
                  boxShadow: '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
                },
                default: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 25 },
                  shadowOpacity: 0.15,
                  shadowRadius: 50,
                  elevation: 24,
                },
              }),
              { 
                maxWidth: 400,
                alignSelf: 'center'
              } as any
            ]}>
              <View style={tw`items-center mb-4`}>
                <Text style={[tw`text-[28px] font-extrabold text-[#111] mb-1`, { fontFamily: 'Urbanist_800ExtraBold' }]}>
                  {isLogin ? 'Log in' : 'Sign up'}
                </Text>
                <Text style={[tw`text-[13px] font-medium text-gray-400`, { fontFamily: 'Urbanist_500Medium' }]}>
                  Culture Match. Real Connections.
                </Text>
              </View>

              <View style={tw`gap-3`}>
                {/* Email */}
                <View>
                  <Text style={[tw`text-[11px] font-bold text-gray-400 uppercase mb-1 ml-1`, { fontFamily: 'Urbanist_700Bold' }]}>Email</Text>
                  <View style={tw`flex-row items-center bg-gray-50 border border-gray-100 rounded-xl px-4 h-12`}>
                    <Mail size={16} color={COLORS.primary} style={tw`mr-3`} />
                    <TextInput 
                      placeholder="example@gmail.com"
                      placeholderTextColor="#9CA3AF"
                      style={[tw`flex-1 text-[#111] font-semibold text-[14px]`, { fontFamily: 'Urbanist_600SemiBold' }]}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                </View>

                {/* Password */}
                <View>
                  <Text style={[tw`text-[11px] font-bold text-gray-400 uppercase mb-1 ml-1`, { fontFamily: 'Urbanist_700Bold' }]}>Password</Text>
                  <View style={tw`flex-row items-center bg-gray-50 border border-gray-100 rounded-xl px-4 h-12`}>
                    <Lock size={16} color={COLORS.primary} style={tw`mr-3`} />
                    <TextInput 
                      placeholder="••••••••••••"
                      placeholderTextColor="#9CA3AF"
                      style={[tw`flex-1 text-[#111] font-semibold text-[14px]`, { fontFamily: 'Urbanist_600SemiBold' }]}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} color="#9CA3AF" /> : <Eye size={16} color="#9CA3AF" />}
                    </TouchableOpacity>
                  </View>
                </View>

                {!isLogin && (
                  <View>
                    <Text style={[tw`text-[11px] font-bold text-gray-400 uppercase mb-1 ml-1`, { fontFamily: 'Urbanist_700Bold' }]}>Confirm password</Text>
                    <View style={tw`flex-row items-center bg-gray-50 border border-gray-100 rounded-xl px-4 h-12`}>
                      <Key size={16} color={COLORS.primary} style={tw`mr-3`} />
                      <TextInput 
                        placeholder="••••••••••••"
                        placeholderTextColor="#9CA3AF"
                        style={[tw`flex-1 text-[#111] font-semibold text-[14px]`, { fontFamily: 'Urbanist_600SemiBold' }]}
                        secureTextEntry={!showPassword}
                      />
                    </View>
                  </View>
                )}

                {isLogin && (
                  <View style={tw`flex-row justify-between items-center px-1`}>
                    <TouchableOpacity style={tw`flex-row items-center`}>
                      <View style={tw`w-3.5 h-3.5 rounded border border-gray-300 mr-2`} />
                      <Text style={[tw`text-[11px] text-[#111] font-semibold`, { fontFamily: 'Urbanist_600SemiBold' }]}>Remember me</Text>
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <Text style={[tw`text-[11px] text-primary font-bold`, { fontFamily: 'Urbanist_700Bold' }]}>Forget password?</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity 
                  onPress={() => onAuthSuccess(isLogin ? 'login' : 'register')}
                  activeOpacity={0.8}
                  style={[tw`bg-primary h-12 rounded-xl items-center justify-center shadow-lg mt-1`, { elevation: 3 }]}
                >
                  <Text style={[tw`text-white text-[15px] font-extrabold uppercase tracking-wide`, { fontFamily: 'Urbanist_800ExtraBold' }]}>
                    {isLogin ? 'Log in' : 'Sign up'}
                  </Text>
                </TouchableOpacity>

                <View style={tw`items-center my-0.5`}>
                  <Text style={[tw`text-gray-300 text-[10px] font-bold`, { fontFamily: 'Urbanist_700Bold' }]}>— OR —</Text>
                </View>

                <TouchableOpacity 
                  activeOpacity={0.7}
                  style={tw`flex-row items-center justify-center h-12 rounded-xl border border-gray-200 bg-white`}
                >
                  <Image 
                    source={{ uri: 'https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png' }} 
                    style={tw`w-4.5 h-4.5 mr-3`} 
                  />
                  <Text style={[tw`text-[#111] text-[14px] font-bold`, { fontFamily: 'Urbanist_700Bold' }]}>
                    Google Login
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                onPress={() => setIsLogin(!isLogin)}
                style={tw`mt-5 items-center`}
              >
                <Text style={tw`text-gray-500 text-[12px] font-semibold`}>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <Text style={tw`text-primary font-extrabold`}>{isLogin ? 'Register' : 'Log in'}</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};
