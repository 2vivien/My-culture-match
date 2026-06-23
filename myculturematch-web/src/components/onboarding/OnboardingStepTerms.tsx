import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ChevronRight } from 'lucide-react';

interface OnboardingStepTermsProps {
  acceptedTerms: boolean;
  checkedTermsCheckbox: boolean;
  setCheckedTermsCheckbox: (checked: boolean) => void;
  setAcceptedTerms: (accepted: boolean) => void;
}

export const OnboardingStepTerms: React.FC<OnboardingStepTermsProps> = ({
  acceptedTerms,
  checkedTermsCheckbox,
  setCheckedTermsCheckbox,
  setAcceptedTerms,
}) => {
  return (
    <AnimatePresence>
      {!acceptedTerms && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-md flex items-start justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ y: -200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -200, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8 flex flex-col gap-6 mt-12 mb-12"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Info className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-xl text-zinc-900 dark:text-white">
                Conditions Générales d'Utilisation
              </h3>
              <p className="text-xs text-zinc-400 mt-1 uppercase font-bold tracking-wider">
                Contrat de communauté MyCultureMatch
              </p>
            </div>

            <div className="space-y-4 max-h-[320px] overflow-y-auto border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/55 scrollbar-thin text-xs sm:text-sm text-zinc-600 dark:text-zinc-350 leading-relaxed font-medium">
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-xs uppercase tracking-wider mb-1">1. Respect de l'Héritage Culturel</h4>
                <p>Notre communauté est un espace sacré dédié au partage sincère des traditions. Tout comportement offensant, harcèlement ou dénigrement culturel entraînera un bannissement immédiat et définitif.</p>
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-xs uppercase tracking-wider mb-1">2. Authenticité des données</h4>
                <p>Vous vous engagez à fournir des informations véridiques concernant votre identité, vos origines et votre biographie. L'usurpation d'identité est formellement interdite.</p>
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-xs uppercase tracking-wider mb-1">3. Confidentialité et Matchmaking</h4>
                <p>Les informations collectées lors de cet onboarding servent uniquement à affiner notre algorithme pour vous proposer vos Trios Hebdos et suggestions. Elles ne seront jamais revendues.</p>
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-xs uppercase tracking-wider mb-1">4. Conditions d'Accès</h4>
                <p>L'accès à l'application est réservé aux personnes majeures de 18 ans et plus. En continuant, vous confirmez remplir cette condition essentielle.</p>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={checkedTermsCheckbox}
                onChange={(e) => setCheckedTermsCheckbox(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary accent-primary cursor-pointer"
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold leading-normal">
                J'accepte sans réserve les conditions générales d'utilisation ainsi que la politique de confidentialité de MyCultureMatch.
              </span>
            </label>

            <button
              type="button"
              onClick={() => setAcceptedTerms(true)}
              disabled={!checkedTermsCheckbox}
              className={`w-full py-4 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all active:scale-[0.98] select-none flex items-center justify-center gap-2 ${
                checkedTermsCheckbox 
                  ? 'bg-primary cursor-pointer hover:bg-opacity-95 shadow-primary/20' 
                  : 'bg-zinc-300 dark:bg-zinc-800 opacity-60 pointer-events-none'
              }`}
            >
              <span>Accepter et Continuer</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
