import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
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
import { BottomNav } from './components/layout/BottomNav';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [currentTab, setCurrentTab] = useState('match');

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
        setFontsLoaded(true); // Proceed anyway with system fonts
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

  if (showOnboarding) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <OnboardingScreen onFinish={() => setShowOnboarding(false)} />
      </GestureHandlerRootView>
    );
  }

  const renderScreen = () => {
    switch (currentTab) {
      case 'chat':
        return <ConversationsScreen />;
      case 'profile':
        return <InterestsScreen />;
      case 'match':
      default:
        return <IdealMatchScreen />;
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={tw`flex-1 bg-white`}>
        <StatusBar style="dark" />
        
        <View style={tw`flex-1`}>
          {renderScreen()}
        </View>

        {/* Hide nav on profile (Interests screen) as per user request flow */}
        {currentTab !== 'profile' && (
          <BottomNav activeTab={currentTab} onTabPress={(tab) => setCurrentTab(tab)} />
        )}
      </View>
    </GestureHandlerRootView>
  );
}
