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
];

export const CreateTribeModal = () => {
  const { showCreateTribeModal, setShowCreateTribeModal } = useUIStore();
  const [createStep, setCreateStep] = useState(1);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [tribeType, setTribeType] = useState<'public' | 'restricted' | 'private'>('public');
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

  const closeModal = () => {
    setShowCreateTribeModal(false);
    // Reset state after animation
    setTimeout(() => {
      setCreateStep(1);
      setSelectedTopics([]);
      setTribeType('public');
      setTribeName('');
      setTribeDescription('');
    }, 300);
  };

  return (
    <AnimatePresence>
      {showCreateTribeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4 cursor-default select-none">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-white dark:bg-zinc-950 border border-app-border dark:border-zinc-850 rounded-[32px] max-w-xl md:max-w-2xl w-full overflow-hidden shadow-2xl relative p-6 text-app-black dark:text-zinc-100 flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-app-border/40 dark:border-zinc-800/40">
              <div>
                <h3 className="text-xl font-black text-app-black dark:text-white">
                  {createStep === 1 && "What will your tribu be about?"}
                  {createStep === 2 && "What kind of tribu is this?"}
                  {createStep === 3 && "Tell us about your tribu"}
                  {createStep === 4 && "Tribu Created!"}
                </h3>
                <p className="text-xs text-app-gray mt-1">
                  {createStep === 1 && "Choose a topic to help members discover your tribu"}
                  {createStep === 2 && "Decide who can view and contribute in your tribu."}
                  {createStep === 3 && "A name and description help people understand what your tribu is all about."}
                  {createStep === 4 && "Your new Tribu is now ready for its members!"}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-app-border dark:border-zinc-800 text-app-black dark:text-white flex items-center justify-center hover:opacity-90 cursor-pointer transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Topics list */}
            {createStep === 1 && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[45vh] overflow-y-auto pr-1 hide-scrollbar">
                  {topicsList.map((topic) => {
                    const isSelected = selectedTopics.includes(topic.name);
                    return (
                      <button
                        key={topic.name}
                        onClick={() => toggleTopic(topic.name)}
                        className={cn(
                          "flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-[11px] font-black tracking-wider transition-all text-left cursor-pointer",
                          isSelected
                            ? "bg-[#E27D60] border-[#E27D60] text-white"
                            : "bg-zinc-50 dark:bg-zinc-900 border-app-border dark:border-zinc-850 text-app-gray hover:text-app-black dark:hover:text-white"
                        )}
                      >
                        <span className="text-sm shrink-0">{topic.icon}</span>
                        <span className="truncate">{topic.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Tribu Type */}
            {createStep === 2 && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-3">
                  {/* Public Option */}
                  <div
                    onClick={() => setTribeType('public')}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none",
                      tribeType === 'public'
                        ? "bg-[#E27D60]/5 border-[#E27D60] dark:bg-[#E27D60]/10"
                        : "bg-zinc-50 dark:bg-zinc-900 border-app-border dark:border-zinc-850 hover:bg-zinc-100/50"
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <Compass className={cn("w-5 h-5", tribeType === 'public' ? "text-[#E27D60]" : "text-app-gray")} />
                      <div>
                        <span className="font-extrabold text-xs text-app-black dark:text-white block">Public</span>
                        <span className="text-[10px] text-app-gray dark:text-zinc-400 font-medium block mt-0.5">
                          Anyone can view, post, and comment to this tribu
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                      tribeType === 'public' ? "border-[#E27D60]" : "border-app-border dark:border-zinc-700"
                    )}>
                      {tribeType === 'public' && <div className="w-2 h-2 rounded-full bg-[#E27D60]" />}
                    </div>
                  </div>

                  {/* Restricted Option */}
                  <div
                    onClick={() => setTribeType('restricted')}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none",
                      tribeType === 'restricted'
                        ? "bg-[#E27D60]/5 border-[#E27D60] dark:bg-[#E27D60]/10"
                        : "bg-zinc-50 dark:bg-zinc-900 border-app-border dark:border-zinc-850 hover:bg-zinc-100/50"
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <Users className={cn("w-5 h-5", tribeType === 'restricted' ? "text-[#E27D60]" : "text-app-gray")} />
                      <div>
                        <span className="font-extrabold text-xs text-app-black dark:text-white block">Restricted</span>
                        <span className="text-[10px] text-app-gray dark:text-zinc-400 font-medium block mt-0.5">
                          Anyone can view, but only approved members can contribute
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                      tribeType === 'restricted' ? "border-[#E27D60]" : "border-app-border dark:border-zinc-700"
                    )}>
                      {tribeType === 'restricted' && <div className="w-2 h-2 rounded-full bg-[#E27D60]" />}
                    </div>
                  </div>

                  {/* Private Option */}
                  <div
                    onClick={() => setTribeType('private')}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none",
                      tribeType === 'private'
                        ? "bg-[#E27D60]/5 border-[#E27D60] dark:bg-[#E27D60]/10"
                        : "bg-zinc-50 dark:bg-zinc-900 border-app-border dark:border-zinc-850 hover:bg-zinc-100/50"
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <Plus className="w-5 h-5 text-app-gray" style={{ transform: 'rotate(45deg)' }} />
                      <div>
                        <span className="font-extrabold text-xs text-app-black dark:text-white block">Private</span>
                        <span className="text-[10px] text-app-gray dark:text-zinc-400 font-medium block mt-0.5">
                          Only approved members can view and contribute
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                      tribeType === 'private' ? "border-[#E27D60]" : "border-app-border dark:border-zinc-700"
                    )}>
                      {tribeType === 'private' && <div className="w-2 h-2 rounded-full bg-[#E27D60]" />}
                    </div>
                  </div>
                </div>

                <p className="text-[9px] text-app-gray dark:text-zinc-500 leading-normal font-semibold">
                  By continuing, you agree to our <span className="text-[#E27D60] underline cursor-pointer">Tribu Code of Conduct</span> and acknowledge that you understand the <span className="text-[#E27D60] underline cursor-pointer">My Culture Match Rules</span>.
                </p>
              </div>
            )}

            {/* Step 3: Details & Live Preview */}
            {createStep === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
                      Tribu name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="t/tribename"
                      value={tribeName}
                      maxLength={21}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val.startsWith(' ')) {
                          setTribeName(val);
                        }
                      }}
                      className="w-full bg-[#FCFCFC] dark:bg-zinc-900 text-sm text-app-black dark:text-white border border-app-border dark:border-zinc-800 rounded-2xl py-3 px-4 outline-none focus:border-[#E27D60] focus:ring-1 focus:ring-[#E27D60]/20 transition-all placeholder:text-app-gray/50"
                    />
                    <span className="text-[9px] text-app-gray dark:text-zinc-500 text-right font-black tracking-wider">
                      {tribeName.length}/21
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
                      Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      placeholder="Tell members what your tribu is all about..."
                      value={tribeDescription}
                      onChange={(e) => setTribeDescription(e.target.value)}
                      rows={4}
                      className="w-full bg-[#FCFCFC] dark:bg-zinc-900 text-sm text-app-black dark:text-white border border-app-border dark:border-zinc-800 rounded-2xl py-3 px-4 outline-none resize-none focus:border-[#E27D60] focus:ring-1 focus:ring-[#E27D60]/20 transition-all placeholder:text-app-gray/50"
                    />
                    <span className="text-[9px] text-app-gray dark:text-zinc-500 text-right font-black tracking-wider">
                      {tribeDescription.length} characters
                    </span>
                  </div>
                </div>

                {/* Card Preview */}
                <div className="flex flex-col gap-3 select-none">
                  <span className="text-[10px] font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
                    Live Preview
                  </span>
                  <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-app-border dark:border-zinc-850 rounded-[24px] p-5 shadow-sm flex flex-col justify-between h-48 border-dashed">
                    <div>
                      <div className="flex items-center gap-3.5 mb-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-app-gray dark:text-zinc-400 border border-app-border dark:border-zinc-750">
                          <Landmark className="w-6 h-6 text-[#E27D60]" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm text-app-black dark:text-zinc-100 truncate leading-tight">
                            {tribeName ? `t/${tribeName}` : 't/tribename'}
                          </h4>
                          <p className="text-[10px] text-app-gray dark:text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                            1 member • 1 online
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-app-gray dark:text-zinc-400 leading-relaxed line-clamp-3">
                        {tribeDescription || 'Your tribu description will appear here. Talk about heritage traditions, arts, writing, or festivals.'}
                      </p>
                    </div>
                    <div className="text-[9px] font-bold text-[#E27D60] uppercase tracking-wider">
                      {tribeType.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Success Screen */}
            {createStep === 4 && (
              <div className="flex flex-col items-center text-center py-8 gap-4 select-none">
                <div className="w-16 h-16 rounded-full bg-[#E27D60]/10 text-[#E27D60] flex items-center justify-center border border-[#E27D60]/20 mb-2">
                  <Check className="w-8 h-8 stroke-[3.5]" />
                </div>
                <h4 className="text-lg font-extrabold text-app-black dark:text-white">
                  Tribu Initialization Complete!
                </h4>
                <p className="text-xs text-app-gray dark:text-zinc-400 max-w-sm leading-relaxed">
                  The tribu <span className="font-extrabold text-app-black dark:text-white">t/{tribeName}</span> has been successfully registered. You are now the official moderator of this guild!
                </p>
              </div>
            )}

            {/* Dot Indicators & Buttons Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-app-border/40 dark:border-zinc-800/40 select-none">
              {/* Dots */}
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((stepNum) => (
                  <div
                    key={stepNum}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      createStep === stepNum
                        ? "bg-[#E27D60] w-4"
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
                    className="px-6 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-app-black dark:text-zinc-300 text-xs font-black uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    Back
                  </button>
                )}
                {createStep === 1 && (
                  <button
                    onClick={closeModal}
                    className="px-6 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-app-black dark:text-zinc-300 text-xs font-black uppercase tracking-wider cursor-pointer transition-colors"
                    type="button"
                  >
                    Cancel
                  </button>
                )}

                {createStep === 1 && (
                  <button
                    onClick={() => setCreateStep(2)}
                    disabled={selectedTopics.length === 0}
                    className={cn(
                      "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer transition-all select-none",
                      selectedTopics.length > 0
                        ? "bg-[#E27D60] text-white hover:brightness-105"
                        : "bg-zinc-100 dark:bg-zinc-900 text-app-gray/50 dark:text-zinc-700 cursor-not-allowed border border-app-border/40 dark:border-zinc-850"
                    )}
                  >
                    Next
                  </button>
                )}

                {createStep === 2 && (
                  <button
                    onClick={() => setCreateStep(3)}
                    className="px-6 py-2.5 bg-[#E27D60] text-white hover:brightness-105 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer transition-all select-none"
                  >
                    Next
                  </button>
                )}

                {createStep === 3 && (
                  <button
                    onClick={() => setCreateStep(4)}
                    disabled={!tribeName.trim() || !tribeDescription.trim()}
                    className={cn(
                      "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer transition-all select-none",
                      tribeName.trim() && tribeDescription.trim()
                        ? "bg-[#E27D60] text-white hover:brightness-105"
                        : "bg-zinc-100 dark:bg-zinc-900 text-app-gray/50 dark:text-zinc-700 cursor-not-allowed border border-app-border/40 dark:border-zinc-850"
                    )}
                  >
                    Create Tribu
                  </button>
                )}

                {createStep === 4 && (
                  <button
                    onClick={closeModal}
                    className="px-6 py-2.5 bg-[#E27D60] text-white hover:brightness-105 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer transition-all select-none"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
