import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateTribe } from '@/src/hooks/useCreateTribe';
import { CreateTribeHeader } from './create-tribe/CreateTribeHeader';
import { CreateTribeTopicsStep } from './create-tribe/CreateTribeTopicsStep';
import { CreateTribeTypeStep } from './create-tribe/CreateTribeTypeStep';
import { CreateTribeDetailsStep } from './create-tribe/CreateTribeDetailsStep';
import { CreateTribeSuccessStep } from './create-tribe/CreateTribeSuccessStep';
import { CreateTribeFooter } from './create-tribe/CreateTribeFooter';

export const CreateTribeModal: React.FC = () => {
  const {
    showCreateTribeModal,
    createStep,
    topics,
    selectedTopics,
    toggleTopic,
    tribeType,
    setTribeType,
    tribeName,
    setTribeName,
    tribeDescription,
    setTribeDescription,
    nextStep,
    prevStep,
    handleSubmit,
    closeModal,
  } = useCreateTribe();

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
            <CreateTribeHeader step={createStep} onClose={closeModal} />

            {createStep === 1 && (
              <CreateTribeTopicsStep
                topics={topics}
                selectedTopics={selectedTopics}
                onToggleTopic={toggleTopic}
              />
            )}

            {createStep === 2 && (
              <CreateTribeTypeStep
                tribeType={tribeType}
                onTypeChange={setTribeType}
              />
            )}

            {createStep === 3 && (
              <CreateTribeDetailsStep
                tribeName={tribeName}
                setTribeName={setTribeName}
                tribeDescription={tribeDescription}
                setTribeDescription={setTribeDescription}
                tribeType={tribeType}
              />
            )}

            {createStep === 4 && (
              <CreateTribeSuccessStep tribeName={tribeName} />
            )}

            <CreateTribeFooter
              step={createStep}
              onBack={prevStep}
              onCancel={closeModal}
              onNext={nextStep}
              onSubmit={handleSubmit}
              onDone={closeModal}
              selectedTopicsCount={selectedTopics.length}
              tribeName={tribeName}
              tribeDescription={tribeDescription}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
