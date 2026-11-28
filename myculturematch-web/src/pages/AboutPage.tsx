import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, Camera, ChevronRight, Download, Heart, MapPin, MessageCircle,
  Plus, RefreshCw, ShieldCheck, Sparkles, SquarePen, Users,
} from 'lucide-react';
import logoMyCultureMatch from '@/assets/logo-myculturematch.png';
import heroImg from '@/assets/about-hero.jpg';
import resultThumb from '@/assets/about-hero.jpg';
import resultOne from '@/assets/about-result-1.jpg';
import resultTwo from '@/assets/about-result-2.jpg';
import storeImg from '@/assets/about-store.jpg';
import { useAppStore } from '@/src/stores/useAppStore';
import { useUIStore } from '@/src/stores/useUIStore';
import './about.css';

const TABS = [
  { key: 'post', label: 'Publier' },
  { key: 'love', label: 'Amour' },
  { key: 'friends', label: 'Amis' },
  { key: 'chat', label: 'Chat' },
];

const COLOR_CARDS = [
  {
    bg: 'bg-[#174ea6]', label: 'RACCOURCIS', tint: 'text-blue-200',
    title: 'Tapez @ pour accéder à votre communauté',
    image: 'post-shortcuts', icon: SquarePen,
  },
  {
    bg: 'bg-[#fde293]', label: 'RECHERCHE VOCALE', tint: 'text-[#5f6368]',
    title: 'Posez vos questions sur les traditions',
    image: 'voice-search', icon: MessageCircle,
  },
  {
    bg: 'bg-[#188038]', label: 'DES SOLUTIONS RAPIDES', tint: 'text-green-100',
    title: 'Trouvez un match en un clin d’œil',
    image: 'quick-match', icon: Heart,
  },
];

/** QR code SVG repris de la maquette (aucune image à charger). */
const QrSvg = () => (
  <svg className="w-full h-full text-[#202124]" viewBox="0 0 36 36" fill="currentColor">
    <path d="M2 2h10v10H2V2zm2 2v6h6V4H4zm2 2h2v2H6V6zm18-4h10v10H24V2zm2 2v6h6V4h-6zm2 2h2v2h-2V6zM2 24h10v10H2V24zm2 2v6h6v-6H4zm2 2h2v2H6v-2zm10-24h2v4h-2V4zm4 0h2v2h-2V4zm-2 4h2v4h-2V8zm-4 4h2v2h-2v-2zM4 16h4v2H4v-2zm6 0h2v4h-2v-4zm16 0h4v2h-4v-2zm6 2h2v4h-2v-4zm-14 6h4v2h-4v-2zm6 2h2v4h-2v-4zm4 4h4v4h-4v-4zm-8 2h2v2h-2v-2z"/>
  </svg>
);

