import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import tw from '@/lib/tailwind';
import { SHADOWS } from '@/lib/styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MatchModalProps {
  visible: boolean;
  onClose: () => void;
  user: any; 
  currentUserPhoto?: string;
}

export const MatchModal = ({ visible, onClose, user, currentUserPhoto }: MatchModalProps) => {
  if (!user) return null;

  const isFriendMode = user.mode === 'friendship';

  // Love mode: pinkish/white gradient. Friend mode: strict Black & White
  const themeBgColors = (isFriendMode 
    ? ['#000000', '#111111', '#1a1a1a']
    : ['#FFFFFF', '#FFE4E6', '#FFB1C1']) as [string, string, ...string[]]; 

  const textColor = isFriendMode ? 'text-white' : 'text-gray-900';
  const subTextColor = isFriendMode ? 'text-gray-400' : 'text-gray-600';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
    >
      <View style={tw`flex-1`}>
        <LinearGradient
          colors={themeBgColors}
          style={tw`absolute inset-0`}
        />
        
        {/* Top bar with close button */}
        <View style={tw`pt-14 px-6`}>
          <TouchableOpacity 
            onPress={onClose}
            style={tw`w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/10`}
          >
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <Line x1="18" y1="6" x2="6" y2="18" />
              <Line x1="6" y1="6" x2="18" y2="18" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Match content */}
        <View style={tw`flex-1 items-center justify-center px-8`}>
          {/* Overlapping Photos */}
          <View style={tw`h-[280px] w-full items-center justify-center mb-10`}>
            {/* Current user photo */}
            <View style={[tw`w-[160px] h-[220px] bg-gray-200 rounded-[40px] absolute border-4`, { borderColor: isFriendMode ? '#fff' : '#fff', transform: [{ rotate: '-8deg' }, { translateX: -40 }] }, SHADOWS.card]}>
              <Image 
                source={{ uri: currentUserPhoto || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800' }}
                style={tw`w-full h-full rounded-[36px]`}
                resizeMode="cover"
              />
            </View>

            {/* Matched User photo */}
            <View style={[tw`w-[160px] h-[220px] bg-gray-200 rounded-[40px] absolute border-4`, { borderColor: isFriendMode ? '#fff' : '#fff', transform: [{ rotate: '8deg' }, { translateX: 40 }, { translateY: 20 }] }, SHADOWS.card]}>
              <Image 
                source={{ uri: user.images[0] }}
                style={tw`w-full h-full rounded-[36px]`}
                resizeMode="cover"
              />
            </View>

            {/* Match Icon */}
            <View style={[tw`w-16 h-16 bg-white rounded-full items-center justify-center absolute z-20`, { bottom: 10 }, SHADOWS.floatingBtn]}>
              {isFriendMode ? (
                <Svg width="28" height="28" viewBox="0 0 24 24" fill="#000">
                    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><Circle cx="9" cy="7" r="4" /><Path d="M23 21v-2a4 4 0 0 0-3-3.87" /><Path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </Svg>
              ) : (
                <Svg width="28" height="28" viewBox="0 0 24 24" fill="#ff386c">
                  <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </Svg>
              )}
            </View>
          </View>

          {/* Texts */}
          <Text style={[tw`text-[44px] font-black text-center mb-2 ${textColor} uppercase tracking-tighter`, { fontFamily: 'Urbanist_900Black' }]}>
            {isFriendMode ? 'Friend Amis' : 'It\'s a Match!'}
          </Text>
          <Text style={[tw`text-[15px] text-center px-6 leading-relaxed ${subTextColor}`, { fontFamily: 'Urbanist_500Medium' }]}>
            {isFriendMode 
              ? `Vous avez les mêmes origines et centres d'intérêts avec ${user.name}. Faites connaissance !`
              : `Vous et ${user.name} avez eu un coup de cœur l'un pour l'autre.`}
          </Text>
        </View>

        {/* Action button */}
        <View style={tw`pb-20 px-8`}>
          <TouchableOpacity 
            style={[tw`w-full h-18 bg-white rounded-[24px] flex-row items-center justify-center gap-3`, SHADOWS.floatingBtn]}
          >
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </Svg>
            <Text style={[tw`text-black text-lg font-black uppercase`, { fontFamily: 'Urbanist_800ExtraBold' }]}>
                {isFriendMode ? 'Lui écrire un CC' : 'Envoyer un message'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={onClose}
            style={tw`mt-6 items-center`}
          >
            <Text style={[tw`text-white/60 text-sm font-bold uppercase tracking-widest`, { fontFamily: 'Urbanist_700Bold' }]}>Continuer à chercher</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
