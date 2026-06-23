import { useState } from 'react';

export type SettingsTab = 'Account' | 'Profile' | 'Privacy' | 'Preferences' | 'Notifications' | 'Email';

export function useSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('Account');
  const [email, setEmail] = useState('agueoundev@gmail.com');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [gender, setGender] = useState('Male');
  const [isEditingGender, setIsEditingGender] = useState(false);
  const [locationType, setLocationType] = useState('Use approximate location (based on IP)');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(true);
  const [appleConnected, setAppleConnected] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

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
