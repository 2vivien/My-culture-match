import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, SafeAreaView, StatusBar } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import tw from '@/lib/tailwind';
import { SHADOWS } from '@/lib/styles';

const MOCK_NOTIFICATIONS = [
  { id: '1', type: 'match', title: 'Nouveau Match !', body: 'Vous avez matché avec Amina. Dites-lui bonjour !', time: 'Il y a 2 min', read: false, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200' },
  { id: '2', type: 'like', title: 'Quelqu\'un vous apprécie', body: 'Un nouveau profil a liké votre bio sincère.', time: 'Il y a 1h', read: true, image: null },
  { id: '3', type: 'system', title: 'Trio Hebdo prêt', body: 'Vos 3 profils de la semaine sont arrivés !', time: 'Il y a 3h', read: true, image: null },
];

const NotificationItem = ({ item }: { item: typeof MOCK_NOTIFICATIONS[0] }) => (
  <TouchableOpacity 
    style={[tw`mx-6 mt-3 p-4 rounded-[32px] flex-row items-center border border-gray-50`, item.read ? tw`bg-white` : tw`bg-primary/5`, SHADOWS.card]}
  >
    <View style={tw`relative`}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={tw`w-12 h-12 rounded-full`} />
      ) : (
        <View style={tw`w-12 h-12 rounded-full bg-primary/10 items-center justify-center`}>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff386c" strokeWidth="2.5">
            <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
          </Svg>
        </View>
      )}
      {!item.read && <View style={tw`absolute top-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-white`} />}
    </View>
    <View style={tw`flex-1 ml-4`}>
      <View style={tw`flex-row justify-between items-center`}>
        <Text style={[tw`text-[15px] font-black text-gray-900`, { fontFamily: 'Urbanist_800ExtraBold' }]}>{item.title}</Text>
        <Text style={tw`text-[10px] text-gray-400 font-bold uppercase`}>{item.time}</Text>
      </View>
      <Text style={[tw`text-gray-500 text-xs mt-1`, { fontFamily: 'Urbanist_500Medium' }]} numberOfLines={2}>
        {item.body}
      </Text>
    </View>
  </TouchableOpacity>
);

export const NotificationsScreen = ({ onBack }: { onBack: () => void }) => {
  return (
    <View style={tw`flex-1 bg-white`}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={tw`flex-1`}>
        <View style={tw`px-6 pt-4 pb-2 flex-row justify-between items-center`}>
          <TouchableOpacity onPress={onBack} style={tw`w-10 h-10 bg-gray-50 rounded-full items-center justify-center`}>
             <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5">
                <Path d="M15 18l-6-6 6-6" />
             </Svg>
          </TouchableOpacity>
          <Text style={[tw`text-xl font-black text-gray-900`, { fontFamily: 'Urbanist_800ExtraBold' }]}>Notifications</Text>
          <View style={tw`w-10`} />
        </View>

        <FlatList 
          data={MOCK_NOTIFICATIONS}
          renderItem={({ item }) => <NotificationItem item={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={tw`pb-10 pt-4`}
          ListEmptyComponent={
            <View style={tw`flex-1 items-center justify-center pt-20`}>
              <Text style={tw`text-gray-400 font-bold`}>Aucune notification pour le moment.</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
};
