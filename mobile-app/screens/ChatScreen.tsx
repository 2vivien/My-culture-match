import React, { useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  StatusBar
} from 'react-native';
import { ChevronLeft, Phone, Video, MoreVertical, Camera, Mic, Image as ImageIcon, Send } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { COLORS } from '@/lib/theme';

export const ChatScreen = ({ route, onBack }: { route?: any, onBack: () => void }) => {
  const [message, setMessage] = useState('');
  
  // Mock data for the specific chat
  const chatUser = {
    name: 'Jennifer Steve',
    status: 'Active Now',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'
  };

  const messages = [
    { id: '1', text: 'Hi Jennifer How are you ?', time: '16:12', isSender: false },
    { id: '2', text: 'Totally Fine Bro !', time: '16:12', isSender: true },
    { id: '3', text: 'Prince ! I finally Found A Job', time: '16:12', isSender: true },
    { id: '4', text: 'Congrats ! after all this searches your finally made it.', time: '16:12', isSender: false },
    { id: '5', text: 'In which company btw ?', time: '16:12', isSender: false },
    { id: '6', text: 'UI designer in facebook', time: '16:12', isSender: true },
    { id: '7', text: 'Excellent Brother !', time: '16:12', isSender: false },
  ];

  // Primary Theme Color for header/send button
  const lightDustyRose = COLORS.primary;

  return (
    <View style={tw`flex-1 bg-white`}>
      <StatusBar barStyle="light-content" />
      
      {/* Premium Light Muted Dusty Rose Header */}
      <View style={[tw`pt-12 pb-5 px-6 rounded-b-[40px]`, { backgroundColor: lightDustyRose }]}>
        <SafeAreaView>
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center gap-4`}>
              <TouchableOpacity onPress={onBack}>
                <ChevronLeft size={24} color="white" />
              </TouchableOpacity>
              <View style={tw`relative`}>
                <Image source={{ uri: chatUser.image }} style={tw`w-12 h-12 rounded-full border-2 border-white/20`} />
                <View style={tw`absolute right-0 bottom-0 w-3 h-3 bg-green-400 border-2 border-[${lightDustyRose}] rounded-full`} />
              </View>
              <View>
                <Text style={[tw`text-white text-[18px] font-extrabold`, { fontFamily: 'Urbanist_800ExtraBold' }]}>{chatUser.name}</Text>
                <Text style={[tw`text-white/80 text-[12px] font-semibold`, { fontFamily: 'Urbanist_600SemiBold' }]}>{chatUser.status}</Text>
              </View>
            </View>
            <View style={tw`flex-row items-center gap-4`}>
              <TouchableOpacity style={tw`w-10 h-10 items-center justify-center bg-white/10 rounded-full`}>
                <Phone size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={tw`w-10 h-10 items-center justify-center bg-white/10 rounded-full`}>
                <Video size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity>
                <MoreVertical size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Messages Area */}
      <ScrollView 
        style={tw`flex-1 px-5 pt-6`} 
        contentContainerStyle={tw`pb-10`}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View key={msg.id} style={tw`mb-5 ${msg.isSender ? 'items-end' : 'items-start'}`}>
            <View style={tw`flex-row items-end gap-2 max-w-[82%]`}>
              {!msg.isSender && (
                <Image source={{ uri: chatUser.image }} style={tw`w-7 h-7 rounded-full mb-1 border border-gray-100 shadow-sm`} />
              )}
              <View style={[
                tw`px-5 py-3.5 rounded-[22px] shadow-sm`,
                msg.isSender 
                  ? [tw`bg-[#111] rounded-tr-none`, { elevation: 2 }] 
                  : [tw`bg-[#f3f4f6] rounded-tl-none`]
              ]}>
                <Text style={[
                  tw`text-[15px] font-medium leading-relaxed`, 
                  { fontFamily: 'Urbanist_500Medium', color: msg.isSender ? 'white' : '#111' }
                ]}>
                  {msg.text}
                </Text>
              </View>
            </View>
            <View style={tw`mt-1.5 ${msg.isSender ? 'mr-2' : 'ml-11'}`}>
               <Text style={[tw`text-[10px] text-gray-400 font-bold`, { fontFamily: 'Urbanist_700Bold' }]}>{msg.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modern Custom Input matching mockup */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={tw`px-6 pb-8 pt-2`}
      >
        <View style={tw`flex-row items-center gap-3`}>
          <TouchableOpacity style={tw`bg-gray-50 border border-gray-100 p-3.5 rounded-full shadow-sm`}>
            <Camera size={22} color="#111" />
          </TouchableOpacity>
          <View style={tw`flex-1 h-14 bg-gray-50 border border-gray-100 rounded-full px-5 flex-row items-center`}>
             <Mic size={20} color="#999" style={tw`mr-3`} />
             <TextInput 
              placeholder="Type here..."
              placeholderTextColor="#999"
              style={[tw`flex-1 text-[#111] font-semibold text-[15.5px]`, { fontFamily: 'Urbanist_600SemiBold' }]}
              value={message}
              onChangeText={setMessage}
             />
             <TouchableOpacity style={tw`ml-2`}>
               <ImageIcon size={20} color="#999" />
             </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={[tw`h-14 w-14 items-center justify-center rounded-full shadow-lg`, { backgroundColor: lightDustyRose, elevation: 4 }]}
          >
            <Send size={22} color="white" style={tw`ml-1`} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};
