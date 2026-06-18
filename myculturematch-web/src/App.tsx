import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MainFeedColumn } from './components/feed/MainFeedColumn';
import { RightPanel } from './components/RightPanel';
import { TotemProfile } from './components/totem/TotemProfile';
import { ChatPage } from './pages/ChatPage';
import { useAppStore } from './stores/useAppStore';
import { useUIStore } from './stores/useUIStore';
import { cn } from './lib/utils';
import { motion } from 'framer-motion';

export default function App() {
  const { theme } = useAppStore();
  const { activeTab } = useUIStore();

  return (
    <QueryClientProvider client={queryClient}>
      <div
        className={cn(
          'h-screen w-full flex overflow-hidden font-sans transition-colors duration-300',
          theme === 'dark' ? 'dark bg-zinc-950 text-white' : 'bg-[#FEFEFE] text-app-black'
        )}
      >
        <Sidebar />

        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Header />

          <div className="flex-1 overflow-hidden px-4 md:px-10 pb-4 flex gap-8">
            {activeTab === 'Feed' || activeTab === 'Home' ? (
              <MainFeedColumn />
            ) : activeTab === 'Totem' ? (
              <TotemProfile />
            ) : activeTab === 'Chat' ? (
              <ChatPage />
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                  <div className="w-3 h-3 bg-app-black dark:bg-white rounded-full animate-bounce" />
                </div>
                <h2 className="font-bold text-lg select-none text-app-black dark:text-white">
                  {activeTab} module is loading
                </h2>
                <p className="text-sm text-app-gray max-w-md mt-1 select-none">
                  We are preparing intercultural insights and matchmaking resources for your community. Check back shortly!
                </p>
              </motion.div>
            )}

            {activeTab !== 'Chat' && <RightPanel />}
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}
