import React from 'react';
import { useSettings } from '@/src/hooks/useSettings';
import { SettingsHeader } from '@/src/components/settings/SettingsHeader';
import { SettingsTabs } from '@/src/components/settings/SettingsTabs';
import { AccountGeneral } from '@/src/components/settings/sections/AccountGeneral';
import { AccountAuth } from '@/src/components/settings/sections/AccountAuth';
import { ProfileSection } from '@/src/components/settings/sections/ProfileSection';
import { PrivacySection } from '@/src/components/settings/sections/PrivacySection';
import { PreferencesSection } from '@/src/components/settings/sections/PreferencesSection';
import { NotificationsSection } from '@/src/components/settings/sections/NotificationsSection';
import { EmailSection } from '@/src/components/settings/sections/EmailSection';

export const SettingsPage: React.FC = () => {
  const settings = useSettings();
  const { activeTab, setActiveTab } = settings;

  return (
    <div className="flex-1 w-full h-full overflow-y-auto px-4 md:px-10 pb-12 select-none bg-[#FEFEFE] dark:bg-zinc-950/20">
      <SettingsHeader />
      <SettingsTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="max-w-3xl">
        {activeTab === 'Account' && (
          <div className="space-y-8 animate-fade-in">
            <AccountGeneral {...settings} />
            <AccountAuth {...settings} />
          </div>
        )}
        {activeTab === 'Profile' && <ProfileSection />}
        {activeTab === 'Privacy' && <PrivacySection />}
        {activeTab === 'Preferences' && <PreferencesSection />}
        {activeTab === 'Notifications' && <NotificationsSection />}
        {activeTab === 'Email' && <EmailSection />}
      </div>
    </div>
  );
};
