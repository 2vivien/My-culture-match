import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, TextInput } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import tw from '@/lib/tailwind';
import { SHADOWS } from '@/lib/styles';

// Components
import { StatsCard } from '../components/Profile/StatsCard';
import { PhotoGrid } from '../components/Profile/PhotoGrid';
import { ProfileMenu } from '../components/Profile/ProfileMenu';

const ProfileHeader = () => (
  <View style={tw`px-6 pt-4 pb-2 items-center`}>
    <Text style={[tw`text-xl font-black text-gray-900`, { fontFamily: 'Urbanist_800ExtraBold' }]}>Profil</Text>
  </View>
);

const UserHero = () => (
  <View style={tw`items-center px-6 mt-6`}>
    <View style={tw`relative`}>
      <View style={[tw`w-32 h-32 rounded-full border-4 border-white overflow-hidden`, SHADOWS.card]}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800' }} 
          style={tw`w-full h-full`}
        />
      </View>
      <View style={tw`absolute bottom-1 right-1 bg-[#1D9E75] w-8 h-8 rounded-full border-2 border-white items-center justify-center`}>
         <Svg width="14" height="14" viewBox="0 0 24 24" fill="white">
           <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"/>
         </Svg>
      </View>
    </View>
    
    <Text style={[tw`text-[24px] font-black text-gray-900 mt-4`, { fontFamily: 'Urbanist_800ExtraBold' }]}>
      Julia, 24
    </Text>
    <View style={tw`flex-row items-center gap-1.5 mt-1`}>
       <View style={tw`w-2 h-2 bg-[#1D9E75] rounded-full`} />
       <Text style={[tw`text-gray-400 font-bold uppercase text-[11px]`, { fontFamily: 'Urbanist_700Bold' }]}>Statut Vérifié</Text>
    </View>
  </View>
);

const SubscriptionBanner = () => (
  <TouchableOpacity 
    activeOpacity={0.9}
    style={[tw`mx-6 mt-8 p-6 bg-primary rounded-[32px] overflow-hidden`, SHADOWS.floatingBtn]}
  >
    <View style={tw`flex-row justify-between items-center relative z-10`}>
      <View>
        <Text style={[tw`text-white text-[18px] font-black`, { fontFamily: 'Urbanist_800ExtraBold' }]}>Passez à Premium</Text>
        <Text style={[tw`text-white/80 text-[13px] font-medium mt-1`, { fontFamily: 'Urbanist_500Medium' }]}>Matchs illimités & Trio Hebdo extra</Text>
      </View>
      <View style={tw`bg-white px-4 py-2 rounded-full`}>
        <Text style={[tw`text-primary font-bold text-sm`, { fontFamily: 'Urbanist_700Bold' }]}>Activer</Text>
      </View>
    </View>
    <View style={[tw`absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full`, { transform: [{ scale: 1.5 }] }]} />
  </TouchableOpacity>
);

const BioSection = ({ bio, setBio }: { bio: string, setBio: (v: string) => void }) => (
  <View style={tw`px-6 mt-8`}>
    <Text style={[tw`text-gray-400 font-bold uppercase text-[11px] mb-3`, { fontFamily: 'Urbanist_700Bold' }]}>Ma bio sincère</Text>
    <View style={tw`bg-gray-50 p-5 rounded-[32px]`}>
      <TextInput 
        multiline
        maxLength={1000}
        value={bio}
        onChangeText={setBio}
        style={[tw`text-gray-700 leading-relaxed text-[15px]`, { fontFamily: 'Urbanist_500Medium', minHeight: 80 }]}
      />
      <Text style={tw`text-right text-gray-300 mt-2 font-bold text-[10px]`}>{bio.length}/1000</Text>
    </View>
  </View>
);

export const ProfileScreen = () => {
  const [bio, setBio] = useState("Sénégalaise à Lyon, le thiéboudienne me manque chaque dimanche mais je compense avec mon énergie débordante !");

  return (
    <View style={tw`flex-1 bg-white`}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={tw`flex-1`}>
        <ProfileHeader />
        
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-32`}>
          <UserHero />
          <StatsCard />
          <SubscriptionBanner />
          <BioSection bio={bio} setBio={setBio} />
          <PhotoGrid />
          <ProfileMenu />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
