import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Settings, Chrome, Apple, ShieldCheck, Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Account' | 'Profile' | 'Privacy' | 'Preferences' | 'Notifications' | 'Email'>('Account');
  
  // Interactive state variables
  const [email, setEmail] = useState('agueoundev@gmail.com');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [gender, setGender] = useState('Male');
  const [isEditingGender, setIsEditingGender] = useState(false);
  const [locationType, setLocationType] = useState('Use approximate location (based on IP)');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  
  const [googleConnected, setGoogleConnected] = useState(true);
  const [appleConnected, setAppleConnected] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <div className="flex-1 w-full h-full overflow-y-auto px-4 md:px-10 pb-12 select-none bg-[#FEFEFE] dark:bg-zinc-950/20">
      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-black tracking-tight text-app-black dark:text-white mt-6 mb-4 flex items-center gap-2">
        <Settings className="w-7 h-7 text-[#E27D60] animate-spin-slow" />
        Settings
      </h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 md:gap-2 border-b border-app-border dark:border-zinc-850 pb-3 mb-6">
        {(['Account', 'Profile', 'Privacy', 'Preferences', 'Notifications', 'Email'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4.5 py-2 text-xs font-black rounded-full cursor-pointer tracking-wider transition-all relative",
                isActive 
                  ? "text-[#E27D60] dark:text-[#E27D60]" 
                  : "text-app-gray hover:text-app-black dark:hover:text-zinc-200"
              )}
            >
              {tab}
              {isActive && (
                <motion.div
                  layoutId="settings-tab-bar"
                  className="absolute bottom-[-13px] left-0 right-0 h-[3px] bg-[#E27D60] rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Settings Tab Content */}
      <div className="max-w-3xl">
        {activeTab === 'Account' && (
          <div className="space-y-8 animate-fade-in">
            {/* General Settings */}
            <div>
              <h2 className="text-xs uppercase font-extrabold tracking-wider text-app-gray dark:text-zinc-500 mb-4">
                General
              </h2>
              
              <div className="divide-y divide-app-border/40 dark:divide-zinc-850/40">
                {/* Email address row */}
                <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-xs font-extrabold text-app-black dark:text-zinc-250">
                    Email address
                  </span>
                  <div className="flex items-center gap-2">
                    {isEditingEmail ? (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && setIsEditingEmail(false)}
                          className="px-3 py-1.5 text-xs rounded-xl border border-app-border bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-200 focus:outline-none focus:border-[#E27D60]"
                        />
                        <button 
                          onClick={() => setIsEditingEmail(false)} 
                          className="p-1.5 bg-[#E27D60] text-white rounded-lg cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs text-app-gray dark:text-zinc-400 font-semibold">
                          {email}
                        </span>
                        <button 
                          onClick={() => setIsEditingEmail(true)}
                          className="p-1 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer text-app-gray"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Gender row */}
                <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-xs font-extrabold text-app-black dark:text-zinc-250">
                    Gender
                  </span>
                  <div className="flex items-center gap-2">
                    {isEditingGender ? (
                      <select
                        value={gender}
                        onChange={(e) => {
                          setGender(e.target.value);
                          setIsEditingGender(false);
                        }}
                        className="px-3 py-1.5 text-xs rounded-xl border border-app-border bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-200 outline-none focus:ring-1 focus:ring-[#E27D60]"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    ) : (
                      <>
                        <span className="text-xs text-app-gray dark:text-zinc-400 font-semibold">
                          {gender}
                        </span>
                        <button 
                          onClick={() => setIsEditingGender(true)}
                          className="p-1 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-855 cursor-pointer text-app-gray"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Location customization row */}
                <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-xs font-extrabold text-app-black dark:text-zinc-250">
                    Location customization
                  </span>
                  <div className="flex items-center gap-2">
                    {isEditingLocation ? (
                      <select
                        value={locationType}
                        onChange={(e) => {
                          setLocationType(e.target.value);
                          setIsEditingLocation(false);
                        }}
                        className="px-3 py-1.5 text-xs rounded-xl border border-app-border bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-200 outline-none focus:ring-1 focus:ring-[#E27D60]"
                      >
                        <option value="Use approximate location (based on IP)">Use approximate location (based on IP)</option>
                        <option value="Use specific location profile details">Use specific location profile details</option>
                        <option value="Disable location customization">Disable location customization</option>
                      </select>
                    ) : (
                      <>
                        <span className="text-xs text-app-gray dark:text-zinc-400 font-semibold">
                          {locationType}
                        </span>
                        <button 
                          onClick={() => setIsEditingLocation(true)}
                          className="p-1 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer text-app-gray"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Authorization */}
            <div>
              <h2 className="text-xs uppercase font-extrabold tracking-wider text-app-gray dark:text-zinc-500 mb-4">
                Account authorization
              </h2>
              
              <div className="divide-y divide-app-border/40 dark:divide-zinc-850/40">
                {/* Google Auth row */}
                <div className="py-5 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center shrink-0">
                      <Chrome className="w-5 h-5 text-app-gray dark:text-zinc-400" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-app-black dark:text-zinc-200 leading-snug">
                        Google
                      </h4>
                      <p className="text-[10.5px] text-app-gray dark:text-zinc-400 leading-snug mt-0.5">
                        Connect to log in to MyCultureMatch with your Google account
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setGoogleConnected(!googleConnected)}
                    className={cn(
                      "px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer",
                      googleConnected 
                        ? "border border-app-border hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 text-app-black dark:text-zinc-200" 
                        : "bg-[#E27D60] hover:bg-[#c66b50] text-white"
                    )}
                  >
                    {googleConnected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>

                {/* Apple Auth row */}
                <div className="py-5 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center shrink-0">
                      <Apple className="w-5 h-5 text-app-gray dark:text-zinc-400" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-app-black dark:text-zinc-200 leading-snug">
                        Apple
                      </h4>
                      <p className="text-[10.5px] text-app-gray dark:text-zinc-400 leading-snug mt-0.5">
                        Connect to log in to MyCultureMatch with your Apple account
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setAppleConnected(!appleConnected)}
                    className={cn(
                      "px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer",
                      appleConnected 
                        ? "border border-app-border hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 text-app-black dark:text-zinc-200" 
                        : "bg-[#E27D60] hover:bg-[#c66b50] text-white"
                    )}
                  >
                    {appleConnected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>

                {/* Two Factor Auth row */}
                <div className="py-5 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-app-gray dark:text-zinc-400" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-app-black dark:text-zinc-200 leading-snug">
                        Two-factor authentication
                      </h4>
                      <p className="text-[10.5px] text-app-gray dark:text-zinc-400 leading-snug mt-0.5">
                        Add an extra layer of security to safeguard your ceremonial contributions
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setTwoFactor(!twoFactor)}
                    className={cn(
                      "w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer flex items-center shrink-0",
                      twoFactor ? "bg-[#E27D60]" : "bg-zinc-200 dark:bg-zinc-800"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-xs",
                        twoFactor ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Settings */}
        {activeTab === 'Profile' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-xs uppercase font-extrabold tracking-wider text-app-gray dark:text-zinc-500 mb-4">
                Public Profile
              </h2>
              <div className="divide-y divide-app-border/40 dark:divide-zinc-850/40">
                <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-xs font-extrabold text-app-black dark:text-zinc-250">Display Name</span>
                  <input type="text" defaultValue="MyCultureMatch User" className="px-3 py-1.5 text-xs rounded-xl border border-app-border bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-200 focus:outline-none focus:border-[#E27D60]" />
                </div>
                <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-xs font-extrabold text-app-black dark:text-zinc-250">Bio</span>
                  <textarea defaultValue="Explorer of global traditions." className="px-3 py-1.5 text-xs rounded-xl border border-app-border bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-200 focus:outline-none focus:border-[#E27D60] resize-none h-16 w-64" />
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-xs uppercase font-extrabold tracking-wider text-app-gray dark:text-zinc-500 mb-4">
                Identity & Totem
              </h2>
              <div className="divide-y divide-app-border/40 dark:divide-zinc-850/40">
                <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-xs font-extrabold text-app-black dark:text-zinc-250">Primary Tribu</span>
                  <select className="px-3 py-1.5 text-xs rounded-xl border border-app-border bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-200 outline-none focus:ring-1 focus:ring-[#E27D60]">
                    <option>Yamato Heritage Circle</option>
                    <option>Celtic Ogham Circles</option>
                    <option>Quechua Weaver Guild</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button className="bg-[#E27D60] hover:bg-[#c66b50] text-white rounded-full px-6 py-2 text-xs font-black">Save Profile Changes</Button>
            </div>
          </div>
        )}

        {/* Privacy Settings */}
        {activeTab === 'Privacy' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-xs uppercase font-extrabold tracking-wider text-app-gray dark:text-zinc-500 mb-4">
                Visibility
              </h2>
              <div className="divide-y divide-app-border/40 dark:divide-zinc-850/40">
                <div className="py-4.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-xs text-app-black dark:text-zinc-200">Private Account</h4>
                    <p className="text-[10.5px] text-app-gray dark:text-zinc-400 mt-0.5">Only approved companions can see your traditions and photos</p>
                  </div>
                  <button className="w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer flex items-center shrink-0 bg-zinc-200 dark:bg-zinc-800">
                    <span className="absolute left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-xs translate-x-0" />
                  </button>
                </div>
                <div className="py-4.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-xs text-app-black dark:text-zinc-200">Activity Status</h4>
                    <p className="text-[10.5px] text-app-gray dark:text-zinc-400 mt-0.5">Show when you are active on MyCultureMatch</p>
                  </div>
                  <button className="w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer flex items-center shrink-0 bg-[#E27D60]">
                    <span className="absolute left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-xs translate-x-5" />
                  </button>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-xs uppercase font-extrabold tracking-wider text-app-gray dark:text-zinc-500 mb-4">
                Interactions
              </h2>
              <div className="divide-y divide-app-border/40 dark:divide-zinc-850/40">
                <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-xs font-extrabold text-app-black dark:text-zinc-250">Who can message you</span>
                  <select className="px-3 py-1.5 text-xs rounded-xl border border-app-border bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-200 outline-none focus:ring-1 focus:ring-[#E27D60]">
                    <option>Everyone</option>
                    <option>Companions Only</option>
                    <option>No One</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Settings */}
        {activeTab === 'Notifications' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-xs uppercase font-extrabold tracking-wider text-app-gray dark:text-zinc-500 mb-4">
                Push Notifications
              </h2>
              <div className="divide-y divide-app-border/40 dark:divide-zinc-850/40">
                <div className="py-4.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-xs text-app-black dark:text-zinc-200">New Matches & Companions</h4>
                    <p className="text-[10.5px] text-app-gray dark:text-zinc-400 mt-0.5">When someone requests to connect with you</p>
                  </div>
                  <button className="w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer flex items-center shrink-0 bg-[#E27D60]">
                    <span className="absolute left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-xs translate-x-5" />
                  </button>
                </div>
                <div className="py-4.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-xs text-app-black dark:text-zinc-200">Messages (Thunderbird)</h4>
                    <p className="text-[10.5px] text-app-gray dark:text-zinc-400 mt-0.5">When you receive direct messages</p>
                  </div>
                  <button className="w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer flex items-center shrink-0 bg-[#E27D60]">
                    <span className="absolute left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-xs translate-x-5" />
                  </button>
                </div>
                <div className="py-4.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-xs text-app-black dark:text-zinc-200">Tribu Activity</h4>
                    <p className="text-[10.5px] text-app-gray dark:text-zinc-400 mt-0.5">Updates from Tribes you have joined</p>
                  </div>
                  <button className="w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer flex items-center shrink-0 bg-zinc-200 dark:bg-zinc-800">
                    <span className="absolute left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-xs translate-x-0" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Settings */}
        {activeTab === 'Email' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-xs uppercase font-extrabold tracking-wider text-app-gray dark:text-zinc-500 mb-4">
                Email Preferences
              </h2>
              <div className="divide-y divide-app-border/40 dark:divide-zinc-850/40">
                <div className="py-4.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-xs text-app-black dark:text-zinc-200">Weekly Highlights</h4>
                    <p className="text-[10.5px] text-app-gray dark:text-zinc-400 mt-0.5">Top traditions and news from the community</p>
                  </div>
                  <button className="w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer flex items-center shrink-0 bg-[#E27D60]">
                    <span className="absolute left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-xs translate-x-5" />
                  </button>
                </div>
                <div className="py-4.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-xs text-app-black dark:text-zinc-200">Security & Account Alerts</h4>
                    <p className="text-[10.5px] text-app-gray dark:text-zinc-400 mt-0.5">Important notifications about your account status</p>
                  </div>
                  <button className="w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-not-allowed flex items-center shrink-0 bg-zinc-400 dark:bg-zinc-600 opacity-70">
                    <span className="absolute left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-xs translate-x-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Preferences fallback for any other uncaught tabs (like 'Preferences' if it exists) */}
          </div>
        )}

        {/* Preferences */}
        {activeTab === 'Preferences' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-xs uppercase font-extrabold tracking-wider text-app-gray dark:text-zinc-500 mb-4">
                App Experience
              </h2>
              <div className="divide-y divide-app-border/40 dark:divide-zinc-850/40">
                <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-xs font-extrabold text-app-black dark:text-zinc-250">Display Language</span>
                  <select className="px-3 py-1.5 text-xs rounded-xl border border-app-border bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-200 outline-none focus:ring-1 focus:ring-[#E27D60]">
                    <option>English (US)</option>
                    <option>Français</option>
                    <option>Español</option>
                    <option>日本語</option>
                  </select>
                </div>
                <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-xs font-extrabold text-app-black dark:text-zinc-250">Content Filter</span>
                  <select className="px-3 py-1.5 text-xs rounded-xl border border-app-border bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-200 outline-none focus:ring-1 focus:ring-[#E27D60]">
                    <option>Standard (Recommended)</option>
                    <option>Strict</option>
                    <option>Off</option>
                  </select>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-xs uppercase font-extrabold tracking-wider text-app-gray dark:text-zinc-500 mb-4">
                Media Autoplay
              </h2>
              <div className="divide-y divide-app-border/40 dark:divide-zinc-850/40">
                <div className="py-4.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-xs text-app-black dark:text-zinc-200">Autoplay Videos</h4>
                    <p className="text-[10.5px] text-app-gray dark:text-zinc-400 mt-0.5">Automatically play videos when scrolling feed</p>
                  </div>
                  <button className="w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer flex items-center shrink-0 bg-[#E27D60]">
                    <span className="absolute left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-xs translate-x-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
