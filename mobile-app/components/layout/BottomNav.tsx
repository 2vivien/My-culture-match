import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import tw from '@/lib/tailwind';

type Props = {
  activeTab: string;
  onTabPress: (tab: string) => void;
};

export const BottomNav = ({ activeTab, onTabPress }: Props) => {
  const getIconColor = (tab: string) => activeTab === tab ? '#1e1e1e' : '#d1d5db';

  return (
    <View style={[
      tw`absolute bottom-0 w-full h-[95px] bg-white flex-row justify-around items-center px-6 pb-6 rounded-t-[40px] z-50`,
      {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.03,
        shadowRadius: 20,
        elevation: 10,
      }
    ]}>
      {/* Home */}
      <TouchableOpacity onPress={() => onTabPress('home')} style={tw`p-2`}>
        <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <Path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V10L12 3L21 10V19C21 19.5304 20.7893 20 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15M9 21V15C9 14.4696 9.21071 13.9609 9.58579 13.5858C9.96086 13.2107 10.4696 13 11 13H13C13.5304 13 14.0391 13.2107 14.4142 13.5858C14.7893 13.9609 15 14.4696 15 15V21M9 21H15" stroke={getIconColor('home')} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
      </TouchableOpacity>

      {/* Match */}
      <TouchableOpacity onPress={() => onTabPress('match')} style={tw`p-2`}>
        <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <Rect x="3" y="3" width="18" height="18" rx="4" stroke={getIconColor('match')} strokeWidth="2.5"/>
            <Path d="M3 9H21" stroke={getIconColor('match')} strokeWidth="2.5"/>
        </Svg>
      </TouchableOpacity>

      {/* Chat */}
      <TouchableOpacity onPress={() => onTabPress('chat')} style={tw`p-2 relative`}>
        {activeTab !== 'chat' && <View style={tw`absolute top-2 right-2 w-3 h-3 bg-primary rounded-full border-2 border-white z-10`} />}
        <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke={getIconColor('chat')} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <Path d="M9 12H9.01M15 12H15.01" stroke={getIconColor('chat')} strokeWidth="3" strokeLinecap="round"/>
        </Svg>
      </TouchableOpacity>

      {/* Profile */}
      <TouchableOpacity onPress={() => onTabPress('profile')} style={tw`p-2`}>
        <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <Path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke={getIconColor('profile')} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <Circle cx="12" cy="7" r="4" stroke={getIconColor('profile')} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
      </TouchableOpacity>
    </View>
  );
};
