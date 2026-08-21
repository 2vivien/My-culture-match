import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/src/services/settingsService';
import type { UserSettings } from '@/src/types/settings';

export type SettingsTab = 'Account' | 'Profile' | 'Privacy' | 'Preferences' | 'Notifications' | 'Email';

export function useSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('Account');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingGender, setIsEditingGender] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings,
    staleTime: 1000 * 60 * 5,
  });

  const updateSettings = useMutation({
    mutationFn: (data: Partial<UserSettings>) => settingsService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  return {
    activeTab,
    setActiveTab,
    email: settings?.email ?? '',
    setEmail: (val: string) => updateSettings.mutate({ email: val }),
    isEditingEmail,
    setIsEditingEmail,
    gender: settings?.gender ?? '',
    setGender: (val: string) => updateSettings.mutate({ gender: val }),
    isEditingGender,
    setIsEditingGender,
    locationType: settings?.locationType ?? '',
    setLocationType: (val: string) => updateSettings.mutate({ locationType: val }),
    isEditingLocation,
    setIsEditingLocation,
    googleConnected: settings?.googleConnected ?? false,
    setGoogleConnected: (val: boolean) => updateSettings.mutate({ googleConnected: val }),
    appleConnected: settings?.appleConnected ?? false,
    setAppleConnected: (val: boolean) => updateSettings.mutate({ appleConnected: val }),
    twoFactor: settings?.twoFactor ?? false,
    setTwoFactor: (val: boolean) => updateSettings.mutate({ twoFactor: val }),
    isLoading,
    error,
  };
}
