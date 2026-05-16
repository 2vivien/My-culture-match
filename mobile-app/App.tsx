import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Font from 'expo-font';
import {
  Urbanist_400Regular,
  Urbanist_500Medium,
  Urbanist_600SemiBold,
  Urbanist_700Bold,
  Urbanist_800ExtraBold
} from '@expo-google-fonts/urbanist';

import tw from './lib/tailwind';
import { ConversationsScreen } from './screens/ConversationsScreen';
import { IdealMatchScreen } from './screens/IdealMatchScreen';
import { InterestsScreen } from './screens/InterestsScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { AuthScreen } from './screens/AuthScreen';
import { ChatScreen } from './screens/ChatScreen';
import { BottomNav } from './components/layout/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { ProfileDetailScreen } from './screens/ProfileDetailScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { FriendSearchScreen } from './screens/FriendSearchScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';

if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    html, body {
      overflow: hidden !important;
      height: 100% !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      touch-action: none !important;
      user-select: none !important;
      overscroll-behavior: none !important;
      background-color: #f3f4f6 !important;
    }
    #root {
      height: 100% !important;
      width: 100% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
  `;
  document.head.appendChild(style);
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showInterestsOnboarding, setShowInterestsOnboarding] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [currentTab, setCurrentTab] = useState('home');

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          Urbanist_400Regular,
          Urbanist_500Medium,
          Urbanist_600SemiBold,
          Urbanist_700Bold,
          Urbanist_800ExtraBold,
          'Urbanist': Urbanist_400Regular,
        });
        setFontsLoaded(true);
      } catch (e) {
        console.warn("Font loading failed", e);
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-white`}>
        <ActivityIndicator size="large" color="#ff386c" />
      </View>
    );
  }

  const renderContent = () => {
    if (showOnboarding) {
      return <OnboardingScreen onFinish={() => {
        setShowOnboarding(false);
        setShowAuth(true);
      }} />;
    }

    if (showAuth) {
      return <AuthScreen onAuthSuccess={(mode) => {
        setShowAuth(false);
        if (mode === 'register') {
          setShowInterestsOnboarding(true);
        } else {
          setShowInterestsOnboarding(false);
        }
      }} />;
    }

    if (showInterestsOnboarding) {
      return <InterestsScreen onFinish={() => setShowInterestsOnboarding(false)} />;
    }

    const renderScreen = () => {
      switch (currentTab) {
        case 'chat':
          return <ConversationsScreen onSelectChat={(id) => setSelectedChat(id)} onShowNotifications={() => setShowNotifications(true)} />;
        case 'friends':
          return <FriendSearchScreen onSelectProfile={(user) => setSelectedProfile(user)} />;
        case 'profile':
          return <ProfileScreen />;
        case 'match':
          return <IdealMatchScreen onBack={() => setCurrentTab('home')} onSelectUser={(user) => setSelectedProfile(user)} onShowNotifications={() => setShowNotifications(true)} />;
        case 'home':
        default:
          return <HomeScreen onBack={() => setShowAuth(true)} onSelectUser={(user) => setSelectedProfile(user)} onShowNotifications={() => setShowNotifications(true)} />;
      }
    };

    return (
      <View style={tw`flex-1`}>
        <View style={tw`flex-1`}>
          {showNotifications ? (
            <NotificationsScreen onBack={() => setShowNotifications(false)} />
          ) : selectedChat ? (
            <ChatScreen onBack={() => setSelectedChat(null)} />
          ) : selectedProfile ? (
            <ProfileDetailScreen 
              user={selectedProfile} 
              onBack={() => setSelectedProfile(null)} 
            />
          ) : renderScreen()}
        </View>

        {!selectedChat && !selectedProfile && !showNotifications && (
          <BottomNav activeTab={currentTab} onTabPress={(tab) => setCurrentTab(tab)} />
        )}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <View style={[
        tw`flex-1 items-center justify-center`,
        Platform.OS === 'web' && { height: '100vh', width: '100vw', overflow: 'hidden' }
      ]}>
        <View style={[
          tw`bg-white shadow-2xl`,
          Platform.OS === 'web' ? { 
            width: Math.min(windowWidth, 500), 
            height: Math.min(windowHeight, 850),
            borderRadius: windowWidth > 500 ? 24 : 0,
            overflow: 'hidden',
            position: 'relative',
          } : { flex: 1, width: '100%' }
        ]}>
          <StatusBar style="dark" />
          {renderContent()}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
