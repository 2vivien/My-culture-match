import React from 'react';
import { motion } from 'framer-motion';
import { useCreateTradition } from '@/src/hooks/useCreateTradition';
import { CreateTraditionHeader } from '../create-tradition/CreateTraditionHeader';
import { TribuSelector } from '../create-tradition/TribuSelector';
import { FlairSelector } from '../create-tradition/FlairSelector';
import { CreateTraditionTabs } from '../create-tradition/CreateTraditionTabs';
import { CreateTraditionTextForm } from '../create-tradition/CreateTraditionTextForm';
import { CreateTraditionMediaForm } from '../create-tradition/CreateTraditionMediaForm';
import { CreateTraditionLinkForm } from '../create-tradition/CreateTraditionLinkForm';

export const CreateTraditionView: React.FC = () => {
  const {
    tribes,
    selectedTribe,
    tribuDropdownOpen,
    setTribuDropdownOpen,
    activeSubTab,
    setActiveSubTab,
    title,
    setTitle,
    body,
    setBody,
    linkUrl,
    setLinkUrl,
    mediaPreview,
    handleMediaChange,
    clearMedia,
    formats,
    toggleFormat,
    isSubmitting,
    selectTribe,
    handleSubmit,
    selectedTags,
    toggleTag,
    flairs,
    flairsLoading,
    selectedFlairId,
    setSelectedFlairId,
  } = useCreateTradition();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex-1 max-w-3xl w-full h-full mx-auto pb-12 pt-4 select-none overflow-y-auto hide-scrollbar pr-2"
    >
      <CreateTraditionHeader />

      <div className="bg-white dark:bg-zinc-950 rounded-[20px] p-6 border border-app-border dark:border-zinc-800 shadow-sm">
        <TribuSelector
          tribes={tribes}
          selectedTribe={selectedTribe}
          isOpen={tribuDropdownOpen}
          setIsOpen={setTribuDropdownOpen}
          onSelect={selectTribe}
        />

        {selectedTribe && (
          <FlairSelector
            flairs={flairs}
            loading={flairsLoading}
            selectedFlairId={selectedFlairId}
            onSelect={setSelectedFlairId}
          />
        )}

        <CreateTraditionTabs
          activeTab={activeSubTab} 
          setActiveTab={setActiveSubTab} 
        />

        {activeSubTab === 'Text' && (
          <CreateTraditionTextForm
            title={title}
            setTitle={setTitle}
            body={body}
            setBody={setBody}
            formats={formats}
            toggleFormat={toggleFormat}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
          />
        )}

        {activeSubTab === 'Images' && (
          <CreateTraditionMediaForm
            mediaPreview={mediaPreview}
            onMediaChange={handleMediaChange}
            onClearMedia={clearMedia}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        )}

        {activeSubTab === 'Link' && (
          <CreateTraditionLinkForm
            linkUrl={linkUrl}
            setLinkUrl={setLinkUrl}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </motion.div>
  );
};