/** Page About autonome, calquée sur la maquette fournie (sans sidebar). */
export const AboutPage = () => {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const { openAuthModal, setActiveTab } = useUIStore();
  const [activeTabPill, setActiveTabPill] = useState('post');
  const [, forceRefresh] = useState(0);
  const [lensTarget, setLensTarget] = useState(0);
  const [connectStep, setConnectStep] = useState(0);
  const [connectTick, setConnectTick] = useState(0);
  const selectConnect = (step: number) => { setConnectStep(step); setConnectTick((t) => t + 1); };
  const [qrOpen, setQrOpen] = useState(true);
  const lensQueries = ['Monstera Deliciosa', 'Tradition du Bénin', 'Rencontre culturelle'];
  const lensPositions = ['top-10 left-10', 'top-24 left-16', 'top-16 left-6'];
  const cycleLens = () => setLensTarget((v) => (v + 1) % lensQueries.length);
  useEffect(() => {
    const id = window.setInterval(() => setConnectStep((v) => (v + 1) % 3), 5000);
    return () => window.clearInterval(id);
  }, [connectTick]);

  const join = () => (isAuthenticated ? setActiveTab('Home') : openAuthModal());

  return (
    <div className="design-google min-h-full">
      {/* 1. HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button type="button" onClick={() => setActiveTab('Home')} className="flex items-center gap-2.5 group cursor-pointer">
            <img src={logoMyCultureMatch} alt="MyCultureMatch" className="w-8 h-8 object-contain rounded-lg transition-transform duration-300 group-hover:rotate-12" />
            <span className="text-[22px] font-medium tracking-tight text-[#5f6368]">MyCultureMatch</span>
          </button>
          <nav className="hidden md:flex items-center gap-1" aria-label="Navigation principale">
            <button type="button" onClick={() => setActiveTab('Home')} className="px-3 py-2 rounded text-[15px] font-medium text-[#5f6368] hover:text-[#202124] hover:bg-gray-100/80 transition-colors cursor-pointer">Accueil</button>
            <a href="#outils" className="px-3 py-2 rounded text-[15px] font-medium text-[#202124] relative after:content-[''] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[3px] after:bg-[#1a73e8] after:rounded-t">Par MyCultureMatch</a>
            <a href="#communaute" className="px-3 py-2 rounded text-[15px] font-medium text-[#5f6368] hover:text-[#202124] hover:bg-gray-100/80 transition-colors cursor-pointer">Communauté</a>
          </nav>
          <button type="button" onClick={join} className="bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium text-[15px] px-6 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer">
            <Download className="w-4 h-4" strokeWidth={2.2} />
            <span>{isAuthenticated ? 'Ouvrir l’application' : 'Rejoindre MyCultureMatch'}</span>
          </button>
        </div>
      </header>

      {/* 2. WIDGET QR FLOTTANT (SVG de la maquette) */}
      <aside className={`hidden xl:flex fixed right-0 top-24 z-30 bg-white rounded-l-[24px] shadow-chrome-high border border-gray-100 transition-transform duration-300 ${qrOpen ? 'translate-x-0' : 'translate-x-[calc(100%-2rem)]'}`}>
        <button type="button" onClick={() => setQrOpen((v) => !v)} aria-label="Réduire le QR code" className="px-2 py-6 flex items-center justify-center text-[#1a73e8] hover:bg-[#e8f0fe]/40 rounded-l-[24px] transition-colors cursor-pointer">
          <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${qrOpen ? '' : 'rotate-180'}`} strokeWidth={2.5} />
        </button>
        <div className="pr-4 py-3.5 flex flex-col items-center text-center w-[112px]">
          <div className="w-20 h-20 p-1.5 bg-white border border-gray-200 rounded-xl relative flex items-center justify-center">
            <QrSvg />
            <span className="w-5 h-5 rounded-full bg-white shadow flex items-center justify-center absolute">
              <span className="w-3.5 h-3.5 rounded-full bg-[#1a73e8] border-2 border-yellow-400" />
            </span>
          </div>
          <p className="text-[11px] leading-[14px] text-[#5f6368] mt-2 font-medium">Téléchargez MyCultureMatch pour votre téléphone</p>
        </div>
      </aside>

      <main>
        {/* 3. HERO — structure identique à la maquette (badge, H1, sous-titre, bento 12 colonnes) */}
      <section className="pt-12 sm:pt-16 pb-10 overflow-hidden">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 text-center">
          <h1 className="display-h1 text-[40px] sm:text-[56px] lg:text-[72px] text-[#202124] mb-6">
            Des fonctionnalités innovantes conçues par MyCultureMatch
          </h1>
          <p className="font-text text-[17px] sm:text-[19px] leading-[28px] text-[#5f6368] max-w-[700px] mx-auto">
            Grâce à des outils puissants comme Publier, Amour, Amis, Cartes et Chat, vous pouvez accomplir davantage. Et ils sont directement intégrés à votre expérience.
          </p>
        </div>

        <div className="mt-12 sm:mt-16 max-w-[1600px] mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Colonne gauche */}
            <div className="hidden lg:flex lg:col-span-3 flex-col gap-5 float-card-1">
              <div className="bg-[#e6f4ea] rounded-[24px] p-5 shadow-chrome-low">
                <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2.5 text-xs">
                  <div className="flex justify-between text-[#5f6368]"><span>Sous-total</span><span>55,00 €</span></div>
                  <div className="flex justify-between text-[#5f6368]"><span>Livraison</span><span>8,00 €</span></div>
                  <div className="border-t pt-2 flex justify-between font-bold text-[#202124] text-sm"><span>Total</span><span>63,00 €</span></div>
                  <div className="pt-1">
                    <div className="w-full bg-[#202124] text-white rounded-full py-2.5 px-4 flex items-center justify-center gap-1.5 font-medium text-xs">
                      <span>Rejoindre via</span><span className="font-bold">MyCultureMatch</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#1a73e8] rounded-[24px] p-5 overflow-hidden relative h-44 flex flex-col justify-between shadow-chrome-low">
                <div className="bg-white rounded-xl p-2.5 shadow-md flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#1a73e8] text-white text-[10px] font-bold flex items-center justify-center">M</span>
                  <span className="text-[11px] text-[#5f6368] truncate">Effectuez une recherche...</span>
                </div>
                <div className="flex items-end justify-between mt-4">
                  <div className="w-12 h-16 rounded-t-full bg-[#fbbc04] -mb-6" />
                  <div className="w-14 h-14 rounded-full bg-[#ea4335] -mb-4" />
                </div>
              </div>
            </div>

            {/* Carte centrale — démo de recherche visuelle (Lens → recherche MyCultureMatch) */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-[28px] shadow-chrome-high border border-gray-200/80 overflow-hidden grid grid-cols-1 sm:grid-cols-12">
                <div className="sm:col-span-6 relative min-h-[300px] sm:min-h-[380px] bg-[#e9ecef] overflow-hidden group">
                  <img src={heroImg} alt="Tradition culturelle analysée" className="w-full h-full object-cover" />
                  <div className={`lens-reticle absolute w-36 h-44 border-2 border-white rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.18)] pointer-events-none ${lensPositions[lensTarget]}`}>
                    <span className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-white rounded-tl-lg" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-white rounded-tr-lg" />
                    <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-white rounded-bl-lg" />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-white rounded-br-lg" />
                    <button type="button" onClick={cycleLens} title="Analyser une autre zone" className="pointer-events-auto absolute -bottom-4 -right-4 w-10 h-10 rounded-full bg-white shadow-chrome-high flex items-center justify-center text-[#1a73e8] hover:scale-110 transition-transform cursor-pointer">
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  <button type="button" onClick={cycleLens} className="absolute bottom-3 left-3 bg-white/90 backdrop-blur text-[#202124] text-xs font-medium px-3 py-1.5 rounded-full shadow hover:bg-white transition cursor-pointer">
                    Tester la recherche ↻
                  </button>
                </div>
                <div className="sm:col-span-6 p-5 bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 bg-[#f1f3f4] rounded-full px-3.5 py-2 mb-4">
                      <img src={logoMyCultureMatch} alt="" className="w-5 h-5 object-contain" />
                      <img src={resultThumb} alt="Miniature" className="w-6 h-6 rounded-md object-cover" />
                      <span className="text-xs font-medium text-[#202124] truncate">{lensQueries[lensTarget]}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <div className="h-28 rounded-2xl overflow-hidden"><img src={resultOne} alt="Résultat 1" className="w-full h-full object-cover" /></div>
                        <div className="h-2.5 w-4/5 bg-gray-200 rounded-full" />
                        <div className="h-2 w-1/2 bg-[#e6f4ea] rounded-full" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-28 rounded-2xl overflow-hidden"><img src={resultTwo} alt="Résultat 2" className="w-full h-full object-cover" /></div>
                        <div className="h-2.5 w-3/4 bg-gray-200 rounded-full" />
                        <div className="h-2 w-2/3 bg-gray-100 rounded-full" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-[#5f6368]">
                    <span>Correspondances visuelles</span>
                    <span className="text-[#1a73e8] font-semibold">Recherche MyCultureMatch</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne droite */}
            <div className="hidden lg:flex lg:col-span-3 flex-col gap-5 float-card-2">
              <div className="bg-[#1a73e8] rounded-[24px] p-5 overflow-hidden relative h-44 flex flex-col justify-between shadow-chrome-low">
                <div className="bg-white rounded-xl p-2.5 shadow-md flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#1a73e8] text-white text-[10px] font-bold flex items-center justify-center">M</span>
                  <span className="text-[11px] text-[#5f6368] truncate">Effectuez une recherche</span>
                </div>
                <div className="flex items-end justify-between mt-4">
                  <div className="w-12 h-14 rounded-t-full bg-[#fbbc04] -mb-5" />
                  <div className="w-14 h-14 rounded-full bg-[#ea4335] -mb-4" />
                </div>
              </div>
              <div className="bg-[#e8f0fe] rounded-[24px] p-6 flex items-center justify-around shadow-chrome-low">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#1a73e8]"><SquarePen className="w-6 h-6" /></div>
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#ea4335]"><Heart className="w-6 h-6" /></div>
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#188038]"><Users className="w-6 h-6" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. RECHERCHE + PILLES + CARTES COLORÉES */}
        <section className="py-12 sm:py-16">
          <div className="max-w-[1040px] mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-5">
                <h2 className="display-h4 text-[28px] sm:text-[36px] text-[#202124]">Trouvez ce que vous cherchez</h2>
              </div>
              <div className="md:col-span-7">
                <p className="font-text text-[17px] leading-[28px] text-[#5f6368]">
                  Avec MyCultureMatch, publiez une tradition, trouvez un match, retrouvez vos amis ou explorez votre quartier — tout sans quitter la communauté.
                </p>
              </div>
            </div>
            <div className="mt-14 flex justify-center">
              <nav aria-label="Catégories de fonctionnalités" className="inline-flex items-center gap-1 bg-white p-1.5 rounded-full shadow-chrome-mid border border-gray-200/80 overflow-x-auto no-scrollbar max-w-full">
                {TABS.map((tab) => (
                  <button key={tab.key} type="button" onClick={() => setActiveTabPill(tab.key)} className={`px-5 py-2.5 rounded-full text-[15px] font-medium transition-all whitespace-nowrap cursor-pointer ${activeTabPill === tab.key ? 'bg-[#f1f3f4] text-[#202124]' : 'text-[#5f6368] hover:text-[#202124]'}`}>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 mt-14">
            <div className="text-center max-w-[760px] mx-auto mb-12 sm:mb-16">
              <h2 className="display-h2 text-[36px] sm:text-[48px] lg:text-[60px] text-[#202124] mb-4">Conseils et astuces pour faire vivre votre culture</h2>
              <p className="font-text text-[18px] text-[#5f6368]">Découvrez ces astuces pour profiter pleinement de MyCultureMatch.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {COLOR_CARDS.map(({ bg, label, tint, title, image, icon: Icon }) => (
                <motion.article key={image} whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }} className={`${bg} rounded-[24px] p-8 pb-0 text-white flex flex-col justify-between overflow-hidden relative min-h-[470px] group shadow-chrome-mid`}>
                  <div>
                    <span className={`block text-[12px] font-semibold tracking-[0.08em] uppercase ${tint} mb-3`}>{label}</span>
                    <h3 className="display-h1 text-[30px] sm:text-[34px] leading-tight">{title}</h3>
                  </div>
                  <div className="mt-8 -mx-2">
                    <img src={image === 'post-shortcuts' ? resultOne : image === 'voice-search' ? resultTwo : storeImg} alt={label} className="w-full h-[220px] object-cover" />
                  </div>
                  <button type="button" onClick={join} aria-label="Ajouter" className="absolute bottom-5 right-5 w-11 h-11 rounded-full bg-[#1a73e8] text-white flex items-center justify-center shadow-chrome-high hover:scale-105 transition-transform cursor-pointer z-10">
                    <Plus className="w-5 h-5" />
                  </button>
                  <Icon className="w-5 h-5 absolute top-6 right-6 opacity-50" />
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* 5. GRANDE CARTE SHOWCASE */}
        <section id="outils" className="py-14 sm:py-24">
          <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
            <div className="text-center max-w-[780px] mx-auto mb-12 sm:mb-16">
              <h2 className="display-h2 text-[36px] sm:text-[52px] lg:text-[60px] text-[#202124]">Des outils performants pour réussir à tout faire</h2>
            </div>
            <div className="bg-[#e8f0fe] rounded-[28px] p-6 sm:p-12 lg:p-16 relative overflow-hidden">
              <button type="button" onClick={() => forceRefresh((v) => v + 1)} title="Changer l’aperçu" className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white shadow-chrome-low flex items-center justify-center text-[#5f6368] hover:text-[#1a73e8] transition cursor-pointer z-20">
                <RefreshCw className="w-5 h-5" />
              </button>
              <div className="relative flex items-center justify-center py-4">
                <div className="hidden md:block w-64 h-44 bg-[#1a73e8] rounded-2xl shadow-lg -mr-12 -translate-y-2 p-4 text-white">
                  <div className="bg-white/95 rounded-full px-3 py-1 text-[10px] text-[#5f6368] mb-6">Publier une tradition</div>
                  <div className="text-center font-bold text-xl">MyCultureMatch</div>
                </div>
                <div className="w-full max-w-[640px] bg-white rounded-2xl shadow-chrome-high border border-gray-200 overflow-hidden z-10">
                  <div className="bg-[#e8eaed] px-4 py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#34a853]" /><span className="font-semibold text-[#202124]">Communauté — Traditions</span></div>
                    <div className="flex gap-2 text-gray-500"><span>—</span><span>❐</span><span>✕</span></div>
                  </div>
                  <div className="p-6">
                    <img src={heroImg} alt="Aperçu de votre communauté" className="w-full h-full object-cover rounded-2xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. CONNEXION — accordéon chronométré et panneau visuel de la maquette */}
        <section id="connexion" className="py-12 sm:py-20">
          <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              <div className="lg:col-span-6">
                <div className="bg-[#e6f4ea] rounded-[28px] p-6 sm:p-10 min-h-[420px] flex items-center justify-center transition-colors duration-500">
                  {connectStep === 0 && (
                    <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-chrome-high overflow-hidden">
                      <div className="bg-[#f1f3f4] px-3 py-2 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /><span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /><span className="w-2.5 h-2.5 rounded-full bg-green-400" /></div>
                        <span>myculturematch.example</span>
                      </div>
                      <div className="p-5 relative">
                        <div className="bg-white border border-gray-200 rounded-xl shadow-chrome-mid p-3 mb-4">
                          <div className="flex items-center justify-between text-xs border-b pb-2 mb-2">
                            <span className="text-[#5f6368]">Profil détecté</span>
                            <span className="text-[#1a73e8] font-semibold border-b-2 border-[#1a73e8] pb-1">Français</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-medium text-[#202124]">
                            <img src={logoMyCultureMatch} alt="" className="w-4 h-4 object-contain" />
                            <span>MyCultureMatch</span>
                          </div>
                        </div>
                        <h4 className="font-serif text-2xl text-[#202124] mb-2">Les traditions du Bénin</h4>
                        <p className="text-xs text-[#5f6368] leading-relaxed mb-4">Découvrez comment les rituels et les recettes racontent l’histoire d’un peuple et se transmettent de génération en génération.</p>
                        <button type="button" onClick={() => selectConnect(1)} className="bg-[#188038] text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-[#137333] transition cursor-pointer">Basculer Profil / Communauté</button>
                      </div>
                    </div>
                  )}
                  {connectStep === 1 && (
                    <div className="w-full max-w-[360px] bg-[#1e1e2e] rounded-2xl shadow-chrome-high overflow-hidden text-white p-6 text-center relative">
                      <div className="border-2 border-white/80 rounded-2xl p-6 my-4 bg-gradient-to-b from-purple-900/50 to-indigo-950/80">
                        <span className="inline-block bg-white/20 backdrop-blur px-3 py-1 rounded-md text-sm font-bold tracking-wide mb-2">FESTIVAL DES TRADITIONS</span>
                        <p className="text-xs text-purple-200">16 Juillet, 20h00 — Cotonou, Bénin</p>
                      </div>
                      <div className="inline-flex items-center gap-2 bg-white text-[#202124] px-4 py-2 rounded-full text-xs font-semibold shadow">
                        <span className="text-[#1a73e8]">文A</span>
                        <span>Traduit instantanément</span>
                      </div>
                    </div>
                  )}
                  {connectStep === 2 && (
                    <div className="w-full max-w-[400px] bg-[#202124] rounded-2xl shadow-chrome-high overflow-hidden text-white p-6">
                      <div className="h-36 rounded-xl bg-gradient-to-tr from-[#1a73e8] to-blue-400 flex items-center justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-white/25 flex items-center justify-center"><span className="text-xl">▶</span></div>
                      </div>
                      <div className="bg-black/80 border border-white/15 rounded-xl p-3.5 text-xs leading-relaxed">
                        <span className="text-[10px] uppercase tracking-wider text-blue-300 block mb-1">Sous-titres instantanés · MyCultureMatch</span>
                        « Bienvenue dans ce nouvel épisode consacré aux innovations du web moderne... »
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-6 space-y-6">
                {[
                  {
                    title: 'Retrouvez vos traditions en un clic.',
                    desc: 'Vos publications et vos tribus restent accessibles partout.',
                    link: 'En savoir plus sur votre compte',
                  },
                  {
                    title: 'Échangez où que vous soyez avec le chat.',
                    desc: 'Vos conversations suivent votre rythme, sur tous vos écrans.',
                    link: 'Découvrir le chat',
                  },
                  {
                    title: 'Suivez vos matchs amoureux en temps réel.',
                    desc: 'Les personnes qui partagent vos valeurs sont à portée de main.',
                    link: undefined,
                  },
                ].map((item, i) => (
                  <button key={item.title} type="button" onClick={() => selectConnect(i)} className="block w-full text-left pl-6 relative py-2 cursor-pointer">
                    <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gray-200 rounded-full overflow-hidden">
                      <span key={`${connectStep}-${connectTick}`} className={`block w-full bg-[#1a73e8] ${connectStep === i ? 'accordion-progress-active' : 'h-0'}`} />
                    </span>
                    <h3 className="text-[22px] sm:text-[26px] font-bold text-[#202124] mb-2">{item.title}</h3>
                    <div className="space-y-3">
                      <p className="font-text text-[16px] leading-[26px] text-[#5f6368]">{item.desc}</p>
                      {item.link && (
                        <span className="inline-flex items-center gap-1 text-[#1a73e8] font-medium text-[15px] hover:underline">
                          <span>{item.link}</span><span>↗</span>
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 7. UN MONDE PLUS CONNECTÉ */}
        <section id="communaute" className="py-12 sm:py-20">
          <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
            <h2 className="display-h2 text-[36px] sm:text-[52px] text-center text-[#202124] mb-16">Un monde plus connecté, pour tous</h2>
            {[
              { tag: 'AMOUR', title: 'Des rencontres qui vous ressemblent', text: 'MyCultureMatch vous met en relation avec des personnes qui partagent vos valeurs, vos origines et vos curiosités.', image: 'love-feature' },
              { tag: 'CARTES', title: 'Les cultures autour de vous', text: 'Explorez votre quartier, repérez les communautés proches et trouvez des événements à vivre ensemble.', image: 'maps-feature' },
              { tag: 'CHAT', title: 'Des fonctionnalités adaptées à vos besoins', text: 'Échangez par messages, partagez vos souvenirs et gardez le lien avec vos amis et vos matchs.', image: 'chat-feature' },
            ].map((row, i) => (
              <div key={row.tag} className={`grid md:grid-cols-2 gap-10 items-center mb-16 ${i % 2 ? 'md:grid-flow-row-dense' : ''}`}>
                <div className={i % 2 ? 'md:col-start-2' : ''}>
                  <span className="block text-[12px] font-semibold tracking-[0.08em] uppercase text-[#5f6368] mb-3">{row.tag}</span>
                  <h3 className="display-h1 text-[32px] sm:text-[44px] text-[#202124]">{row.title}</h3>
                  <p className="font-text text-[17px] leading-[28px] text-[#5f6368] mt-4">{row.text}</p>
                  <button type="button" onClick={join} className="mt-5 text-[#1967d2] font-medium text-[16px] cursor-pointer">En savoir plus ↗</button>
                </div>
                <div className={i % 2 ? 'md:col-start-1 md:row-start-1' : ''}>
                  <img src={row.image === 'love-feature' ? resultOne : row.image === 'maps-feature' ? resultTwo : storeImg} alt={row.tag} className="w-full h-80 object-cover rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 8. RESSOURCES SUPPLÉMENTAIRES — mise en page exacte de la maquette */}
        <section className="py-14 sm:py-20">
          <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
            <h2 className="display-h4 text-[28px] sm:text-[36px] text-center text-[#202124] mb-12">Avez-vous d’autres questions ?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col">
                <div className="bg-[#e6f4ea] rounded-[24px] h-44 flex flex-col items-center justify-center mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full bg-[#4285F4]" /><span className="w-3 h-3 rounded-full bg-[#EA4335]" /><span className="w-3 h-3 rounded-full bg-[#FBBC05]" /><span className="w-3 h-3 rounded-full bg-[#34A853]" />
                  </div>
                  <span className="font-medium text-sm text-[#5f6368]">MyCultureMatch</span>
                </div>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[#5f6368] mb-2">NOTRE MISSION</span>
                <h3 className="font-bold text-[19px] text-[#202124] mb-2">Faire circuler les cultures et les traditions</h3>
                <p className="font-text text-[15px] text-[#5f6368] mb-4 flex-1">Découvrez comment MyCultureMatch rapproche les personnes autour de ce qui fait leur culture.</p>
                <button type="button" onClick={join} className="inline-flex items-center gap-1 text-[#1a73e8] font-medium text-[15px] hover:underline w-fit cursor-pointer"><span>En savoir plus</span><span>↗</span></button>
              </div>
              <div className="flex flex-col">
                <div className="bg-[#fef7e0] rounded-[24px] h-44 flex items-center justify-center mb-5">
                  <div className="w-16 h-16 rounded-full bg-white shadow-chrome-low flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full border-4 border-[#34A853] border-t-[#EA4335] border-r-[#FBBC05] flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-[#1a73e8]" />
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[#5f6368] mb-2">NOUVEAUTÉS</span>
                <h3 className="font-bold text-[19px] text-[#202124] mb-2">Découvrez toutes les nouveautés</h3>
                <p className="font-text text-[15px] text-[#5f6368] mb-4 flex-1">Explorez les dernières fonctionnalités conçues pour rendre vos échanges plus simples.</p>
                <button type="button" onClick={join} className="inline-flex items-center gap-1 text-[#1a73e8] font-medium text-[15px] hover:underline w-fit cursor-pointer"><span>Explorer MyCultureMatch</span><span>↗</span></button>
              </div>
              <div className="flex flex-col">
                <div className="bg-[#e8f0fe] rounded-[24px] h-44 flex items-center justify-center mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-[#1a73e8] text-white shadow-chrome-low flex items-center justify-center font-bold text-2xl">M</div>
                </div>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[#5f6368] mb-2">SÉCURITÉ</span>
                <h3 className="font-bold text-[19px] text-[#202124] mb-2">Naviguez en toute confiance</h3>
                <p className="font-text text-[15px] text-[#5f6368] mb-4 flex-1">Protégez vos données et vos échanges grâce aux outils de sécurité intégrés.</p>
                <button type="button" onClick={join} className="inline-flex items-center gap-1 text-[#1a73e8] font-medium text-[15px] hover:underline w-fit cursor-pointer"><span>En savoir plus</span><span>↗</span></button>
              </div>
            </div>
          </div>
        </section>

        {/* 9. BANDE FINALE */}
        <section className="py-10 sm:py-16">
          <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
            <div className="bg-[#1a73e8] rounded-[28px] px-6 py-14 sm:p-16 text-center text-white relative overflow-hidden">
              <div className="max-w-[620px] mx-auto relative z-10">
                <h2 className="display-h2 text-[34px] sm:text-[48px] mb-4">Emportez MyCultureMatch avec vous</h2>
                <p className="font-text text-[17px] text-blue-100 mb-8">Connectez-vous sur votre téléphone ou votre ordinateur et retrouvez la même expérience partout.</p>
                <button type="button" onClick={join} className="bg-white text-[#1a73e8] hover:bg-blue-50 font-semibold text-[16px] px-7 py-3.5 rounded-full shadow-chrome-high transition-all inline-flex items-center gap-2.5 cursor-pointer">
                  <Download className="w-5 h-5" /> Connexion
                </button>
              </div>
              <div className="hidden md:flex flex-col items-center bg-white text-[#202124] rounded-t-2xl p-3 pb-4 shadow-chrome-high absolute bottom-0 right-10 w-28">
                <div className="w-20 h-20 border border-gray-200 rounded-lg p-1 flex items-center justify-center"><QrSvg /></div>
                <span className="text-[10px] leading-tight text-[#5f6368] mt-1.5 font-medium">Scannez pour obtenir l’appli</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 10. FOOTER */}
      <footer className="bg-[#f8f9fa] border-t border-gray-200 mt-12 text-[#5f6368] text-[14px]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center gap-5 pb-8 border-b border-gray-200 mb-8">
            <span className="font-medium text-[#202124]">Suivez-nous</span>
            {['▶', '𝕏', 'f', 'in', '▶'].map((s) => <span key={s} className="w-7 h-7 rounded bg-[#202124] text-white flex items-center justify-center text-xs">{s}</span>)}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-8">
            {[
              { title: 'MyCultureMatch', links: ['Home', 'Explorer', 'Communauté'] },
              { title: 'Découvrir', links: ['Traditions', 'Tribus', 'Cartes'] },
              { title: 'Rencontrer', links: ['Amour', 'Amis', 'Chat'] },
              { title: 'Entreprise', links: ['À propos', 'Nouveautés', 'Presse'] },
              { title: 'Assistance', links: ['Aide', 'Confidentialité', 'Conditions'] },
            ].map((col) => (
              <div key={col.title}>
                <h3 className="font-semibold text-[#202124] mb-4">{col.title}</h3>
                <ul className="space-y-2">{col.links.map((l) => <li key={l}>{l} ↗</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-5 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><img src={logoMyCultureMatch} alt="" className="w-6 h-6 object-contain" /><span className="font-medium text-[#202124]">MyCultureMatch</span></div>
          <div className="flex gap-5"><span>Confidentialité et conditions d’utilisation</span><span>À propos</span><span>France · Français</span></div>
        </div>
      </footer>
    </div>
  );
};
