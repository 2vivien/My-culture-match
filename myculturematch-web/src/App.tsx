import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { authService } from './services/authService';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MainFeedColumn } from './components/feed/MainFeedColumn';
import { RightPanel } from './components/RightPanel';
import { ProfilePage } from './components/profile/ProfilePage';
import { ChatPopup } from './components/chat/ChatPopup';
import { ExploreColumn } from './components/explore/ExploreColumn';
import { TribuDetailView } from './components/explore/TribuDetailView';
import { TribuSettingsView } from './components/explore/TribuSettingsView';
import { CreatePostView } from './components/feed/CreatePostView';
import { PostDetailPage } from './components/feed/PostDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { LoveColumn } from './components/explore/LoveColumn';
import { CreateTribeModal } from './components/explore/CreateTribeModal';
import { useAppStore } from './stores/useAppStore';
import { useUIStore } from './stores/useUIStore';
import { startRouter } from './lib/router';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthModal } from './components/auth/AuthModal';
import { OnboardingPage } from './pages/OnboardingPage';
import { ConnexionPage } from './pages/ConnexionPage';
import { AdminPage } from './pages/AdminPage';
import { AboutPage } from './pages/AboutPage';

export default function App() {
  const { theme, isAuthenticated, isOnboarded } = useAppStore();
  const { activeTab } = useUIStore();

  useEffect(() => {
    authService.restoreSession();
    // Routeur History API : deep-links (/profil/:id, /tribu/:id, ...) + back/forward navigateur.
    // Les stores sont abonnés au routeur : l'URL se met à jour à chaque navigation.
    startRouter();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <AnimatePresence mode="wait">
        {isAuthenticated && !isOnboarded ? (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <OnboardingPage />
          </motion.div>
        ) : activeTab === 'About' ? (
          <motion.div
            key="about"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full overflow-y-auto bg-[#FEFEFE] dark:bg-[#0d1117]"
          >
            <AboutPage />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'h-screen w-full flex overflow-hidden font-sans transition-colors duration-300',
              theme === 'dark' ? 'dark bg-zinc-950 text-white' : 'bg-[#FEFEFE] text-app-black dark:text-zinc-100'
            )}
          >
            <Sidebar />

            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <Header />

              <div className={cn(
                "flex-1 overflow-hidden flex",
                "px-4 md:px-10 pb-4 gap-8",
                activeTab === 'PostDetail' && 'bg-zinc-100/70 dark:bg-zinc-900/30 rounded-2xl'
              )}>
                {activeTab === 'Feed' || activeTab === 'Home' || activeTab === 'Popular' || activeTab === 'New' ? (
                  <MainFeedColumn />
                ) : activeTab === 'Love' ? (
                  <LoveColumn />
                ) : activeTab === 'Profil' ? (
                  <ProfilePage />
                ) : activeTab === 'Explore' ? (
                  <ExploreColumn />
                ) : activeTab === 'Tribu' ? (
                  <TribuDetailView />
                ) : activeTab === 'TribuSettings' ? (
                  <TribuSettingsView />
                ) : activeTab === 'Create' ? (
                  <CreatePostView />
                ) : activeTab === 'PostDetail' ? (
                  <PostDetailPage />
                ) : activeTab === 'Notifications' ? (
                  <NotificationsPage />
                ) : activeTab === 'Settings' ? (
                  <SettingsPage />
                ) : activeTab === 'Friends' || activeTab === 'Connexion' || activeTab === 'Connections' ? (
                  <ConnexionPage />
                ) : activeTab === 'Admin' ? (
                  <AdminPage />
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

                {(activeTab === 'Home' || activeTab === 'Feed' || activeTab === 'Popular' || activeTab === 'New') && <RightPanel />}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Home accessible sans compte : la connexion s'ouvre en popup, sans changer de page. */}
      <AuthModal />
      <ChatPopup />
      <CreateTribeModal />
    </QueryClientProvider>
  );
}
