import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/src/services/settingsService';
import type { UserSettings } from '@/src/types/settings';

export type SettingsTab = 'Account' | 'Profile' | 'Privacy' | 'Preferences' | 'Notifications' | 'Email';

export function useSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('Account');
  const [email, setEmailState] = useState('');
  const [gender, setGenderState] = useState('');
  const [isEditingGender, setIsEditingGender] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings,
    staleTime: 1000 * 60 * 5,
  });

  const setGender = async (val: string) => {
    setGenderState(val);
    await settingsService.updateSettings({ gender: val });
  };

  const setLocationType = async (val: string) => {
    await settingsService.updateSettings({ locationType: val });
  };

  const setGoogleConnected = async (val: boolean) => {
    await settingsService.updateSettings({ googleConnected: val });
  };

  const setAppleConnected = async (val: boolean) => {
    await settingsService.updateSettings({ appleConnected: val });
  };

  const setTwoFactor = async (val: boolean) => {
    await settingsService.updateSettings({ twoFactor: val });
  };

  return {
    activeTab,
    setActiveTab,
    email,
    onEmailChanged: setEmailState,
    gender,
    setGender,
    isEditingGender,
    setIsEditingGender,
    locationType: settings?.locationType ?? '',
    setLocationType,
    isEditingLocation,
    setIsEditingLocation,
    googleConnected: settings?.googleConnected ?? false,
    setGoogleConnected,
    appleConnected: settings?.appleConnected ?? false,
    setAppleConnected,
    twoFactor: settings?.twoFactor ?? false,
    setTwoFactor,
    isLoading,
    error,
  };
}
