import React from 'react';
import { Button } from '@/src/components/ui/button';

export const ProfileSection: React.FC = () => {
  return (
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
  );
};
