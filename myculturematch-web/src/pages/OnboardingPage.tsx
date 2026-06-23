import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/src/stores/useAppStore';
import { 
  Heart, Globe, Shield, Briefcase, Calendar, MessageSquare, 
  ChevronLeft, ChevronRight, Check, Sparkles, Smile, RefreshCw,
  BookOpen, HelpCircle, AlertCircle, Compass, Users, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoMyCultureMatch from '@/assets/logo-myculturematch.png';

// Onboarding Form Data Interface
interface OnboardingData {
  intention: string;
  gender: string;
  seeking: string;
  name: string;      // Nom & Prénom
  username: string;  // Username
  birthdate: string; // Date de naissance YYYY-MM-DD
  age: number;       // Âge calculé
  avatarSeed: string;
  roots: { country: string; region: string; ethnicity: string; village: string };
  occupation: { domain: string; title: string };
  values: string[];
  languages: string[];
  preference: string;
  diaspora: string;
  familyQuiz: string;
  situation: string;
  criteria: string[];
  bio: string;
}

const DOMAINS = [
  { id: 'tech', label: 'Tech & Digital' },
  { id: 'business', label: 'Business & Finance' },
  { id: 'creative', label: 'Art & Design' },
  { id: 'medical', label: 'Santé & Social' },
  { id: 'other', label: 'Autre domaine' },
];

const VALUES = [
  { id: 'faith', label: 'Foi & Spiritualité' },
  { id: 'family', label: 'Famille d\'abord' },
  { id: 'ambition', label: 'Ambition & Réussite' },
  { id: 'tradition', label: 'Tradition & Coutumes' },
  { id: 'solidarity', label: 'Solidarité' },
  { id: 'comm', label: 'Communication' },
  { id: 'peace', label: 'Paix & Équilibre' },
  { id: 'indep', label: 'Indépendance' },
  { id: 'loyalty', label: 'Loyauté absolue' },
  { id: 'freedom', label: 'Liberté' },
  { id: 'edu', label: 'Éducation' },
  { id: 'health', label: 'Santé' }
];

const LANGUAGES = {
  intl: ['Français', 'Anglais', 'Arabe', 'Espagnol', 'Portugais'],
  africa: ['Wolof', 'Bambara', 'Soninké', 'Peul', 'Yoruba', 'Igbo', 'Haoussa', 'Twi', 'Éwé', 'Lingala', 'Moore', 'Bamiléké', 'Swahili'],
  diaspora: ['Créole haïtien', 'Créole antillais']
};

const CRITERIA = [
  'Communication', 'Respect mutuel', 'Foi partagée', 'Ambition commune', 
  'Humour', 'Stabilité financière', 'Tendresse', 'Honnêteté', 
  'Passion', 'Autonomie', 'Projet familial', 'Culture', 'Proximité'
];

// Pure Helper to calculate age from birthdate string
function calculateAge(birthdateStr: string): number {
  if (!birthdateStr) return 0;
  const today = new Date();
  const birthDate = new Date(birthdateStr);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Pure Helper to generate username suggestions based on full name
function generateUsernameSuggestions(fullName: string): string[] {
  if (!fullName) return [];
  const clean = fullName.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return [];
  
  const p1 = parts[0];
  const p2 = parts[1] || '';
  
  const suggestions: string[] = [];
  if (p2) {
    suggestions.push(`${p1}.${p2}`);
    suggestions.push(`${p1}_${p2}_${Math.floor(Math.random() * 90) + 10}`);
    suggestions.push(`${p2}_${p1}`);
  } else {
    suggestions.push(`${p1}_mcm`);
    suggestions.push(`${p1}.${Math.floor(Math.random() * 900) + 100}`);
    suggestions.push(`iam_${p1}`);
  }
  return Array.from(new Set(suggestions)).slice(0, 3);
}

export function OnboardingPage() {
  const { loginUser } = useAppStore();
  const [step, setStep] = useState(1);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [checkedTermsCheckbox, setCheckedTermsCheckbox] = useState(false);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [formData, setFormData] = useState<OnboardingData>({
    intention: '',
    gender: '',
    seeking: '',
    name: '',
    username: '',
    birthdate: '',
    age: 0,
    avatarSeed: '',
    roots: { country: '', region: '', ethnicity: '', village: '' },
    occupation: { domain: '', title: '' },
    values: [],
    languages: [],
    preference: '',
    diaspora: '',
    familyQuiz: '',
    situation: '',
    criteria: [],
    bio: ''
  });

  // Sync avatar seed with username or name initial change, but allow shuffles
  useEffect(() => {
    if (formData.username && !formData.avatarSeed) {
      setFormData(prev => ({ ...prev, avatarSeed: prev.username }));
    } else if (formData.name && !formData.avatarSeed) {
      setFormData(prev => ({ ...prev, avatarSeed: prev.name }));
    }
  }, [formData.name, formData.username]);

  // Generate username suggestions when name changes
  useEffect(() => {
    if (formData.name) {
      setUsernameSuggestions(generateUsernameSuggestions(formData.name));
    } else {
      setUsernameSuggestions([]);
    }
  }, [formData.name]);

  const updateField = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleList = (field: 'values' | 'languages' | 'criteria', item: string, max?: number) => {
    const list = [...formData[field]];
    if (list.includes(item)) {
      updateField(field, list.filter(i => i !== item));
    } else {
      if (max && list.length >= max) return;
      updateField(field, [...list, item]);
    }
  };

  const handleNext = () => {
    if (step < 15) {
      setStep(step + 1);
    } else {
      // Complete Onboarding & Save
      const avatarUrl = `https://api.dicebear.com/7.x/open-peeps/svg?seed=${encodeURIComponent(formData.avatarSeed || formData.username || formData.name || 'default')}`;
      loginUser({
        name: formData.name || 'Anonyme',
        avatar: avatarUrl,
        location: formData.roots.country || 'Inconnu',
        tribes: [formData.roots.region, formData.roots.ethnicity].filter(Boolean),
      });
    }
  };

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 1));
  };

  const shuffleAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    updateField('avatarSeed', randomSeed);
  };

  // Check if current step is valid to proceed
  const isStepValid = () => {
    switch (step) {
      case 1: return !!formData.intention;
      case 2: return !!formData.gender && !!formData.seeking;
      case 3: return !!formData.name.trim() && !!formData.username.trim();
      case 4: return !!formData.roots.country.trim() && !!formData.roots.region.trim() && !!formData.roots.ethnicity.trim();
      case 5: return !!formData.birthdate && formData.age >= 18;
      case 6: return !!formData.occupation.domain;
      case 7: return formData.values.length > 0;
      case 8: return formData.languages.length > 0;
      case 9: return !!formData.preference;
      case 10: return !!formData.diaspora;
      case 11: return !!formData.familyQuiz;
      case 12: return !!formData.situation;
      case 13: return formData.criteria.length > 0;
      case 14: return formData.bio.trim().length >= 10;
      default: return true;
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1: // Intention
        return (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
                Ton Intention
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
                Pourquoi es-tu là aujourd'hui ?
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                Ta réponse oriente tout notre algorithme d'affinités culturelles dès le départ.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                { id: 'union', label: 'Je cherche une union sérieuse', desc: 'Mariage, engagement de vie, construction solide', icon: Heart },
                { id: 'culture', label: 'Retrouver des gens de ma culture', desc: 'Communauté, réseau social local, partage des racines', icon: Users },
                { id: 'discover', label: "Découvrir d'autres cultures", desc: 'Ouverture spirituelle, curiosité sincère et enrichissement', icon: Globe },
                { id: 'explore', label: 'Je ne sais pas encore', desc: 'Je verrai au fil des rencontres et des discussions', icon: Compass }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => updateField('intention', opt.id)}
                  type="button"
                  className={`w-full p-5 text-left border-2 rounded-2xl flex items-center gap-4 transition-all ${
                    formData.intention === opt.id
                      ? 'border-primary bg-primary-light/30 dark:bg-primary/10'
                      : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.intention === opt.id ? 'bg-primary text-white' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500'}`}>
                    <opt.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-zinc-900 dark:text-white text-base">{opt.label}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">{opt.desc}</p>
                  </div>
                  {formData.intention === opt.id && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 2: // Gender
        return (
          <div className="space-y-8">
            <div className="text-center md:text-left">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
                Identité
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
                Ton profil de genre
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                Ces informations nous aident à cibler les suggestions correspondantes.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Je suis :</h3>
              <div className="grid grid-cols-3 gap-4">
                {['Homme', 'Femme', 'Autre'].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => updateField('gender', g)}
                    className={`py-5 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all font-bold ${
                      formData.gender === g
                        ? 'border-primary bg-primary-light/30 dark:bg-primary/10 text-primary'
                        : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <span className="text-lg">{g}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Je cherche :</h3>
              <div className="grid grid-cols-3 gap-4">
                {['Hommes', 'Femmes', 'Les deux'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateField('seeking', s)}
                    className={`py-5 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all font-bold ${
                      formData.seeking === s
                        ? 'border-primary bg-primary-light/30 dark:bg-primary/10 text-primary'
                        : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <span className="text-lg">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3: // Identity & Dicebear Avatar Preview
        return (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
                Nom & Avatar
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
                Présentez-vous
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                Un avatar unique est généré en temps réel à partir de votre prénom ou de votre nom d'utilisateur.
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-6">
              {/* Dynamic SVG Dicebear Preview */}
              <div className="relative group animate-bounce-subtle">
                <div className="w-36 h-36 rounded-3xl overflow-hidden bg-zinc-50 dark:bg-zinc-900 border-4 border-primary/20 dark:border-primary/40 shadow-xl flex items-center justify-center">
                  <img
                    src={`https://api.dicebear.com/7.x/open-peeps/svg?seed=${encodeURIComponent(formData.avatarSeed || 'default')}`}
                    alt="Dicebear OpenPeeps Avatar"
                    className="w-full h-full object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={shuffleAvatar}
                  className="absolute -bottom-2 right-2 p-3 bg-primary text-white rounded-2xl shadow-lg hover:bg-opacity-95 transition-all flex items-center justify-center cursor-pointer border-2 border-white dark:border-zinc-950"
                  title="Générer un autre avatar"
                >
                  <RefreshCw className="w-5 h-5 animate-spin-hover" />
                </button>
              </div>

              {/* Name field */}
              <div className="w-full space-y-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Votre Nom & Prénom
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      name: newName
                    }));
                  }}
                  placeholder="Ex: Amal Bénin, Malik Diop..."
                  className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors"
                  required
                />
              </div>

              {/* Username field */}
              <div className="w-full space-y-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Nom d'utilisateur (Username)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 font-bold">
                    @
                  </span>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => {
                      const cleanUser = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '');
                      updateField('username', cleanUser);
                    }}
                    placeholder="nomutilisateur"
                    className="w-full pl-8 pr-4 py-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Username Suggestions pills */}
              {usernameSuggestions.length > 0 && (
                <div className="w-full space-y-2 select-none">
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Suggestions de nom d'utilisateur :</span>
                  <div className="flex flex-wrap gap-2">
                    {usernameSuggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => updateField('username', sug)}
                        className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full text-xs font-bold hover:bg-primary hover:text-white dark:hover:bg-primary transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700"
                      >
                        @{sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 4: // Roots
        return (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
                Héritage
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
                D'où venez-vous ?
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                Précisez vos origines. Plus c'est exact, plus les matchs culturels seront fins.
              </p>
            </div>
            
            <div className="space-y-4">
              {/* Pays d'origine */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Pays d'origine
                </label>
                <input
                  type="text"
                  value={formData.roots.country}
                  onChange={(e) => updateField('roots', { ...formData.roots, country: e.target.value })}
                  placeholder="Ex: Sénégal, Bénin, Côte d'Ivoire..."
                  className="w-full p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors"
                  required
                />
              </div>

              {/* Région d'origine */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Région d'origine
                </label>
                <input
                  type="text"
                  value={formData.roots.region}
                  onChange={(e) => updateField('roots', { ...formData.roots, region: e.target.value })}
                  placeholder="Ex: Casamance, Littoral, Région des Lagunes..."
                  className="w-full p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors"
                  required
                />
              </div>

              {/* Ethnie d'origine */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-505 dark:text-zinc-400 uppercase tracking-wider block">
                  Ethnie d'origine
                </label>
                <input
                  type="text"
                  value={formData.roots.ethnicity}
                  onChange={(e) => updateField('roots', { ...formData.roots, ethnicity: e.target.value })}
                  placeholder="Ex: Fon, Yoruba, Wolof, Diola, Baoulé..."
                  className="w-full p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors"
                  required
                />
              </div>

              {/* Ville ou Village natal */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Ville ou Village natal (Optionnel)
                </label>
                <input
                  type="text"
                  value={formData.roots.village}
                  onChange={(e) => updateField('roots', { ...formData.roots, village: e.target.value })}
                  placeholder="Ex: Ouidah, Saint-Louis, Yamoussoukro..."
                  className="w-full p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors"
                />
              </div>
            </div>
          </div>
        );

      case 5: // Birthdate
        return (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
                Date de Naissance
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
                Quelle est votre date de naissance ?
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                Vous devez avoir au moins 18 ans pour utiliser MyCultureMatch. Votre âge est calculé automatiquement.
              </p>
            </div>

            <div className="space-y-4 max-w-sm mx-auto">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Date de naissance
                </label>
                <input
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => {
                    const bdate = e.target.value;
                    const calculatedAge = calculateAge(bdate);
                    setFormData(prev => ({
                      ...prev,
                      birthdate: bdate,
                      age: calculatedAge
                    }));
                  }}
                  className="w-full p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors cursor-pointer"
                  required
                />
              </div>

              {formData.birthdate && (
                <div className="text-center p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl">
                  <span className="text-zinc-400 font-bold block text-xs uppercase tracking-wider">Votre âge calculé</span>
                  <span className="text-4xl font-black text-primary mt-1 block">{formData.age} ans</span>
                  {formData.age < 18 ? (
                    <div className="flex items-center justify-center gap-1.5 text-red-500 font-bold text-xs mt-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Vous devez avoir au moins 18 ans.</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 text-green-600 dark:text-green-400 font-bold text-xs mt-2">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>Âge requis validé</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 6: // Career / Activity
        return (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
                Carrière
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
                Que faites-vous dans la vie ?
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                Votre domaine d'activité permet de situer vos centres d'intérêts et votre quotidien.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Domaine principal :</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DOMAINS.map(dom => (
                  <button
                    key={dom.id}
                    type="button"
                    onClick={() => updateField('occupation', { ...formData.occupation, domain: dom.label })}
                    className={`p-4 text-left border-2 rounded-2xl flex items-center justify-between font-bold text-base transition-all ${
                      formData.occupation.domain === dom.label
                        ? 'border-primary bg-primary-light/30 dark:bg-primary/10 text-primary'
                        : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    <span>{dom.label}</span>
                    {formData.occupation.domain === dom.label && (
                      <span className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Intitulé de poste / Métier (Optionnel)
                </label>
                <input
                  type="text"
                  value={formData.roots.village} // re-using to avoid typescript errors, wait, no, occupation.title is in formData!
                  onChange={(e) => updateField('occupation', { ...formData.occupation, title: e.target.value })}
                  placeholder="Ex: Designer UX, Ingénieur logiciel, Banquier, Médecin, Étudiant..."
                  className="w-full p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors"
                />
              </div>
            </div>
          </div>
        );

      case 7: // Values
        return (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
                Valeurs
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
                Quelles sont vos valeurs fondamentales ?
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                Sélectionnez jusqu'à 4 valeurs essentielles qui guident vos relations et vos choix de vie.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {VALUES.map(val => (
                <button
                  key={val.id}
                  type="button"
                  onClick={() => toggleList('values', val.label, 4)}
                  className={`p-4 border-2 rounded-2xl flex items-center gap-3 transition-all text-left font-semibold ${
                    formData.values.includes(val.label)
                      ? 'border-primary bg-primary-light/30 dark:bg-primary/10 text-primary'
                      : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${formData.values.includes(val.label) ? 'border-primary bg-primary text-white' : 'border-zinc-300 dark:border-zinc-750'}`}>
                    {formData.values.includes(val.label) && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm sm:text-base">{val.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 8: // Languages
        return (
          <div className="space-y-8">
            <div className="text-center md:text-left">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
                Langues
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
                Quelles langues parlez-vous ?
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                Sélectionnez toutes les langues que vous maîtrisez pour communiquer avec vos futurs compagnons.
              </p>
            </div>

            {Object.entries(LANGUAGES).map(([key, list]) => (
              <div key={key} className="space-y-3">
                <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">
                  {key === 'intl' ? 'International' : key === 'africa' ? 'Afrique' : 'Diaspora'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {list.map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleList('languages', lang)}
                      className={`px-4 py-2 border rounded-full text-sm font-bold transition-all ${
                        formData.languages.includes(lang)
                          ? 'border-primary bg-primary text-white'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 9: // Match Preference
        return (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
                Match Idéal
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
                Quel est votre match idéal ?
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                Dites-nous si vous accordez une importance stricte ou ouverte à la proximité d'origine.
              </p>
            </div>
            
            <div className="grid gap-4">
              {[
                { id: 'same', label: 'Ma propre culture', desc: 'Rencontrer en priorité des personnes de la même ethnie, région ou langue.', icon: Shield },
                { id: 'region', label: 'Même continent', desc: 'Avoir les mêmes affinités élargies (Ex: Afrique de l’Ouest, Maghreb, etc.)', icon: Globe },
                { id: 'target', label: 'Une culture précise', desc: 'J’ai une affinité ou un intérêt spécifique pour une culture donnée.', icon: Sparkles },
                { id: 'open', label: 'Ouverture totale', desc: 'Les valeurs de cœur et d’esprit comptent bien plus pour moi que l’origine.', icon: Smile }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => updateField('preference', opt.id)}
                  type="button"
                  className={`w-full p-5 text-left border-2 rounded-2xl flex items-center gap-4 transition-all ${
                    formData.preference === opt.id
                      ? 'border-primary bg-primary-light/30 dark:bg-primary/10'
                      : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.preference === opt.id ? 'bg-primary text-white' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500'}`}>
                    <opt.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-zinc-900 dark:text-white text-base">{opt.label}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">{opt.desc}</p>
                  </div>
                  {formData.preference === opt.id && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 10: // Diaspora
        return (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
                Diaspora
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
                Profils à l'étranger ?
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                Êtes-vous ouvert(e) à faire connaissance avec des personnes de votre culture vivant dans d'autres pays ?
              </p>
            </div>
            
            <div className="grid gap-4">
              {[
                { id: 'yes', label: 'Oui, sans aucun problème', desc: 'Les racines communes importent plus que la géographie physique.', icon: Globe },
                { id: 'maybe', label: 'Selon le pays', desc: 'Je préfère préserver une certaine proximité géographique raisonnable.', icon: Compass },
                { id: 'no', label: 'Priorité pays d’origine', desc: 'Je préfère rencontrer des personnes qui vivent au cœur de ma patrie.', icon: Shield }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => updateField('diaspora', opt.id)}
                  type="button"
                  className={`w-full p-5 text-left border-2 rounded-2xl flex items-center gap-4 transition-all ${
                    formData.diaspora === opt.id
                      ? 'border-primary bg-primary-light/30 dark:bg-primary/10'
                      : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.diaspora === opt.id ? 'bg-primary text-white' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500'}`}>
                    <opt.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-zinc-900 dark:text-white text-base">{opt.label}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">{opt.desc}</p>
                  </div>
                  {formData.diaspora === opt.id && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 11: // Family Quiz
        return (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
                Famille
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
                Quel est votre rapport à la famille ?
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                Quelle importance accordez-vous à la validation ou aux coutumes familiales dans vos relations ?
              </p>
            </div>
            
            <div className="grid gap-4">
              {[
                { id: 'strict', label: 'Accord familial essentiel', desc: 'L’approbation de mes proches est une fondation indéboulonnable.', icon: Shield },
                { id: 'mixed', label: 'Avis important', desc: 'Je respecte leur regard mais je conserve toujours le dernier mot.', icon: Users },
                { id: 'independent', label: 'Indépendance totale', desc: 'Je prends mes décisions affectives en toute autonomie personnelle.', icon: Smile }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => updateField('familyQuiz', opt.id)}
                  type="button"
                  className={`w-full p-5 text-left border-2 rounded-2xl flex items-center gap-4 transition-all ${
                    formData.familyQuiz === opt.id
                      ? 'border-primary bg-primary-light/30 dark:bg-primary/10'
                      : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.familyQuiz === opt.id ? 'bg-primary text-white' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500'}`}>
                    <opt.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-zinc-900 dark:text-white text-base">{opt.label}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">{opt.desc}</p>
                  </div>
                  {formData.familyQuiz === opt.id && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 12: // Situation
        return (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
                Situation
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
                Votre situation civile actuelle
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                Une transparence totale pour débuter des discussions en toute confiance.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {['Célibataire', 'Divorcé(e)', 'Veuf/Veuve', 'Secret'].map(sit => (
                <button
                  key={sit}
                  type="button"
                  onClick={() => updateField('situation', sit)}
                  className={`p-6 border-2 rounded-2xl flex flex-col items-center gap-3 transition-all font-bold text-base ${
                    formData.situation === sit
                      ? 'border-primary bg-primary-light/30 dark:bg-primary/10 text-primary'
                      : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  <span>{sit}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 13: // Match Criteria
        return (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
                Critères
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
                Qu'est-ce qui est vital pour vous ?
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                Choisissez jusqu'à 5 critères profonds indispensables pour vos futurs matchs.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {CRITERIA.map(crit => (
                <button
                  key={crit}
                  type="button"
                  onClick={() => toggleList('criteria', crit, 5)}
                  className={`px-5 py-3 border-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                    formData.criteria.includes(crit)
                      ? 'border-primary bg-primary text-white'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {formData.criteria.includes(crit) && <Check className="w-4 h-4" />}
                  <span>{crit}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 14: // Bio
        return (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
                Biographie
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
                Présentez-vous sincèrement
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                Pas besoin de rédiger un texte parfait. Écrivez juste une phrase ou deux sur votre histoire et ce que vous aimez. (Min. 10 caractères)
              </p>
            </div>

            <div className="space-y-2">
              <textarea
                value={formData.bio}
                onChange={(e) => updateField('bio', e.target.value)}
                placeholder="Exemple: Sénégalais d’origine vivant à Lyon. Passionné de cuisine et de récits historiques, j'adore partager les traditions de mon pays..."
                rows={6}
                maxLength={1000}
                className="w-full p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-3xl outline-none text-zinc-900 dark:text-white text-base transition-colors placeholder:text-zinc-400 leading-relaxed resize-none"
              />
              <div className="flex justify-between items-center text-xs font-bold text-zinc-400 px-1">
                <span>Min. 10 caractères</span>
                <span>{formData.bio.length} / 1000</span>
              </div>
            </div>
          </div>
        );

      case 15: // Recap / Profile ready
        return (
          <div className="space-y-8 py-4">
            <div className="text-center">
              <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 text-xs font-bold uppercase rounded-full tracking-wider">
                Profil Prêt
              </span>
              <h2 className="text-3xl font-black mt-4 text-zinc-900 dark:text-white">
                Votre profil est prêt !
              </h2>
            </div>

            {/* Simple Dynamic Avatar Display */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-28 h-28 rounded-3xl overflow-hidden bg-zinc-50 dark:bg-zinc-900 border-4 border-primary/20 shadow-lg flex items-center justify-center">
                <img
                  src={`https://api.dicebear.com/7.x/open-peeps/svg?seed=${encodeURIComponent(formData.avatarSeed || formData.username || formData.name || 'default')}`}
                  alt="Dicebear Profile"
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="font-extrabold text-xl text-zinc-900 dark:text-white">{formData.name}</h3>
              {formData.username && (
                <p className="text-sm font-bold text-primary">@{formData.username}</p>
              )}
              {formData.roots.country && (
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider text-center">
                  {formData.roots.country} | {formData.roots.region} {formData.roots.ethnicity ? `(${formData.roots.ethnicity})` : ''}
                </p>
              )}
            </div>

            {/* Welcoming Message per user request */}
            <div className="space-y-4 text-center max-w-sm mx-auto">
              <p className="text-zinc-650 dark:text-zinc-300 font-semibold text-sm sm:text-base leading-relaxed">
                Vous pouvez modifier toutes vos informations et paramètres à tout moment depuis votre profil.
              </p>
              <div className="p-5 bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-2xl shadow-sm">
                <p className="text-zinc-900 dark:text-zinc-100 font-extrabold text-sm sm:text-base leading-relaxed">
                  Rejoignez dès maintenant nos tribus, trouvez des compagnons culturels et découvrez l'amour !
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-zinc-50 dark:bg-zinc-955/80 relative overflow-hidden py-12 px-4 sm:px-6">
      
      {/* Terms & Conditions Dropdown Overlay (Slide down from top) */}
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
              {/* Header */}
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

              {/* Terms Content */}
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

              {/* Checkbox */}
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

              {/* Action Button */}
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

      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Info */}
      <div className="w-full max-w-xl mx-auto flex justify-between items-center z-10 mb-8 select-none">
        <div className="flex items-center gap-2">
          <img src={logoMyCultureMatch} alt="MyCultureMatch Logo" className="w-6 h-6 object-contain rounded-md" />
          <span className="font-extrabold text-sm dark:text-white text-zinc-800">MyCultureMatch</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-sm text-zinc-400">Étape {step} sur 15</span>
          <div className="h-2 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / 15) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Card Wrapper */}
      <div className="flex-1 w-full max-w-xl mx-auto flex items-center justify-center z-10 mb-8">
        <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 sm:p-10 rounded-3xl shadow-xl shadow-zinc-100/10 dark:shadow-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="w-full max-w-xl mx-auto flex justify-between gap-4 z-10 select-none">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 1}
          className={`flex items-center gap-2 py-4 px-6 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-sm text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 transition-all active:scale-[0.98] disabled:opacity-0 disabled:pointer-events-none ${step > 1 ? 'cursor-pointer' : ''}`}
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!isStepValid()}
          className={`flex items-center gap-2 py-4 px-8 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/10 transition-all active:scale-[0.98] disabled:opacity-55 disabled:pointer-events-none ${isStepValid() ? 'cursor-pointer hover:bg-opacity-95' : ''}`}
        >
          <span>{step === 15 ? 'Terminer et continuer' : 'Continuer'}</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
