import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Compass, Users, Plus, Check, Landmark, ArrowLeft } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useUIStore } from '@/src/stores/useUIStore';

const topicsList = [
  { name: 'Anime & Cosplay', icon: '🎏' },
  { name: 'Art', icon: '🧑‍🎨' },
  { name: 'Business & Finance', icon: '💵' },
  { name: 'Collectibles & Other Hobbies', icon: '🧩' },
  { name: 'Education & Career', icon: '🧑‍🎓' },
  { name: 'Fashion & Beauty', icon: '💄' },
  { name: 'Food & Drinks', icon: '🍔' },
  { name: 'Games', icon: '🕹️' },
  { name: 'Health', icon: '❤️' },
  { name: 'Home & Garden', icon: '🏡' },
  { name: 'Humanities & Law', icon: '📜' },
  { name: 'Identity & Relationships', icon: '🌈' },
  { name: 'Internet Culture', icon: '🐶' },
  { name: 'Movies & TV', icon: '🎬' },
  { name: 'Music', icon: '🎵' },
  { name: 'Nature & Outdoors', icon: '🌿' },
  { name: 'News & Politics', icon: '📰' },
  { name: 'Places & Travel', icon: '🌐' },
  { name: 'Pop Culture', icon: '✨' },
  { name: 'Q&As & Stories', icon: '✍️' },
  { name: 'Reading & Writing', icon: '📖' },
  { name: 'Sciences', icon: '🧪' },
  { name: 'Spooky', icon: '💀' },
  { name: 'Sports', icon: '🏅' },
  { name: 'Technology', icon: '💻' },
  { name: 'Vehicles', icon: '🚗' },
  { name: 'Adult Content', icon: '🔞' }
];

