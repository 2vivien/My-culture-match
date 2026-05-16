import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, useWindowDimensions, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import tw from '@/lib/tailwind';
import { SHADOWS } from '@/lib/styles';

export interface FilterValues {
  origin: string;
  location: string;
  ageRange: [number, number];
  gender: string;
  distance: string;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
  initialFilters?: FilterValues;
}

export const FilterModal = ({ visible, onClose, onApply, initialFilters }: FilterModalProps) => {
  const [origin, setOrigin] = useState(initialFilters?.origin || '');
  const [location, setLocation] = useState(initialFilters?.location || '');
  const [ageRange, setAgeRange] = useState<[number, number]>(initialFilters?.ageRange || [18, 45]);
  const [gender, setGender] = useState(initialFilters?.gender || 'Everyone');
  const [distance, setDistance] = useState(initialFilters?.distance || 'Partout');
  
  const { height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    if (initialFilters) {
      setOrigin(initialFilters.origin);
      setLocation(initialFilters.location);
      setAgeRange(initialFilters.ageRange);
      setGender(initialFilters.gender);
      setDistance(initialFilters.distance);
    }
  }, [initialFilters, visible]);

  const handleApply = () => {
    onApply({
      origin,
      location,
      ageRange,
      gender,
      distance
    });
    onClose();
  };

  const handleReset = () => {
    setOrigin('');
    setLocation('');
    setAgeRange([18, 45]);
    setGender('Everyone');
    setDistance('Partout');
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        <View style={tw`flex-1 justify-end bg-black/60`}>
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={onClose} 
            style={tw`absolute inset-0`} 
          />
          <View style={[tw`bg-white rounded-t-[40px] px-6 pt-8 pb-10`, { height: windowHeight * 0.85 }]}>
            <View style={tw`flex-row justify-between items-center mb-8`}>
              <View>
                <Text style={[tw`text-2xl font-black text-gray-900`, { fontFamily: 'Urbanist_800ExtraBold' }]}>Filtres</Text>
                <TouchableOpacity onPress={handleReset}>
                  <Text style={[tw`text-primary text-xs font-bold mt-1`, { fontFamily: 'Urbanist_700Bold' }]}>Réinitialiser tout</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={onClose} style={tw`p-2 bg-gray-100 rounded-full`}>
                 <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M18 6L6 18M6 6l12 12" />
                 </Svg>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-32`}>
              {/* Origin Section - Pills removed as requested */}
              <View style={tw`mb-8`}>
                <Text style={[tw`text-[11px] font-bold text-gray-400 uppercase mb-3`, { fontFamily: 'Urbanist_700Bold' }]}>Origine / Provenance</Text>
                <View style={[tw`flex-row items-center bg-gray-50 px-4 rounded-2xl border border-gray-100`, SHADOWS.card]}>
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                    <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <Path d="M4 22v-7" />
                  </Svg>
                  <TextInput 
                    value={origin}
                    onChangeText={setOrigin}
                    placeholder="Ecrivez l'origine souhaitée..." 
                    style={[tw`flex-1 p-4 font-bold text-gray-900`, { fontFamily: 'Urbanist_700Bold' }]}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Localization Section */}
              <View style={tw`mb-8`}>
                <Text style={[tw`text-[11px] font-bold text-gray-400 uppercase mb-3`, { fontFamily: 'Urbanist_700Bold' }]}>Localisation</Text>
                <View style={[tw`flex-row items-center bg-gray-50 px-4 rounded-2xl border border-gray-100`, SHADOWS.card]}>
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                    <Circle cx="12" cy="10" r="3" />
                    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  </Svg>
                  <TextInput 
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Ville, code postal ou région..." 
                    style={[tw`flex-1 p-4 font-bold text-gray-900`, { fontFamily: 'Urbanist_700Bold' }]}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Distance Section */}
              <View style={tw`mb-8`}>
                <Text style={[tw`text-[11px] font-bold text-gray-400 uppercase mb-3`, { fontFamily: 'Urbanist_700Bold' }]}>Rayon de recherche</Text>
                <View style={tw`flex-row gap-2`}>
                  {['10km', '50km', '100km', 'Partout'].map(z => (
                    <TouchableOpacity 
                      key={z} 
                      onPress={() => setDistance(z)}
                      style={[
                        tw`flex-1 py-3 items-center rounded-2xl border`,
                        distance === z ? tw`bg-primary border-primary` : tw`bg-gray-50 border-gray-100`
                      ]}
                    >
                      <Text style={[
                        tw`text-xs font-bold`, 
                        { fontFamily: 'Urbanist_700Bold', color: distance === z ? 'white' : '#111' }
                      ]}>{z}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Age Range Section - Improved Interactivity feel */}
              <View style={tw`mb-8`}>
                <View style={tw`flex-row justify-between items-center mb-4`}>
                  <Text style={[tw`text-[11px] font-bold text-gray-400 uppercase`, { fontFamily: 'Urbanist_700Bold' }]}>Tranche d'âge</Text>
                  <View style={tw`flex-row items-center bg-primary/10 px-3 py-1 rounded-lg`}>
                    <Text style={[tw`text-sm font-black text-primary`, { fontFamily: 'Urbanist_800ExtraBold' }]}>{ageRange[0]} - {ageRange[1]}+</Text>
                  </View>
                </View>
                
                {/* Visual Slider representation - users can tap to change */}
                <TouchableOpacity 
                  activeOpacity={1}
                  onPress={() => setAgeRange([22, 35])} // Dynamic simulation
                  style={tw`h-10 justify-center px-2`}
                >
                  <View style={tw`h-2 bg-gray-100 rounded-full relative`}>
                    <View style={[tw`absolute h-2 bg-primary rounded-full`, { left: '15%', right: '35%' }]} />
                    <View style={[tw`absolute w-8 h-8 bg-white border-[3px] border-primary rounded-full shadow-md -top-3`, { left: '15%' }]} />
                    <View style={[tw`absolute w-8 h-8 bg-white border-[3px] border-primary rounded-full shadow-md -top-3`, { right: '35%' }]} />
                  </View>
                </TouchableOpacity>

                <View style={tw`flex-row justify-between mt-4 px-2`}>
                   <Text style={[tw`text-gray-400 text-[10px] font-black`, { fontFamily: 'Urbanist_800ExtraBold' }]}>18 ANS</Text>
                   <Text style={[tw`text-gray-400 text-[10px] font-black`, { fontFamily: 'Urbanist_800ExtraBold' }]}>60 ANS +</Text>
                </View>
              </View>

              {/* Gender Section */}
              <View style={tw`mb-8`}>
                <Text style={[tw`text-[11px] font-bold text-gray-400 uppercase mb-3`, { fontFamily: 'Urbanist_700Bold' }]}>Afficher</Text>
                <View style={tw`flex-row gap-3`}>
                  {['Hommes', 'Femmes', 'Tout le monde'].map((item) => (
                    <TouchableOpacity 
                      key={item} 
                      onPress={() => setGender(item)}
                      style={[
                          tw`flex-1 py-4 rounded-2xl items-center justify-center border-2`,
                          gender === item ? tw`border-primary bg-primary/5` : tw`border-gray-50 bg-white`
                      ]}
                    >
                      <Text style={[
                        tw`text-[13px] font-bold`, 
                        { fontFamily: 'Urbanist_700Bold', color: gender === item ? '#ff386c' : '#666' }
                      ]}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={tw`absolute bottom-10 left-6 right-6`}>
              <TouchableOpacity 
                onPress={handleApply}
                style={[tw`w-full bg-primary h-16 rounded-[24px] items-center justify-center shadow-lg shadow-primary/30`, SHADOWS.floatingBtn]}
              >
                <Text style={[tw`text-white text-lg font-black uppercase tracking-wider`, { fontFamily: 'Urbanist_800ExtraBold' }]}>Appliquer les filtres</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
