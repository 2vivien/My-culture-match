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

/** Bloc d'accueil et carrousel éditorial affichés en bas de la sidebar pour un visiteur. */
export const GuestSidebarPanel = () => {
  const [index, setIndex] = useState(0);
  const { openAuthModal } = useUIStore();
  const slide = SLIDES[index]!;

  return (
    <div className="flex h-full min-h-full flex-col rounded-[20px] border border-app-border bg-[#FAF8F4] p-4 shadow-sm">
      {/* Titre et sous-titre de l'écran actif, avant les boutons. */}
      <h3 className="text-center text-[17px] font-black uppercase leading-tight text-app-black">
        {slide.title}
      </h3>
      <p className="mt-1 text-center text-[11px] leading-snug text-app-gray">
        {slide.subtitle}
      </p>

      <div className="mt-5 space-y-3">
        <button
          type="button"
          onClick={openAuthModal}
          className="w-full py-2 px-3 rounded-xl border border-app-border bg-white text-xs font-bold text-app-black hover:bg-zinc-50 transition-colors cursor-pointer"
        >
          <span className="text-[#4285F4] font-black mr-1">G</span> Continuer avec Google
        </button>
        <button
          type="button"
          onClick={openAuthModal}
          className="w-full py-2 px-3 rounded-xl border border-app-border bg-white text-xs font-bold text-app-black hover:bg-zinc-50 transition-colors cursor-pointer"
        >
          <span className="mr-1">●</span> Continuer avec Apple
        </button>
        <button
          type="button"
          onClick={openAuthModal}
          className="w-full py-2 px-3 rounded-xl border border-app-border bg-white text-xs font-bold text-app-black hover:bg-zinc-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <Mail className="w-4 h-4" /> Utiliser une adresse email
        </button>
      </div>

      <p className="mt-3 text-[10px] leading-snug text-app-gray text-center">
        En continuant, tu acceptes notre Contrat d&apos;utilisation et la Politique de confidentialité.
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
