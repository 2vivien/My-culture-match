import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import tw from '@/lib/tailwind';

const MenuItem = ({ icon, label, sub, color = "#ff386c", last }: any) => (
  <TouchableOpacity style={[tw`flex-row items-center py-4`, !last && tw`border-b border-gray-50`]}>
    <View style={tw`w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mr-4`}>
      {icon(color)}
    </View>
    <View style={tw`flex-1`}>
      <Text style={[tw`text-[15px] font-bold text-gray-900`, { fontFamily: 'Urbanist_700Bold' }]}>{label}</Text>
      {sub && <Text style={[tw`text-[12px] text-gray-400 mt-0.5`, { fontFamily: 'Urbanist_500Medium' }]}>{sub}</Text>}
    </View>
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="3">
      <Path d="M9 18l6-6-6-6"/>
    </Svg>
  </TouchableOpacity>
);

export const ProfileMenu = () => (
  <View style={tw`px-6 mt-8 pb-12`}>
    <Text style={[tw`text-gray-400 font-bold uppercase text-[11px] mb-4`, { fontFamily: 'Urbanist_700Bold' }]}>Paramètres & Sécurité</Text>
    <View style={tw`bg-white rounded-[32px]`}>
      <MenuItem 
        label="Vérification du Profil" 
        sub="Vérifié par selfie le 12/05" 
        icon={(c: string) => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Svg>}
      />
      <MenuItem 
        label="Mon Trio Hebdo" 
        sub="Prochain arrivage : Lundi" 
        icon={(c: string) => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><Circle cx="9" cy="7" r="4"/><Path d="M23 21v-2a4 4 0 0 0-3-3.87"/><Path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>}
      />
      <MenuItem 
        label="Déconnexion" 
        color="#EF4444" 
        last 
        icon={(c: string) => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></Svg>}
      />
    </View>
  </View>
);
