import React from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import tw from '@/lib/tailwind';
import { StepHeader } from '../StepHeader';

type Props = {
  name: string;
  onNameChange: (val: string) => void;
  photo: string | null;
};

export const IdentityStep = ({ name, onNameChange, photo }: Props) => (
  <View>
    <StepHeader 
      badge="Moi" 
      title="Montre qui tu es" 
      sub="Ton prénom et ta plus belle photo." 
    />
    <TextInput 
      placeholder="Ton prénom" 
      value={name} 
      onChangeText={onNameChange}
      style={[tw`w-full p-5 bg-gray-50 rounded-3xl mb-6 text-lg`, { fontFamily: 'Urbanist_600SemiBold' }]}
    />
    <TouchableOpacity style={tw`w-full aspect-square bg-gray-100 rounded-[40px] items-center justify-center border-2 border-dashed border-gray-300`}>
       {photo ? null : (
         <>
           <Svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
             <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><Circle cx="12" cy="13" r="4"/>
           </Svg>
           <Text style={tw`text-gray-400 mt-4 font-bold`}>Ajouter une photo</Text>
         </>
       )}
    </TouchableOpacity>
  </View>
);
