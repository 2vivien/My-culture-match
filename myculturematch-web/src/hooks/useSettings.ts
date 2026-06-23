import { useState, useEffect } from 'react';
import { settingsService } from '@/src/services/settingsService';

export type SettingsTab = 'Account' | 'Profile' | 'Privacy' | 'Preferences' | 'Notifications' | 'Email';

export function useSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('Account');
  const [email, setEmailState] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [gender, setGenderState] = useState('');
  const [isEditingGender, setIsEditingGender] = useState(false);
  const [locationType, setLocationTypeState] = useState('');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [googleConnected, setGoogleConnectedState] = useState(false);
  const [appleConnected, setAppleConnectedState] = useState(false);
  const [twoFactor, setTwoFactorState] = useState(false);

  useEffect(() => {
    let isMounted = true;
    settingsService.getSettings().then((data) => {
      if (isMounted) {
        setEmailState(data.email);
        setGenderState(data.gender);
        setLocationTypeState(data.locationType);
        setGoogleConnectedState(data.googleConnected);
        setAppleConnectedState(data.appleConnected);
        setTwoFactorState(data.twoFactor);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const setEmail = async (val: string) => {
    setEmailState(val);
    await settingsService.updateSettings({ email: val });
  };

  const setGender = async (val: string) => {
    setGenderState(val);
    await settingsService.updateSettings({ gender: val });
  };

  const setLocationType = async (val: string) => {
    setLocationTypeState(val);
    await settingsService.updateSettings({ locationType: val });
  };

  const setGoogleConnected = async (val: boolean) => {
    setGoogleConnectedState(val);
    await settingsService.updateSettings({ googleConnected: val });
  };

  const setAppleConnected = async (val: boolean) => {
    setAppleConnectedState(val);
    await settingsService.updateSettings({ appleConnected: val });
  };

  const setTwoFactor = async (val: boolean) => {
    setTwoFactorState(val);
    await settingsService.updateSettings({ twoFactor: val });
  };

  return {
    activeTab,
    setActiveTab,
    email,
    setEmail,
    isEditingEmail,
    setIsEditingEmail,
    gender,
    setGender,
    isEditingGender,
    setIsEditingGender,
    locationType,
    setLocationType,
    isEditingLocation,
    setIsEditingLocation,
    googleConnected,
    setGoogleConnected,
    appleConnected,
    setAppleConnected,
    twoFactor,
    setTwoFactor,
  };
}
