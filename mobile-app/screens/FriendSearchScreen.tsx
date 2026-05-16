import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, SafeAreaView, StatusBar, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import tw from '@/lib/tailwind';
import { SHADOWS } from '@/lib/styles';
import { FilterModal, FilterValues } from '@/components/FilterModal';

const MOCK_MARKERS = [
  { 
    id: '1', 
    name: 'Moussa', 
    age: 28,
    lat: 0.3, 
    lng: 0.4, 
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    origin: 'Sénégalais',
    ethnicity: 'Peul',
    languages: ['Wolof', 'Français'],
    bio: 'Envie d\'un café et de discuter de nos racines.',
    images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800'],
    location: 'Paris, France'
  },
  { 
    id: '2', 
    name: 'Amina', 
    age: 25,
    lat: 0.5, 
    lng: 0.6, 
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    origin: 'Algérienne',
    ethnicity: 'Kabyle',
    languages: ['Arabe', 'Français', 'Anglais'],
    bio: 'Passionnée par l\'art et la culture méditerranéenne.',
    images: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800'],
    location: 'Lyon, France'
  },
  { 
    id: '3', 
    name: 'Koffi', 
    age: 30,
    lat: 0.2, 
    lng: 0.7, 
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    origin: 'Ivoirien',
    ethnicity: 'Akan',
    languages: ['Baoulé', 'Français'],
    bio: 'Nouveau en ville, hâte de faire des rencontres.',
    images: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800'],
    location: 'Bordeaux, France'
  },
];

const SearchHeader = ({ onFilterPress }: { onFilterPress: () => void }) => (
  <View style={tw`px-6 pt-4 flex-row items-center gap-3`}>
    <View style={[tw`bg-white rounded-[32px] p-2 flex-row items-center border border-gray-100 flex-1`, SHADOWS.floatingBtn]}>
      <TouchableOpacity style={tw`p-3 ml-1`}>
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5">
          <Circle cx="11" cy="11" r="8"/><Path d="M21 21l-4.35-4.35"/>
        </Svg>
      </TouchableOpacity>
      <TextInput 
        placeholder="Chercher une zone, une origine..." 
        style={[tw`flex-1 text-sm font-bold text-gray-900`, { fontFamily: 'Urbanist_700Bold' }]}
        placeholderTextColor="#9CA3AF"
      />
      <TouchableOpacity 
        onPress={onFilterPress}
        style={tw`bg-primary w-11 h-11 rounded-2xl items-center justify-center`}
      >
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
        </Svg>
      </TouchableOpacity>
    </View>
  </View>
);

const NearFriendCard = ({ user, onPress }: { user: any, onPress: () => void }) => (
  <TouchableOpacity 
    onPress={onPress}
    style={tw`absolute bottom-32 w-full px-6`}
  >
    <View style={[tw`bg-white p-5 rounded-[40px] flex-row items-center border border-gray-50`, SHADOWS.card]}>
      <Image source={{ uri: user.image || user.images[0] }} style={tw`w-16 h-16 rounded-full`} />
      <View style={tw`ml-4 flex-1`}>
        <Text style={[tw`text-lg font-black text-gray-900`, { fontFamily: 'Urbanist_800ExtraBold' }]}>{user.name}, {user.age}</Text>
        <Text style={tw`text-gray-400 text-xs font-medium`}>"{user.bio.slice(0, 30)}..." · {user.origin}</Text>
      </View>
      <TouchableOpacity style={tw`bg-primary/10 w-12 h-12 rounded-full items-center justify-center`}>
         <Svg width="20" height="20" viewBox="0 0 24 24" fill="#ff386c">
            <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
         </Svg>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

export const FriendSearchScreen = ({ onSelectProfile }: { onSelectProfile: (user: any) => void }) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const SCREEN_WIDTH = Math.min(windowWidth, 500);
  const SCREEN_HEIGHT = windowHeight;

  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(MOCK_MARKERS[0]);
  const [filters, setFilters] = useState<FilterValues>({
    origin: '',
    location: '',
    ageRange: [18, 60],
    gender: 'Tout le monde',
    distance: '10km'
  });

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  const MapSimulation = () => (
    <View style={[tw`absolute inset-0 bg-gray-100`, { zIndex: -1 }]}>
      <Image 
        source={{ uri: 'https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-0.1278,51.5074,13/800x1200?access_token=pk.eyJ1IjoiZGVtbyIsImEiOiJja2p4eGgzeG0wZzV5MnFvMnFvMnFvMnFvIn0.demo' }} 
        style={tw`w-full h-full opacity-50`}
        resizeMode="cover"
      />
      {MOCK_MARKERS.map(m => (
        <TouchableOpacity 
          key={m.id} 
          onPress={() => setSelectedUser(m)}
          style={[tw`absolute`, { left: SCREEN_WIDTH * m.lng, top: SCREEN_HEIGHT * m.lat }]}
        >
          <View style={[
            tw`bg-white p-1 rounded-full shadow-lg border-2`, 
            selectedUser.id === m.id ? tw`border-primary` : tw`border-white`,
            SHADOWS.card
          ]}>
            <Image source={{ uri: m.image }} style={tw`w-10 h-10 rounded-full`} />
          </View>
          <View style={tw`bg-primary w-2 h-2 rounded-full self-center -mt-1`} />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={[tw`flex-1 bg-white`, { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, alignSelf: 'center', overflow: 'hidden' }]}>
      <StatusBar barStyle="dark-content" />
      <MapSimulation />
      <SafeAreaView style={tw`flex-1`}>
        <SearchHeader onFilterPress={() => setFiltersVisible(true)} />
        <NearFriendCard user={selectedUser} onPress={() => onSelectProfile(selectedUser)} />
        <FilterModal 
          visible={filtersVisible} 
          onClose={() => setFiltersVisible(false)} 
          onApply={handleApplyFilters}
          initialFilters={filters}
        />
      </SafeAreaView>
    </View>
  );
};
