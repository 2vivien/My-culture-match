import { useState } from 'react';
import { Mail } from 'lucide-react';
import { useUIStore } from '@/src/stores/useUIStore';
import slide1 from '@/assets/screensplash/img-u7532529069045057930-1-non-916-oui-mais-je-veux-n-fond-comme-sa-stp-pas-trop-biza.jpg';
import slide2 from '@/assets/screensplash/img-u7532529069045057930-2-non-916-oui-mais-je-veux-n-fond-comme-sa-stp-pas-trop-biza.jpg';
import slide3 from '@/assets/screensplash/img-u7532529069045057930-3-non-916-oui-mais-je-veux-n-fond-comme-sa-stp-pas-trop-biza.jpg';
import slide4 from '@/assets/screensplash/img-u7532529069045057930-4-non-916-oui-mais-je-veux-n-fond-comme-sa-stp-pas-trop-biza.jpg';
import slide5 from '@/assets/screensplash/img-u7532529069045057930-5-non-916-oui-mais-je-veux-n-fond-comme-sa-stp-pas-trop-biza.jpg';
import slide6 from '@/assets/screensplash/img-u7532529069045057930-6-non-916-oui-mais-je-veux-n-fond-comme-sa-stp-pas-trop-biza.jpg';
import slide7 from '@/assets/screensplash/img-u7532529069045057930-7-non-916-oui-mais-je-veux-n-fond-comme-sa-stp-pas-trop-biza.jpg';
import slide8 from '@/assets/screensplash/img-u7532529069045057930-8-non-916-oui-mais-je-veux-n-fond-comme-sa-stp-pas-trop-biza.jpg';

const SLIDES = [
  { image: slide1, title: 'Where culture meets connection', subtitle: 'Connect with people who truly understand you.' },
  { image: slide2, title: 'Different cultures, one connection', subtitle: 'Find love, friendship & meaningful bonds.' },
  { image: slide3, title: 'Same culture, real stories', subtitle: 'Discover relationships built on respect & values.' },
  { image: slide4, title: 'Friendship, love, everything in between', subtitle: "More than dating. It's about real connection." },
  { image: slide5, title: 'Your culture, your match', subtitle: 'Match with people who share your values.' },
  { image: slide6, title: 'United by respect, connected by heart', subtitle: 'Cultures may differ, but hearts speak the same language.' },
  { image: slide7, title: 'From friendship to forever', subtitle: 'Build friendships today, create memories for life.' },
  { image: slide8, title: 'One world, many cultures, endless possibilities', subtitle: 'Your journey to love, friendship & belonging starts here.' },
];

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const AppleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z" />
  </svg>
);

/** Bloc d'accueil et carrousel éditorial affichés en bas de la sidebar pour un visiteur. */
export const GuestSidebarPanel = () => {
  const [index, setIndex] = useState(0);
  const { openAuthModal } = useUIStore();
  const slide = SLIDES[index]!;

  return (
    <div className="flex h-full min-h-full flex-col rounded-[20px] border border-app-border bg-[#FAF8F4] p-4 shadow-sm">
      {/* Titre et sous-titre de l'écran actif, avant les boutons. */}
      <h3 className="pt-2 text-center text-[17px] font-black uppercase leading-tight text-app-black">
        {slide.title}
      </h3>
      <p className="mt-1 text-center text-[11px] leading-snug text-app-gray">
        {slide.subtitle}
      </p>

      <div className="mt-5 space-y-3">
        <button
          type="button"
          onClick={openAuthModal}
          className="w-full py-2 px-3 rounded-xl border border-app-border bg-white text-xs font-bold text-app-black hover:bg-zinc-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <GoogleIcon /> Continuer avec Google
        </button>
        <button
          type="button"
          onClick={openAuthModal}
          className="w-full py-2 px-3 rounded-xl border border-app-border bg-white text-xs font-bold text-app-black hover:bg-zinc-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <AppleIcon /> Continuer avec Apple
        </button>
        <button
          type="button"
          onClick={openAuthModal}
          className="w-full py-2 px-3 rounded-xl border border-app-border bg-white text-xs font-bold text-app-black hover:bg-zinc-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <Mail className="w-4 h-4" /> Utiliser une adresse email
        </button>
      </div>

      <p className="mt-4 text-[10px] leading-snug text-app-gray text-center">
        En continuant, tu acceptes notre{" "}
        <button type="button" onClick={openAuthModal} className="text-blue-600 underline hover:text-blue-700 cursor-pointer">
          Contrat d&apos;utilisation
        </button>{" "}
        et reconnais que tu comprends notre{" "}
        <button type="button" onClick={openAuthModal} className="text-blue-600 underline hover:text-blue-700 cursor-pointer">
          Politique de confidentialité
        </button>
        .
      </p>

      <div className="mt-6 h-px bg-app-border" />

      {/* L'image occupe toute la hauteur restante, sans vide en bas. */}
      <div className="relative mt-6 min-h-[280px] flex-1">
        <img
          src={slide.image}
          alt={slide.title}
          className="h-full w-full object-cover object-center rounded-2xl select-none"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-12 rounded-t-2xl bg-gradient-to-b from-[#FAF8F4] to-transparent" />
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {SLIDES.map((item, dot) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setIndex(dot)}
            aria-label={`Voir l'écran ${dot + 1}`}
            className={`h-2.5 rounded-full cursor-pointer transition-all ${dot === index ? 'w-5 bg-[#8B4A2B]' : 'w-2.5 bg-zinc-300 hover:bg-zinc-400'}`}
          />
        ))}
      </div>
    </div>
  );
};