export const CreateTribePage = () => {
  const { setActiveTab } = useUIStore();
  const [createStep, setCreateStep] = useState(1);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [tribeType, setTribeType] = useState<'public' | 'restricted' | 'private'>('public');
  const [isMature, setIsMature] = useState(false);
  const [tribeName, setTribeName] = useState('');
  const [tribeDescription, setTribeDescription] = useState('');

  const toggleTopic = (topicName: string) => {
    setSelectedTopics(prev => {
      if (prev.includes(topicName)) {
        return prev.filter(t => t !== topicName);
      }
      return [...prev, topicName];
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden w-full max-w-4xl mx-auto px-4 sm:px-6">
      {/* Top Navigation */}
      <div className="flex items-center gap-4 py-6 border-b border-app-border dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('Explore')}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-app-black dark:text-white" />
        </button>
        <div>
          <h1 className="text-xl font-black text-app-black dark:text-white">Créer un tribu</h1>
          <p className="text-xs text-app-gray mt-0.5">Start your own community</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar py-8 flex justify-center items-start">
        <AnimatePresence mode="wait">
          <motion.div
            key={createStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-app-border dark:border-zinc-850 rounded-[32px] shadow-sm p-6 sm:p-8 flex flex-col gap-6"
          >
            {/* Header inside card */}
            <div className="pb-4 border-b border-app-border/40 dark:border-zinc-800/40">
              <h3 className="text-2xl font-black text-app-black dark:text-white">
                {createStep === 1 && "What will your community be about?"}
                {createStep === 2 && "What kind of community is this?"}
                {createStep === 3 && "Tell us about your community"}
                {createStep === 4 && "Community Created!"}
              </h3>
              <p className="text-sm text-app-gray mt-1">
                {createStep === 1 && "Choose a topic to help members discover your community"}
                {createStep === 2 && "Decide who can view and contribute in your community."}
                {createStep === 3 && "A name and description help people understand what your community is all about."}
                {createStep === 4 && "Your new Tribu is now ready for its members!"}
              </p>
            </div>

            {/* Step 1: Topics list */}
            {createStep === 1 && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-2 hide-scrollbar">
                  {topicsList.map((topic) => {
                    const isSelected = selectedTopics.includes(topic.name);
                    return (
                      <button
                        key={topic.name}
                        onClick={() => toggleTopic(topic.name)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-black tracking-wider transition-all text-left cursor-pointer",
                          isSelected
                            ? "bg-[#E27D60] border-[#E27D60] text-white shadow-md shadow-[#E27D60]/20"
                            : "bg-zinc-50 dark:bg-zinc-900/50 border-app-border dark:border-zinc-800 text-app-gray hover:text-app-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        )}
                      >
                        <span className="text-base shrink-0">{topic.icon}</span>
                        <span className="truncate">{topic.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Community Type */}
            {createStep === 2 && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-3">
                  {/* Public Option */}
                  <div
                    onClick={() => setTribeType('public')}
                    className={cn(
                      "flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer select-none",
                      tribeType === 'public'
                        ? "bg-[#E27D60]/5 border-[#E27D60] dark:bg-[#E27D60]/10 shadow-sm"
                        : "bg-zinc-50 dark:bg-zinc-900 border-app-border dark:border-zinc-850 hover:bg-zinc-100/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        tribeType === 'public' ? "bg-[#E27D60]/10 text-[#E27D60]" : "bg-zinc-200 dark:bg-zinc-800 text-app-gray"
                      )}>
                        <Compass className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-sm text-app-black dark:text-white block">Public</span>
                        <span className="text-xs text-app-gray dark:text-zinc-400 font-medium block mt-0.5">
                          Anyone can view, post, and comment to this community
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      tribeType === 'public' ? "border-[#E27D60]" : "border-app-border dark:border-zinc-700"
                    )}>
                      {tribeType === 'public' && <div className="w-2.5 h-2.5 rounded-full bg-[#E27D60]" />}
                    </div>
                  </div>

                  {/* Restricted Option */}
                  <div
                    onClick={() => setTribeType('restricted')}
                    className={cn(
                      "flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer select-none",
                      tribeType === 'restricted'
                        ? "bg-[#E27D60]/5 border-[#E27D60] dark:bg-[#E27D60]/10 shadow-sm"
                        : "bg-zinc-50 dark:bg-zinc-900 border-app-border dark:border-zinc-850 hover:bg-zinc-100/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        tribeType === 'restricted' ? "bg-[#E27D60]/10 text-[#E27D60]" : "bg-zinc-200 dark:bg-zinc-800 text-app-gray"
                      )}>
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-sm text-app-black dark:text-white block">Restricted</span>
                        <span className="text-xs text-app-gray dark:text-zinc-400 font-medium block mt-0.5">
                          Anyone can view, but only approved members can contribute
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      tribeType === 'restricted' ? "border-[#E27D60]" : "border-app-border dark:border-zinc-700"
                    )}>
                      {tribeType === 'restricted' && <div className="w-2.5 h-2.5 rounded-full bg-[#E27D60]" />}
                    </div>
                  </div>

                  {/* Private Option */}
                  <div
                    onClick={() => setTribeType('private')}
                    className={cn(
                      "flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer select-none",
                      tribeType === 'private'
                        ? "bg-[#E27D60]/5 border-[#E27D60] dark:bg-[#E27D60]/10 shadow-sm"
                        : "bg-zinc-50 dark:bg-zinc-900 border-app-border dark:border-zinc-850 hover:bg-zinc-100/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        tribeType === 'private' ? "bg-[#E27D60]/10 text-[#E27D60]" : "bg-zinc-200 dark:bg-zinc-800 text-app-gray"
                      )}>
                        <Plus className="w-5 h-5" style={{ transform: 'rotate(45deg)' }} />
                      </div>
                      <div>
                        <span className="font-extrabold text-sm text-app-black dark:text-white block">Private</span>
                        <span className="text-xs text-app-gray dark:text-zinc-400 font-medium block mt-0.5">
                          Only approved members can view and contribute
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      tribeType === 'private' ? "border-[#E27D60]" : "border-app-border dark:border-zinc-700"
                    )}>
                      {tribeType === 'private' && <div className="w-2.5 h-2.5 rounded-full bg-[#E27D60]" />}
                    </div>
                  </div>
                </div>

                <div className="border-t border-app-border/40 dark:border-zinc-800/40 pt-5">
                  {selectedTopics.includes('Adult Content') && (
                    <p className="text-xs text-rose-500 font-black mb-3 select-none tracking-wide uppercase">
                      Community marked as Mature (18+) because you selected a mature topic
                    </p>
                  )}
                  <div className="flex items-center justify-between p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-app-border dark:border-zinc-850 select-none">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-extrabold px-2 py-1 rounded-md bg-zinc-200 dark:bg-zinc-800 text-app-black dark:text-zinc-300 font-sans tracking-tighter">18</span>
                      <div>
                        <span className="font-extrabold text-sm text-app-black dark:text-white block">Mature (18+)</span>
                        <span className="text-xs text-app-gray dark:text-zinc-400 font-medium block mt-0.5">
                          Users must be over 18 to view and contribute
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsMature(!isMature)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative flex items-center p-0.5 cursor-pointer",
                        isMature || selectedTopics.includes('Adult Content') ? "bg-[#E27D60]" : "bg-zinc-300 dark:bg-zinc-700"
                      )}
                      disabled={selectedTopics.includes('Adult Content')}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full bg-white shadow-sm transition-all flex items-center justify-center",
                        isMature || selectedTopics.includes('Adult Content') ? "translate-x-6" : "translate-x-0"
                      )}>
                        {(isMature || selectedTopics.includes('Adult Content')) && <Check className="w-3 h-3 text-[#E27D60]" />}
                      </div>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-app-gray dark:text-zinc-500 leading-normal font-semibold">
                  By continuing, you agree to our <span className="text-[#E27D60] underline cursor-pointer">Tribu Code of Conduct</span> and acknowledge that you understand the <span className="text-[#E27D60] underline cursor-pointer">My Culture Match Rules</span>.
                </p>
              </div>
            )}

            {/* Step 3: Details & Live Preview */}
            {createStep === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
                      Community name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="t/communityname"
                      value={tribeName}
                      maxLength={21}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val.startsWith(' ')) {
                          setTribeName(val);
                        }
                      }}
                      className="w-full bg-[#FCFCFC] dark:bg-zinc-900 text-sm text-app-black dark:text-white border border-app-border dark:border-zinc-800 rounded-2xl py-3.5 px-4 outline-none focus:border-[#E27D60] focus:ring-1 focus:ring-[#E27D60]/20 transition-all placeholder:text-app-gray/50"
                    />
                    <span className="text-[10px] text-app-gray dark:text-zinc-500 text-right font-black tracking-wider">
                      {tribeName.length}/21
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
                      Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      placeholder="Tell members what your community is all about..."
                      value={tribeDescription}
                      onChange={(e) => setTribeDescription(e.target.value)}
                      rows={5}
                      className="w-full bg-[#FCFCFC] dark:bg-zinc-900 text-sm text-app-black dark:text-white border border-app-border dark:border-zinc-800 rounded-2xl py-3.5 px-4 outline-none resize-none focus:border-[#E27D60] focus:ring-1 focus:ring-[#E27D60]/20 transition-all placeholder:text-app-gray/50"
                    />
                    <span className="text-[10px] text-app-gray dark:text-zinc-500 text-right font-black tracking-wider">
                      {tribeDescription.length} characters
                    </span>
                  </div>
                </div>

                {/* Card Preview */}
                <div className="flex flex-col gap-3 select-none">
                  <span className="text-xs font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
                    Live Preview
                  </span>
                  <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-app-border dark:border-zinc-850 rounded-[24px] p-6 shadow-sm flex flex-col justify-between h-56 border-dashed">
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-app-gray dark:text-zinc-400 border border-app-border dark:border-zinc-750">
                          <Landmark className="w-7 h-7 text-[#E27D60]" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-base text-app-black dark:text-zinc-100 truncate leading-tight">
                            {tribeName ? `t/${tribeName}` : 't/communityname'}
                          </h4>
                          <p className="text-xs text-app-gray dark:text-zinc-400 font-bold uppercase tracking-wider mt-1">
                            1 member • 1 online
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-app-gray dark:text-zinc-400 leading-relaxed line-clamp-3">
                        {tribeDescription || 'Your community description will appear here. Talk about heritage traditions, arts, writing, or festivals.'}
                      </p>
                    </div>
                    <div className="text-xs font-bold text-[#E27D60] uppercase tracking-wider mt-4">
                      {tribeType.toUpperCase()} {isMature || selectedTopics.includes('Adult Content') ? "• 18+" : ""}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Success Screen */}
            {createStep === 4 && (
              <div className="flex flex-col items-center text-center py-12 gap-5 select-none">
                <div className="w-20 h-20 rounded-full bg-[#E27D60]/10 text-[#E27D60] flex items-center justify-center border border-[#E27D60]/20 mb-2">
                  <Check className="w-10 h-10 stroke-[3.5]" />
                </div>
                <h4 className="text-2xl font-extrabold text-app-black dark:text-white">
                  Tribu Initialization Complete!
                </h4>
                <p className="text-sm text-app-gray dark:text-zinc-400 max-w-sm leading-relaxed">
                  The community <span className="font-extrabold text-app-black dark:text-white">t/{tribeName}</span> has been successfully registered. You are now the official moderator of this guild!
                </p>
              </div>
            )}

            {/* Dot Indicators & Buttons Footer */}
            <div className="flex items-center justify-between pt-6 mt-2 border-t border-app-border/40 dark:border-zinc-800/40 select-none">
              {/* Dots */}
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((stepNum) => (
                  <div
                    key={stepNum}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all",
                      createStep === stepNum
                        ? "bg-[#E27D60] w-6"
                        : "bg-zinc-200 dark:bg-zinc-800"
                    )}
                  />
                ))}
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3">
                {createStep > 1 && createStep < 4 && (
                  <button
                    onClick={() => setCreateStep(prev => prev - 1)}
                    className="px-6 py-3 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-app-black dark:text-zinc-300 text-sm font-black uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    Back
                  </button>
                )}

                {createStep === 1 && (
                  <button
                    onClick={() => setCreateStep(2)}
                    disabled={selectedTopics.length === 0}
                    className={cn(
                      "px-8 py-3 rounded-full text-sm font-black uppercase tracking-wider cursor-pointer transition-all select-none",
                      selectedTopics.length > 0
                        ? "bg-[#E27D60] text-white hover:brightness-105 shadow-md shadow-[#E27D60]/20"
                        : "bg-zinc-100 dark:bg-zinc-900 text-app-gray/50 dark:text-zinc-700 cursor-not-allowed border border-app-border/40 dark:border-zinc-850"
                    )}
                  >
                    Next
                  </button>
                )}

                {createStep === 2 && (
                  <button
                    onClick={() => setCreateStep(3)}
                    className="px-8 py-3 bg-[#E27D60] text-white hover:brightness-105 shadow-md shadow-[#E27D60]/20 rounded-full text-sm font-black uppercase tracking-wider cursor-pointer transition-all select-none"
                  >
                    Next
                  </button>
                )}

                {createStep === 3 && (
                  <button
                    onClick={() => setCreateStep(4)}
                    disabled={!tribeName.trim() || !tribeDescription.trim()}
                    className={cn(
                      "px-8 py-3 rounded-full text-sm font-black uppercase tracking-wider cursor-pointer transition-all select-none",
                      tribeName.trim() && tribeDescription.trim()
                        ? "bg-[#E27D60] text-white hover:brightness-105 shadow-md shadow-[#E27D60]/20"
                        : "bg-zinc-100 dark:bg-zinc-900 text-app-gray/50 dark:text-zinc-700 cursor-not-allowed border border-app-border/40 dark:border-zinc-850"
                    )}
                  >
                    Create Tribe
                  </button>
                )}

                {createStep === 4 && (
                  <button
                    onClick={() => setActiveTab('Explore')}
                    className="px-8 py-3 bg-[#E27D60] text-white hover:brightness-105 shadow-md shadow-[#E27D60]/20 rounded-full text-sm font-black uppercase tracking-wider cursor-pointer transition-all select-none"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
