import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import tw from '@/lib/tailwind';
import { StepHeader } from '../StepHeader';
import Svg, { Path, Circle } from 'react-native-svg';
import { SHADOWS } from '@/lib/styles';

type Props = {
  age: number;
  seekAge: [number, number];
  onChange: (age: number) => void;
  onSeekAgeChange: (range: [number, number]) => void;
};

export const AgeStep = ({ age, seekAge, onChange, onSeekAgeChange }: Props) => (
  <View>
    <StepHeader 
      badge="Âge" 
      title="Parlons de ton âge" 
      sub="Nous utilisons ces infos pour te présenter des profils pertinents." 
    />
    
    {/* Your Age */}
    <View style={tw`mb-8`}>
      <Text style={[tw`text-[11px] font-bold text-gray-400 uppercase mb-3`, { fontFamily: 'Urbanist_700Bold' }]}>Ton âge actuel</Text>
      <View style={[tw`bg-white p-8 rounded-[40px] items-center border border-gray-50`, SHADOWS.card]}>
        <TextInput 
          keyboardType="numeric"
          value={age.toString()}
          onChangeText={t => onChange(parseInt(t) || 0)}
          style={[tw`text-6xl font-black text-primary p-0`, { fontFamily: 'Urbanist_800ExtraBold' }]}
        />
        <Text style={tw`text-gray-400 font-bold uppercase mt-2`}>Ans</Text>
      </View>
    </View>

    {/* Target Age Range */}
    <View style={tw`mb-8`}>
      <View style={tw`flex-row justify-between items-center mb-4`}>
        <Text style={[tw`text-[11px] font-bold text-gray-400 uppercase`, { fontFamily: 'Urbanist_700Bold' }]}>Tranche d'âge souhaitée</Text>
        <View style={tw`bg-primary/10 px-3 py-1 rounded-lg`}>
          <Text style={[tw`text-sm font-black text-primary`, { fontFamily: 'Urbanist_800ExtraBold' }]}>{seekAge[0]} - {seekAge[1]}+</Text>
        </View>
      </View>
      
      <View style={[tw`bg-white p-6 rounded-[32px] border border-gray-50`, SHADOWS.card]}>
        <View style={tw`h-1.5 bg-gray-100 rounded-full relative mx-2 mb-4`}>
           <View style={[tw`absolute h-1.5 bg-primary rounded-full`, { left: '15%', right: '35%' }]} />
           <View style={[tw`absolute w-7 h-7 bg-white border-2 border-primary rounded-full shadow-md -top-2.75`, { left: '15%' }]} />
           <View style={[tw`absolute w-7 h-7 bg-white border-2 border-primary rounded-full shadow-md -top-2.75`, { right: '35%' }]} />
        </View>
        <View style={tw`flex-row justify-between px-2`}>
           <Text style={[tw`text-gray-400 text-xs font-bold`, { fontFamily: 'Urbanist_700Bold' }]}>18</Text>
           <Text style={[tw`text-gray-400 text-xs font-bold`, { fontFamily: 'Urbanist_700Bold' }]}>60+</Text>
        </View>
        
        {/* Quick Range Presets */}
        <View style={tw`flex-row gap-2 mt-6`}>
           {[
             { label: 'Proche', range: [age - 3, age + 3] },
             { label: 'Mature', range: [30, 45] },
             { label: 'Tout', range: [18, 60] }
           ].map((p, idx) => (
             <TouchableOpacity 
               key={idx}
               onPress={() => onSeekAgeChange(p.range as [number, number])}
               style={tw`flex-1 py-2.5 bg-gray-50 rounded-xl items-center border border-gray-100`}
             >
               <Text style={[tw`text-[11px] font-bold text-gray-600`, { fontFamily: 'Urbanist_700Bold' }]}>{p.label}</Text>
             </TouchableOpacity>
           ))}
        </View>
      </View>
    </View>
  </View>
);
